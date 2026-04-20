// Reg. (EU) 2016/1104 applies in the same 18 MS as 2016/1103 under
// enhanced cooperation. We reuse the matrimonial tables to avoid
// drift; any future divergence would go here.
export {
  isMatrimonialBoundState as isPartnershipBoundState,
  listMatrimonialBoundStates as listPartnershipBoundStates,
  matrimonialRegulationStatus as partnershipRegulationStatus,
  normaliseCountry,
} from "../matrimonial/memberStates.js";
