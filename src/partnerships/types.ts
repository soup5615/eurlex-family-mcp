// Types for Regulation (EU) 2016/1104 — property consequences of
// registered partnerships. Structure parallels 2016/1103 with two
// substantive differences: the default connecting factor (law of the
// State under whose law the partnership was created, art. 26(1)) and
// the fact that the legal concept of registered partnership is not
// recognised in all MS (art. 9 enables decline).

import type {
  CountryCode,
  ReasoningStep,
  ResidencePeriod,
} from "../types.js";

export type { CountryCode, ReasoningStep };

export interface Partner {
  id: string;
  nationalities: CountryCode[];
  habitualResidence: CountryCode;
  residenceHistory?: ResidencePeriod[];
}

export interface Partnership {
  dateOfRegistration: string; // ISO
  // The State under whose law the partnership was created. This is
  // the decisive default connecting factor under art. 26(1).
  stateOfCreation: CountryCode;
  placeOfRegistration?: CountryCode;
}

export type PartnershipChoiceOfLawForm = "express-writing" | "implicit-from-agreement";

export interface PartnershipChoiceOfLaw {
  chosenLaw: CountryCode;
  form: PartnershipChoiceOfLawForm;
  dateOfChoice: string;
  retroactive?: boolean;
  inWritingDatedSigned?: boolean;
  hrAtChoice?: { partnerId: string; country: CountryCode }[];
}

export type PartnershipAgreementKind =
  | "separation-of-property"
  | "community-of-property"
  | "participation-in-acquisitions"
  | "other"
  | "none";

export interface PartnershipPropertyAgreement {
  dateExecuted: string;
  kind: PartnershipAgreementKind;
  placeOfExecution?: CountryCode;
  inWritingDatedSigned?: boolean;
}

export type PartnershipForum =
  | "art-4-concentration-succession"
  | "art-5-concentration-dissolution"
  | "art-6-1-a-common-hr"
  | "art-6-1-b-last-common-hr-one-remains"
  | "art-6-1-c-hr-respondent"
  | "art-6-1-d-common-nationality"
  | "art-6-1-e-state-of-creation"
  | "art-7-choice-of-court"
  | "art-8-appearance"
  | "art-9-alternative-declined"
  | "art-10-subsidiary-immovable"
  | "art-11-forum-necessitatis"
  | "none"
  | "regulation-not-applicable-ratione-temporis";

export interface PartnershipJurisdictionDetermination {
  competentForum: CountryCode | null;
  basis: PartnershipForum;
  scope:
    | "entire-regime"
    | "regime-concentrated-with-other-proceedings"
    | "immovable-only"
    | "none";
  reasoning: ReasoningStep[];
  warnings: string[];
}

export type PartnershipApplicableLawBasis =
  | "art-22-choice"
  | "art-26-1-state-of-creation"
  | "art-26-2-closer-connection-exception"
  | "regulation-not-applicable-ratione-temporis";

export interface PartnershipApplicableLawDetermination {
  applicableLaw: CountryCode | null;
  basis: PartnershipApplicableLawBasis;
  universalApplication: boolean; // Art. 20
  renvoiExcluded: boolean; // Art. 32
  reasoning: ReasoningStep[];
  warnings: string[];
}

export interface PartnershipContext {
  deathOfPartner?: {
    partnerId: string;
    forumSeisedForSuccession?: CountryCode;
  };
  dissolution?: {
    forumSeisedForDissolution?: CountryCode;
  };
  forumState?: CountryCode;
  choiceOfCourt?: {
    mostRecentState: CountryCode;
    inWritingDatedSigned: boolean;
  };
}

export interface PartnershipCase {
  partners: [Partner, Partner];
  partnership: Partnership;
  choiceOfLaw?: PartnershipChoiceOfLaw;
  agreement?: PartnershipPropertyAgreement;
  context: PartnershipContext;
  jurisdictionAssets?: { locatedIn: CountryCode; kind: "movable" | "immovable" }[];
  // Art. 26(2) narrow exception — the partners can request application
  // of the law of a State with which they jointly have closer
  // connection, other than the State of creation.
  closerConnectionException?: {
    requestedByPartnerId?: string;
    otherState: CountryCode;
    bothPartnersRelied: boolean;
  };
}

export interface PartnershipAgreementFormalValidity {
  baselineSatisfied: boolean | null;
  candidateAdditionalLaws: CountryCode[];
  reasoning: ReasoningStep[];
  warnings: string[];
}

export interface PartnershipTemporalScope {
  applicable: boolean;
  reason: string;
}

export interface PartnershipMaterialScope {
  applicable: boolean;
  reason: string;
  excluded: string[];
}

export interface PartnershipAnalysis {
  input: PartnershipCase;
  temporalScope: PartnershipTemporalScope;
  materialScope: PartnershipMaterialScope;
  jurisdiction: PartnershipJurisdictionDetermination;
  applicableLaw: PartnershipApplicableLawDetermination;
  agreement?: PartnershipAgreementFormalValidity;
  flags: string[];
}
