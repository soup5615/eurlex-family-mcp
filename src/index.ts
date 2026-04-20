export { analyseSuccession } from "./engine/analyze.js";
export { determineJurisdiction } from "./engine/jurisdiction.js";
export { determineApplicableLaw } from "./engine/applicableLaw.js";
export { analyseDispositions, habitualResidenceAt } from "./engine/dispositions.js";
export { analyseFormalValidity } from "./engine/formalValidity.js";
export { analyseRenvoi } from "./engine/renvoi.js";
export { recommendESC } from "./engine/esc.js";
export { checkTemporalScope, checkMaterialScope } from "./engine/scope.js";
export { renderConsultationHTML } from "./render/html.js";
export { ARTICLES, getArticle, listArticles } from "./data/articles.js";
export { CJEU_CASES, findCase } from "./data/cjeuCases.js";
export {
  regulationStatus,
  isBoundMemberState,
  listBoundMemberStates,
} from "./data/memberStates.js";
export {
  getThirdStateRule,
  listThirdStateRules,
} from "./data/thirdStatePIL.js";
export type * from "./types.js";

// Brique 2 — Regulation (EU) 2016/1103 (matrimonial property regimes).
export { analyseMatrimonial } from "./matrimonial/engine/analyze.js";
export { determineMatrimonialJurisdiction } from "./matrimonial/engine/jurisdiction.js";
export { determineMatrimonialApplicableLaw } from "./matrimonial/engine/applicableLaw.js";
export {
  analyseMpaFormalValidity,
  analyseChoiceOfLawFormalValidity,
} from "./matrimonial/engine/mpa.js";
export {
  checkMatrimonialTemporalScope,
  checkMatrimonialMaterialScope,
} from "./matrimonial/engine/scope.js";
export {
  MATRIMONIAL_ARTICLES,
  getMatrimonialArticle,
  listMatrimonialArticles,
} from "./matrimonial/articles.js";
export {
  isMatrimonialBoundState,
  listMatrimonialBoundStates,
  matrimonialRegulationStatus,
} from "./matrimonial/memberStates.js";
export type * as Matrimonial from "./matrimonial/types.js";
