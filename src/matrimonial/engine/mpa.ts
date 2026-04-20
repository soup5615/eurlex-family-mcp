import type {
  ChoiceOfLawFormalValidityAnalysis,
  MatrimonialCase,
  MpaFormalValidityAnalysis,
  ReasoningStep,
} from "../types.js";
import { isMatrimonialBoundState, normaliseCountry } from "../memberStates.js";

// Art. 25: formal validity of the matrimonial property agreement.
//   (1) The MPA shall be expressed in writing, dated and signed by both
//       spouses. Any communication by electronic means with a durable
//       record is deemed equivalent to writing.
//   (2) If the law of the MS where both spouses had their habitual
//       residence at the time of conclusion imposes additional formal
//       requirements, those apply. If the spouses were habitually
//       resident in different MS whose laws lay down different
//       additional formal requirements, the MPA is valid as to form
//       if it satisfies the requirements of either.
//   (3) If only one spouse had their habitual residence in a MS at the
//       time of conclusion and that law lays down additional formal
//       requirements, they apply.
//   (4) If the applicable law to the MPR imposes additional formal
//       requirements at the time of conclusion, those apply.
export function analyseMpaFormalValidity(
  input: MatrimonialCase,
): MpaFormalValidityAnalysis | undefined {
  if (!input.mpa) return undefined;
  const reasoning: ReasoningStep[] = [];
  const warnings: string[] = [];

  const baseline = input.mpa.inWritingDatedSigned ?? null;
  reasoning.push({
    article: "Art. 25(1) Règl. (UE) 2016/1103",
    rule: "La convention matrimoniale est formulée par écrit, datée et signée par les deux époux. Un mode électronique permettant un enregistrement durable est équivalent à l'écrit.",
    appliedTo: `MPA conclue le ${input.mpa.dateExecuted}.`,
    conclusion:
      baseline === true
        ? "Condition de base satisfaite."
        : baseline === false
          ? "Condition de base non satisfaite — la MPA n'est pas formellement valable."
          : "Condition de base à vérifier (écrit daté et signé).",
  });

  // Additional MS-level requirements based on HR at conclusion.
  const candidate = new Set<string>();
  const [a, b] = input.spouses;
  const hrA = normaliseCountry(a.habitualResidence);
  const hrB = normaliseCountry(b.habitualResidence);
  if (hrA === hrB && isMatrimonialBoundState(hrA)) {
    candidate.add(hrA);
    reasoning.push({
      article: "Art. 25(2) Règl. (UE) 2016/1103",
      rule: "Lorsque les deux époux avaient leur résidence habituelle, au moment de la conclusion, dans le même État membre dont le droit prévoit des exigences formelles supplémentaires, ces exigences s'appliquent.",
      appliedTo: `Résidence habituelle commune à la conclusion : ${hrA}.`,
      conclusion: `Ajouter, le cas échéant, les formalités du droit de ${hrA} (ex. en France : acte notarié ; en Allemagne : Ehevertrag devant notaire).`,
    });
  } else {
    if (isMatrimonialBoundState(hrA)) candidate.add(hrA);
    if (isMatrimonialBoundState(hrB)) candidate.add(hrB);
    reasoning.push({
      article: "Art. 25(2) Règl. (UE) 2016/1103",
      rule: "En présence de résidences habituelles dans deux États membres dont les droits imposent des exigences formelles supplémentaires différentes, la MPA est valable si elle satisfait aux exigences de l'un ou l'autre.",
      appliedTo: `Résidences habituelles : ${hrA} / ${hrB}.`,
      conclusion: `La MPA est formellement valable si elle satisfait aux formalités de ${[
        ...candidate,
      ].join(" ou ")}.`,
    });
  }

  warnings.push(
    "Art. 25(4) : vérifier les exigences formelles prescrites par la loi applicable au régime matrimonial à la date de la conclusion (elles s'ajoutent à celles retenues ci-dessus).",
  );

  return {
    baselineSatisfied: baseline,
    candidateAdditionalLaws: [...candidate],
    reasoning,
    warnings,
  };
}

// Art. 23 mirrors art. 25 for the choice-of-law agreement.
export function analyseChoiceOfLawFormalValidity(
  input: MatrimonialCase,
): ChoiceOfLawFormalValidityAnalysis | undefined {
  if (!input.choiceOfLaw) return undefined;
  const reasoning: ReasoningStep[] = [];
  const warnings: string[] = [];
  const baseline = input.choiceOfLaw.inWritingDatedSigned ?? null;

  reasoning.push({
    article: "Art. 23(1) Règl. (UE) 2016/1103",
    rule: "La convention de choix de loi applicable est formulée par écrit, datée et signée par les deux époux. Un mode électronique permettant un enregistrement durable est équivalent à l'écrit.",
    appliedTo: `Choix de loi du ${input.choiceOfLaw.dateOfChoice}.`,
    conclusion:
      baseline === true
        ? "Exigence formelle de base satisfaite."
        : baseline === false
          ? "Exigence formelle de base non satisfaite."
          : "Vérifier que la convention est écrite, datée et signée.",
  });

  const candidate = new Set<string>();
  const hrAtChoice = input.choiceOfLaw.hrAtChoice ?? [];
  for (const h of hrAtChoice) {
    const c = normaliseCountry(h.country);
    if (isMatrimonialBoundState(c)) candidate.add(c);
  }
  if (candidate.size === 0) {
    const [a, b] = input.spouses;
    if (isMatrimonialBoundState(a.habitualResidence)) {
      candidate.add(normaliseCountry(a.habitualResidence));
    }
    if (isMatrimonialBoundState(b.habitualResidence)) {
      candidate.add(normaliseCountry(b.habitualResidence));
    }
  }
  if (candidate.size > 0) {
    reasoning.push({
      article: "Art. 23(2)-(4) Règl. (UE) 2016/1103",
      rule: "Si, au moment du choix, les deux époux ont leur résidence habituelle dans le même État membre, les formalités supplémentaires de ce droit s'appliquent. À défaut, si l'un d'eux a sa résidence habituelle dans un État membre dont la loi prévoit des formalités, celles-ci s'appliquent également.",
      appliedTo: `Résidences habituelles (choix) : ${[
        ...candidate,
      ].join(", ")}.`,
      conclusion: `Ajouter les formalités supplémentaires éventuelles prévues par ${[
        ...candidate,
      ].join(" et/ou ")}.`,
    });
  }

  warnings.push(
    "Art. 24 : consentement et validité au fond de la convention de choix sont régis par la loi qui serait applicable si la convention était valable. Un époux peut, pour établir l'absence de consentement, invoquer la loi de sa résidence habituelle au moment de la saisine.",
  );

  return {
    baselineSatisfied: baseline,
    candidateAdditionalLaws: [...candidate],
    reasoning,
    warnings,
  };
}
