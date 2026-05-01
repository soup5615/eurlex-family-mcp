// Hague Convention of 25 October 1980 on the Civil Aspects of
// International Child Abduction. Complementary to Brussels IIter
// art. 9 (continuing jurisdiction in the State of pre-abduction HR)
// and art. 22-29 (cooperation between MS).
//
// This module flags the typical questions a practitioner faces:
//   - Is the Convention applicable (both States parties, child
//     under 16, breach of custody rights)?
//   - Is the application brought within the 1-year window (art. 12)?
//   - Are any exceptions to immediate return potentially open
//     (art. 12 § 2, 13 § 1 a/b, 13 § 2, 20)?
//
// Reference: HCCH Convention HCCH-28 (1980).

import type { CountryCode, ReasoningStep } from "../types.js";

export type { CountryCode, ReasoningStep };

// Status of the 100+ Contracting States. We list only EU MS + a few
// commonly-encountered third states; the full list is on hcch.net.
const PARTIES_2024: readonly CountryCode[] = [
  // EU 27 (all parties)
  "AT","BE","BG","CY","CZ","DE","DK","EE","ES","FI","FR","GR","HR",
  "HU","IE","IT","LT","LU","LV","MT","NL","PL","PT","RO","SE","SI","SK",
  // Other commonly-encountered parties
  "GB","CH","NO","IS","US","CA","AU","NZ","JP","KR","BR","AR","MX",
  "TR","RU","UA","RS","BA","AL","MK","ME","XK",
  "MA","TN","ZA","IL",
  // Also: many more in Latin America, Asia, etc. Not exhaustive.
];

export function isParty(country: CountryCode): boolean {
  return PARTIES_2024.includes(country.toUpperCase());
}

export interface Hague1980Case {
  child: {
    id: string;
    ageAtRemoval: number; // years
    habitualResidenceBeforeRemoval: CountryCode;
  };
  removal: {
    fromState: CountryCode;
    toState: CountryCode;
    dateOfRemovalOrRetention: string; // ISO
    breachOfCustodyRights: boolean;
    custodyRightsActuallyExercised: boolean;
  };
  application: {
    dateOfApplication: string; // ISO
    requestingState: CountryCode;
  };
  // Optional: facts the parties may invoke for art. 12/13/20.
  defenses?: {
    childSettledMoreThanOneYear?: boolean;
    consentOrAcquiescence?: boolean;
    graveRiskOfHarm?: boolean;
    objectionByMatureChild?: boolean;
    fundamentalPublicPolicy?: boolean;
  };
}

export type Hague1980Outcome =
  | "convention-not-applicable"
  | "return-presumed"
  | "return-may-be-refused"
  | "out-of-time-with-discretion";

export interface Hague1980Determination {
  outcome: Hague1980Outcome;
  applicabilityChecks: { test: string; passed: boolean }[];
  exceptions: { article: string; ground: string; raised: boolean }[];
  reasoning: ReasoningStep[];
  warnings: string[];
}

export function analyseHague1980(input: Hague1980Case): Hague1980Determination {
  const reasoning: ReasoningStep[] = [];
  const warnings: string[] = [];
  const checks: { test: string; passed: boolean }[] = [];

  const fromState = input.removal.fromState.toUpperCase();
  const toState = input.removal.toState.toUpperCase();

  const fromIsParty = isParty(fromState);
  const toIsParty = isParty(toState);
  const childUnder16 = input.child.ageAtRemoval < 16;
  const wrongful =
    input.removal.breachOfCustodyRights &&
    input.removal.custodyRightsActuallyExercised;

  checks.push({ test: "État d'origine partie à la Convention", passed: fromIsParty });
  checks.push({ test: "État de refuge partie à la Convention", passed: toIsParty });
  checks.push({ test: "Enfant âgé de moins de 16 ans (art. 4)", passed: childUnder16 });
  checks.push({
    test: "Déplacement/non-retour illicite (art. 3 : violation d'un droit de garde effectivement exercé)",
    passed: wrongful,
  });

  reasoning.push({
    article: "Art. 1, 3, 4 Convention de La Haye 1980",
    rule: "La Convention vise au retour immédiat des enfants déplacés ou retenus illicitement dans tout État contractant. Elle ne s'applique qu'aux enfants de moins de 16 ans, lorsque le déplacement/non-retour viole un droit de garde effectivement exercé selon le droit de la résidence habituelle.",
    appliedTo: `${fromState} → ${toState}, enfant ${input.child.ageAtRemoval} ans, garde violée : ${wrongful ? "oui" : "non"}.`,
    conclusion: checks.every((c) => c.passed)
      ? "Conditions de base réunies."
      : "Une ou plusieurs conditions ne sont pas remplies — Convention inapplicable.",
  });

  if (!checks.every((c) => c.passed)) {
    return {
      outcome: "convention-not-applicable",
      applicabilityChecks: checks,
      exceptions: [],
      reasoning,
      warnings,
    };
  }

  // Art. 12 — application brought within 1 year of the wrongful
  // removal/retention triggers immediate return. Otherwise, return
  // is still ordered unless it is demonstrated that the child is
  // settled in their new environment.
  const removalDate = Date.parse(input.removal.dateOfRemovalOrRetention);
  const applicationDate = Date.parse(input.application.dateOfApplication);
  const months = Number.isFinite(removalDate) && Number.isFinite(applicationDate)
    ? (applicationDate - removalDate) / (1000 * 60 * 60 * 24 * 30.44)
    : NaN;
  const withinOneYear = Number.isFinite(months) && months <= 12;

  const exceptions: { article: string; ground: string; raised: boolean }[] = [
    {
      article: "Art. 12 § 2",
      ground: "Enfant intégré dans son nouvel environnement (action engagée plus d'un an après)",
      raised: !withinOneYear || !!input.defenses?.childSettledMoreThanOneYear,
    },
    {
      article: "Art. 13 § 1 a)",
      ground: "Consentement ou acquiescement postérieur du titulaire du droit de garde",
      raised: !!input.defenses?.consentOrAcquiescence,
    },
    {
      article: "Art. 13 § 1 b)",
      ground: "Risque grave de danger physique ou psychique en cas de retour",
      raised: !!input.defenses?.graveRiskOfHarm,
    },
    {
      article: "Art. 13 § 2",
      ground: "Opposition de l'enfant suffisamment mature à son retour",
      raised: !!input.defenses?.objectionByMatureChild,
    },
    {
      article: "Art. 20",
      ground: "Retour incompatible avec les principes fondamentaux du for sur les droits de l'homme",
      raised: !!input.defenses?.fundamentalPublicPolicy,
    },
  ];

  reasoning.push({
    article: "Art. 12 al. 1 Convention de La Haye 1980",
    rule: "Lorsque l'action est engagée dans le délai d'un an à compter du déplacement/non-retour, l'autorité ordonne le retour immédiat de l'enfant.",
    appliedTo: `Déplacement le ${input.removal.dateOfRemovalOrRetention}, action introduite le ${input.application.dateOfApplication} (${months.toFixed(1)} mois).`,
    conclusion: withinOneYear
      ? "Délai respecté → retour présumé."
      : "Délai dépassé — l'art. 12 al. 2 entre en jeu.",
  });

  // A "concrete" exception is one explicitly invoked by the parties
  // (art. 13/20). Art. 12 § 2 (settlement) is also concrete only when
  // the user explicitly flags `childSettledMoreThanOneYear`. The mere
  // expiry of the one-year window enables the discretion regime but
  // is not itself a refusal ground.
  const d = input.defenses ?? {};
  const concreteDefenseRaised =
    !!d.childSettledMoreThanOneYear ||
    !!d.consentOrAcquiescence ||
    !!d.graveRiskOfHarm ||
    !!d.objectionByMatureChild ||
    !!d.fundamentalPublicPolicy;

  if (concreteDefenseRaised) {
    reasoning.push({
      article: "Art. 13 et 20 Convention de La Haye 1980",
      rule: "Les autorités peuvent refuser d'ordonner le retour si l'une des exceptions des art. 13 §1 a/b, 13 §2 ou 20 est démontrée.",
      appliedTo: "Au moins une exception est invoquée.",
      conclusion:
        "Le retour peut être refusé sous réserve de l'appréciation du juge ; charge de la preuve sur celui qui s'oppose.",
      confidence: "fact-sensitive",
    });
    warnings.push(
      "Exception invoquée : sous l'art. 11(4) Bruxelles II ter, l'art. 13(1)(b) ne suffit pas si des mesures adéquates protègent l'enfant à son retour ; l'art. 11(7) prévoit un mécanisme de retour en dépit du non-retour ordonné par l'État de refuge.",
    );
  } else if (!withinOneYear) {
    reasoning.push({
      article: "Art. 12 al. 2 Convention de La Haye 1980",
      rule: "Lorsque la procédure est introduite après l'expiration du délai d'un an, l'autorité ordonne également le retour, à moins qu'il ne soit établi que l'enfant s'est intégré dans son nouvel environnement.",
      appliedTo: "Délai d'un an dépassé ; aucune intégration explicitement démontrée.",
      conclusion:
        "Le retour reste la règle ; appréciation in concreto de l'intégration.",
    });
  }

  let outcome: Hague1980Outcome;
  if (concreteDefenseRaised) outcome = "return-may-be-refused";
  else if (withinOneYear) outcome = "return-presumed";
  else outcome = "out-of-time-with-discretion";

  return {
    outcome,
    applicabilityChecks: checks,
    exceptions,
    reasoning,
    warnings,
  };
}
