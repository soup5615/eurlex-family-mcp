import type { RenvoiAnalysis, SuccessionAnalysis, SuccessionCase } from "../types.js";
import { determineJurisdiction } from "./jurisdiction.js";
import { determineApplicableLaw } from "./applicableLaw.js";
import { analyseDispositions } from "./dispositions.js";
import { recommendESC } from "./esc.js";
import { analyseRenvoi } from "./renvoi.js";
import { checkMaterialScope, checkTemporalScope } from "./scope.js";

export function analyseSuccession(input: SuccessionCase): SuccessionAnalysis {
  const temporalScope = checkTemporalScope(input);
  const materialScope = checkMaterialScope(input);
  const flags: string[] = [];

  if (!temporalScope.applicable) {
    flags.push(
      "Règlement inapplicable ratione temporis ; voir DIP national de l'État membre saisi (avant la Convention de La Haye 1989 non entrée en vigueur).",
    );
    const emptyRenvoi: RenvoiAnalysis = {
      considered: false,
      blockedByArt34_2: false,
      designatedStateAppliesOwnLaw: null,
      referralAccepted: false,
      referralTarget: null,
      rationale: "Règlement inapplicable.",
      reasoning: [],
      warnings: [],
    };
    return {
      input,
      temporalScope,
      materialScope,
      jurisdiction: {
        competentForum: null,
        basis: "regulation-not-applicable-ratione-temporis",
        scope: "none",
        reasoning: [],
        warnings: [temporalScope.reason],
      },
      applicableLaw: {
        applicableLaw: null,
        basis: "regulation-not-applicable-ratione-temporis",
        universalApplication: false,
        renvoiConsidered: false,
        reasoning: [],
        warnings: [temporalScope.reason],
      },
      renvoi: emptyRenvoi,
      dispositions: [],
      esc: {
        recommended: false,
        rationale: temporalScope.reason,
        issuingAuthorityState: null,
        notes: [],
      },
      flags,
    };
  }

  const jurisdiction = determineJurisdiction(input);
  const applicableLaw = determineApplicableLaw(input);
  const renvoi = analyseRenvoi(input, applicableLaw);

  // If renvoi results in a different target, reflect it on the final
  // applicable-law determination.
  if (renvoi.referralAccepted && renvoi.referralTarget) {
    applicableLaw.renvoiAccepted = {
      from: applicableLaw.applicableLaw!,
      to: renvoi.referralTarget,
      rationale: renvoi.rationale,
    };
  }

  const dispositions = analyseDispositions(input);
  const esc = recommendESC(input, jurisdiction);

  if (
    applicableLaw.renvoiConsidered &&
    applicableLaw.basis === "art-21-1-habitual-residence"
  ) {
    if (renvoi.referralAccepted) {
      flags.push(
        `Renvoi (art. 34) accepté : la loi matérielle finalement applicable est celle de ${renvoi.referralTarget}.`,
      );
    } else if (renvoi.designatedStateAppliesOwnLaw) {
      flags.push(
        `Renvoi (art. 34) examiné : l'État désigné applique sa propre loi ; la loi désignée est retenue.`,
      );
    } else if (renvoi.warnings.length > 0) {
      flags.push(
        "Renvoi (art. 34) à examiner manuellement : certaines règles de DIP de l'État désigné ne sont pas embarquées.",
      );
    }
  }
  if (jurisdiction.basis === "art-10-2-limited-to-assets") {
    flags.push(
      "Compétence limitée aux biens situés dans l'État du for (art. 10(2)) : une coordination avec d'autres procédures peut être nécessaire.",
    );
  }
  if (
    jurisdiction.basis === "art-4-habitual-residence" &&
    applicableLaw.basis === "art-22-professio-juris" &&
    jurisdiction.competentForum !== applicableLaw.applicableLaw
  ) {
    flags.push(
      "Dissociation for / loi applicable : envisager art. 5-7 (accord d'élection de for / déclinatoire) pour rattacher les juridictions à la loi choisie.",
    );
  }

  return {
    input,
    temporalScope,
    materialScope,
    jurisdiction,
    applicableLaw,
    renvoi,
    dispositions,
    esc,
    flags,
  };
}
