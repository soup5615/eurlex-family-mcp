export { analyseSuccession } from "./engine/analyze.js";
export { determineJurisdiction } from "./engine/jurisdiction.js";
export { determineApplicableLaw } from "./engine/applicableLaw.js";
export { analyseDispositions } from "./engine/dispositions.js";
export { recommendESC } from "./engine/esc.js";
export { checkTemporalScope, checkMaterialScope } from "./engine/scope.js";
export { ARTICLES, getArticle, listArticles } from "./data/articles.js";
export { CJEU_CASES, findCase } from "./data/cjeuCases.js";
export {
  regulationStatus,
  isBoundMemberState,
  listBoundMemberStates,
} from "./data/memberStates.js";
export type * from "./types.js";
