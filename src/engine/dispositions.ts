import type {
  CountryCode,
  Disposition,
  DispositionAnalysis,
  ReasoningStep,
  SuccessionCase,
} from "../types.js";
import { validateProfessioJuris } from "./applicableLaw.js";

// Determines the law governing admissibility and substantive validity of
// each disposition (Art. 24 for dispositions other than succession pacts,
// Art. 25 for pacts). This engine focuses on admissibility / substantive
// validity; formal validity (Art. 27) is not yet modelled.
export function analyseDispositions(
  input: SuccessionCase,
): DispositionAnalysis[] {
  const dispositions = input.dispositions ?? [];
  return dispositions.map((d) => analyseOne(d, input));
}

function analyseOne(d: Disposition, input: SuccessionCase): DispositionAnalysis {
  const reasoning: ReasoningStep[] = [];
  const nats = input.deceased.nationalities.map((n) => n.toUpperCase());
  const hr = input.deceased.lastHabitualResidence.toUpperCase();

  // Explicit choice by the disponent (Art. 24(2) or Art. 25(3)).
  if (d.lawChosenForAdmissibilityAndValidity) {
    const chosen = d.lawChosenForAdmissibilityAndValidity.toUpperCase();
    const validity = validateProfessioJuris(
      { chosenLaw: chosen, form: "express" },
      nats,
    );
    if (validity.valid) {
      const article =
        d.type === "succession-pact"
          ? "Art. 25(3) Règl. (UE) 650/2012"
          : "Art. 24(2) Règl. (UE) 650/2012";
      reasoning.push({
        article,
        rule:
          d.type === "succession-pact"
            ? "Les parties à un pacte successoral peuvent choisir comme loi régissant le pacte, en ce qui concerne sa recevabilité, sa validité au fond et ses effets obligatoires, la loi que la personne (ou l'une des personnes) dont la succession est concernée aurait pu choisir en vertu de l'art. 22."
            : "Par dérogation à l'art. 24(1), l'auteur de la disposition peut choisir comme loi régissant la recevabilité et la validité au fond de sa disposition la loi qu'il aurait pu choisir en vertu de l'art. 22.",
        appliedTo: `${d.type}, conclu(e) le ${d.dateExecuted} ; loi choisie : ${chosen} ; nationalités du défunt : ${nats.join(", ") || "(aucune)"}.`,
        conclusion: `Loi régissant la recevabilité et la validité au fond : droit de ${chosen}.`,
      });
      return {
        disposition: d,
        lawGoverningAdmissibilityAndValidity: chosen,
        basis: d.type === "succession-pact" ? "art-25-3-choice" : "art-24-2-choice",
        reasoning,
      };
    }
  }

  // Fallback — hypothetical succession law at the date of the disposition.
  // This engine approximates "what would have been applicable if the
  // disponent had died on the date of the disposition" with the current
  // last habitual residence. This is an admitted simplification; a real
  // product would ask the user for the HR at the date of the disposition.
  if (d.type === "succession-pact") {
    // Art. 25(2): multi-person pacts — admissibility requires each
    // hypothetical law to admit the pact; substantive validity is
    // governed by the law having the closest connection.
    const otherNats = d.otherPartyNationalities ?? [];
    if (otherNats.length > 0) {
      reasoning.push({
        article: "Art. 25(2) Règl. (UE) 650/2012",
        rule: "Pour un pacte concernant la succession de plusieurs personnes, le pacte n'est recevable que s'il l'est selon chacune des lois qui, en vertu du règlement, auraient régi la succession de chacune des personnes concernées si elles étaient décédées le jour où le pacte a été conclu. La validité au fond et les effets obligatoires sont régis par la loi avec laquelle le pacte présente les liens les plus étroits.",
        appliedTo: `Pacte concernant ${1 + otherNats.length} successions ; recevabilité à vérifier selon chacune des lois hypothétiques.`,
        conclusion:
          "La loi applicable à la validité au fond sera celle des lois hypothétiques avec laquelle le pacte présente les liens les plus étroits — appréciation concrète.",
      });
      return {
        disposition: d,
        lawGoverningAdmissibilityAndValidity: null,
        basis: "art-25-2-multi-person-hypothetical-laws",
        reasoning,
      };
    }
    reasoning.push({
      article: "Art. 25(1) Règl. (UE) 650/2012",
      rule: "Un pacte successoral concernant la succession d'une seule personne est régi, pour sa recevabilité, sa validité au fond et ses effets obligatoires, par la loi qui, en vertu du règlement, aurait été applicable à la succession de cette personne si elle était décédée le jour où le pacte a été conclu.",
      appliedTo: `Pacte conclu le ${d.dateExecuted} ; approximation : loi de la résidence habituelle courante (${hr}).`,
      conclusion: `Loi régissant la recevabilité et la validité au fond : droit de ${hr} (approximation — à confirmer avec la résidence habituelle à la date du pacte).`,
    });
    return {
      disposition: d,
      lawGoverningAdmissibilityAndValidity: hr,
      basis: "art-25-1-one-person-hypothetical-law",
      reasoning,
    };
  }

  reasoning.push({
    article: "Art. 24(1) Règl. (UE) 650/2012",
    rule: "La recevabilité et la validité au fond d'une disposition à cause de mort autre qu'un pacte successoral sont régies par la loi qui, en vertu du règlement, aurait été applicable à la succession de son auteur s'il était décédé le jour où la disposition a été établie.",
    appliedTo: `Disposition du ${d.dateExecuted} ; approximation : loi de la résidence habituelle courante (${hr}).`,
    conclusion: `Loi régissant la recevabilité et la validité au fond : droit de ${hr} (approximation).`,
  });
  return {
    disposition: d,
    lawGoverningAdmissibilityAndValidity: hr,
    basis: "art-24-1-hypothetical-succession-law",
    reasoning,
  };
}

// Accept a country code for use in fallback (kept for future expansion).
export function _describeLaw(code: CountryCode): string {
  return `droit de ${code.toUpperCase()}`;
}
