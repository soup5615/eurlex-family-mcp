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
export { analyseCombined } from "./matrimonial/combined.js";
export {
  renderMatrimonialHTML,
  renderCombinedHTML,
} from "./render/matrimonialHtml.js";

// Regulation (EU) 2016/1104 (registered partnerships).
export {
  analysePartnership,
  determinePartnershipJurisdiction,
  determinePartnershipApplicableLaw,
  analysePartnershipAgreementFormalValidity,
  checkPartnershipTemporalScope,
  checkPartnershipMaterialScope,
} from "./partnerships/engine.js";
export {
  PARTNERSHIP_ARTICLES,
  getPartnershipArticle,
  listPartnershipArticles,
} from "./partnerships/articles.js";
export {
  isPartnershipBoundState,
  listPartnershipBoundStates,
  partnershipRegulationStatus,
} from "./partnerships/memberStates.js";
export type * as Partnerships from "./partnerships/types.js";

// Brique 3 — Rome III (1259/2010) and Brussels IIter (2019/1111).
export {
  analyseRome3,
  determineRome3ApplicableLaw,
  analyseRome3ChoiceFormalValidity,
  checkRome3TemporalScope,
  checkRome3MaterialScope,
} from "./divorce/engine.js";
export {
  ROME3_ARTICLES,
  getRome3Article,
  listRome3Articles,
} from "./divorce/articles.js";
export {
  isRome3BoundState,
  listRome3BoundStates,
  rome3Status,
} from "./divorce/memberStates.js";
export type * as Rome3 from "./divorce/types.js";

export {
  analyseBiiMatrimonial,
  analyseBiiParental,
  determineBiiMatrimonialJurisdiction,
  determineBiiParentalJurisdiction,
  checkBiiTemporalScope,
} from "./brussels2/engine.js";
export {
  BII_ARTICLES,
  getBiiArticle,
  listBiiArticles,
} from "./brussels2/articles.js";
export {
  biiStatus,
  isBiiBoundState,
  listBiiBoundStates,
} from "./brussels2/memberStates.js";
export { analyseCrisis } from "./brussels2/crisis.js";
export type * as Brussels2 from "./brussels2/types.js";

// Reg. (CE) 4/2009 — maintenance obligations + Hague Protocol 2007.
export {
  analyseMaintenance,
  determineMaintenanceJurisdiction,
  determineMaintenanceApplicableLaw,
  checkMaintenanceTemporalScope,
} from "./maintenance/engine.js";
export {
  MAINTENANCE_ARTICLES,
  getMaintenanceArticle,
  listMaintenanceArticles,
} from "./maintenance/articles.js";
export {
  isMaintenanceBoundState,
  listMaintenanceBoundStates,
  maintenanceStatus,
  protocolApplies,
} from "./maintenance/memberStates.js";
export type * as Maintenance from "./maintenance/types.js";
