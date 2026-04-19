import type {
  ESCRecommendation,
  JurisdictionDetermination,
  SuccessionCase,
} from "../types.js";
import { isBoundMemberState } from "../data/memberStates.js";

export function recommendESC(
  input: SuccessionCase,
  jurisdiction: JurisdictionDetermination,
): ESCRecommendation {
  const notes: string[] = [];
  const assets = input.assets ?? [];
  const hr = input.deceased.lastHabitualResidence.toUpperCase();

  const assetCountries = new Set(
    assets.map((a) => a.locatedIn.toUpperCase()),
  );
  const crossBorder = assets.some(
    (a) =>
      isBoundMemberState(a.locatedIn) && a.locatedIn.toUpperCase() !== hr,
  );

  if (!jurisdiction.competentForum) {
    return {
      recommended: false,
      rationale:
        "Aucune juridiction d'État membre n'est compétente ; le CSE, délivré par l'État compétent au titre des art. 4, 7, 10 ou 11, ne peut être émis (art. 64).",
      issuingAuthorityState: null,
      notes,
    };
  }

  if (!isBoundMemberState(jurisdiction.competentForum)) {
    return {
      recommended: false,
      rationale:
        "Le for compétent n'est pas un État membre lié par le règlement ; le CSE ne peut y être délivré.",
      issuingAuthorityState: null,
      notes,
    };
  }

  if (crossBorder || assetCountries.size > 1) {
    notes.push(
      `Biens dans plusieurs États (${[...assetCountries].join(", ")}) : le CSE est particulièrement utile pour faire reconnaître la qualité d'héritier / légataire / exécuteur sans autre formalité (art. 69).`,
    );
    return {
      recommended: true,
      rationale: `Succession transfrontière ; biens dans plusieurs pays. Le CSE est à demander auprès des autorités compétentes de ${jurisdiction.competentForum} (art. 64).`,
      issuingAuthorityState: jurisdiction.competentForum,
      notes,
    };
  }

  if (assets.length === 0) {
    notes.push(
      "Aucun bien renseigné : l'utilité du CSE dépend du besoin des intéressés d'invoquer leur qualité dans un autre État membre (art. 63).",
    );
  }

  return {
    recommended: false,
    rationale:
      "Pas d'élément transfrontière manifeste : le CSE n'est pas nécessairement utile ; les titres nationaux peuvent suffire. L'utilisation du CSE n'est pas obligatoire (art. 62(2)).",
    issuingAuthorityState: jurisdiction.competentForum,
    notes,
  };
}
