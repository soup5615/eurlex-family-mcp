import type {
  MatrimonialApplicableLawDetermination,
  MatrimonialCase,
  ReasoningStep,
  Spouse,
} from "../types.js";
import { normaliseCountry } from "../memberStates.js";

// Implements art. 20-26 and 32 of Reg. (EU) 2016/1103.
//
//   Art. 20: universal application.
//   Art. 22: choice of law — HR of either/both spouses at the time
//     of choice, or nationality of either spouse at the time of choice.
//     Art. 22(2)-(3): a change of law is prospective unless agreed
//     otherwise, and cannot adversely affect third-party rights.
//   Art. 26(1): in the absence of choice:
//     (a) first common HR after the marriage;
//     (b) failing which, common nationality of the spouses at the
//         marriage; not applicable if the spouses have more than one
//         common nationality;
//     (c) failing which, the law of the State with which the spouses
//         jointly have the closest connection at the time of the
//         marriage.
//   Art. 26(2): exception at the request of a spouse when the last
//     common HR was in another State for a significantly longer period
//     and both spouses relied on that law; subject to art. 26(3).
//   Art. 32: renvoi is excluded.
export function determineMatrimonialApplicableLaw(
  input: MatrimonialCase,
): MatrimonialApplicableLawDetermination {
  const reasoning: ReasoningStep[] = [];
  const warnings: string[] = [];

  // Art. 22 — choice of law takes precedence.
  if (input.choiceOfLaw) {
    const chosen = normaliseCountry(input.choiceOfLaw.chosenLaw);
    const validity = validateChoice(input, chosen);
    if (validity.valid) {
      reasoning.push({
        article: "Art. 22 Règl. (UE) 2016/1103",
        rule: "Les époux peuvent choisir comme loi applicable à leur régime matrimonial : (a) la loi d'un État de la résidence habituelle de l'un ou des deux époux au moment du choix, ou (b) la loi d'un État de la nationalité de l'un d'eux au moment du choix.",
        appliedTo: `Loi choisie : ${chosen} (${validity.branch}).`,
        conclusion: `Loi applicable : droit de ${chosen}.`,
      });
      if (input.choiceOfLaw.retroactive !== true) {
        warnings.push(
          "Art. 22(2) : un changement de loi n'a d'effet que pour l'avenir, sauf convention contraire des époux. Sans préjudice des droits des tiers (art. 22(3)).",
        );
      }
      return {
        applicableLaw: chosen,
        basis: "art-22-choice",
        universalApplication: true,
        renvoiExcluded: true,
        reasoning,
        warnings,
      };
    }
    warnings.push(
      `Art. 22 : choix de loi présumé invalide (${validity.reason}). Retour à la règle de l'art. 26.`,
    );
  }

  // Art. 26(1)(a) — first common HR after marriage.
  const firstCommon = inferFirstCommonHRAfterMarriage(input);
  if (firstCommon) {
    reasoning.push({
      article: "Art. 26(1)(a) Règl. (UE) 2016/1103",
      rule: "À défaut de choix, la loi applicable est celle de l'État de la première résidence habituelle commune des époux après la célébration du mariage.",
      appliedTo: `Première résidence habituelle commune : ${firstCommon}.`,
      conclusion: `Loi applicable : droit de ${firstCommon} (art. 32 : exclusion du renvoi).`,
    });
    return {
      applicableLaw: firstCommon,
      basis: "art-26-1-a-first-common-hr",
      universalApplication: true,
      renvoiExcluded: true,
      reasoning,
      warnings,
    };
  }

  // Art. 26(1)(b) — common nationality at marriage (only if unique).
  const [a, b] = input.spouses;
  const commonNats = a.nationalities
    .map(normaliseCountry)
    .filter((n) => b.nationalities.map(normaliseCountry).includes(n));
  if (commonNats.length === 1) {
    const nat = commonNats[0]!;
    reasoning.push({
      article: "Art. 26(1)(b) Règl. (UE) 2016/1103",
      rule: "À défaut, la loi applicable est celle de la nationalité commune des deux époux au moment de la célébration du mariage. Ce chef ne joue pas en présence de plusieurs nationalités communes.",
      appliedTo: `Nationalité commune unique : ${nat}.`,
      conclusion: `Loi applicable : droit de ${nat}.`,
    });
    return {
      applicableLaw: nat,
      basis: "art-26-1-b-common-nationality",
      universalApplication: true,
      renvoiExcluded: true,
      reasoning,
      warnings,
    };
  }

  // Art. 26(1)(c) — closest connection at time of marriage. Without
  // hard facts the engine flags this for manual assessment.
  warnings.push(
    "Art. 26(1)(c) : à apprécier concrètement — loi de l'État avec lequel les deux époux présentent conjointement les liens les plus étroits au moment de la célébration.",
  );
  reasoning.push({
    article: "Art. 26(1)(c) Règl. (UE) 2016/1103",
    rule: "À défaut, la loi applicable est celle de l'État avec lequel les deux époux présentent conjointement les liens les plus étroits au moment de la célébration.",
    appliedTo: "Aucun critère (a) ou (b) rempli.",
    conclusion:
      "Détermination au cas par cas ; faisceau d'indices (lieu du mariage, lieu d'installation prévu, famille, biens).",
  });
  return {
    applicableLaw: null,
    basis: "art-26-1-c-closest-connection",
    universalApplication: true,
    renvoiExcluded: true,
    reasoning,
    warnings,
  };
}

export interface ChoiceValidity {
  valid: boolean;
  reason: string;
  branch?: "art-22-1-a-hr" | "art-22-1-b-nationality";
}

export function validateChoice(
  input: MatrimonialCase,
  chosen: string,
): ChoiceValidity {
  const [a, b] = input.spouses;
  // Art. 22(1)(a): HR of either spouse (at time of choice). We do not
  // track HR at choice date separately; we take current HR as a
  // proxy and flag that this should be verified.
  const hrs = new Set<string>([
    normaliseCountry(a.habitualResidence),
    normaliseCountry(b.habitualResidence),
  ]);
  if (hrs.has(chosen)) {
    return {
      valid: true,
      reason: `${chosen} est la résidence habituelle d'au moins un époux (vérifier à la date du choix).`,
      branch: "art-22-1-a-hr",
    };
  }
  // Art. 22(1)(b): nationality of either spouse at choice.
  const nats = new Set([
    ...a.nationalities.map(normaliseCountry),
    ...b.nationalities.map(normaliseCountry),
  ]);
  if (nats.has(chosen)) {
    return {
      valid: true,
      reason: `${chosen} est une nationalité d'au moins un époux (vérifier à la date du choix).`,
      branch: "art-22-1-b-nationality",
    };
  }
  return {
    valid: false,
    reason: `${chosen} n'est ni la résidence habituelle, ni la nationalité d'aucun époux. Vérifier les rattachements à la date du choix.`,
  };
}

// Tries to infer the first common HR after the marriage from the
// spouses' residence histories. Returns null if uncertain.
export function inferFirstCommonHRAfterMarriage(
  input: MatrimonialCase,
): string | null {
  const [a, b] = input.spouses;
  const hrA = normaliseCountry(a.habitualResidence);
  const hrB = normaliseCountry(b.habitualResidence);

  // Simple case: spouses currently share an HR. Assume it is the
  // first common HR, unless one of them has a residence history
  // preceding this one that was also common (which we cannot know
  // without more data).
  if (hrA === hrB) return hrA;

  // Otherwise, look into the histories for a country that figures in
  // both, with the LARGEST `years` (= earliest exit) present in both.
  // Using our semantics, the larger `years` means the earlier the
  // spouse left that country.
  const commonCountries = commonSharedCountries(a, b);
  if (commonCountries.length === 0) return null;
  // Pick the one that appears with the largest combined years (earliest).
  const scored = commonCountries.map((c) => ({
    country: c,
    score:
      (getYears(a, c) ?? 0) + (getYears(b, c) ?? 0),
  }));
  scored.sort((x, y) => y.score - x.score);
  return scored[0]?.country ?? null;
}

function commonSharedCountries(a: Spouse, b: Spouse): string[] {
  const setA = new Set<string>([
    normaliseCountry(a.habitualResidence),
    ...(a.residenceHistory ?? []).map((p) => normaliseCountry(p.country)),
  ]);
  const setB = new Set<string>([
    normaliseCountry(b.habitualResidence),
    ...(b.residenceHistory ?? []).map((p) => normaliseCountry(p.country)),
  ]);
  return [...setA].filter((c) => setB.has(c));
}

function getYears(s: Spouse, country: string): number | undefined {
  const c = country;
  if (normaliseCountry(s.habitualResidence) === c) return 0;
  return s.residenceHistory?.find((p) => normaliseCountry(p.country) === c)?.years;
}
