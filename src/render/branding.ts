// Branding & legal-deliverable layout for the consultation note.
//
// A "branding" carries the cabinet's identity (firm name, address,
// optional logo as a data: URL) and the dossier metadata (author,
// client reference, dossier date). When supplied, the consultation
// note acquires:
//   - a cover page with logo + title + dossier reference,
//   - a dedicated "Avertissement" page reproducing the full primary
//     disclaimer + the scope limitations applicable to the regulation
//     of the case,
//   - running headers/footers on every subsequent page (firm name +
//     "Confidentiel" + page numbers via CSS @page counters).
//
// All output is HTML — Chrome headless then converts to PDF and
// honours the @page rules. No new runtime dependency is introduced.

import {
  PRIMARY_DISCLAIMER,
  SCOPE_LIMITATIONS_BY_REGULATION,
} from "../data/legalDisclaimer.js";
import {
  regulationSource,
  type RegulationKey,
} from "../data/sources.js";

export interface Branding {
  firmName?: string;
  firmAddress?: string;
  firmTagline?: string;
  // Data URL preferred (data:image/png;base64,…) — survives PDF
  // generation. Plain http(s) URL also accepted but Chrome must be
  // able to fetch it.
  logoDataUrl?: string;
  authorName?: string;
  authorTitle?: string;
  clientReference?: string;
  caseTitle?: string;
  caseDate?: string; // ISO; defaults to today
  // Two-letter code displayed in the running footer (e.g. "FR" for a
  // French cabinet using French formalities). Purely cosmetic.
  jurisdictionTag?: string;
}

function esc(s: string | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// CSS for the @page rules. Chrome respects margin boxes via the
// content() function; a single style block is enough.
export function pageStyle(branding: Branding): string {
  const headerLeft = branding.firmName
    ? esc(branding.firmName)
    : "eurlex-family";
  const headerRight = "Confidentiel — Note de consultation";
  return `@page {
  size: A4;
  margin: 22mm 18mm 25mm 18mm;
  @top-left {
    content: "${headerLeft}";
    font-family: Georgia, serif;
    font-size: 9pt;
    color: #555;
  }
  @top-right {
    content: "${headerRight}";
    font-family: Georgia, serif;
    font-size: 9pt;
    color: #c33;
  }
  @bottom-center {
    content: counter(page) " / " counter(pages);
    font-family: Georgia, serif;
    font-size: 9pt;
    color: #777;
  }
  @bottom-left {
    content: "Aide à la décision — vérification professionnelle requise";
    font-family: Georgia, serif;
    font-size: 8pt;
    color: #888;
  }
}
@page :first {
  @top-left { content: ""; }
  @top-right { content: ""; }
}
.cover, .disclaimer-page { page-break-after: always; }
.cover { display: flex; flex-direction: column; justify-content: space-between; min-height: 24cm; }
.cover-top { text-align: center; padding-top: 1cm; }
.cover-logo { max-height: 4cm; max-width: 9cm; margin: 0 auto 1.5cm; display: block; }
.cover-firm { font-family: Georgia, serif; font-size: 13pt; color: #1a1a1a; margin-bottom: .3cm; font-weight: bold; }
.cover-tagline { font-family: Georgia, serif; font-size: 10pt; color: #555; font-style: italic; }
.cover-title { font-family: Georgia, serif; font-size: 24pt; color: #1a1a1a; margin: 4cm auto 1cm; max-width: 14cm; line-height: 1.25; }
.cover-subtitle { font-family: Georgia, serif; font-size: 12pt; color: #555; max-width: 14cm; margin: 0 auto; }
.cover-meta { font-family: Georgia, serif; font-size: 11pt; color: #1a1a1a; max-width: 14cm; margin: 4cm auto 0; line-height: 1.7; }
.cover-meta dt { font-weight: bold; display: inline-block; min-width: 5cm; }
.cover-meta dd { display: inline; margin: 0; }
.cover-meta div { margin-bottom: .3cm; }
.cover-bottom { padding-bottom: 1cm; text-align: center; }
.cover-bottom .firm-address { font-family: Georgia, serif; font-size: 9pt; color: #777; line-height: 1.4; }
.disclaimer-page { padding: 1cm 0; }
.disclaimer-page h2 { color: #8b3a00; }
.disclaimer-page .ack {
  border: 1px solid #cc8800;
  background: #fff4e0;
  padding: .8cm 1cm;
  margin-top: 1cm;
  font-family: Georgia, serif;
  font-size: 10pt;
  line-height: 1.5;
}
.disclaimer-page .ack strong { color: #8b3a00; }
.disclaimer-page .signature {
  margin-top: 2cm;
  border-top: 1px solid #999;
  padding-top: .5cm;
  font-size: 9pt;
  color: #555;
  display: flex;
  justify-content: space-between;
}`;
}

export function renderCoverPage(
  branding: Branding,
  defaultTitle: string,
): string {
  const today = new Date().toISOString().slice(0, 10);
  const title = branding.caseTitle ?? defaultTitle;
  const date = branding.caseDate ?? today;

  return `<section class="cover">
  <div class="cover-top">
    ${branding.logoDataUrl ? `<img class="cover-logo" src="${esc(branding.logoDataUrl)}" alt="${esc(branding.firmName ?? "")}">` : ""}
    ${branding.firmName ? `<div class="cover-firm">${esc(branding.firmName)}</div>` : ""}
    ${branding.firmTagline ? `<div class="cover-tagline">${esc(branding.firmTagline)}</div>` : ""}
    <h1 class="cover-title">${esc(title)}</h1>
    <p class="cover-subtitle">Note de consultation en droit international privé européen de la famille</p>
  </div>
  <dl class="cover-meta">
    ${branding.clientReference ? `<div><dt>Référence dossier</dt><dd>${esc(branding.clientReference)}</dd></div>` : ""}
    <div><dt>Date</dt><dd>${esc(date)}</dd></div>
    ${branding.authorName ? `<div><dt>Rédigé par</dt><dd>${esc(branding.authorName)}${branding.authorTitle ? `, ${esc(branding.authorTitle)}` : ""}</dd></div>` : ""}
  </dl>
  <div class="cover-bottom">
    ${branding.firmAddress ? `<div class="firm-address">${esc(branding.firmAddress)}</div>` : ""}
  </div>
</section>`;
}

export function renderDisclaimerPage(
  regulationKeys: RegulationKey[],
): string {
  const limitations = regulationKeys
    .map((k) => SCOPE_LIMITATIONS_BY_REGULATION[k])
    .filter((x): x is string[] => Array.isArray(x))
    .flat();
  const sources = regulationKeys.map((k) => regulationSource(k));
  return `<section class="disclaimer-page">
  <h2>Avertissement</h2>
  <div class="ack">
    <p><strong>Le présent document est une consultation automatisée d'aide à la qualification.</strong></p>
    <p>${esc(PRIMARY_DISCLAIMER)}</p>
  </div>

  <h3 style="margin-top:2cm;">Périmètre de la consultation</h3>
  <p>Cette consultation porte sur les instruments suivants :</p>
  <ul>
    ${sources.map((s) => `<li><em>${esc(s.shortTitle)}</em> — texte officiel : ${esc(s.officialUrl)}</li>`).join("")}
  </ul>

  ${
    limitations.length > 0
      ? `<h3 style="margin-top:1.5cm;">Limites du moteur (points non modélisés ou approximés)</h3>
         <ul>${limitations.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`
      : ""
  }

  <div class="signature">
    <span>Document généré automatiquement</span>
    <span>${new Date().toISOString().slice(0, 10)}</span>
  </div>
</section>`;
}

export function hasBranding(b: Branding | undefined): b is Branding {
  if (!b) return false;
  return Boolean(
    b.firmName ||
      b.logoDataUrl ||
      b.authorName ||
      b.clientReference ||
      b.caseTitle,
  );
}
