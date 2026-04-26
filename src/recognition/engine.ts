// Recognition and enforcement of decisions across the family-law
// regulations. This is a unified module covering:
//   - Reg. (EU) 650/2012     Chapter IV   (art. 39-58, 59-60, 61, 62-73 ESC)
//   - Reg. (EU) 2016/1103    Chapter IV   (art. 36-57)
//   - Reg. (EU) 2016/1104    Chapter IV   (art. 36-57)
//   - Reg. (EC) 4/2009       Chapter IV   (art. 16-43, with Section 1
//                                          for protocole-bound MS,
//                                          Section 2 for the rest)
//   - Reg. (EU) 2019/1111    Chapter IV   (art. 30-55, 60-65 enforcement)

import type { CountryCode, ReasoningStep } from "../types.js";

export type { CountryCode, ReasoningStep };

export type DecisionRegulation =
  | "650-2012"
  | "2016-1103"
  | "2016-1104"
  | "4-2009"
  | "2019-1111";

export type DecisionKind =
  | "judgment"
  | "authentic-instrument"
  | "court-settlement"
  | "european-succession-certificate";

export interface RecognitionCase {
  // The instrument under consideration.
  instrument: {
    regulation: DecisionRegulation;
    kind: DecisionKind;
    originState: CountryCode;
    issuedOn: string; // ISO date
  };
  // The MS in which recognition / enforcement is sought.
  forumState: CountryCode;
  // Optional hints for the grounds-of-refusal analysis.
  refusalHints?: {
    // Was the defendant duly served and given an opportunity to be heard?
    defendantDulyServed?: boolean;
    defaultJudgment?: boolean;
    // Manifest contradiction with the public policy of the forum.
    publicPolicyConcern?: boolean;
    // Irreconcilable with an earlier decision in the forum or in
    // another State entitled to recognition.
    irreconcilableWithEarlierDecision?: boolean;
    // For maintenance: the protocol-bound origin / forum status is
    // material (cf. art. 17 vs art. 23 of R 4/2009).
  };
  // For Reg 4/2009 only: was the origin MS bound by the Hague
  // Protocol 2007 at the time? (Denmark and the UK pre-Brexit were
  // not.) Defaults to true.
  originBoundByHagueProtocol?: boolean;
}

export type RecognitionRegime =
  | "automatic-no-procedure"
  | "automatic-with-certificate"
  | "exequatur-required"
  | "limited-section-2-of-r-4-2009"
  | "esc-direct-effect"
  | "not-covered";

export interface RecognitionDetermination {
  regime: RecognitionRegime;
  certificateNeeded: string | null; // e.g. "annexe I", "annexe II", "Form V", "CSE"
  enforceabilityRequiresDeclaration: boolean;
  refusalGrounds: { article: string; ground: string; triggered: boolean }[];
  reasoning: ReasoningStep[];
  warnings: string[];
}

export interface RecognitionAnalysis {
  input: RecognitionCase;
  determination: RecognitionDetermination;
  flags: string[];
}

// Membership tables — duplicated locally to avoid coupling other
// modules' member-state files (each is scoped to its own regulation).
const BOUND: Record<DecisionRegulation, readonly CountryCode[]> = {
  // 650/2012: all EU except DK, IE
  "650-2012": [
    "AT","BE","BG","HR","CY","CZ","DE","EE","ES","FI","FR","GR","HU",
    "IT","LT","LU","LV","MT","NL","PL","PT","RO","SE","SI","SK",
  ],
  // 2016/1103 + 2016/1104: 18 enhanced cooperation states
  "2016-1103": [
    "BE","BG","CY","CZ","DE","ES","FI","FR","GR","HR","IT","LU",
    "MT","NL","AT","PT","SI","SE",
  ],
  "2016-1104": [
    "BE","BG","CY","CZ","DE","ES","FI","FR","GR","HR","IT","LU",
    "MT","NL","AT","PT","SI","SE",
  ],
  // 4/2009: all 27 EU MS (DK partial — protocol)
  "4-2009": [
    "AT","BE","BG","CY","CZ","DE","DK","EE","ES","FI","FR","GR","HR",
    "HU","IE","IT","LT","LU","LV","MT","NL","PL","PT","RO","SE","SI","SK",
  ],
  // 2019/1111: all EU except DK
  "2019-1111": [
    "AT","BE","BG","CY","CZ","DE","EE","ES","FI","FR","GR","HR","HU",
    "IE","IT","LT","LU","LV","MT","NL","PL","PT","RO","SE","SI","SK",
  ],
};

function isBound(reg: DecisionRegulation, country: CountryCode): boolean {
  const c = country.toUpperCase() === "EL" ? "GR" : country.toUpperCase();
  return BOUND[reg].includes(c);
}

const APPLICATION_START: Record<DecisionRegulation, string> = {
  "650-2012": "2015-08-17",
  "2016-1103": "2019-01-29",
  "2016-1104": "2019-01-29",
  "4-2009": "2011-06-18",
  "2019-1111": "2022-08-01",
};

export function analyseRecognition(input: RecognitionCase): RecognitionAnalysis {
  const reg = input.instrument.regulation;
  const flags: string[] = [];
  const reasoning: ReasoningStep[] = [];
  const warnings: string[] = [];
  const origin = input.instrument.originState.toUpperCase();
  const forum = input.forumState.toUpperCase();

  // Both origin and forum must be MS bound by the relevant
  // Regulation. Otherwise the question falls outside its scope.
  if (!isBound(reg, origin)) {
    return notCovered(
      input,
      `L'État d'origine ${origin} n'est pas un EM lié par le règl. ${reg}.`,
    );
  }
  if (!isBound(reg, forum)) {
    return notCovered(
      input,
      `L'État requis ${forum} n'est pas un EM lié par le règl. ${reg}.`,
    );
  }
  if (input.instrument.issuedOn < APPLICATION_START[reg]) {
    return notCovered(
      input,
      `Décision antérieure à l'application du règl. ${reg} (${APPLICATION_START[reg]}).`,
    );
  }

  // Per-regulation regime selection.
  let regime: RecognitionRegime = "automatic-with-certificate";
  let certificate: string | null = null;
  let enforceabilityNeedsDeclaration = false;
  let refusalArticle = "";

  switch (reg) {
    case "650-2012":
      // Recognition: art. 39 — automatic. Enforcement: art. 43 —
      // declaration of enforceability required (the Reg keeps the
      // exequatur procedure). ESC: direct effect (art. 69).
      if (input.instrument.kind === "european-succession-certificate") {
        regime = "esc-direct-effect";
        certificate = "Annexe V (formulaire CSE)";
        refusalArticle = "Art. 69 R650/2012";
        reasoning.push({
          article: "Art. 62, 69 Règl. (UE) 650/2012",
          rule: "Le CSE produit ses effets dans tous les EM sans aucune procédure (art. 69(1)). Il fait foi du contenu (art. 69(2)).",
          appliedTo: `CSE délivré par ${origin}.`,
          conclusion: "Effet direct dans tous les EM liés.",
        });
      } else if (input.instrument.kind === "judgment") {
        regime = "automatic-with-certificate";
        certificate = "Annexe I (art. 46(3)(b))";
        enforceabilityNeedsDeclaration = true;
        refusalArticle = "Art. 40 R650/2012";
        reasoning.push({
          article: "Art. 39, 43 Règl. (UE) 650/2012",
          rule: "La reconnaissance est automatique sans procédure spéciale (art. 39). L'exécution requiert une déclaration constatant la force exécutoire (art. 43) — l'attestation de l'art. 46 est jointe.",
          appliedTo: `Décision de ${origin}, à invoquer/exécuter en ${forum}.`,
          conclusion: "Reconnaissance auto ; exéquatur conservé pour l'exécution.",
        });
      } else if (input.instrument.kind === "authentic-instrument") {
        regime = "automatic-with-certificate";
        certificate = "Annexe II (acte authentique)";
        refusalArticle = "Art. 59-60 R650/2012";
        reasoning.push({
          article: "Art. 59-60 Règl. (UE) 650/2012",
          rule: "Les actes authentiques sont acceptés dans les autres EM avec la même force probante. Annexe II permet leur circulation. L'exécution suit l'art. 60 (déclaration de force exécutoire).",
          appliedTo: `Acte authentique de ${origin}.`,
          conclusion: "Force probante reconnue ; exécution via art. 60.",
        });
        enforceabilityNeedsDeclaration = true;
      } else {
        regime = "automatic-with-certificate";
        certificate = "Annexe III (transaction judiciaire)";
        refusalArticle = "Art. 61 R650/2012";
        enforceabilityNeedsDeclaration = true;
      }
      break;

    case "2016-1103":
    case "2016-1104":
      // Recognition: automatic (art. 36). Enforcement: declaration
      // of enforceability needed (art. 44 et s.) — exequatur kept.
      regime = "automatic-with-certificate";
      certificate =
        input.instrument.kind === "judgment"
          ? "Attestation art. 45 (annexe I)"
          : input.instrument.kind === "authentic-instrument"
            ? "Attestation art. 58 (annexe II)"
            : "Attestation art. 59 (transaction)";
      enforceabilityNeedsDeclaration = true;
      refusalArticle = reg === "2016-1103" ? "Art. 38 R 2016/1103" : "Art. 38 R 2016/1104";
      reasoning.push({
        article:
          reg === "2016-1103"
            ? "Art. 36, 44 Règl. (UE) 2016/1103"
            : "Art. 36, 44 Règl. (UE) 2016/1104",
        rule: "La reconnaissance est automatique (art. 36). L'exécution requiert une déclaration constatant la force exécutoire (art. 44).",
        appliedTo: `Décision de ${origin}, invocation/exécution en ${forum}.`,
        conclusion: "Reconnaissance auto ; déclaration d'exécution requise.",
      });
      break;

    case "2019-1111":
      // Brussels IIter abolished exequatur generally (art. 30, 34).
      // Recognition is automatic. Enforcement of decisions in
      // matrimonial matters and parental responsibility no longer
      // requires a declaration of enforceability — direct enforcement
      // with the appropriate certificate (annexes II, III, IV, V).
      regime = "automatic-no-procedure";
      enforceabilityNeedsDeclaration = false;
      refusalArticle = "Art. 38-39 (matrimonial) ou 39-50 (parental) R 2019/1111";
      certificate =
        input.instrument.kind === "judgment"
          ? "Annexe II (matière matrimoniale) ou III (responsabilité parentale)"
          : input.instrument.kind === "authentic-instrument"
            ? "Annexe VIII (acte authentique) ou IX (accord)"
            : "Annexe IX (accord)";
      reasoning.push({
        article: "Art. 30, 34 Règl. (UE) 2019/1111",
        rule: "La reconnaissance est automatique (art. 30) et l'exequatur a été aboli pour la plupart des décisions (art. 34) : exécution directe avec le certificat approprié, sans procédure intermédiaire.",
        appliedTo: `Décision de ${origin}, à exécuter en ${forum}.`,
        conclusion: "Exécution directe sans déclaration d'exécution.",
      });
      warnings.push(
        "Certaines décisions « privilégiées » sur le droit de visite ou la décision certifiée art. 47 (cas de retour après enlèvement) bénéficient de l'effet exécutoire renforcé — vérifier le certificat émis.",
      );
      break;

    case "4-2009":
      // Two distinct regimes:
      //   Section 1 (art. 17-22) — origin MS bound by Hague Protocol 2007:
      //     no exequatur; direct enforcement.
      //   Section 2 (art. 23-38) — origin MS not bound (DK, ex-UK):
      //     exequatur kept (procédure de constat de force exécutoire).
      const protocol = input.originBoundByHagueProtocol !== false;
      if (protocol) {
        regime = "automatic-no-procedure";
        enforceabilityNeedsDeclaration = false;
        certificate = "Annexe I (art. 20)";
        refusalArticle = "Art. 21 R 4/2009 (motifs limités)";
        reasoning.push({
          article: "Art. 17-22 Règl. (CE) 4/2009 (Section 1)",
          rule: "Une décision rendue dans un EM lié par le Protocole de La Haye 2007 est reconnue et exécutée sans aucune procédure intermédiaire et sans pouvoir d'examen au fond (art. 17, 20). Refus uniquement sur les motifs limités de l'art. 21.",
          appliedTo: `Décision de ${origin} (lié par le Protocole 2007).`,
          conclusion: "Reconnaissance et exécution automatiques.",
        });
      } else {
        regime = "limited-section-2-of-r-4-2009";
        enforceabilityNeedsDeclaration = true;
        certificate = "Annexe II (art. 28)";
        refusalArticle = "Art. 24 R 4/2009 (Section 2 — motifs étendus)";
        reasoning.push({
          article: "Art. 23-38 Règl. (CE) 4/2009 (Section 2)",
          rule: "Pour les décisions rendues dans un EM non lié par le Protocole 2007 (DK, ex-UK pré-Brexit), la reconnaissance et l'exécution restent soumises à la procédure de l'exequatur (art. 23-26).",
          appliedTo: `Décision de ${origin} (non lié par le Protocole).`,
          conclusion: "Déclaration de force exécutoire requise.",
        });
      }
      break;
  }

  // Refusal grounds — the canonical four (and the additional ones
  // for parental responsibility / public policy).
  const grounds = computeRefusalGrounds(input, refusalArticle);

  return {
    input,
    determination: {
      regime,
      certificateNeeded: certificate,
      enforceabilityRequiresDeclaration: enforceabilityNeedsDeclaration,
      refusalGrounds: grounds,
      reasoning,
      warnings,
    },
    flags,
  };
}

function computeRefusalGrounds(
  input: RecognitionCase,
  refusalArticle: string,
): { article: string; ground: string; triggered: boolean }[] {
  const h = input.refusalHints ?? {};
  const out: { article: string; ground: string; triggered: boolean }[] = [];
  out.push({
    article: refusalArticle,
    ground: "Contrariété manifeste à l'ordre public du for",
    triggered: !!h.publicPolicyConcern,
  });
  out.push({
    article: refusalArticle,
    ground:
      "Décision rendue par défaut sans signification régulière au défendeur lui permettant de se défendre",
    triggered: !!h.defaultJudgment && h.defendantDulyServed === false,
  });
  out.push({
    article: refusalArticle,
    ground: "Inconciliabilité avec une décision antérieure rendue dans le for ou dans un autre État",
    triggered: !!h.irreconcilableWithEarlierDecision,
  });
  return out;
}

function notCovered(input: RecognitionCase, reason: string): RecognitionAnalysis {
  return {
    input,
    determination: {
      regime: "not-covered",
      certificateNeeded: null,
      enforceabilityRequiresDeclaration: false,
      refusalGrounds: [],
      reasoning: [
        {
          article: "(hors champ)",
          rule: "Le règlement invoqué ne s'applique pas à la situation.",
          appliedTo: reason,
          conclusion: "Examiner d'autres instruments (Convention de La Haye, droit national, conventions bilatérales).",
        },
      ],
      warnings: [reason],
    },
    flags: [
      "Hors champ du règlement — voir conventions de La Haye applicables et DIP national.",
    ],
  };
}
