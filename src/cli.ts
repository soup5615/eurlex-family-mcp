#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { argv, stdin } from "node:process";
import { analyseSuccession } from "./engine/analyze.js";
import { getArticle, listArticles } from "./data/articles.js";
import { CJEU_CASES, findCase } from "./data/cjeuCases.js";
import { listBoundMemberStates } from "./data/memberStates.js";
import type { SuccessionCase, SuccessionAnalysis } from "./types.js";

const USAGE = `eurlex-family — moteur de qualification du Règl. (UE) 650/2012

Commandes :
  analyze [--file <case.json>]   Analyse un cas de succession (JSON sur stdin si --file absent).
  article <numéro>               Affiche le résumé d'un article (ex. 21, 22, 34).
  articles                       Liste tous les articles référencés.
  case <id|nom>                  Affiche une décision de la CJUE (ex. C-218/16, Kubicka).
  cases                          Liste les décisions de la CJUE référencées.
  states                         Liste les États membres liés par le règlement.
  help                           Affiche cette aide.

Format du cas (JSON) :
  {
    "deceased": {
      "nationalities": ["FR"],
      "lastHabitualResidence": "DE",
      "dateOfDeath": "2023-05-10",
      "residenceHistory": [{ "country": "FR", "years": 3 }]
    },
    "professioJuris": { "chosenLaw": "FR", "form": "express" },
    "dispositions": [{ "type": "will", "dateExecuted": "2018-01-12" }],
    "assets": [
      { "kind": "immovable", "locatedIn": "FR" },
      { "kind": "movable", "locatedIn": "DE" }
    ],
    "forumState": "DE"
  }
`;

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

function renderAnalysis(a: SuccessionAnalysis): string {
  const lines: string[] = [];
  lines.push("== Analyse succession (Règl. UE 650/2012) ==");
  lines.push("");
  lines.push(
    `Champ temporel : ${a.temporalScope.applicable ? "OUI" : "NON"} — ${a.temporalScope.reason}`,
  );
  lines.push("");
  lines.push("-- Compétence --");
  lines.push(`Forum : ${a.jurisdiction.competentForum ?? "aucun"}`);
  lines.push(`Base : ${a.jurisdiction.basis}`);
  lines.push(`Portée : ${a.jurisdiction.scope}`);
  for (const r of a.jurisdiction.reasoning) {
    lines.push(`  • ${r.article}`);
    lines.push(`    Règle : ${r.rule}`);
    lines.push(`    Application : ${r.appliedTo}`);
    lines.push(`    Conclusion : ${r.conclusion}`);
  }
  for (const w of a.jurisdiction.warnings) lines.push(`  ! ${w}`);
  lines.push("");
  lines.push("-- Loi applicable --");
  lines.push(`Loi : ${a.applicableLaw.applicableLaw ?? "aucune"}`);
  lines.push(`Base : ${a.applicableLaw.basis}`);
  lines.push(`Universalité (art. 20) : ${a.applicableLaw.universalApplication ? "oui" : "non"}`);
  lines.push(`Renvoi examiné (art. 34) : ${a.applicableLaw.renvoiConsidered ? "oui" : "non"}`);
  for (const r of a.applicableLaw.reasoning) {
    lines.push(`  • ${r.article}`);
    lines.push(`    Règle : ${r.rule}`);
    lines.push(`    Application : ${r.appliedTo}`);
    lines.push(`    Conclusion : ${r.conclusion}`);
  }
  for (const w of a.applicableLaw.warnings) lines.push(`  ! ${w}`);

  if (a.dispositions.length > 0) {
    lines.push("");
    lines.push("-- Dispositions à cause de mort --");
    for (const d of a.dispositions) {
      lines.push(
        `  • ${d.disposition.type} du ${d.disposition.dateExecuted} → loi : ${d.lawGoverningAdmissibilityAndValidity ?? "(à déterminer)"} (${d.basis})`,
      );
      for (const r of d.reasoning) {
        lines.push(`      ${r.article} — ${r.conclusion}`);
      }
    }
  }

  lines.push("");
  lines.push("-- Certificat successoral européen --");
  lines.push(`Recommandé : ${a.esc.recommended ? "oui" : "non"}`);
  lines.push(`Motif : ${a.esc.rationale}`);
  if (a.esc.issuingAuthorityState) {
    lines.push(`Autorité émettrice : ${a.esc.issuingAuthorityState}`);
  }
  for (const n of a.esc.notes) lines.push(`  • ${n}`);

  if (a.flags.length > 0) {
    lines.push("");
    lines.push("-- Points de vigilance --");
    for (const f of a.flags) lines.push(`  ⚑ ${f}`);
  }

  return lines.join("\n");
}

async function runAnalyze(args: string[]): Promise<void> {
  let raw: string;
  const fileFlag = args.indexOf("--file");
  if (fileFlag >= 0) {
    const path = args[fileFlag + 1];
    if (!path) throw new Error("--file attend un chemin.");
    raw = readFileSync(path, "utf8");
  } else if (args.includes("--json") && args.length > args.indexOf("--json") + 1) {
    raw = args[args.indexOf("--json") + 1]!;
  } else {
    raw = await readStdin();
  }
  if (!raw.trim()) {
    throw new Error(
      "Aucun cas fourni. Passer un JSON via stdin ou --file <chemin>.",
    );
  }
  const input = JSON.parse(raw) as SuccessionCase;
  const analysis = analyseSuccession(input);
  if (args.includes("--json-out")) {
    process.stdout.write(JSON.stringify(analysis, null, 2) + "\n");
  } else {
    process.stdout.write(renderAnalysis(analysis) + "\n");
  }
}

async function main(): Promise<number> {
  const args = argv.slice(2);
  const cmd = args[0];

  if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
    process.stdout.write(USAGE);
    return 0;
  }

  if (cmd === "analyze") {
    await runAnalyze(args.slice(1));
    return 0;
  }

  if (cmd === "article") {
    const id = args[1];
    if (!id) throw new Error("Numéro d'article requis.");
    const a = getArticle(id);
    if (!a) {
      process.stderr.write(`Article ${id} non trouvé.\n`);
      return 1;
    }
    process.stdout.write(`${a.id} — ${a.title}\n${a.summary}\n`);
    return 0;
  }

  if (cmd === "articles") {
    for (const a of listArticles()) {
      process.stdout.write(`${a.id.padEnd(8)} ${a.title}\n`);
    }
    return 0;
  }

  if (cmd === "case") {
    const id = args[1];
    if (!id) throw new Error("Identifiant d'affaire requis.");
    const c = findCase(id);
    if (!c) {
      process.stderr.write(`Affaire ${id} non trouvée.\n`);
      return 1;
    }
    process.stdout.write(
      `${c.caseNumber} — ${c.name} (${c.date})\nArticles : ${c.articles.join(", ")}\n\n${c.holding}\n\nPertinence : ${c.relevance}\n`,
    );
    return 0;
  }

  if (cmd === "cases") {
    for (const c of CJEU_CASES) {
      process.stdout.write(
        `${c.caseNumber.padEnd(12)} ${c.name.padEnd(32)} ${c.date}\n`,
      );
    }
    return 0;
  }

  if (cmd === "states") {
    process.stdout.write(listBoundMemberStates().join(" ") + "\n");
    return 0;
  }

  process.stderr.write(`Commande inconnue : ${cmd}\n\n`);
  process.stderr.write(USAGE);
  return 2;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    process.stderr.write(`Erreur : ${(err as Error).message}\n`);
    process.exit(1);
  },
);
