import type {
  MatrimonialCase,
  MatrimonialJurisdictionDetermination,
  ReasoningStep,
} from "../types.js";
import {
  isMatrimonialBoundState,
  matrimonialRegulationStatus,
  normaliseCountry,
} from "../memberStates.js";

// Implements art. 4-11 of Reg. (EU) 2016/1103.
//
// The overriding logic:
//   - Art. 4: if proceedings on the succession of one spouse have been
//     brought under Reg. 650/2012, the court seised there is also
//     competent for the matrimonial property regime issues linked to
//     that succession.
//   - Art. 5: if a divorce/separation/annulment case is pending under
//     Brussels IIter, the same court is competent for the MPR issues
//     (with, in some cases, spouses' agreement required).
//   - Otherwise, art. 6 cascade: common HR; last common HR (one still
//     there); respondent's HR; common nationality.
//   - Art. 7: choice of court toward the MS of applicable law.
//   - Art. 10: subsidiary for immovables.
//   - Art. 11: forum necessitatis.
export function determineMatrimonialJurisdiction(
  input: MatrimonialCase,
): MatrimonialJurisdictionDetermination {
  const reasoning: ReasoningStep[] = [];
  const warnings: string[] = [];

  // Art. 4: concentration with succession court.
  if (input.context.deathOfSpouse?.forumSeisedForSuccession) {
    const forum = normaliseCountry(
      input.context.deathOfSpouse.forumSeisedForSuccession,
    );
    if (isMatrimonialBoundState(forum)) {
      reasoning.push({
        article: "Art. 4 Règl. (UE) 2016/1103",
        rule: "Lorsqu'une juridiction d'un État membre est saisie, en vertu du règl. 650/2012, de la succession d'un époux, elle est également compétente pour les questions du régime matrimonial liées à cette succession.",
        appliedTo: `Juridiction saisie pour la succession d'un époux : ${forum}.`,
        conclusion: `Juridictions de ${forum} compétentes pour les questions du régime matrimonial liées à la succession.`,
      });
      return {
        competentForum: forum,
        basis: "art-4-concentration-succession",
        scope: "regime-concentrated-with-other-proceedings",
        reasoning,
        warnings,
      };
    }
    warnings.push(
      `Art. 4 : la juridiction saisie pour la succession est dans ${forum}, qui n'est pas un EM lié au règlement 2016/1103. La concentration de compétence n'opère pas ; examiner art. 6 ss.`,
    );
  }

  // Art. 5: concentration with divorce/separation/annulment court.
  if (input.context.matrimonialCause?.forumSeisedForDivorce) {
    const forum = normaliseCountry(
      input.context.matrimonialCause.forumSeisedForDivorce,
    );
    if (isMatrimonialBoundState(forum)) {
      reasoning.push({
        article: "Art. 5 Règl. (UE) 2016/1103",
        rule: "Lorsqu'une juridiction d'un État membre est saisie, en vertu du règl. Bruxelles II ter, d'une demande en divorce, séparation de corps ou annulation, elle est également compétente pour le régime matrimonial. Dans certains chefs de compétence de Bruxelles II ter (fondés sur la seule résidence habituelle du demandeur ou la nationalité commune des seuls époux), la compétence sur le régime est subordonnée à l'accord des époux.",
        appliedTo: `Juridiction saisie pour dissolution du mariage : ${forum}.`,
        conclusion: `Juridictions de ${forum} compétentes pour le régime matrimonial.`,
      });
      warnings.push(
        "Art. 5(2) : si la compétence « divorce » repose sur les chefs prévus à l'art. 3(1)(a) 5e ou 6e tiret de Bruxelles II ter, ou sur les art. 5 ou 7 du même règlement, la compétence du juge sur le régime est subordonnée à l'accord des époux.",
      );
      return {
        competentForum: forum,
        basis: "art-5-concentration-matrimonial-cause",
        scope: "regime-concentrated-with-other-proceedings",
        reasoning,
        warnings,
      };
    }
  }

  // Art. 7: choice-of-court agreement.
  if (input.context.choiceOfCourt) {
    const coc = input.context.choiceOfCourt;
    const target = normaliseCountry(coc.mostRecentState);
    if (isMatrimonialBoundState(target) && coc.inWritingDatedSigned) {
      reasoning.push({
        article: "Art. 7 Règl. (UE) 2016/1103",
        rule: "Les parties peuvent convenir que les juridictions de l'État membre dont la loi est applicable en vertu de l'art. 22 ou de l'art. 26(1)(a) ou (b) sont seules compétentes. L'accord est formulé par écrit, daté et signé.",
        appliedTo: `Accord de compétence vers ${target}, écrit, daté, signé.`,
        conclusion: `Juridictions de ${target} seules compétentes.`,
      });
      return {
        competentForum: target,
        basis: "art-7-choice-of-court",
        scope: "entire-regime",
        reasoning,
        warnings,
      };
    }
    if (!coc.inWritingDatedSigned) {
      warnings.push(
        "Art. 7(2) : l'accord d'élection de for doit être écrit, daté, signé par les parties. Forme électronique durable assimilée à un écrit.",
      );
    }
  }

  // Art. 6 cascade.
  const [a, b] = input.spouses;
  const hrA = normaliseCountry(a.habitualResidence);
  const hrB = normaliseCountry(b.habitualResidence);

  // (a) common HR at seisin.
  if (hrA === hrB && isMatrimonialBoundState(hrA)) {
    reasoning.push({
      article: "Art. 6(1)(a) Règl. (UE) 2016/1103",
      rule: "Sont compétentes les juridictions de l'État membre sur le territoire duquel les époux ont leur résidence habituelle au moment de la saisine.",
      appliedTo: `Résidence habituelle commune : ${hrA}.`,
      conclusion: `Juridictions de ${hrA} compétentes.`,
    });
    return {
      competentForum: hrA,
      basis: "art-6-1-a-common-hr",
      scope: "entire-regime",
      reasoning,
      warnings,
    };
  }

  // (b) last common HR, provided one spouse still resides there.
  // We consider the spouses' residence histories to infer a last
  // common HR and whether one still resides there.
  const lastCommon = inferLastCommonHR(input);
  if (
    lastCommon &&
    (hrA === lastCommon || hrB === lastCommon) &&
    isMatrimonialBoundState(lastCommon)
  ) {
    reasoning.push({
      article: "Art. 6(1)(b) Règl. (UE) 2016/1103",
      rule: "À défaut, les juridictions de l'État membre sur le territoire duquel les époux avaient leur dernière résidence habituelle commune sont compétentes pour autant que l'un des époux y réside encore au moment de la saisine.",
      appliedTo: `Dernière RH commune : ${lastCommon} ; un époux y réside encore.`,
      conclusion: `Juridictions de ${lastCommon} compétentes.`,
    });
    return {
      competentForum: lastCommon,
      basis: "art-6-1-b-last-common-hr-one-remains",
      scope: "entire-regime",
      reasoning,
      warnings,
    };
  }

  // (c) HR of the respondent. We don't know who is plaintiff or
  // respondent; if the user supplied forumState, test it against
  // either HR.
  const forum = input.context.forumState
    ? normaliseCountry(input.context.forumState)
    : undefined;
  if (forum && (forum === hrA || forum === hrB) && isMatrimonialBoundState(forum)) {
    reasoning.push({
      article: "Art. 6(1)(c) Règl. (UE) 2016/1103",
      rule: "À défaut, les juridictions de l'État membre de la résidence habituelle du défendeur au moment de la saisine.",
      appliedTo: `Défendeur résidant habituellement dans ${forum}.`,
      conclusion: `Juridictions de ${forum} compétentes.`,
    });
    return {
      competentForum: forum,
      basis: "art-6-1-c-hr-respondent",
      scope: "entire-regime",
      reasoning,
      warnings,
    };
  }

  // (d) common nationality at seisin.
  const natsA = a.nationalities.map(normaliseCountry);
  const natsB = b.nationalities.map(normaliseCountry);
  const commonNat = natsA.find((n) => natsB.includes(n));
  if (commonNat && isMatrimonialBoundState(commonNat)) {
    reasoning.push({
      article: "Art. 6(1)(d) Règl. (UE) 2016/1103",
      rule: "À défaut, les juridictions de l'État membre de la nationalité commune des deux époux au moment de la saisine.",
      appliedTo: `Nationalité commune : ${commonNat}.`,
      conclusion: `Juridictions de ${commonNat} compétentes.`,
    });
    return {
      competentForum: commonNat,
      basis: "art-6-1-d-common-nationality",
      scope: "entire-regime",
      reasoning,
      warnings,
    };
  }

  // Art. 10: subsidiary — immovable property in a MS.
  const forumAssets = forum
    ? (input.jurisdictionAssets ?? []).some(
        (asset) =>
          asset.kind === "immovable" &&
          normaliseCountry(asset.locatedIn) === forum,
      )
    : false;
  if (forum && forumAssets && isMatrimonialBoundState(forum)) {
    reasoning.push({
      article: "Art. 10 Règl. (UE) 2016/1103",
      rule: "Lorsqu'aucune juridiction d'un État membre n'est compétente en vertu des art. 4 à 8, les juridictions d'un État membre sont compétentes dans la mesure où des biens immobiliers de l'un ou des deux époux sont situés sur son territoire — pour ces biens uniquement.",
      appliedTo: `Immeuble situé dans ${forum} ; absence de compétence plus large.`,
      conclusion: `Juridictions de ${forum} compétentes uniquement pour les biens immobiliers situés dans ${forum}.`,
    });
    warnings.push(
      "Art. 10 : compétence cantonnée aux biens immobiliers situés dans l'État du for. Pour l'ensemble du régime, coordonner avec une juridiction principale compétente.",
    );
    return {
      competentForum: forum,
      basis: "art-10-subsidiary-immovable",
      scope: "immovable-only",
      reasoning,
      warnings,
    };
  }

  // Art. 11 — forum necessitatis.
  warnings.push(
    "Art. 11 : à défaut de tout autre for, un forum necessitatis dans un État membre reste envisageable à titre exceptionnel, s'il est impossible d'introduire ou de conduire la procédure dans un État tiers ayant un lien étroit, et que l'affaire présente un lien suffisant avec l'État saisi.",
  );

  // Non-bound contexts: flag.
  if (
    matrimonialRegulationStatus(hrA) !== "bound" &&
    matrimonialRegulationStatus(hrB) !== "bound"
  ) {
    warnings.push(
      "Aucun époux n'a sa résidence habituelle dans un EM lié au règlement 2016/1103 ; examiner le DIP national et les règles résiduelles.",
    );
  }

  return {
    competentForum: null,
    basis: "none",
    scope: "none",
    reasoning,
    warnings,
  };
}

// Heuristic: the last common habitual residence is the country that
// appears in both spouses' residence histories (including current HR)
// with the most recent overlap, exposed by the smallest `years` (time
// since exit) that is the same for both.
function inferLastCommonHR(input: MatrimonialCase): string | null {
  const [a, b] = input.spouses;
  const hrA = normaliseCountry(a.habitualResidence);
  const hrB = normaliseCountry(b.habitualResidence);
  if (hrA === hrB) return hrA;
  const histA = new Map<string, number>();
  const histB = new Map<string, number>();
  histA.set(hrA, 0);
  histB.set(hrB, 0);
  for (const p of a.residenceHistory ?? []) {
    histA.set(normaliseCountry(p.country), p.years);
  }
  for (const p of b.residenceHistory ?? []) {
    histB.set(normaliseCountry(p.country), p.years);
  }
  // Find a country present in both, prefer the smallest combined years
  // since exit as "most recent".
  let best: { country: string; score: number } | null = null;
  for (const [c, yA] of histA) {
    const yB = histB.get(c);
    if (yB === undefined) continue;
    const score = yA + yB;
    if (!best || score < best.score) best = { country: c, score };
  }
  return best?.country ?? null;
}
