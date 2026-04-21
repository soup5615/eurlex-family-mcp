// Types for Regulation (EU) 2019/1111 (Brussels IIter) on
// jurisdiction, recognition and enforcement of decisions in
// matrimonial matters and matters of parental responsibility.
// Applicable from 1 August 2022 in all EU MS except Denmark.

import type { CountryCode, ReasoningStep } from "../types.js";

export type { CountryCode, ReasoningStep };

export interface BiiSpouse {
  id: string;
  nationalities: CountryCode[];
  habitualResidence: CountryCode;
  // For art. 3(1)(a) 5th-6th indents — length of HR at time of seisin.
  monthsInHabitualResidence?: number;
}

export type MatrimonialProceeding = "divorce" | "legal-separation" | "annulment";

export interface BiiMatrimonialCase {
  spouses: [BiiSpouse, BiiSpouse];
  proceeding: MatrimonialProceeding;
  dateCourtSeised: string; // ISO
  // The MS whose jurisdiction is being tested.
  forumState: CountryCode;
  // True if application is joint (art. 3(1)(a) 4th indent).
  jointApplication?: boolean;
  // True if applicant is respondent (irrelevant but we track who is who).
  applicantId?: string;
}

export type BiiMatrimonialBasis =
  | "art-3-1-a-i-common-hr"
  | "art-3-1-a-ii-last-common-hr-one-remains"
  | "art-3-1-a-iii-respondent-hr"
  | "art-3-1-a-iv-joint-application"
  | "art-3-1-a-v-applicant-hr-1-year"
  | "art-3-1-a-vi-applicant-hr-6-months-national"
  | "art-3-1-b-common-nationality"
  | "art-5-conversion"
  | "art-6-residual"
  | "none"
  | "regulation-not-applicable-ratione-temporis";

export interface BiiMatrimonialDetermination {
  competentForum: CountryCode | null;
  basis: BiiMatrimonialBasis;
  reasoning: ReasoningStep[];
  warnings: string[];
}

export interface BiiChild {
  id: string;
  habitualResidence: CountryCode;
  // Time already in the current HR (for art. 8 continuing jurisdiction
  // after a move; simpler: track if the child moved recently).
  monthsInHabitualResidence?: number;
}

export interface BiiParentalResponsibilityCase {
  child: BiiChild;
  // Whether matrimonial proceedings (divorce, separation, annulment)
  // are being conducted in a MS — triggers art. 10 possibilities and
  // earlier art. 12 of B IIbis ideas (prorogation).
  matrimonialProceedingsIn?: CountryCode;
  // If a lawful move happened < 3 months before seisin, art. 8 of
  // B IIter maintains jurisdiction in the former MS of the child's HR
  // under conditions.
  formerHabitualResidence?: CountryCode;
  monthsSinceMoveFromFormer?: number;
  // Art. 10 prorogation: all parties to the proceedings expressly
  // accepted jurisdiction, in writing, at the time the court is
  // seised (or in the course of proceedings if provided by the law
  // of the MS); chosen forum has substantial connection.
  prorogation?: {
    chosenForum: CountryCode;
    allPartiesAccepted: boolean;
    substantialConnection: boolean;
  };
  // Art. 9: unlawful removal/retention of the child (Hague 1980/2019).
  unlawfulRemoval?: {
    fromState: CountryCode;
    toState: CountryCode;
    dateOfRemoval: string;
  };
  // Forum whose jurisdiction is being tested.
  forumState: CountryCode;
  dateCourtSeised: string;
}

export type BiiParentalBasis =
  | "art-7-general-hr-of-child"
  | "art-8-continuing-jurisdiction-after-move"
  | "art-9-unlawful-removal-continuing"
  | "art-10-prorogation"
  | "art-11-presence-of-child"
  | "art-12-forum-non-conveniens-transfer"
  | "none"
  | "regulation-not-applicable-ratione-temporis";

export interface BiiParentalDetermination {
  competentForum: CountryCode | null;
  basis: BiiParentalBasis;
  reasoning: ReasoningStep[];
  warnings: string[];
}

export interface BiiScope {
  applicable: boolean;
  reason: string;
}
