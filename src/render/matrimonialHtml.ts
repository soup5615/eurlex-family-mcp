import type {
  MatrimonialAnalysis,
  ReasoningStep,
} from "../matrimonial/types.js";
import type { CombinedAnalysis } from "../matrimonial/combined.js";
import {
  listDoctrine,
  regulationSource,
  type DoctrineEntry,
  type RegulationKey,
} from "../data/sources.js";

function sourcesBlock(keys: RegulationKey[]): string {
  const sections = keys.map((key) => {
    const src = regulationSource(key);
    const doctrine = listDoctrine(key);
    const docHtml = doctrine.length
      ? `<ul class="doctrine">${doctrine
          .map(
            (d: DoctrineEntry) => `<li>
              <strong>${esc(d.authors)}</strong>, <em>${esc(d.title)}</em>,
              ${esc(d.publisher)}, ${d.year}
              ${d.url ? ` — <a href="${esc(d.url)}" target="_blank" rel="noopener">accès libre</a>` : ""}
              ${d.notes ? `<div class="muted">${esc(d.notes)}</div>` : ""}
            </li>`,
          )
          .join("")}</ul>`
      : "";
    return `<div class="src-section">
      <h3>${esc(src.shortTitle)}</h3>
      <p><a href="${esc(src.officialUrl)}" target="_blank" rel="noopener">Texte officiel</a>${
        src.consolidatedUrl
          ? ` · <a href="${esc(src.consolidatedUrl)}" target="_blank" rel="noopener">Version consolidée</a>`
          : ""
      }</p>
      ${docHtml}
    </div>`;
  });
  return `<section class="sources">
    <h2>Sources &amp; doctrine</h2>
    ${sections.join("")}
  </section>`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function reasoningList(steps: ReasoningStep[]): string {
  if (steps.length === 0) return "";
  return `<ol class="reasoning">${steps
    .map(
      (r) => `<li>
        <div class="article">${esc(r.article)}</div>
        <div class="rule"><em>Règle :</em> ${esc(r.rule)}</div>
        <div class="applied"><em>Application :</em> ${esc(r.appliedTo)}</div>
        <div class="conclusion"><em>Conclusion :</em> ${esc(r.conclusion)}</div>
      </li>`,
    )
    .join("")}</ol>`;
}

function warningList(ws: string[]): string {
  if (ws.length === 0) return "";
  return `<ul class="warnings">${ws.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>`;
}

const STYLE = `body { font-family: Georgia, "Times New Roman", serif; max-width: 820px; margin: 2rem auto; color: #1a1a1a; line-height: 1.5; padding: 0 1rem; }
h1 { border-bottom: 2px solid #1a1a1a; padding-bottom: .3rem; }
h2 { margin-top: 2rem; border-bottom: 1px solid #bbb; padding-bottom: .2rem; }
h3 { margin-top: 1.2rem; }
.muted { color: #777; font-size: 0.9em; }
.facts { background: #f7f7f5; padding: 0.8rem 1rem; border-left: 3px solid #888; }
.reasoning { margin-left: 0; padding-left: 1.2rem; }
.reasoning li { margin-bottom: .6rem; }
.article { font-weight: bold; }
.warnings { color: #8b3a00; margin-left: 1rem; }
.warnings li { margin-bottom: .3rem; }
.flags { background: #fff7e6; padding: 0.8rem 1rem; border-left: 3px solid #cc8800; }
footer { margin-top: 3rem; color: #777; font-size: 0.85em; border-top: 1px solid #ddd; padding-top: 1rem; }
.sources h3 { font-size: .95rem; margin: 1rem 0 .3rem; }
.sources .src-section { margin-bottom: 1rem; }
.doctrine { padding-left: 1.2rem; }
.doctrine li { margin-bottom: .35rem; font-size: .9rem; }`;

export function renderMatrimonialHTML(
  a: MatrimonialAnalysis,
  opts: { title?: string } = {},
): string {
  const title = opts.title ?? "Consultation — Règl. (UE) 2016/1103";
  const [sa, sb] = a.input.spouses;

  const mpaBlock = a.mpa
    ? `<section>
        <h2>Convention matrimoniale (art. 25)</h2>
        <p>Écrit daté signé : <strong>${a.mpa.baselineSatisfied === null ? "non renseigné" : a.mpa.baselineSatisfied ? "oui" : "NON"}</strong></p>
        ${a.mpa.candidateAdditionalLaws.length > 0 ? `<p>Formalités supplémentaires à vérifier : <strong>${esc(a.mpa.candidateAdditionalLaws.join(", "))}</strong></p>` : ""}
        ${reasoningList(a.mpa.reasoning)}
        ${warningList(a.mpa.warnings)}
      </section>`
    : "";

  const colBlock = a.choiceOfLawFormal
    ? `<section>
        <h2>Convention de choix de loi (art. 23)</h2>
        <p>Écrit daté signé : <strong>${a.choiceOfLawFormal.baselineSatisfied === null ? "non renseigné" : a.choiceOfLawFormal.baselineSatisfied ? "oui" : "NON"}</strong></p>
        ${a.choiceOfLawFormal.candidateAdditionalLaws.length > 0 ? `<p>Formalités supplémentaires : <strong>${esc(a.choiceOfLawFormal.candidateAdditionalLaws.join(", "))}</strong></p>` : ""}
        ${reasoningList(a.choiceOfLawFormal.reasoning)}
        ${warningList(a.choiceOfLawFormal.warnings)}
      </section>`
    : "";

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<style>${STYLE}</style>
</head>
<body>
  <h1>${esc(title)}</h1>
  <p class="muted">Règlement (UE) 2016/1103 du 24 juin 2016 — consultation automatisée</p>

  <section>
    <h2>Faits</h2>
    <div class="facts">
      <p>Époux A (${esc(sa.id)}) : nationalité(s) <strong>${esc(sa.nationalities.join(", ") || "(aucune)")}</strong>, RH <strong>${esc(sa.habitualResidence)}</strong>.</p>
      <p>Époux B (${esc(sb.id)}) : nationalité(s) <strong>${esc(sb.nationalities.join(", ") || "(aucune)")}</strong>, RH <strong>${esc(sb.habitualResidence)}</strong>.</p>
      <p>Mariage : <strong>${esc(a.input.marriage.dateOfMarriage)}</strong>${a.input.marriage.placeOfMarriage ? ` à ${esc(a.input.marriage.placeOfMarriage)}` : ""}.</p>
      ${a.input.choiceOfLaw ? `<p>Choix de loi (art. 22) : <strong>${esc(a.input.choiceOfLaw.chosenLaw)}</strong> (${esc(a.input.choiceOfLaw.form)}, ${esc(a.input.choiceOfLaw.dateOfChoice)}).</p>` : ""}
      ${a.input.mpa ? `<p>Convention matrimoniale : ${esc(a.input.mpa.kind)} du ${esc(a.input.mpa.dateExecuted)}.</p>` : ""}
    </div>
  </section>

  <section>
    <h2>Champ d'application</h2>
    <p>Temporel : <strong>${a.temporalScope.applicable ? "OUI" : "NON"}</strong> — ${esc(a.temporalScope.reason)}</p>
  </section>

  <section>
    <h2>Compétence (art. 4-11)</h2>
    <p>For compétent : <strong>${esc(a.jurisdiction.competentForum ?? "aucun")}</strong>
      <span class="muted">(${esc(a.jurisdiction.basis)}, portée : ${esc(a.jurisdiction.scope)})</span></p>
    ${reasoningList(a.jurisdiction.reasoning)}
    ${warningList(a.jurisdiction.warnings)}
  </section>

  <section>
    <h2>Loi applicable (art. 22, 26, 32)</h2>
    <p>Loi désignée : <strong>${esc(a.applicableLaw.applicableLaw ?? "(à déterminer)")}</strong>
      <span class="muted">(${esc(a.applicableLaw.basis)})</span></p>
    <p>Application universelle (art. 20) : ${a.applicableLaw.universalApplication ? "oui" : "non"} — Renvoi exclu (art. 32) : ${a.applicableLaw.renvoiExcluded ? "oui" : "non"}</p>
    ${reasoningList(a.applicableLaw.reasoning)}
    ${warningList(a.applicableLaw.warnings)}
  </section>

  ${mpaBlock}
  ${colBlock}

  ${a.flags.length > 0 ? `<section><h2>Points de vigilance</h2><div class="flags"><ul>${a.flags.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></div></section>` : ""}

  ${sourcesBlock(["2016-1103"])}

  <footer>
    Consultation générée par eurlex-family-mcp. Outil d'aide à la décision — ne
    se substitue pas à l'analyse d'un professionnel du droit.
  </footer>
</body>
</html>`;
}

export function renderCombinedHTML(
  a: CombinedAnalysis,
  opts: { title?: string } = {},
): string {
  const title = opts.title ?? "Consultation — décès d'un conjoint (UE)";
  const dec = a.succession.input.deceased;

  const orchestrationBlock = `<section>
    <h2>Orchestration succession / régime matrimonial</h2>
    <p>Concentration art. 4 Règl. 2016/1103 : <strong>${a.orchestration.concentrationApplies ? "oui" : "non"}</strong></p>
    <p>For compétent : <strong>${esc(a.orchestration.competentForum ?? "aucun")}</strong></p>
    <ol>${a.orchestration.orderOfOperations.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
    ${warningList(a.orchestration.notes)}
  </section>`;

  const successionSummary = `<section>
    <h2>Volet successoral (Règl. 650/2012)</h2>
    <p>For : <strong>${esc(a.succession.jurisdiction.competentForum ?? "aucun")}</strong> (${esc(a.succession.jurisdiction.basis)})</p>
    <p>Loi applicable : <strong>${esc(a.succession.applicableLaw.applicableLaw ?? "aucune")}</strong> (${esc(a.succession.applicableLaw.basis)})</p>
    ${a.succession.renvoi.referralAccepted && a.succession.renvoi.referralTarget ? `<p>Renvoi accepté → <strong>${esc(a.succession.renvoi.referralTarget)}</strong></p>` : ""}
    <p>CSE recommandé : ${a.succession.esc.recommended ? "oui" : "non"}</p>
  </section>`;

  const matrimonialSummary = `<section>
    <h2>Volet régime matrimonial (Règl. 2016/1103)</h2>
    <p>For : <strong>${esc(a.matrimonial.jurisdiction.competentForum ?? "aucun")}</strong> (${esc(a.matrimonial.jurisdiction.basis)})</p>
    <p>Loi applicable : <strong>${esc(a.matrimonial.applicableLaw.applicableLaw ?? "(à déterminer)")}</strong> (${esc(a.matrimonial.applicableLaw.basis)})</p>
    ${reasoningList(a.matrimonial.applicableLaw.reasoning)}
  </section>`;

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<style>${STYLE}</style>
</head>
<body>
  <h1>${esc(title)}</h1>
  <p class="muted">Règlement (UE) 650/2012 + Règlement (UE) 2016/1103</p>

  <section>
    <h2>Faits</h2>
    <div class="facts">
      <p>Défunt : nationalité(s) <strong>${esc(dec.nationalities.join(", ") || "(aucune)")}</strong>, dernière RH <strong>${esc(dec.lastHabitualResidence)}</strong>, décédé le <strong>${esc(dec.dateOfDeath)}</strong>.</p>
    </div>
  </section>

  ${orchestrationBlock}
  ${successionSummary}
  ${matrimonialSummary}

  ${a.matrimonial.flags.length > 0 || a.succession.flags.length > 0 ? `<section><h2>Points de vigilance</h2><div class="flags"><ul>${[...a.succession.flags, ...a.matrimonial.flags].map((f) => `<li>${esc(f)}</li>`).join("")}</ul></div></section>` : ""}

  ${sourcesBlock(["650-2012", "2016-1103"])}

  <footer>
    Consultation combinée générée par eurlex-family-mcp. Outil d'aide à la
    décision — ne se substitue pas à un professionnel du droit.
  </footer>
</body>
</html>`;
}
