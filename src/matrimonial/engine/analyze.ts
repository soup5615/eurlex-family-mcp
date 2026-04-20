import type { MatrimonialAnalysis, MatrimonialCase } from "../types.js";
import {
  checkMatrimonialMaterialScope,
  checkMatrimonialTemporalScope,
} from "./scope.js";
import { determineMatrimonialJurisdiction } from "./jurisdiction.js";
import { determineMatrimonialApplicableLaw } from "./applicableLaw.js";
import {
  analyseChoiceOfLawFormalValidity,
  analyseMpaFormalValidity,
} from "./mpa.js";

export function analyseMatrimonial(input: MatrimonialCase): MatrimonialAnalysis {
  const temporalScope = checkMatrimonialTemporalScope(input);
  const materialScope = checkMatrimonialMaterialScope(input);
  const flags: string[] = [];

  const jurisdiction = determineMatrimonialJurisdiction(input);

  // Applicable-law rules (Ch. III) only apply to spouses married or
  // who chose the law on/after 29 January 2019. For earlier marriages
  // without subsequent choice, we flag and do not force an outcome.
  if (!temporalScope.applicable) {
    flags.push(
      "Règles sur la loi applicable non applicables (art. 69(3)) : appliquer le DIP national du for (jurisprudence et/ou Convention de La Haye du 14 mars 1978).",
    );
    return {
      input,
      temporalScope,
      materialScope,
      jurisdiction,
      applicableLaw: {
        applicableLaw: null,
        basis: "regulation-not-applicable-ratione-temporis",
        universalApplication: false,
        renvoiExcluded: false,
        reasoning: [],
        warnings: [temporalScope.reason],
      },
      flags,
    };
  }

  const applicableLaw = determineMatrimonialApplicableLaw(input);
  const mpa = analyseMpaFormalValidity(input);
  const choiceOfLawFormal = analyseChoiceOfLawFormalValidity(input);

  if (applicableLaw.basis === "art-26-1-c-closest-connection") {
    flags.push(
      "Art. 26(1)(c) : liens les plus étroits — décision judiciaire à motiver in concreto. Produire un mémoire sur le faisceau d'indices.",
    );
  }
  if (
    applicableLaw.basis === "art-22-choice" &&
    jurisdiction.basis !== "art-7-choice-of-court" &&
    jurisdiction.competentForum !== applicableLaw.applicableLaw
  ) {
    flags.push(
      "Dissociation for / loi applicable : un accord d'élection de for (art. 7) peut rattacher la compétence à l'État de la loi choisie.",
    );
  }
  if (mpa && mpa.baselineSatisfied === false) {
    flags.push(
      "Art. 25(1) : convention matrimoniale ne remplissant pas l'écrit daté et signé — nullité formelle à examiner.",
    );
  }
  if (jurisdiction.basis === "art-10-subsidiary-immovable") {
    flags.push(
      "Compétence cantonnée aux biens immobiliers situés dans l'État du for (art. 10).",
    );
  }

  const result: MatrimonialAnalysis = {
    input,
    temporalScope,
    materialScope,
    jurisdiction,
    applicableLaw,
    flags,
  };
  if (mpa) result.mpa = mpa;
  if (choiceOfLawFormal) result.choiceOfLawFormal = choiceOfLawFormal;
  return result;
}
