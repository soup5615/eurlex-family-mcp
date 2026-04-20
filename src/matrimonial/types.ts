// Types for Regulation (EU) 2016/1103 — matrimonial property regimes
// (régimes matrimoniaux). Applies, in the Member States participating
// in the enhanced cooperation, to the property consequences of
// marriage. The companion Regulation 2016/1104 covers registered
// partnerships and is not modelled here.

import type { CountryCode, ReasoningStep, ResidencePeriod } from "../types.js";

export type { CountryCode, ReasoningStep };

export interface Spouse {
  id: string; // stable identifier within the case (e.g. "A", "B")
  nationalities: CountryCode[];
  habitualResidence: CountryCode;
  residenceHistory?: ResidencePeriod[];
}

export type ChoiceOfLawForm = "express-writing" | "implicit-from-mpa";

export interface MatrimonialChoiceOfLaw {
  // Art. 22(1): the spouses may designate, or change, the law
  // applicable to their matrimonial property regime, provided that
  // law is:
  //   (a) the law of the State of HR of (either of) the spouses at
  //       the time of choice; or
  //   (b) the law of a State whose nationality (either of) them has
  //       at the time of choice.
  chosenLaw: CountryCode;
  form: ChoiceOfLawForm;
  dateOfChoice: string; // ISO
  // Art. 22(2): unless the spouses agree otherwise, a change of law
  // has effect only for the future (prospective). Default true.
  retroactive?: boolean;
  // Formal validity data (Art. 23). The agreement must be in writing,
  // dated and signed. MS-specific additional requirements may apply.
  inWritingDatedSigned?: boolean;
  // Habitual residences of the spouses at the time of the choice,
  // to test additional MS-specific form requirements (Art. 23(2)-(4)).
  hrAtChoice?: { spouseId: string; country: CountryCode }[];
}

export type MatrimonialAgreementKind =
  | "separation-of-property"
  | "community-of-property"
  | "participation-in-acquisitions"
  | "other"
  | "none";

export interface MatrimonialPropertyAgreement {
  dateExecuted: string; // ISO
  kind: MatrimonialAgreementKind;
  placeOfExecution?: CountryCode;
  // Art. 25(1): MPA must be in writing, dated, signed by both spouses.
  inWritingDatedSigned?: boolean;
  // Additional MS formalities (art. 25(2)-(3)) — the tool surfaces
  // which MS requirements apply; it does not second-guess national
  // rules.
}

export interface Marriage {
  dateOfMarriage: string; // ISO
  placeOfMarriage?: CountryCode;
}

export type MatrimonialForum =
  // Art. 4: courts seised on the succession of a spouse
  | "art-4-concentration-succession"
  // Art. 5: courts seised on divorce/separation/annulment
  | "art-5-concentration-matrimonial-cause"
  // Art. 6 general cascade
  | "art-6-1-a-common-hr"
  | "art-6-1-b-last-common-hr-one-remains"
  | "art-6-1-c-hr-respondent"
  | "art-6-1-d-common-nationality"
  // Art. 7 choice of court
  | "art-7-choice-of-court"
  | "art-8-appearance"
  | "art-9-alternative-declined"
  // Art. 10 subsidiary (immovable property)
  | "art-10-subsidiary-immovable"
  // Art. 11 forum necessitatis
  | "art-11-forum-necessitatis"
  | "none"
  | "regulation-not-applicable-ratione-temporis";

export interface MatrimonialJurisdictionDetermination {
  competentForum: CountryCode | null;
  basis: MatrimonialForum;
  scope:
    | "entire-regime"
    | "regime-concentrated-with-other-proceedings"
    | "immovable-only"
    | "none";
  reasoning: ReasoningStep[];
  warnings: string[];
}

export type MatrimonialApplicableLawBasis =
  | "art-22-choice"
  | "art-26-1-a-first-common-hr"
  | "art-26-1-b-common-nationality"
  | "art-26-1-c-closest-connection"
  | "art-26-2-exception-last-common-hr"
  | "regulation-not-applicable-ratione-temporis";

export interface MatrimonialApplicableLawDetermination {
  applicableLaw: CountryCode | null;
  basis: MatrimonialApplicableLawBasis;
  universalApplication: boolean; // Art. 20
  renvoiExcluded: boolean; // Art. 32
  reasoning: ReasoningStep[];
  warnings: string[];
}

export interface MpaFormalValidityAnalysis {
  baselineSatisfied: boolean | null; // Art. 25(1): written, dated, signed
  candidateAdditionalLaws: CountryCode[]; // MS whose additional formal
  // requirements may apply (Art. 25(2)-(3)).
  reasoning: ReasoningStep[];
  warnings: string[];
}

export interface ChoiceOfLawFormalValidityAnalysis {
  baselineSatisfied: boolean | null; // Art. 23(1)
  candidateAdditionalLaws: CountryCode[]; // Art. 23(2)-(4)
  reasoning: ReasoningStep[];
  warnings: string[];
}

// Triggers and context for the engine. Provide at least one of:
//   - `deathOfSpouse`: triggers art. 4 concentration in the succession court
//   - `matrimonialCause`: triggers art. 5 concentration in the divorce court
// Otherwise art. 6 cascade applies.
export interface MatrimonialContext {
  deathOfSpouse?: {
    spouseId: string;
    forumSeisedForSuccession?: CountryCode;
  };
  matrimonialCause?: {
    kind: "divorce" | "separation" | "annulment";
    forumSeisedForDivorce?: CountryCode;
    seisedAfterJanuary29_2019?: boolean;
  };
  // If no death/divorce, callers may specify the MS whose jurisdiction
  // is being tested under art. 6-11 (typically the respondent's HR).
  forumState?: CountryCode;
  // Art. 7: a written, dated, signed choice-of-court agreement can
  // vest jurisdiction in the MS of the law chosen under art. 22 or
  // the MS of law of the place where the marriage was concluded.
  choiceOfCourt?: {
    mostRecentState: CountryCode;
    inWritingDatedSigned: boolean;
  };
}

export interface MatrimonialCase {
  spouses: [Spouse, Spouse];
  marriage: Marriage;
  choiceOfLaw?: MatrimonialChoiceOfLaw;
  mpa?: MatrimonialPropertyAgreement;
  context: MatrimonialContext;
  // The forum MS the user wants us to reason about (for art. 10).
  // Optional, defaults to forum handling the main proceedings.
  jurisdictionAssets?: { locatedIn: CountryCode; kind: "movable" | "immovable" }[];
  // Art. 26(2) exception input. The exception can only be invoked by a
  // spouse before the court and requires proving (i) a last common HR
  // significantly longer than the first, and (ii) that both spouses
  // relied on that law. Art. 26(3) blocks it if an MPA was concluded
  // before the first common HR was established.
  closerConnectionException?: {
    requestedBySpouseId?: string;
    lastCommonHR: CountryCode;
    yearsInFirstCommonHR: number;
    yearsInLastCommonHR: number;
    bothSpousesRelied: boolean;
  };
}

export interface MatrimonialTemporalScope {
  applicable: boolean;
  reason: string;
}

export interface MatrimonialMaterialScope {
  applicable: boolean;
  reason: string;
  excluded: string[];
}

export interface MatrimonialAnalysis {
  input: MatrimonialCase;
  temporalScope: MatrimonialTemporalScope;
  materialScope: MatrimonialMaterialScope;
  jurisdiction: MatrimonialJurisdictionDetermination;
  applicableLaw: MatrimonialApplicableLawDetermination;
  mpa?: MpaFormalValidityAnalysis;
  choiceOfLawFormal?: ChoiceOfLawFormalValidityAnalysis;
  flags: string[];
}
