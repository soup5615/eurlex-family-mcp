import type { ReasoningStep, SuccessionAnalysis } from "../types.js";
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
      <p><a href="${esc(src.officialUrl)}" target="_blank" rel="noopener">Texte officiel (EUR-Lex / HCCH)</a>${
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

export function renderConsultationHTML(
  a: SuccessionAnalysis,
  opts: { title?: string } = {},
): string {
  const title = opts.title ?? "Consultation — Règl. (UE) 650/2012";
  const nats = a.input.deceased.nationalities.join(", ") || "(aucune)";
  const hr = a.input.deceased.lastHabitualResidence;

  const dispositionsBlock = a.dispositions
    .map((d) => {
      const formal = d.formalValidity.applicable
        ? `
          <h4>Validité formelle (art. 27)</h4>
          <p>Lois testables : <strong>${esc(Array.from(new Set(d.formalValidity.candidateLaws.map((c) => c.law))).join(", ") || "(aucune)")}</strong></p>
          <ul>${d.formalValidity.candidateLaws.map((c) => `<li><strong>${esc(c.law)}</strong> — ${esc(c.connection)} : ${esc(c.explanation)}</li>`).join("")}</ul>
          ${reasoningList(d.formalValidity.reasoning)}
          ${warningList(d.formalValidity.warnings)}`
        : `<p><em>Art. 27 non applicable (disposition non écrite).</em></p>`;
      return `
        <section class="disposition">
          <h3>${esc(d.disposition.type)} du ${esc(d.disposition.dateExecuted)}</h3>
          <p>Loi régissant la recevabilité et la validité au fond :
            <strong>${esc(d.lawGoverningAdmissibilityAndValidity ?? "(à déterminer)")}</strong>
            <span class="muted">(${esc(d.basis)})</span></p>
          ${reasoningList(d.reasoning)}
          ${formal}
        </section>`;
    })
    .join("");

  const renvoiBlock =
    a.renvoi.considered || a.renvoi.blockedByArt34_2
      ? `<section>
          <h2>Renvoi (art. 34)</h2>
          <p>Examiné : <strong>${a.renvoi.considered ? "oui" : "non"}</strong>
          ${a.renvoi.blockedByArt34_2 ? '<span class="badge">bloqué par art. 34(2)</span>' : ""}</p>
          <p>${esc(a.renvoi.rationale)}</p>
          ${a.renvoi.referralTarget ? `<p>Loi matérielle retenue : <strong>${esc(a.renvoi.referralTarget)}</strong></p>` : ""}
          ${a.renvoi.dataSource ? `<p class="muted">Source DIP : ${esc(a.renvoi.dataSource)}</p>` : ""}
          ${reasoningList(a.renvoi.reasoning)}
          ${warningList(a.renvoi.warnings)}
        </section>`
      : "";

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<style>
  body { font-family: Georgia, "Times New Roman", serif; max-width: 820px; margin: 2rem auto; color: #1a1a1a; line-height: 1.5; padding: 0 1rem; }
  h1 { border-bottom: 2px solid #1a1a1a; padding-bottom: .3rem; }
  h2 { margin-top: 2rem; border-bottom: 1px solid #bbb; padding-bottom: .2rem; }
  h3 { margin-top: 1.2rem; }
  h4 { margin-top: 1rem; color: #444; }
  .muted { color: #777; font-size: 0.9em; }
  .badge { display: inline-block; padding: 2px 6px; background: #eee; border-radius: 3px; font-size: 0.85em; }
  .facts { background: #f7f7f5; padding: 0.8rem 1rem; border-left: 3px solid #888; }
  .reasoning { margin-left: 0; padding-left: 1.2rem; }
  .reasoning li { margin-bottom: .6rem; }
  .article { font-weight: bold; }
  .warnings { color: #8b3a00; margin-left: 1rem; }
  .warnings li { margin-bottom: .3rem; }
  .flags { background: #fff7e6; padding: 0.8rem 1rem; border-left: 3px solid #cc8800; }
  footer { margin-top: 3rem; color: #777; font-size: 0.85em; border-top: 1px solid #ddd; padding-top: 1rem; }
  .disposition { border-left: 2px solid #ccc; padding-left: 1rem; margin: 1rem 0; }
  .sources h3 { font-size: .95rem; margin: 1rem 0 .3rem; }
  .sources .src-section { margin-bottom: 1rem; }
  .doctrine { padding-left: 1.2rem; }
  .doctrine li { margin-bottom: .35rem; font-size: .9rem; }
</style>
</head>
<body>
  <h1>${esc(title)}</h1>
  <p class="muted">Règlement (UE) n° 650/2012 du 4 juillet 2012 — consultation automatisée</p>

  <section>
    <h2>Faits</h2>
    <div class="facts">
      <p>Défunt : nationalité(s) <strong>${esc(nats)}</strong>, dernière résidence habituelle <strong>${esc(hr)}</strong>, décédé le <strong>${esc(a.input.deceased.dateOfDeath)}</strong>.</p>
      ${a.input.professioJuris ? `<p>Choix de loi (art. 22) : <strong>${esc(a.input.professioJuris.chosenLaw)}</strong> (${esc(a.input.professioJuris.form)}).</p>` : ""}
      ${a.input.assets?.length ? `<p>Biens : ${a.input.assets.map((x) => `${esc(x.kind)} en ${esc(x.locatedIn)}`).join(" ; ")}.</p>` : ""}
      ${a.input.forumState ? `<p>For saisi/envisagé : <strong>${esc(a.input.forumState)}</strong>.</p>` : ""}
    </div>
  </section>

  <section>
    <h2>Champ d'application</h2>
    <p>Temporel : <strong>${a.temporalScope.applicable ? "OUI" : "NON"}</strong> — ${esc(a.temporalScope.reason)}</p>
    <p class="muted">Matériel : ${esc(a.materialScope.reason)}</p>
  </section>

  <section>
    <h2>Compétence (art. 4-11)</h2>
    <p>For compétent : <strong>${esc(a.jurisdiction.competentForum ?? "aucun")}</strong>
      <span class="muted">(${esc(a.jurisdiction.basis)}, portée : ${esc(a.jurisdiction.scope)})</span></p>
    ${reasoningList(a.jurisdiction.reasoning)}
    ${warningList(a.jurisdiction.warnings)}
  </section>

  <section>
    <h2>Loi applicable (art. 20-22)</h2>
    <p>Loi désignée : <strong>${esc(a.applicableLaw.applicableLaw ?? "aucune")}</strong>
      <span class="muted">(${esc(a.applicableLaw.basis)})</span></p>
    <p>Application universelle (art. 20) : ${a.applicableLaw.universalApplication ? "oui" : "non"}</p>
    ${a.applicableLaw.renvoiAccepted ? `<p>Renvoi accepté : de <strong>${esc(a.applicableLaw.renvoiAccepted.from)}</strong> vers <strong>${esc(a.applicableLaw.renvoiAccepted.to)}</strong>.</p>` : ""}
    ${reasoningList(a.applicableLaw.reasoning)}
    ${warningList(a.applicableLaw.warnings)}
  </section>

  ${renvoiBlock}

  ${a.dispositions.length > 0 ? `<section><h2>Dispositions à cause de mort (art. 24-27)</h2>${dispositionsBlock}</section>` : ""}

  <section>
    <h2>Certificat successoral européen (art. 62 ss)</h2>
    <p>Recommandé : <strong>${a.esc.recommended ? "oui" : "non"}</strong></p>
    <p>${esc(a.esc.rationale)}</p>
    ${a.esc.issuingAuthorityState ? `<p>Autorité émettrice compétente : <strong>${esc(a.esc.issuingAuthorityState)}</strong>.</p>` : ""}
    ${a.esc.notes.length ? `<ul>${a.esc.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}
  </section>

  ${a.flags.length > 0 ? `<section><h2>Points de vigilance</h2><div class="flags"><ul>${a.flags.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></div></section>` : ""}

  ${sourcesBlock(["650-2012"])}

  <footer>
    Consultation générée par eurlex-family-mcp. Outil d'aide à la décision — ne se
    substitue pas à l'analyse d'un professionnel du droit.
  </footer>
</body>
</html>`;
}
