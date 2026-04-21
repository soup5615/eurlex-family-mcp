import type {
  DivorceCase,
  ReasoningStep,
  Rome3Analysis,
  Rome3ChoiceFormalValidity,
  Rome3Determination,
  Rome3MaterialScope,
  Rome3TemporalScope,
} from "./types.js";
import { isRome3BoundState, rome3Status } from "./memberStates.js";

// Reg. (EU) 1259/2010 applies to legal proceedings or agreements from
// 21 June 2012 in the initial 14 MS. Participating MS that joined
// later have their own start date. We take a conservative approach:
// if the forum is a bound MS at time of seisin, the Regulation
// applies ; otherwise it does not.
const APPLICATION_START_CORE = "2012-06-21";
// Late-joining MS (approximate application start for simplicity).
const LATE_APPLICATION_START: Record<string, string> = {
  LT: "2014-05-22",
  GR: "2015-07-29",
  EE: "2018-02-11",
};

export function checkRome3TemporalScope(input: DivorceCase): Rome3TemporalScope {
  const forum = input.forumState.toUpperCase();
  const start =
    LATE_APPLICATION_START[forum] ?? APPLICATION_START_CORE;
  if (!isRome3BoundState(forum)) {
    return {
      applicable: false,
      reason: `Forum ${forum} : non participant à la coopération renforcée Rome III. Appliquer le DIP national du for (ou un autre instrument).`,
    };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dateCourtSeised)) {
    return { applicable: false, reason: "Date de saisine invalide." };
  }
  if (input.dateCourtSeised < start) {
    return {
      applicable: false,
      reason: `Rome III applicable dans ${forum} à partir du ${start} ; saisine du ${input.dateCourtSeised} antérieure.`,
    };
  }
  return {
    applicable: true,
    reason: `Rome III applicable dans ${forum} depuis le ${start} ; saisine du ${input.dateCourtSeised}.`,
  };
}

export function checkRome3MaterialScope(input: DivorceCase): Rome3MaterialScope {
  // Art. 1(1) covers divorce and legal separation. Art. 1(2)(c)
  // excludes annulment. We receive proceeding: "divorce" or
  // "legal-separation", both covered.
  if (input.proceeding !== "divorce" && input.proceeding !== "legal-separation") {
    return {
      applicable: false,
      reason: "Procédure hors champ (annulation non couverte — art. 1(2)(c)).",
    };
  }
  return {
    applicable: true,
    reason: `Art. 1(1) : ${input.proceeding} couvert par Rome III.`,
  };
}

export function determineRome3ApplicableLaw(
  input: DivorceCase,
): Rome3Determination {
  const reasoning: ReasoningStep[] = [];
  const warnings: string[] = [];

  // Art. 9: conversion of legal separation into divorce.
  if (input.conversionFromSeparation) {
    const prior = input.conversionFromSeparation.lawThatGovernedSeparation.toUpperCase();
    reasoning.push({
      article: "Art. 9 Règl. (UE) 1259/2010",
      rule: "En cas de conversion de la séparation de corps en divorce, la loi applicable à la séparation s'applique également au divorce, sauf convention contraire au titre de l'art. 5. Si cette loi ne prévoit pas le divorce, l'art. 10 s'applique.",
      appliedTo: `Loi ayant régi la séparation : ${prior}.`,
      conclusion: input.choiceOfLaw
        ? "Une convention art. 5 a été conclue — celle-ci prime."
        : `Application de la loi de ${prior} au divorce, sous réserve de l'art. 10.`,
    });
    if (!input.choiceOfLaw) {
      if (input.designatedLawDoesNotAllowDivorce) {
        return applyLexForiFallback(input, reasoning, warnings);
      }
      return {
        applicableLaw: prior,
        basis: "art-9-continuity-of-separation-law",
        universalApplication: true,
        renvoiExcluded: true,
        reasoning,
        warnings,
      };
    }
  }

  // Art. 5: party autonomy.
  if (input.choiceOfLaw) {
    const chosen = input.choiceOfLaw.chosenLaw.toUpperCase();
    const validity = validateRome3Choice(input, chosen);
    if (validity.valid) {
      reasoning.push({
        article: "Art. 5 Règl. (UE) 1259/2010",
        rule: "Les époux peuvent désigner comme loi applicable : (a) la loi de leur RH à la date de la convention ; (b) la loi de la dernière RH commune, si l'un y réside encore ; (c) la loi d'un État de la nationalité de l'un des époux à la date de la convention ; (d) la loi du for.",
        appliedTo: `Loi choisie : ${chosen} (${validity.branch}).`,
        conclusion: `Loi applicable au divorce/à la séparation : droit de ${chosen}.`,
      });
      if (input.designatedLawDoesNotAllowDivorce) {
        reasoning.push({
          article: "Art. 10 Règl. (UE) 1259/2010",
          rule: "Si la loi désignée ne prévoit pas le divorce ou ne donne pas un accès égal au divorce/à la séparation selon le sexe, la loi du for s'applique.",
          appliedTo: "Loi choisie signalée comme ne permettant pas le divorce.",
          conclusion: `Application de la loi du for ${input.forumState.toUpperCase()}.`,
        });
        return {
          applicableLaw: input.forumState.toUpperCase(),
          basis: "art-10-lex-fori-fallback",
          universalApplication: true,
          renvoiExcluded: true,
          reasoning,
          warnings,
        };
      }
      return {
        applicableLaw: chosen,
        basis: mapBranch(validity.branch),
        universalApplication: true,
        renvoiExcluded: true,
        reasoning,
        warnings,
      };
    }
    warnings.push(
      `Art. 5 : choix présumé non valable (${validity.reason}) — repli sur la cascade art. 8.`,
    );
  }

  // Art. 8 cascade.
  return applyArticle8(input, reasoning, warnings);
}

function applyArticle8(
  input: DivorceCase,
  reasoning: ReasoningStep[],
  warnings: string[],
): Rome3Determination {
  const [a, b] = input.spouses;
  const hrA = a.habitualResidence.toUpperCase();
  const hrB = b.habitualResidence.toUpperCase();
  const forum = input.forumState.toUpperCase();

  // (a) common HR at seisin.
  if (hrA === hrB) {
    reasoning.push({
      article: "Art. 8(a) Règl. (UE) 1259/2010",
      rule: "À défaut de choix, la loi de l'État de la résidence habituelle des époux au moment de la saisine.",
      appliedTo: `RH commune : ${hrA}.`,
      conclusion: `Loi applicable : droit de ${hrA}.`,
    });
    if (input.designatedLawDoesNotAllowDivorce) {
      return applyLexForiFallback(input, reasoning, warnings);
    }
    return {
      applicableLaw: hrA,
      basis: "art-8-a-hr-at-seisin",
      universalApplication: true,
      renvoiExcluded: true,
      reasoning,
      warnings,
    };
  }

  // (b) last common HR, <= 1 year ago, one spouse still there.
  const last = input.lastCommonHR;
  if (last) {
    const country = last.country.toUpperCase();
    const oneStillThere = country === hrA || country === hrB;
    if (last.yearsSinceLeft <= 1 && oneStillThere) {
      reasoning.push({
        article: "Art. 8(b) Règl. (UE) 1259/2010",
        rule: "À défaut, la loi de l'État de la dernière résidence habituelle commune, pour autant qu'il ne se soit pas écoulé plus d'un an depuis qu'elle a cessé et que l'un des époux y réside encore au moment de la saisine.",
        appliedTo: `Dernière RH commune : ${country} (${last.yearsSinceLeft} an depuis la cessation) ; un époux y réside toujours.`,
        conclusion: `Loi applicable : droit de ${country}.`,
      });
      if (input.designatedLawDoesNotAllowDivorce) {
        return applyLexForiFallback(input, reasoning, warnings);
      }
      return {
        applicableLaw: country,
        basis: "art-8-b-last-common-hr",
        universalApplication: true,
        renvoiExcluded: true,
        reasoning,
        warnings,
      };
    }
  }

  // (c) common nationality at seisin.
  const natsA = a.nationalities.map((n) => n.toUpperCase());
  const natsB = b.nationalities.map((n) => n.toUpperCase());
  const commonNat = natsA.find((n) => natsB.includes(n));
  if (commonNat) {
    reasoning.push({
      article: "Art. 8(c) Règl. (UE) 1259/2010",
      rule: "À défaut, la loi de l'État de la nationalité commune des deux époux au moment de la saisine.",
      appliedTo: `Nationalité commune : ${commonNat}.`,
      conclusion: `Loi applicable : droit de ${commonNat}.`,
    });
    if (input.designatedLawDoesNotAllowDivorce) {
      return applyLexForiFallback(input, reasoning, warnings);
    }
    return {
      applicableLaw: commonNat,
      basis: "art-8-c-common-nationality",
      universalApplication: true,
      renvoiExcluded: true,
      reasoning,
      warnings,
    };
  }

  // (d) lex fori.
  reasoning.push({
    article: "Art. 8(d) Règl. (UE) 1259/2010",
    rule: "À défaut, la loi du for.",
    appliedTo: `Aucun rattachement (a) à (c) retenu — for : ${forum}.`,
    conclusion: `Loi applicable : droit de ${forum}.`,
  });
  return {
    applicableLaw: forum,
    basis: "art-8-d-lex-fori",
    universalApplication: true,
    renvoiExcluded: true,
    reasoning,
    warnings,
  };
}

function applyLexForiFallback(
  input: DivorceCase,
  reasoning: ReasoningStep[],
  warnings: string[],
): Rome3Determination {
  const forum = input.forumState.toUpperCase();
  reasoning.push({
    article: "Art. 10 Règl. (UE) 1259/2010",
    rule: "Si la loi désignée ne prévoit pas le divorce ou prive l'un des époux, en raison de son sexe, de l'égalité d'accès au divorce / à la séparation, la loi du for s'applique.",
    appliedTo: `Indication : la loi désignée ne permet pas le divorce — for : ${forum}.`,
    conclusion: `Loi applicable : droit de ${forum}.`,
  });
  return {
    applicableLaw: forum,
    basis: "art-10-lex-fori-fallback",
    universalApplication: true,
    renvoiExcluded: true,
    reasoning,
    warnings,
  };
}

interface ChoiceValidity {
  valid: boolean;
  reason: string;
  branch:
    | "art-5-1-a-hr-agreement"
    | "art-5-1-b-last-hr-agreement"
    | "art-5-1-c-nationality-agreement"
    | "art-5-1-d-lex-fori-agreement"
    | "invalid";
}

function validateRome3Choice(input: DivorceCase, chosen: string): ChoiceValidity {
  const [a, b] = input.spouses;
  const hrA = a.habitualResidence.toUpperCase();
  const hrB = b.habitualResidence.toUpperCase();
  const forum = input.forumState.toUpperCase();
  // (a) common HR at time of agreement.
  if (hrA === hrB && hrA === chosen) {
    return {
      valid: true,
      reason: "HR commune à la convention",
      branch: "art-5-1-a-hr-agreement",
    };
  }
  // (b) last common HR, one still there.
  const last = input.lastCommonHR;
  if (last && last.country.toUpperCase() === chosen) {
    if (hrA === chosen || hrB === chosen) {
      return {
        valid: true,
        reason: "Dernière RH commune et un époux y réside encore",
        branch: "art-5-1-b-last-hr-agreement",
      };
    }
  }
  // (c) nationality of either.
  const nats = new Set<string>([
    ...a.nationalities.map((n) => n.toUpperCase()),
    ...b.nationalities.map((n) => n.toUpperCase()),
  ]);
  if (nats.has(chosen)) {
    return {
      valid: true,
      reason: "Nationalité d'un époux",
      branch: "art-5-1-c-nationality-agreement",
    };
  }
  // (d) lex fori.
  if (forum === chosen) {
    return { valid: true, reason: "Loi du for", branch: "art-5-1-d-lex-fori-agreement" };
  }
  return {
    valid: false,
    reason: "Ne correspond à aucun des rattachements de l'art. 5(1).",
    branch: "invalid",
  };
}

function mapBranch(
  b:
    | "art-5-1-a-hr-agreement"
    | "art-5-1-b-last-hr-agreement"
    | "art-5-1-c-nationality-agreement"
    | "art-5-1-d-lex-fori-agreement"
    | "invalid",
): Rome3Analysis["applicableLaw"]["basis"] {
  if (b === "invalid") return "art-8-d-lex-fori";
  return b;
}

export function analyseRome3ChoiceFormalValidity(
  input: DivorceCase,
): Rome3ChoiceFormalValidity | undefined {
  if (!input.choiceOfLaw) return undefined;
  const reasoning: ReasoningStep[] = [];
  const warnings: string[] = [];
  const baseline = input.choiceOfLaw.inWritingDatedSigned ?? null;
  reasoning.push({
    article: "Art. 7(1) Règl. (UE) 1259/2010",
    rule: "La convention est formulée par écrit, datée et signée par les deux époux. Mode électronique durable assimilé à l'écrit.",
    appliedTo: `Convention du ${input.choiceOfLaw.dateOfChoice}.`,
    conclusion:
      baseline === true
        ? "Exigence de base satisfaite."
        : baseline === false
          ? "Exigence de base non satisfaite."
          : "À vérifier.",
  });
  const [a, b] = input.spouses;
  const candidates = new Set<string>();
  const hrAtChoice = input.choiceOfLaw.hrAtChoice ?? [
    { spouseId: a.id, country: a.habitualResidence },
    { spouseId: b.id, country: b.habitualResidence },
  ];
  for (const h of hrAtChoice) {
    const c = h.country.toUpperCase();
    if (isRome3BoundState(c)) candidates.add(c);
  }
  reasoning.push({
    article: "Art. 7(2)-(4) Règl. (UE) 1259/2010",
    rule: "Si un ou deux époux ont leur RH dans un EM participant dont le droit prévoit des exigences formelles supplémentaires, celles-ci s'appliquent. En cas de RH dans deux EM participants imposant des exigences différentes, la convention est valable si elle satisfait à l'une d'elles.",
    appliedTo: `RH à la convention : ${hrAtChoice.map((h) => `${h.spouseId}=${h.country}`).join(", ")}.`,
    conclusion: `Formalités additionnelles à tester : ${[...candidates].join(", ") || "(aucune)"}.`,
  });
  return {
    baselineSatisfied: baseline,
    candidateAdditionalLaws: [...candidates],
    reasoning,
    warnings,
  };
}

export function analyseRome3(input: DivorceCase): Rome3Analysis {
  const temporalScope = checkRome3TemporalScope(input);
  const materialScope = checkRome3MaterialScope(input);
  const flags: string[] = [];

  if (!materialScope.applicable) {
    return {
      input,
      temporalScope,
      materialScope,
      applicableLaw: {
        applicableLaw: null,
        basis: "art-13-not-applicable-annulment",
        universalApplication: false,
        renvoiExcluded: false,
        reasoning: [],
        warnings: [materialScope.reason],
      },
      flags,
    };
  }

  if (!temporalScope.applicable) {
    const forum = input.forumState.toUpperCase();
    const basis = isRome3BoundState(forum)
      ? "regulation-not-applicable-ratione-temporis"
      : "regulation-not-applicable-ratione-loci";
    return {
      input,
      temporalScope,
      materialScope,
      applicableLaw: {
        applicableLaw: null,
        basis,
        universalApplication: false,
        renvoiExcluded: false,
        reasoning: [],
        warnings: [temporalScope.reason],
      },
      flags,
    };
  }

  const applicableLaw = determineRome3ApplicableLaw(input);
  const choiceFormalValidity = analyseRome3ChoiceFormalValidity(input);

  if (rome3Status(applicableLaw.applicableLaw ?? "") !== "bound") {
    flags.push(
      "La loi matérielle désignée est celle d'un État non participant / tiers — appliquer ses règles de fond (art. 11 : pas de renvoi).",
    );
  }
  if (applicableLaw.basis === "art-8-d-lex-fori") {
    flags.push(
      "Application de la loi du for par défaut (art. 8(d)) — rattachement subsidiaire.",
    );
  }

  const out: Rome3Analysis = {
    input,
    temporalScope,
    materialScope,
    applicableLaw,
    flags,
  };
  if (choiceFormalValidity) out.choiceFormalValidity = choiceFormalValidity;
  return out;
}
