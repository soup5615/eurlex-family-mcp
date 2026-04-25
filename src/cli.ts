#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { argv, stdin } from "node:process";
import { analyseSuccession } from "./engine/analyze.js";
import { getArticle, listArticles } from "./data/articles.js";
import { CJEU_CASES, findCase } from "./data/cjeuCases.js";
import { listBoundMemberStates } from "./data/memberStates.js";
import { listThirdStateRules } from "./data/thirdStatePIL.js";
import { renderConsultationHTML } from "./render/html.js";
import { analyseMatrimonial } from "./matrimonial/engine/analyze.js";
import { analyseCombined, type CombinedCase } from "./matrimonial/combined.js";
import {
  getMatrimonialArticle,
  listMatrimonialArticles,
} from "./matrimonial/articles.js";
import { listMatrimonialBoundStates } from "./matrimonial/memberStates.js";
import {
  renderCombinedHTML,
  renderMatrimonialHTML,
} from "./render/matrimonialHtml.js";
import { analysePartnership } from "./partnerships/engine.js";
import {
  getPartnershipArticle,
  listPartnershipArticles,
} from "./partnerships/articles.js";
import { listPartnershipBoundStates } from "./partnerships/memberStates.js";
import { analyseRome3 } from "./divorce/engine.js";
import { getRome3Article, listRome3Articles } from "./divorce/articles.js";
import { listRome3BoundStates } from "./divorce/memberStates.js";
import {
  analyseBiiMatrimonial,
  analyseBiiParental,
} from "./brussels2/engine.js";
import { getBiiArticle, listBiiArticles } from "./brussels2/articles.js";
import { listBiiBoundStates } from "./brussels2/memberStates.js";
import { analyseCrisis, type CrisisCase } from "./brussels2/crisis.js";
import { analyseMaintenance } from "./maintenance/engine.js";
import {
  getMaintenanceArticle,
  listMaintenanceArticles,
} from "./maintenance/articles.js";
import { listMaintenanceBoundStates } from "./maintenance/memberStates.js";
import type { SuccessionCase, SuccessionAnalysis } from "./types.js";
import type { MatrimonialCase, MatrimonialAnalysis } from "./matrimonial/types.js";
import type { PartnershipCase } from "./partnerships/types.js";
import type { DivorceCase } from "./divorce/types.js";
import type {
  BiiMatrimonialCase,
  BiiParentalResponsibilityCase,
} from "./brussels2/types.js";
import type { MaintenanceCase } from "./maintenance/types.js";

const USAGE = `eurlex-family — moteur de qualification du Règl. (UE) 650/2012

Commandes :
  analyze [--file <case.json>] [--json-out]
                                 Analyse un cas (JSON sur stdin si --file absent).
  consultation [--file <case.json>] [--out <note.html>] [--title "..."]
                                 Génère une note de consultation HTML.
  article <numéro>               Affiche le résumé d'un article (ex. 21, 22, 34).
  articles                       Liste tous les articles référencés.
  case <id|nom>                  Affiche une décision de la CJUE (ex. C-218/16, Kubicka).
  cases                          Liste les décisions de la CJUE référencées.
  states                         Liste les États membres liés par le règlement.
  third-states                   Liste les États tiers dont le DIP est embarqué (renvoi).

Régimes matrimoniaux (Règl. UE 2016/1103) :
  matrimonial analyze [--file <case.json>] [--json-out]
  matrimonial consultation [--file <case.json>] [--out <note.html>] [--title "..."]
  matrimonial article <numéro>
  matrimonial articles
  matrimonial states

Partenariats enregistrés (Règl. UE 2016/1104) :
  partnership analyze [--file <case.json>] [--json-out]
  partnership article <numéro>
  partnership articles
  partnership states

Analyse combinée succession + régime matrimonial (décès d'un conjoint) :
  combined analyze [--file <case.json>] [--json-out]
  combined consultation [--file <case.json>] [--out <note.html>] [--title "..."]

Divorce — loi applicable (Rome III, Règl. UE 1259/2010) :
  divorce analyze [--file <case.json>]
  divorce article <numéro>
  divorce articles
  divorce states

Matières matrimoniales et responsabilité parentale (Bruxelles II ter, Règl. UE 2019/1111) :
  bii matrimonial [--file <case.json>]
  bii parental [--file <case.json>]
  bii article <numéro>
  bii articles
  bii states

Analyse combinée crise conjugale (compétence + loi divorce + régime + parental) :
  crisis analyze [--file <case.json>]

Aliments (Règl. 4/2009 + Protocole de La Haye 2007) :
  maintenance analyze [--file <case.json>]
  maintenance article <numéro|P.numéro>
  maintenance articles
  maintenance states

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

  if (a.renvoi.considered || a.renvoi.blockedByArt34_2) {
    lines.push("");
    lines.push("-- Renvoi (art. 34) --");
    lines.push(`Examiné : ${a.renvoi.considered ? "oui" : "non"}`);
    if (a.renvoi.blockedByArt34_2) {
      lines.push("Bloqué par art. 34(2) (loi désignée par art. 21(2), 22, 24, 25, 27, 28(b) ou 30).");
    }
    lines.push(`Motif : ${a.renvoi.rationale}`);
    if (a.renvoi.referralTarget) {
      lines.push(`Loi matérielle finalement retenue : ${a.renvoi.referralTarget}`);
    }
    if (a.renvoi.dataSource) lines.push(`Source DIP : ${a.renvoi.dataSource}`);
    for (const r of a.renvoi.reasoning) {
      lines.push(`  • ${r.article} — ${r.conclusion}`);
    }
    for (const w of a.renvoi.warnings) lines.push(`  ! ${w}`);
  }

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
      if (d.formalValidity.applicable) {
        const laws = Array.from(new Set(d.formalValidity.candidateLaws.map((c) => c.law)));
        lines.push(
          `      Validité formelle (art. 27) — lois testables : ${laws.join(", ") || "(aucune)"}`,
        );
        for (const c of d.formalValidity.candidateLaws) {
          lines.push(`          · ${c.law} — ${c.connection} (${c.explanation})`);
        }
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

async function readCase(args: string[]): Promise<SuccessionCase> {
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
  return JSON.parse(raw) as SuccessionCase;
}

async function runAnalyze(args: string[]): Promise<void> {
  const input = await readCase(args);
  const analysis = analyseSuccession(input);
  if (args.includes("--json-out")) {
    process.stdout.write(JSON.stringify(analysis, null, 2) + "\n");
  } else {
    process.stdout.write(renderAnalysis(analysis) + "\n");
  }
}

async function readMatrimonialCase(args: string[]): Promise<MatrimonialCase> {
  let raw: string;
  const fileFlag = args.indexOf("--file");
  if (fileFlag >= 0) {
    const path = args[fileFlag + 1];
    if (!path) throw new Error("--file attend un chemin.");
    raw = readFileSync(path, "utf8");
  } else {
    raw = await readStdin();
  }
  if (!raw.trim()) {
    throw new Error(
      "Aucun cas fourni. Passer un JSON via stdin ou --file <chemin>.",
    );
  }
  return JSON.parse(raw) as MatrimonialCase;
}

function renderMatrimonial(a: MatrimonialAnalysis): string {
  const lines: string[] = [];
  lines.push("== Analyse régime matrimonial (Règl. UE 2016/1103) ==");
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
  lines.push(`Loi : ${a.applicableLaw.applicableLaw ?? "(à déterminer)"}`);
  lines.push(`Base : ${a.applicableLaw.basis}`);
  lines.push(`Universalité (art. 20) : ${a.applicableLaw.universalApplication ? "oui" : "non"}`);
  lines.push(`Renvoi exclu (art. 32) : ${a.applicableLaw.renvoiExcluded ? "oui" : "non"}`);
  for (const r of a.applicableLaw.reasoning) {
    lines.push(`  • ${r.article}`);
    lines.push(`    Règle : ${r.rule}`);
    lines.push(`    Application : ${r.appliedTo}`);
    lines.push(`    Conclusion : ${r.conclusion}`);
  }
  for (const w of a.applicableLaw.warnings) lines.push(`  ! ${w}`);

  if (a.mpa) {
    lines.push("");
    lines.push("-- Convention matrimoniale (art. 25) --");
    lines.push(
      `Écrit daté signé : ${a.mpa.baselineSatisfied === null ? "non renseigné" : a.mpa.baselineSatisfied ? "oui" : "NON"}`,
    );
    if (a.mpa.candidateAdditionalLaws.length > 0) {
      lines.push(
        `Formalités nationales additionnelles à tester : ${a.mpa.candidateAdditionalLaws.join(", ")}`,
      );
    }
    for (const w of a.mpa.warnings) lines.push(`  ! ${w}`);
  }

  if (a.choiceOfLawFormal) {
    lines.push("");
    lines.push("-- Convention de choix de loi (art. 23) --");
    lines.push(
      `Écrit daté signé : ${a.choiceOfLawFormal.baselineSatisfied === null ? "non renseigné" : a.choiceOfLawFormal.baselineSatisfied ? "oui" : "NON"}`,
    );
    if (a.choiceOfLawFormal.candidateAdditionalLaws.length > 0) {
      lines.push(
        `Formalités additionnelles : ${a.choiceOfLawFormal.candidateAdditionalLaws.join(", ")}`,
      );
    }
    for (const w of a.choiceOfLawFormal.warnings) lines.push(`  ! ${w}`);
  }

  if (a.flags.length > 0) {
    lines.push("");
    lines.push("-- Points de vigilance --");
    for (const f of a.flags) lines.push(`  ⚑ ${f}`);
  }

  return lines.join("\n");
}

async function runMatrimonial(args: string[]): Promise<number> {
  const sub = args[0];
  if (!sub || sub === "help") {
    process.stdout.write(
      "matrimonial analyze|article|articles|states\n",
    );
    return 0;
  }
  if (sub === "analyze") {
    const input = await readMatrimonialCase(args.slice(1));
    const analysis = analyseMatrimonial(input);
    if (args.includes("--json-out")) {
      process.stdout.write(JSON.stringify(analysis, null, 2) + "\n");
    } else {
      process.stdout.write(renderMatrimonial(analysis) + "\n");
    }
    return 0;
  }
  if (sub === "consultation") {
    const input = await readMatrimonialCase(args.slice(1));
    const analysis = analyseMatrimonial(input);
    const titleIdx = args.indexOf("--title");
    const title = titleIdx >= 0 ? args[titleIdx + 1] : undefined;
    const html = renderMatrimonialHTML(
      analysis,
      title ? { title } : {},
    );
    const outIdx = args.indexOf("--out");
    if (outIdx >= 0) {
      const path = args[outIdx + 1];
      if (!path) throw new Error("--out attend un chemin.");
      writeFileSync(path, html, "utf8");
      process.stderr.write(`Note écrite : ${path}\n`);
    } else {
      process.stdout.write(html);
    }
    return 0;
  }
  if (sub === "article") {
    const id = args[1];
    if (!id) throw new Error("Numéro d'article requis.");
    const art = getMatrimonialArticle(id);
    if (!art) {
      process.stderr.write(`Article ${id} non trouvé.\n`);
      return 1;
    }
    process.stdout.write(`${art.id} — ${art.title}\n${art.summary}\n`);
    return 0;
  }
  if (sub === "articles") {
    for (const art of listMatrimonialArticles()) {
      process.stdout.write(`${art.id.padEnd(8)} ${art.title}\n`);
    }
    return 0;
  }
  if (sub === "states") {
    process.stdout.write(listMatrimonialBoundStates().join(" ") + "\n");
    return 0;
  }
  process.stderr.write(`Sous-commande matrimonial inconnue : ${sub}\n`);
  return 2;
}

async function readPartnershipCase(args: string[]): Promise<PartnershipCase> {
  let raw: string;
  const fileFlag = args.indexOf("--file");
  if (fileFlag >= 0) {
    const path = args[fileFlag + 1];
    if (!path) throw new Error("--file attend un chemin.");
    raw = readFileSync(path, "utf8");
  } else {
    raw = await readStdin();
  }
  if (!raw.trim()) {
    throw new Error("Aucun cas fourni (stdin ou --file).");
  }
  return JSON.parse(raw) as PartnershipCase;
}

async function runPartnership(args: string[]): Promise<number> {
  const sub = args[0];
  if (!sub || sub === "help") {
    process.stdout.write("partnership analyze|article|articles|states\n");
    return 0;
  }
  if (sub === "analyze") {
    const input = await readPartnershipCase(args.slice(1));
    const analysis = analysePartnership(input);
    process.stdout.write(JSON.stringify(analysis, null, 2) + "\n");
    return 0;
  }
  if (sub === "article") {
    const id = args[1];
    if (!id) throw new Error("Numéro d'article requis.");
    const art = getPartnershipArticle(id);
    if (!art) {
      process.stderr.write(`Article ${id} non trouvé.\n`);
      return 1;
    }
    process.stdout.write(`${art.id} — ${art.title}\n${art.summary}\n`);
    return 0;
  }
  if (sub === "articles") {
    for (const art of listPartnershipArticles()) {
      process.stdout.write(`${art.id.padEnd(8)} ${art.title}\n`);
    }
    return 0;
  }
  if (sub === "states") {
    process.stdout.write(listPartnershipBoundStates().join(" ") + "\n");
    return 0;
  }
  process.stderr.write(`Sous-commande partnership inconnue : ${sub}\n`);
  return 2;
}

async function readCombinedCase(args: string[]): Promise<CombinedCase> {
  let raw: string;
  const fileFlag = args.indexOf("--file");
  if (fileFlag >= 0) {
    const path = args[fileFlag + 1];
    if (!path) throw new Error("--file attend un chemin.");
    raw = readFileSync(path, "utf8");
  } else {
    raw = await readStdin();
  }
  if (!raw.trim()) {
    throw new Error("Aucun cas fourni (stdin ou --file).");
  }
  return JSON.parse(raw) as CombinedCase;
}

async function runCombined(args: string[]): Promise<number> {
  const sub = args[0];
  if (!sub || sub === "help") {
    process.stdout.write("combined analyze|consultation\n");
    return 0;
  }
  if (sub === "analyze") {
    const input = await readCombinedCase(args.slice(1));
    const analysis = analyseCombined(input);
    process.stdout.write(JSON.stringify(analysis, null, 2) + "\n");
    return 0;
  }
  if (sub === "consultation") {
    const input = await readCombinedCase(args.slice(1));
    const analysis = analyseCombined(input);
    const titleIdx = args.indexOf("--title");
    const title = titleIdx >= 0 ? args[titleIdx + 1] : undefined;
    const html = renderCombinedHTML(
      analysis,
      title ? { title } : {},
    );
    const outIdx = args.indexOf("--out");
    if (outIdx >= 0) {
      const path = args[outIdx + 1];
      if (!path) throw new Error("--out attend un chemin.");
      writeFileSync(path, html, "utf8");
      process.stderr.write(`Note écrite : ${path}\n`);
    } else {
      process.stdout.write(html);
    }
    return 0;
  }
  process.stderr.write(`Sous-commande combined inconnue : ${sub}\n`);
  return 2;
}

async function readJson<T>(args: string[]): Promise<T> {
  let raw: string;
  const fileFlag = args.indexOf("--file");
  if (fileFlag >= 0) {
    const path = args[fileFlag + 1];
    if (!path) throw new Error("--file attend un chemin.");
    raw = readFileSync(path, "utf8");
  } else {
    raw = await readStdin();
  }
  if (!raw.trim()) throw new Error("Aucun cas fourni (stdin ou --file).");
  return JSON.parse(raw) as T;
}

async function runDivorce(args: string[]): Promise<number> {
  const sub = args[0];
  if (!sub || sub === "help") {
    process.stdout.write("divorce analyze|article|articles|states\n");
    return 0;
  }
  if (sub === "analyze") {
    const input = await readJson<DivorceCase>(args.slice(1));
    process.stdout.write(JSON.stringify(analyseRome3(input), null, 2) + "\n");
    return 0;
  }
  if (sub === "article") {
    const id = args[1];
    if (!id) throw new Error("Numéro d'article requis.");
    const art = getRome3Article(id);
    if (!art) {
      process.stderr.write(`Article ${id} non trouvé.\n`);
      return 1;
    }
    process.stdout.write(`${art.id} — ${art.title}\n${art.summary}\n`);
    return 0;
  }
  if (sub === "articles") {
    for (const art of listRome3Articles()) {
      process.stdout.write(`${art.id.padEnd(8)} ${art.title}\n`);
    }
    return 0;
  }
  if (sub === "states") {
    process.stdout.write(listRome3BoundStates().join(" ") + "\n");
    return 0;
  }
  process.stderr.write(`Sous-commande divorce inconnue : ${sub}\n`);
  return 2;
}

async function runBii(args: string[]): Promise<number> {
  const sub = args[0];
  if (!sub || sub === "help") {
    process.stdout.write("bii matrimonial|parental|article|articles|states\n");
    return 0;
  }
  if (sub === "matrimonial") {
    const input = await readJson<BiiMatrimonialCase>(args.slice(1));
    process.stdout.write(
      JSON.stringify(analyseBiiMatrimonial(input), null, 2) + "\n",
    );
    return 0;
  }
  if (sub === "parental") {
    const input = await readJson<BiiParentalResponsibilityCase>(args.slice(1));
    process.stdout.write(
      JSON.stringify(analyseBiiParental(input), null, 2) + "\n",
    );
    return 0;
  }
  if (sub === "article") {
    const id = args[1];
    if (!id) throw new Error("Numéro d'article requis.");
    const art = getBiiArticle(id);
    if (!art) {
      process.stderr.write(`Article ${id} non trouvé.\n`);
      return 1;
    }
    process.stdout.write(`${art.id} — ${art.title}\n${art.summary}\n`);
    return 0;
  }
  if (sub === "articles") {
    for (const art of listBiiArticles()) {
      process.stdout.write(`${art.id.padEnd(8)} ${art.title}\n`);
    }
    return 0;
  }
  if (sub === "states") {
    process.stdout.write(listBiiBoundStates().join(" ") + "\n");
    return 0;
  }
  process.stderr.write(`Sous-commande bii inconnue : ${sub}\n`);
  return 2;
}

async function runCrisis(args: string[]): Promise<number> {
  const sub = args[0];
  if (!sub || sub === "help") {
    process.stdout.write("crisis analyze\n");
    return 0;
  }
  if (sub === "analyze") {
    const input = await readJson<CrisisCase>(args.slice(1));
    process.stdout.write(JSON.stringify(analyseCrisis(input), null, 2) + "\n");
    return 0;
  }
  process.stderr.write(`Sous-commande crisis inconnue : ${sub}\n`);
  return 2;
}

async function runMaintenance(args: string[]): Promise<number> {
  const sub = args[0];
  if (!sub || sub === "help") {
    process.stdout.write("maintenance analyze|article|articles|states\n");
    return 0;
  }
  if (sub === "analyze") {
    const input = await readJson<MaintenanceCase>(args.slice(1));
    process.stdout.write(JSON.stringify(analyseMaintenance(input), null, 2) + "\n");
    return 0;
  }
  if (sub === "article") {
    const id = args[1];
    if (!id) throw new Error("Numéro d'article requis (ex. 3, 15, P.4).");
    const art = getMaintenanceArticle(id);
    if (!art) {
      process.stderr.write(`Article ${id} non trouvé.\n`);
      return 1;
    }
    process.stdout.write(`${art.id} — ${art.title}\n${art.summary}\n`);
    return 0;
  }
  if (sub === "articles") {
    for (const art of listMaintenanceArticles()) {
      process.stdout.write(`${art.id.padEnd(28)} ${art.title}\n`);
    }
    return 0;
  }
  if (sub === "states") {
    process.stdout.write(listMaintenanceBoundStates().join(" ") + "\n");
    return 0;
  }
  process.stderr.write(`Sous-commande maintenance inconnue : ${sub}\n`);
  return 2;
}

async function runConsultation(args: string[]): Promise<void> {
  const input = await readCase(args);
  const analysis = analyseSuccession(input);
  const titleIdx = args.indexOf("--title");
  const title = titleIdx >= 0 ? args[titleIdx + 1] : undefined;
  const html = renderConsultationHTML(
    analysis,
    title ? { title } : {},
  );
  const outIdx = args.indexOf("--out");
  if (outIdx >= 0) {
    const path = args[outIdx + 1];
    if (!path) throw new Error("--out attend un chemin.");
    writeFileSync(path, html, "utf8");
    process.stderr.write(`Note écrite : ${path}\n`);
  } else {
    process.stdout.write(html);
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

  if (cmd === "consultation") {
    await runConsultation(args.slice(1));
    return 0;
  }

  if (cmd === "third-states") {
    for (const r of listThirdStateRules()) {
      process.stdout.write(`${r.country.padEnd(4)} ${r.source}\n`);
    }
    return 0;
  }

  if (cmd === "matrimonial") {
    return runMatrimonial(args.slice(1));
  }

  if (cmd === "partnership") {
    return runPartnership(args.slice(1));
  }

  if (cmd === "combined") {
    return runCombined(args.slice(1));
  }

  if (cmd === "divorce") {
    return runDivorce(args.slice(1));
  }

  if (cmd === "bii") {
    return runBii(args.slice(1));
  }

  if (cmd === "crisis") {
    return runCrisis(args.slice(1));
  }

  if (cmd === "maintenance") {
    return runMaintenance(args.slice(1));
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
