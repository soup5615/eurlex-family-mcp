// Types for Regulation (EU) No 1259/2010 (Rome III) on the law
// applicable to divorce and legal separation. Enhanced cooperation —
// 17 participating MS as of 2018.

import type {
  CountryCode,
  ReasoningStep,
} from "../types.js";

export type { CountryCode, ReasoningStep };

export interface DivorceSpouse {
  id: string;
  nationalities: CountryCode[];
  habitualResidence: CountryCode;
}

export type DivorceProceeding = "divorce" | "legal-separation";

export interface Rome3ChoiceOfLaw {
  // Art. 5(1): the spouses may agree to designate the law applicable
  // as one of:
  //   (a) the law of the State where the spouses are habitually
  //       resident at the time the agreement is concluded;
  //   (b) the law of the State where the spouses were last
  //       habitually resident, in so far as one of them still resides
  //       there at the time the agreement is concluded;
  //   (c) the law of the State of which one of the spouses is a
  //       national at the time the agreement is concluded;
  //   (d) the law of the forum.
  chosenLaw: CountryCode;
  dateOfChoice: string; // ISO
  // Art. 7: the agreement shall be in writing, dated, signed. If the
  // law of a participating MS in which, at the time of the agreement,
  // at least one spouse is habitually resident lays down additional
  // formal requirements, those apply.
  inWritingDatedSigned?: boolean;
  // Residence at time of choice, for art. 5(1)(a)-(b) checks and for
  // the art. 7 additional-requirements analysis. Defaults to
  // spouses' current HR.
  hrAtChoice?: { spouseId: string; country: CountryCode }[];
}

export interface DivorceCase {
  spouses: [DivorceSpouse, DivorceSpouse];
  // The proceeding brought before the court.
  proceeding: DivorceProceeding;
  // The forum court (a MS participating in Rome III, or else).
  forumState: CountryCode;
  dateCourtSeised: string; // ISO
  // Optional choice of law under art. 5.
  choiceOfLaw?: Rome3ChoiceOfLaw;
  // Last habitual residence common to both spouses, and when they
  // left it (years ago). Used for art. 8(b) test.
  lastCommonHR?: { country: CountryCode; yearsSinceLeft: number };
  // If the court has found that the designated law would not provide
  // for divorce, art. 10 directs the court to apply the lex fori.
  designatedLawDoesNotAllowDivorce?: boolean;
  // For legal-separation-to-divorce conversion (art. 9).
  conversionFromSeparation?: {
    lawThatGovernedSeparation: CountryCode;
  };
}

export type Rome3Basis =
  | "art-5-1-a-hr-agreement"
  | "art-5-1-b-last-hr-agreement"
  | "art-5-1-c-nationality-agreement"
  | "art-5-1-d-lex-fori-agreement"
  | "art-8-a-hr-at-seisin"
  | "art-8-b-last-common-hr"
  | "art-8-c-common-nationality"
  | "art-8-d-lex-fori"
  | "art-9-continuity-of-separation-law"
  | "art-10-lex-fori-fallback"
  | "art-13-not-applicable-annulment"
  | "regulation-not-applicable-ratione-loci"
  | "regulation-not-applicable-ratione-temporis";

export interface Rome3Determination {
  applicableLaw: CountryCode | null;
  basis: Rome3Basis;
  universalApplication: boolean; // Art. 4
  renvoiExcluded: boolean; // Art. 11
  reasoning: ReasoningStep[];
  warnings: string[];
}

export interface Rome3ChoiceFormalValidity {
  baselineSatisfied: boolean | null; // Art. 7(1)
  candidateAdditionalLaws: CountryCode[]; // Art. 7(2)-(4)
  reasoning: ReasoningStep[];
  warnings: string[];
}

export interface Rome3TemporalScope {
  applicable: boolean;
  reason: string;
}

export interface Rome3MaterialScope {
  applicable: boolean;
  reason: string;
}

export interface Rome3Analysis {
  input: DivorceCase;
  temporalScope: Rome3TemporalScope;
  materialScope: Rome3MaterialScope;
  applicableLaw: Rome3Determination;
  choiceFormalValidity?: Rome3ChoiceFormalValidity;
  flags: string[];
}
