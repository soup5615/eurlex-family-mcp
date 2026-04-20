// Combined analysis for the typical "death of a spouse" scenario,
// orchestrating Reg. 650/2012 (succession) and Reg. 2016/1103
// (matrimonial property regime) in the way required by Art. 4 of
// 2016/1103: the court seised of the succession is also competent
// for the matrimonial property issues linked to it, and a preliminary
// liquidation of the matrimonial property regime conditions the
// succession assets (CJUE, Mahnkopf, C-558/16).

import { analyseMatrimonial } from "./engine/analyze.js";
import { analyseSuccession } from "../engine/analyze.js";
import type { MatrimonialAnalysis, MatrimonialCase, Spouse } from "./types.js";
import type { SuccessionAnalysis, SuccessionCase } from "../types.js";

export interface CombinedCase {
  succession: SuccessionCase;
  marriage: MatrimonialCase["marriage"];
  // Identify the surviving spouse (the deceased is in `succession`).
  survivingSpouse: Spouse;
  // If the couple had a choice of law or MPA, pass them through.
  choiceOfLaw?: MatrimonialCase["choiceOfLaw"];
  mpa?: MatrimonialCase["mpa"];
  closerConnectionException?: MatrimonialCase["closerConnectionException"];
  jurisdictionAssets?: MatrimonialCase["jurisdictionAssets"];
}

export interface CombinedAnalysis {
  succession: SuccessionAnalysis;
  matrimonial: MatrimonialAnalysis;
  orchestration: {
    concentrationApplies: boolean;
    competentForum: string | null;
    orderOfOperations: string[];
    notes: string[];
  };
}

export function analyseCombined(input: CombinedCase): CombinedAnalysis {
  const successionAnalysis = analyseSuccession(input.succession);

  // Build the matrimonial case, wiring the Art. 4 concentration via
  // the succession forum (if the succession is within the scope of
  // Reg. 650/2012).
  const successionForum = successionAnalysis.jurisdiction.competentForum;
  const deceasedAsSpouse: Spouse = {
    id: "deceased",
    nationalities: input.succession.deceased.nationalities,
    habitualResidence: input.succession.deceased.lastHabitualResidence,
  };
  if (input.succession.deceased.residenceHistory) {
    deceasedAsSpouse.residenceHistory =
      input.succession.deceased.residenceHistory;
  }

  const context: MatrimonialCase["context"] = {
    deathOfSpouse: {
      spouseId: "deceased",
    },
  };
  if (successionForum) {
    context.deathOfSpouse!.forumSeisedForSuccession = successionForum;
  }

  const matrimonialInput: MatrimonialCase = {
    spouses: [deceasedAsSpouse, input.survivingSpouse],
    marriage: input.marriage,
    context,
  };
  if (input.choiceOfLaw) matrimonialInput.choiceOfLaw = input.choiceOfLaw;
  if (input.mpa) matrimonialInput.mpa = input.mpa;
  if (input.closerConnectionException) {
    matrimonialInput.closerConnectionException =
      input.closerConnectionException;
  }
  if (input.jurisdictionAssets) {
    matrimonialInput.jurisdictionAssets = input.jurisdictionAssets;
  }

  const matrimonialAnalysis = analyseMatrimonial(matrimonialInput);

  const order: string[] = [
    "1. Identifier la juridiction compétente pour la succession (art. 4 Règl. 650/2012).",
    "2. Art. 4 Règl. 2016/1103 : concentrer les questions de régime matrimonial devant ce même juge.",
    "3. Déterminer la loi applicable au régime matrimonial (art. 22 / 26 Règl. 2016/1103).",
    "4. Procéder à la liquidation du régime matrimonial préalablement à la succession (CJUE, Mahnkopf, C-558/16 : les droits issus de la liquidation relèvent de la succession lorsqu'ils dépendent du statut d'époux survivant).",
    "5. Appliquer la loi successorale désignée (art. 21 / 22 Règl. 650/2012) à la masse ainsi constituée.",
    "6. Apprécier l'opportunité d'un Certificat successoral européen (art. 62 ss Règl. 650/2012).",
  ];

  const notes: string[] = [];
  if (
    matrimonialAnalysis.applicableLaw.applicableLaw &&
    successionAnalysis.applicableLaw.applicableLaw &&
    matrimonialAnalysis.applicableLaw.applicableLaw !==
      successionAnalysis.applicableLaw.applicableLaw
  ) {
    notes.push(
      `Dissociation des lois : régime matrimonial = ${matrimonialAnalysis.applicableLaw.applicableLaw} ; succession = ${successionAnalysis.applicableLaw.applicableLaw}. Veiller à la coordination des qualifications (risque Mahnkopf).`,
    );
  }
  if (
    !matrimonialAnalysis.temporalScope.applicable &&
    successionAnalysis.temporalScope.applicable
  ) {
    notes.push(
      "Le régime matrimonial n'est pas couvert ratione temporis par le Règl. 2016/1103 (mariage antérieur au 29 janvier 2019 sans choix postérieur) : appliquer la Convention de La Haye 1978 ou le DIP national.",
    );
  }
  if (
    matrimonialAnalysis.jurisdiction.basis !==
      "art-4-concentration-succession" &&
    successionForum
  ) {
    notes.push(
      `Concentration art. 4 non retenue (${matrimonialAnalysis.jurisdiction.basis}) — vérifier si ${successionForum} est bien un EM lié au Règl. 2016/1103.`,
    );
  }

  return {
    succession: successionAnalysis,
    matrimonial: matrimonialAnalysis,
    orchestration: {
      concentrationApplies:
        matrimonialAnalysis.jurisdiction.basis ===
        "art-4-concentration-succession",
      competentForum: successionForum,
      orderOfOperations: order,
      notes,
    },
  };
}
