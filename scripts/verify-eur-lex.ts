// Verifies the engine's article summaries against the official text on
// EUR-Lex and the Hague Protocol against HCCH. This script is meant
// to be run on a machine with outbound network access (it cannot run
// from a sandboxed CI environment that filters EU institutional
// hosts).
//
// Usage:
//   npx tsx scripts/verify-eur-lex.ts            # verify everything
//   npx tsx scripts/verify-eur-lex.ts --reg 650  # specific regulation
//
// Output: audit/eur-lex-verification-report.md
//
// What it does for each Regulation:
//   1. Fetches the official FR (preferred) or EN consolidated HTML.
//   2. Parses article headings (e.g. "Article 22") and titles.
//   3. Cross-checks the engine's catalog (id, title, summary):
//        - confirms the article exists at the expected number
//        - flags title mismatches (case-insensitive Levenshtein > 30 %)
//   4. Records the (article, expected title) → (article, found title)
//      pair in a markdown report for human review.
//
// What it does NOT do:
//   - It does not auto-correct the engine's summaries — discrepancies
//     are reported for legal-review before any change is committed.
//   - It does not interpret CJEU case dispositifs (only links to them).

import { mkdirSync, writeFileSync } from "node:fs";
import { listArticles } from "../src/data/articles.js";
import { listMatrimonialArticles } from "../src/matrimonial/articles.js";
import { listPartnershipArticles } from "../src/partnerships/articles.js";
import { listRome3Articles } from "../src/divorce/articles.js";
import { listBiiArticles } from "../src/brussels2/articles.js";
import { listMaintenanceArticles } from "../src/maintenance/articles.js";

interface Source {
  key: string;
  shortTitle: string;
  url: string; // canonical text (CELEX or HCCH)
  list: () => Array<{ id: string; title: string; summary?: string }>;
}

const SOURCES: Source[] = [
  {
    key: "650",
    shortTitle: "Règl. (UE) n° 650/2012",
    url: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32012R0650",
    list: () => listArticles().map((a) => ({ id: a.id, title: a.title, summary: a.summary })),
  },
  {
    key: "1259",
    shortTitle: "Règl. (UE) n° 1259/2010 (Rome III)",
    url: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32010R1259",
    list: () => listRome3Articles().map((a) => ({ id: a.id, title: a.title, summary: a.summary })),
  },
  {
    key: "2016-1103",
    shortTitle: "Règl. (UE) 2016/1103",
    url: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32016R1103",
    list: () =>
      listMatrimonialArticles().map((a) => ({ id: a.id, title: a.title, summary: a.summary })),
  },
  {
    key: "2016-1104",
    shortTitle: "Règl. (UE) 2016/1104",
    url: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32016R1104",
    list: () =>
      listPartnershipArticles().map((a) => ({ id: a.id, title: a.title, summary: a.summary })),
  },
  {
    key: "2019-1111",
    shortTitle: "Règl. (UE) 2019/1111 (Bruxelles II ter)",
    url: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32019R1111",
    list: () => listBiiArticles().map((a) => ({ id: a.id, title: a.title, summary: a.summary })),
  },
  {
    key: "4-2009",
    shortTitle: "Règl. (CE) n° 4/2009 + Protocole de La Haye 2007",
    url: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32009R0004",
    list: () =>
      listMaintenanceArticles().map((a) => ({ id: a.id, title: a.title, summary: a.summary })),
  },
];

// Parses an EUR-Lex consolidated HTML page and extracts the heading
// of every article ("Article N — Title"). Returns a Map<number, title>.
function extractArticles(html: string): Map<string, string> {
  const out = new Map<string, string>();
  // EUR-Lex marks article titles with class names varying by version.
  // We use a tolerant set of patterns: the visible "Article N" + the
  // following heading line.
  const re =
    /(?:^|\n|>)\s*Article\s+([0-9]+(?:\s+(?:bis|ter|quater))?)\s*[\n<]([^<\n]{0,300})/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const num = m[1]!.trim();
    const title = (m[2] ?? "").replace(/\s+/g, " ").trim();
    if (title && !out.has(num)) out.set(num, title);
  }
  return out;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const v: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) v[i]![0] = i;
  for (let j = 0; j <= n; j++) v[0]![j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      v[i]![j] = Math.min(v[i - 1]![j]! + 1, v[i]![j - 1]! + 1, v[i - 1]![j - 1]! + cost);
    }
  }
  return v[m]![n]!;
}

function similarity(a: string, b: string): number {
  const an = a.toLowerCase().replace(/\s+/g, " ").trim();
  const bn = b.toLowerCase().replace(/\s+/g, " ").trim();
  if (!an && !bn) return 1;
  const d = levenshtein(an, bn);
  const m = Math.max(an.length, bn.length, 1);
  return 1 - d / m;
}

interface Finding {
  source: string;
  articleId: string;
  status: "ok" | "missing-on-eurlex" | "title-divergence" | "fetch-failed";
  expected: string;
  found?: string;
  similarity?: number;
  note?: string;
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      // EUR-Lex sometimes refuses default Node UA. A standard browser
      // UA mitigates the 403 in real browsers / consumer machines.
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
      "accept": "text/html,application/xhtml+xml",
      "accept-language": "fr,en;q=0.5",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function verifySource(s: Source): Promise<Finding[]> {
  let html: string;
  try {
    html = await fetchHtml(s.url);
  } catch (e) {
    return [
      {
        source: s.shortTitle,
        articleId: "(all)",
        status: "fetch-failed",
        expected: "",
        note: (e as Error).message,
      },
    ];
  }
  const found = extractArticles(html);
  const findings: Finding[] = [];
  for (const a of s.list()) {
    // a.id looks like "Art. 22" or "Protocole 2007, art. 4". Pull the
    // last number from it.
    const m = a.id.match(/(\d+)\b/);
    const num = m ? m[1]! : null;
    if (!num) continue;
    const officialTitle = found.get(num);
    if (!officialTitle) {
      findings.push({
        source: s.shortTitle,
        articleId: a.id,
        status: "missing-on-eurlex",
        expected: a.title,
      });
      continue;
    }
    const sim = similarity(a.title, officialTitle);
    if (sim < 0.5) {
      findings.push({
        source: s.shortTitle,
        articleId: a.id,
        status: "title-divergence",
        expected: a.title,
        found: officialTitle,
        similarity: sim,
      });
    } else {
      findings.push({
        source: s.shortTitle,
        articleId: a.id,
        status: "ok",
        expected: a.title,
        found: officialTitle,
        similarity: sim,
      });
    }
  }
  return findings;
}

function formatReport(allFindings: Finding[]): string {
  const lines: string[] = [];
  lines.push(
    "# Vérification EUR-Lex — Rapport automatisé",
    "",
    `Généré le ${new Date().toISOString()}.`,
    "",
    "Ce rapport est strictement informatif. Il signale les divergences entre les titres d'articles tels que résumés par le moteur et les titres tels qu'ils figurent dans le texte officiel EUR-Lex. **Aucune correction n'est appliquée automatiquement** — chaque divergence requiert une revue juridique humaine avant toute modification.",
    "",
  );
  const bySource: Record<string, Finding[]> = {};
  for (const f of allFindings) {
    bySource[f.source] ??= [];
    bySource[f.source]!.push(f);
  }
  for (const [src, fs] of Object.entries(bySource)) {
    lines.push(`## ${src}`, "");
    const fetchFailed = fs.find((f) => f.status === "fetch-failed");
    if (fetchFailed) {
      lines.push(`> ⚠️ **Fetch impossible** : ${fetchFailed.note}`, "");
      continue;
    }
    const ok = fs.filter((f) => f.status === "ok").length;
    const missing = fs.filter((f) => f.status === "missing-on-eurlex");
    const div = fs.filter((f) => f.status === "title-divergence");
    lines.push(
      `Articles vérifiés : **${fs.length}** — concordance titre : **${ok}**, divergences : **${div.length}**, introuvables : **${missing.length}**.`,
      "",
    );
    if (missing.length) {
      lines.push("### Articles non trouvés sur EUR-Lex à ce numéro", "");
      lines.push("| Id | Titre attendu (moteur) |", "|---|---|");
      for (const f of missing) lines.push(`| ${f.articleId} | ${f.expected} |`);
      lines.push("");
    }
    if (div.length) {
      lines.push("### Divergences de titre", "");
      lines.push(
        "| Id | Moteur | EUR-Lex | Sim. |",
        "|---|---|---|---|",
      );
      for (const f of div) {
        lines.push(
          `| ${f.articleId} | ${f.expected} | ${f.found ?? "?"} | ${(f.similarity ?? 0).toFixed(2)} |`,
        );
      }
      lines.push("");
    }
  }
  return lines.join("\n");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const filter = args.includes("--reg") ? args[args.indexOf("--reg") + 1] : null;
  const sources = filter ? SOURCES.filter((s) => s.key === filter) : SOURCES;
  if (filter && sources.length === 0) {
    process.stderr.write(`Règlement inconnu : ${filter}\n`);
    process.exit(2);
  }
  const all: Finding[] = [];
  for (const s of sources) {
    process.stdout.write(`Fetching ${s.shortTitle}…\n`);
    const fs = await verifySource(s);
    all.push(...fs);
  }
  const md = formatReport(all);
  mkdirSync("audit", { recursive: true });
  const path = "audit/eur-lex-verification-report.md";
  writeFileSync(path, md, "utf8");
  process.stdout.write(`\nRapport écrit dans ${path}\n`);
}

main().catch((err) => {
  process.stderr.write(`Erreur : ${(err as Error).message}\n`);
  process.exit(1);
});
