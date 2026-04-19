import type { CountryCode } from "./data/memberStates.js";

export type { CountryCode };

export interface ResidencePeriod {
  country: CountryCode;
  years: number;
}

export interface Deceased {
  nationalities: CountryCode[];
  lastHabitualResidence: CountryCode;
  residenceHistory?: ResidencePeriod[];
  dateOfDeath: string; // ISO-8601 (YYYY-MM-DD)
}

export type ProfessioJurisForm = "express" | "implicit-from-disposition";

export interface ProfessioJuris {
  // Art. 22(1): a person may choose as the law to govern their succession
  // as a whole the law of the State whose nationality they possess at the
  // time of making the choice or at the time of death.
  chosenLaw: CountryCode;
  form: ProfessioJurisForm;
  dateOfChoice?: string; // ISO
}

export type DispositionType = "will" | "joint-will" | "succession-pact";

export interface Disposition {
  type: DispositionType;
  dateExecuted: string; // ISO
  // Art. 24(2) / Art. 25(3): the disponent may choose the law they could
  // have chosen under Art. 22 to govern admissibility and substantive
  // validity of the disposition / pact.
  lawChosenForAdmissibilityAndValidity?: CountryCode;
  // For succession pacts: nationalities of other parties matter for
  // substantive validity (Art. 25(2)).
  otherPartyNationalities?: CountryCode[][];
}

export type AssetKind = "movable" | "immovable";

export interface Asset {
  kind: AssetKind;
  locatedIn: CountryCode;
  estimatedValueEUR?: number;
}

export interface SuccessionCase {
  deceased: Deceased;
  professioJuris?: ProfessioJuris;
  dispositions?: Disposition[];
  assets?: Asset[];
  // When answering a jurisdiction question, the forum where proceedings
  // are (or would be) brought. Defaults to lastHabitualResidence.
  forumState?: CountryCode;
  // Optional contextual hints the user can pass to trigger Art. 21(2)
  // closer-connection analysis rather than relying on residenceHistory.
  manifestlyCloserConnectionWith?: CountryCode;
}

export interface ReasoningStep {
  article: string; // e.g. "Art. 21(1) Règl. (UE) 650/2012"
  rule: string; // textual rule summary
  appliedTo: string; // facts considered
  conclusion: string;
}

export type JurisdictionBasis =
  | "art-4-habitual-residence"
  | "art-5-choice-of-court"
  | "art-7-court-seized-on-declaration"
  | "art-10-1-subsidiary-nationality"
  | "art-10-1-subsidiary-previous-residence"
  | "art-10-2-limited-to-assets"
  | "art-11-forum-necessitatis"
  | "none"
  | "regulation-not-applicable-ratione-loci"
  | "regulation-not-applicable-ratione-temporis";

export interface JurisdictionDetermination {
  competentForum: CountryCode | null;
  basis: JurisdictionBasis;
  scope: "entire-succession" | "assets-in-forum-only" | "none";
  reasoning: ReasoningStep[];
  warnings: string[];
}

export type ApplicableLawBasis =
  | "art-22-professio-juris"
  | "art-21-1-habitual-residence"
  | "art-21-2-manifestly-closer-connection"
  | "regulation-not-applicable-ratione-temporis";

export interface ApplicableLawDetermination {
  applicableLaw: CountryCode | null;
  basis: ApplicableLawBasis;
  universalApplication: boolean; // Art. 20
  renvoiConsidered: boolean; // Art. 34
  renvoiAccepted?: {
    from: CountryCode;
    to: CountryCode;
    rationale: string;
  };
  reasoning: ReasoningStep[];
  warnings: string[];
}

export interface DispositionAnalysis {
  disposition: Disposition;
  lawGoverningAdmissibilityAndValidity: CountryCode | null;
  basis: "art-24-2-choice" | "art-24-1-hypothetical-succession-law"
       | "art-25-1-one-person-hypothetical-law"
       | "art-25-2-multi-person-hypothetical-laws"
       | "art-25-3-choice";
  reasoning: ReasoningStep[];
}

export interface ESCRecommendation {
  recommended: boolean;
  rationale: string;
  issuingAuthorityState: CountryCode | null;
  notes: string[];
}

export interface TemporalScope {
  applicable: boolean;
  reason: string;
}

export interface MaterialScope {
  applicable: boolean;
  reason: string;
  excluded: string[]; // items excluded by Art. 1(2)
}

export interface SuccessionAnalysis {
  input: SuccessionCase;
  temporalScope: TemporalScope;
  materialScope: MaterialScope;
  jurisdiction: JurisdictionDetermination;
  applicableLaw: ApplicableLawDetermination;
  dispositions: DispositionAnalysis[];
  esc: ESCRecommendation;
  flags: string[]; // e.g. ordre public, complex renvoi, transitional
}
