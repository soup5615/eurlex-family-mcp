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
  // Formal-validity data (Art. 27). All fields optional; the engine
  // tests each connection factor and returns which laws make the
  // disposition formally valid.
  form?: {
    // Whether the instrument is written; Art. 27 only applies to
    // written dispositions (oral dispositions are excluded by Art.
    // 1(2)(f)).
    written?: boolean;
    // Whether the instrument is handwritten / holograph (may be
    // relevant for some national laws).
    holograph?: boolean;
    // Whether two or more persons disposed in a single instrument
    // (joint will). Triggers Art. 27(2) which extends the connection
    // factors for each disponent.
    joint?: boolean;
    placeOfMaking?: CountryCode;
    // Snapshot of relevant connection factors at the time the
    // disposition was made.
    nationalitiesAtMaking?: CountryCode[];
    domicileAtMaking?: CountryCode;
    habitualResidenceAtMaking?: CountryCode;
  };
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

export type FormalValidityConnection =
  | "art-27-1-a-locus-regit-actum"
  | "art-27-1-b-nationality-at-making"
  | "art-27-1-b-nationality-at-death"
  | "art-27-1-c-domicile-at-making"
  | "art-27-1-c-domicile-at-death"
  | "art-27-1-d-habitual-residence-at-making"
  | "art-27-1-d-habitual-residence-at-death"
  | "art-27-1-e-lex-rei-sitae-immovables";

export interface FormalValidityBasis {
  law: CountryCode;
  connection: FormalValidityConnection;
  explanation: string;
}

export interface FormalValidityAnalysis {
  applicable: boolean; // Art. 27 applies only to written dispositions
  // A written disposition is formally valid if at least one of the
  // connection-based laws validates it. This engine surfaces the
  // candidate laws; whether each validates the form under its own
  // rules is a matter of substantive national law beyond scope.
  candidateLaws: FormalValidityBasis[];
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
  formalValidity: FormalValidityAnalysis;
}

export interface RenvoiAnalysis {
  considered: boolean;
  // Art. 34(2) blocks renvoi when the designated law was designated by
  // art. 21(2), 22, 24, 25, 27, 28(b) or 30.
  blockedByArt34_2: boolean;
  // Outcome of applying the PIL of the designated third state.
  designatedStateAppliesOwnLaw: boolean | null;
  referralAccepted: boolean;
  referralTarget: CountryCode | null;
  rationale: string;
  dataSource?: string;
  reasoning: ReasoningStep[];
  warnings: string[];
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
  renvoi: RenvoiAnalysis;
  dispositions: DispositionAnalysis[];
  esc: ESCRecommendation;
  flags: string[]; // e.g. ordre public, complex renvoi, transitional
}
