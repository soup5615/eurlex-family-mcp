// Central legal disclaimer + verification-status taxonomy.
//
// This module is the single source of truth for how the product
// communicates its limitations to users. Every consultation note,
// every API response, and the web UI surface this information.
//
// Verification statuses
// ─────────────────────
//   "drafted-by-claude"
//     Article summary written from the model's training-data
//     knowledge of the regulation. Substance is generally accurate
//     but exact wording, numbering and edge cases require external
//     verification.
//
//   "needs-external-review"
//     Areas where the model itself flagged uncertainty. Requires
//     verification by a DIP-famille practitioner.
//
//   "verified-against-official-text"
//     Set only after `scripts/verify-eur-lex.ts` has confirmed the
//     entry against the EUR-Lex / HCCH official text. Today, none
//     of the entries carry this status.

export type VerificationStatus =
  | "drafted-by-claude"
  | "needs-external-review"
  | "verified-against-official-text";

// Confidence taxonomy on engine determinations.
//
//   "high"               mechanical rule, unambiguous facts
//   "fact-sensitive"     judicial appreciation required
//                        (art. 21(2) R650, 26(2) R1103, 13(1)(b) HCCH 1980 …)
//   "engine-limitation"  the model approximates (e.g. HR-at-disposition
//                        approximated by current HR), or relies on a
//                        partially-modelled rule.
export type Confidence = "high" | "fact-sensitive" | "engine-limitation";

export const PRIMARY_DISCLAIMER =
  "Outil automatisé d'aide à la qualification en droit international privé européen de la famille. Les résumés d'articles et les conclusions du moteur sont rédigés à partir de la connaissance du modèle et n'ont pas été validés par un universitaire ou un praticien spécialisé. CE PRODUIT NE CONSTITUE PAS UN CONSEIL JURIDIQUE et ne se substitue pas à la consultation d'un avocat ou d'un notaire. Toute conclusion doit être vérifiée auprès des textes officiels (EUR-Lex, curia.europa.eu, HCCH) et de la doctrine canonique avant tout usage en dossier.";

export const SHORT_DISCLAIMER =
  "Aide à la qualification — ne constitue pas un conseil juridique. Vérification professionnelle requise.";

export const SCOPE_LIMITATIONS_BY_REGULATION: Record<string, string[]> = {
  "650-2012": [
    "Art. 6 (déclinatoire) modélisé uniquement comme avertissement, pas comme moteur d'effets juridictionnels.",
    "Art. 23 (domaine de la loi applicable) non détaillé point par point.",
    "Art. 28 (effets contre les tiers) non modélisé.",
    "Art. 29 (administration spéciale) non modélisé.",
    "Art. 30 (lois de police de l'État de situation) non modélisé.",
    "Art. 31 (adaptation) signalé en raison de Kubicka mais non systématique.",
    "Art. 32-33 (commorientes / successions vacantes) non modélisé.",
    "Art. 36-38 (règles plurilegislatives) non modélisé.",
    "Renvoi (art. 34) : 12 États tiers couverts ; le DIP des autres tiers est signalé en lacune et requiert recherche manuelle.",
    "Validité formelle (art. 27) : engine vérifie les rattachements admissibles ; ne prononce pas sur la conformité matérielle de l'acte au droit national désigné.",
    "Reconnaissance & exécution (chapitre IV) : couvert par le module séparé `recognition`, mais qualifications fines (motifs de refus art. 40) à vérifier.",
  ],
  "1259-2010": [
    "Art. 6 (consentement et validité au fond) signalé mais non modélisé en détail.",
    "Art. 7 (validité formelle) modélisé pour la baseline + formalités EM ; ne se prononce pas sur la conformité matérielle.",
    "Art. 9 (conversion séparation→divorce) modélisé mais sans gestion fine de la conversion judiciaire en cours.",
    "Art. 12 (ordre public) signalé en flag, non automatisé.",
  ],
  "2016-1103": [
    "Art. 26(2) modélisé avec heuristique 2:1 — paramètre arbitraire, l'appréciation judiciaire reste seule juge.",
    "Art. 26(3) blocage MPA-antérieure-au-mariage approximé : on n'a pas la date d'établissement de la 1ère RH commune.",
    "Art. 28 (effets envers les tiers) non modélisé.",
    "Art. 29 (adaptation droits réels) non modélisé.",
    "Art. 30 (lois de police), 31 (ordre public) non automatisés.",
    "Art. 31-33 (états plurilegislatifs) non modélisé.",
    "Reconnaissance & exécution (chapitre IV) : couvert par `recognition` mais à fin grain à vérifier.",
  ],
  "2016-1104": [
    "Voir limitations 2016/1103 — applicables mutatis mutandis.",
    "Art. 9 (compétence alternative en cas de non-reconnaissance du partenariat) signalé en warning, non automatisé.",
  ],
  "2019-1111": [
    "Art. 8 (maintien 3 mois après déménagement) limité au droit de visite.",
    "Art. 11 (présence de l'enfant) signalé en flag, non automatisé.",
    "Art. 12 (transfert à juridiction mieux placée) non modélisé.",
    "Art. 13 (mesures provisoires) non modélisé.",
    "Art. 17 (date de saisine) non modélisé en détail.",
    "Art. 20 (litispendance) non modélisé.",
    "Mécanisme d'override art. 11(7) (Bruxelles II ter) signalé dans le module Hague 1980, non orchestré.",
  ],
  "4-2009": [
    "Art. 5 (compétence par comparution) signalé, non testé.",
    "Section 1 vs Section 2 du chapitre IV : régime distingué, mais procédure d'exequatur Section 2 non détaillée.",
    "Cascade de la nationalité art. 6 simplifiée (multinationalités non gérées finement).",
  ],
  "hague-protocol-2007": [
    "Art. 4 cascade : implémentée avec deux chaînes selon que le for est l'État de RH du débiteur ; les drapeaux 'la loi désignée permet l'obligation' sont passés par l'utilisateur — pas de vérification matérielle.",
    "Art. 6 défense spéciale (autres bénéficiaires, contestation par le débiteur) signalée mais non modélisée.",
    "Art. 13 (ordre public) signalé en flag.",
  ],
  "hague-1980": [
    "Liste des États parties non exhaustive (focus EU + tiers fréquents).",
    "Art. 12 § 2 (intégration) : raised uniquement si l'utilisateur l'invoque explicitement.",
    "Art. 13(1)(b) (risque grave) : un drapeau ; l'engine ne se prononce pas sur la suffisance des mesures de protection art. 11(4) BIIter.",
    "Art. 11(7) Bruxelles II ter (override de retour) signalé en commentaire, non orchestré.",
  ],
};

export interface ScopeNote {
  regulation: string;
  limitations: string[];
}

export function listScopeLimitations(): ScopeNote[] {
  return Object.entries(SCOPE_LIMITATIONS_BY_REGULATION).map(
    ([regulation, limitations]) => ({ regulation, limitations }),
  );
}
