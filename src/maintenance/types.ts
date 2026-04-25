// Types for Council Regulation (EC) No 4/2009 of 18 December 2008 on
// jurisdiction, applicable law, recognition and enforcement of
// decisions and cooperation in matters relating to maintenance
// obligations. The applicable-law chapter incorporates the Hague
// Protocol of 23 November 2007 (art. 15 of the Regulation).

import type { CountryCode, ReasoningStep } from "../types.js";

export type { CountryCode, ReasoningStep };

export type CreditorRelation =
  | "child"
  | "spouse"
  | "former-spouse"
  | "ascendant"
  | "other-family";

export interface MaintenancePerson {
  id: string;
  habitualResidence: CountryCode;
  nationalities: CountryCode[];
  isMinor?: boolean;
}

export interface MaintenanceChoiceOfCourt {
  // Art. 4: parties may agree on a court of:
  //   (a) the MS where one of the parties is habitually resident,
  //   (b) the MS of nationality of one of the parties,
  //   (c) for spouses/former spouses, the courts having jurisdiction
  //       over the matrimonial cause, or
  //   (d) for spouses/former spouses, the courts of the MS of last
  //       common HR for at least 1 year.
  // Note: art. 4(3) excludes choice-of-court for child maintenance
  // (creditor under 18).
  forumState: CountryCode;
  inWritingDatedSigned: boolean;
  exclusive?: boolean;
}

export interface MaintenanceChoiceOfLaw {
  // Hague Protocol 2007 art. 7-8: parties may designate the law of
  // the State whose authorities are seised (art. 7), or — under
  // stricter conditions — make a general choice between (a) law of
  // nationality of either party, (b) law of HR of either party,
  // (c) for spouses, the law previously chosen / actually applicable
  // to their property regime / divorce.
  chosenLaw: CountryCode;
  scope: "specific-proceedings" | "general";
  inWritingDatedSigned?: boolean;
}

export interface MaintenanceCase {
  creditor: MaintenancePerson;
  debtor: MaintenancePerson;
  relation: CreditorRelation;
  forumState: CountryCode;
  dateCourtSeised: string;
  relatedStatusProceedingsIn?: CountryCode;
  relatedStatusProceedingsBasedOnNationalityOnly?: boolean;
  relatedParentalProceedingsIn?: CountryCode;
  relatedParentalProceedingsBasedOnNationalityOnly?: boolean;
  choiceOfCourt?: MaintenanceChoiceOfCourt;
  choiceOfLaw?: MaintenanceChoiceOfLaw;
  // Art. 5 (Hague Protocol) — spouse objection to creditor-HR rule.
  spouseObjection?: { closerConnectionWith: CountryCode };
  // Hints for the art. 4 cascade (children/vulnerable persons).
  hrCreditorLawAllowsMaintenance?: boolean;
  forumLawAllowsMaintenance?: boolean;
}

export type MaintenanceJurisdictionBasis =
  | "art-3-a-respondent-hr"
  | "art-3-b-creditor-hr"
  | "art-3-c-related-status-court"
  | "art-3-d-related-parental-court"
  | "art-4-choice-of-court"
  | "art-5-appearance"
  | "art-6-subsidiary-common-nationality"
  | "art-7-forum-necessitatis"
  | "none"
  | "regulation-not-applicable-ratione-temporis";

export interface MaintenanceJurisdictionDetermination {
  competentForum: CountryCode | null;
  basis: MaintenanceJurisdictionBasis;
  reasoning: ReasoningStep[];
  warnings: string[];
}

export type MaintenanceApplicableLawBasis =
  | "protocol-art-3-creditor-hr"
  | "protocol-art-4-cascade-creditor-hr"
  | "protocol-art-4-cascade-fori"
  | "protocol-art-4-cascade-common-nationality"
  | "protocol-art-5-spouse-closer-connection"
  | "protocol-art-7-specific-choice"
  | "protocol-art-8-general-choice"
  | "regulation-not-applicable-ratione-temporis"
  | "denmark-protocol-not-applicable";

export interface MaintenanceApplicableLawDetermination {
  applicableLaw: CountryCode | null;
  basis: MaintenanceApplicableLawBasis;
  protocolApplies: boolean; // false if forum is Denmark
  renvoiExcluded: boolean; // Hague Protocol art. 12
  reasoning: ReasoningStep[];
  warnings: string[];
}

export interface MaintenanceTemporalScope {
  applicable: boolean;
  reason: string;
}

export interface MaintenanceAnalysis {
  input: MaintenanceCase;
  temporalScope: MaintenanceTemporalScope;
  jurisdiction: MaintenanceJurisdictionDetermination;
  applicableLaw: MaintenanceApplicableLawDetermination;
  flags: string[];
}
