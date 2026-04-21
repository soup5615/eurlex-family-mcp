// Combined "matrimonial crisis" analyser, orchestrating:
//   - Brussels IIter (Reg. 2019/1111) for jurisdiction
//   - Rome III (Reg. 1259/2010) for law applicable to divorce
//   - Matrimonial property regime (Reg. 2016/1103)
//   - Optional: Brussels IIter parental responsibility

import { analyseBiiMatrimonial, analyseBiiParental } from "./engine.js";
import type {
  BiiMatrimonialCase,
  BiiMatrimonialDetermination,
  BiiParentalDetermination,
  BiiParentalResponsibilityCase,
  BiiScope,
} from "./types.js";
import { analyseRome3 } from "../divorce/engine.js";
import type {
  DivorceCase,
  Rome3Analysis,
} from "../divorce/types.js";
import { analyseMatrimonial } from "../matrimonial/engine/analyze.js";
import type {
  MatrimonialAnalysis,
  MatrimonialCase,
} from "../matrimonial/types.js";

export interface CrisisCase {
  // Spouses, their properties and the proceeding.
  divorce: DivorceCase;
  // Matrimonial case (for the property regime). The matrimonial
  // context is automatically wired via the divorce forum.
  matrimonial: Omit<MatrimonialCase, "context"> & {
    context?: MatrimonialCase["context"];
  };
  // Jurisdiction test against the divorce forum under B IIter.
  bii?: Omit<BiiMatrimonialCase, "forumState" | "dateCourtSeised" | "proceeding">;
  // Optional parental responsibility jurisdiction test.
  parentalResponsibility?: BiiParentalResponsibilityCase;
}

export interface CrisisAnalysis {
  bii: {
    scope: BiiScope;
    jurisdiction: BiiMatrimonialDetermination;
    flags: string[];
  };
  rome3: Rome3Analysis;
  matrimonial: MatrimonialAnalysis;
  parental?: {
    scope: BiiScope;
    jurisdiction: BiiParentalDetermination;
    flags: string[];
  };
  orchestration: {
    orderOfOperations: string[];
    notes: string[];
  };
}

export function analyseCrisis(input: CrisisCase): CrisisAnalysis {
  // 1. Jurisdiction test — does B IIter fund the divorce forum?
  const biiMatrimonialInput: BiiMatrimonialCase = {
    spouses: input.divorce.spouses.map((s) => ({
      id: s.id,
      nationalities: s.nationalities,
      habitualResidence: s.habitualResidence,
    })) as BiiMatrimonialCase["spouses"],
    proceeding: input.divorce.proceeding === "divorce" ? "divorce" : "legal-separation",
    dateCourtSeised: input.divorce.dateCourtSeised,
    forumState: input.divorce.forumState,
    ...(input.bii ?? {}),
  };
  const bii = analyseBiiMatrimonial(biiMatrimonialInput);

  // 2. Applicable law under Rome III.
  const rome3 = analyseRome3(input.divorce);

  // 3. Matrimonial regime — wire art. 5 concentration on divorce forum.
  const matrimonialInput: MatrimonialCase = {
    ...input.matrimonial,
    context: input.matrimonial.context ?? {
      matrimonialCause: {
        kind:
          input.divorce.proceeding === "legal-separation"
            ? "separation"
            : "divorce",
        forumSeisedForDivorce: input.divorce.forumState,
      },
    },
  };
  const matrimonial = analyseMatrimonial(matrimonialInput);

  // 4. Optional parental responsibility.
  const parental = input.parentalResponsibility
    ? analyseBiiParental(input.parentalResponsibility)
    : undefined;

  const order: string[] = [
    "1. Déterminer la compétence du for saisi en matière matrimoniale (Règl. 2019/1111, art. 3).",
    "2. Rattacher la loi applicable au divorce / à la séparation (Règl. 1259/2010, art. 5 ou 8).",
    "3. Rattacher la loi applicable au régime matrimonial (Règl. 2016/1103, art. 22 ou 26) — concentration de compétence art. 5.",
    "4. Le cas échéant, statuer séparément sur la responsabilité parentale (Règl. 2019/1111, art. 7 ss) et les aliments (Règl. 4/2009 — hors champ de ce moteur).",
  ];

  const notes: string[] = [];
  if (bii.jurisdiction.basis === "none") {
    notes.push(
      "La compétence du for pour le divorce ne paraît pas fondée sur Bruxelles II ter ; vérifier les règles nationales de compétence résiduelle (art. 6).",
    );
  }
  if (
    rome3.applicableLaw.applicableLaw &&
    matrimonial.applicableLaw.applicableLaw &&
    rome3.applicableLaw.applicableLaw !==
      matrimonial.applicableLaw.applicableLaw
  ) {
    notes.push(
      `Dissociation des lois : divorce = ${rome3.applicableLaw.applicableLaw} ; régime matrimonial = ${matrimonial.applicableLaw.applicableLaw}. Vérifier l'articulation dans la décision (effets patrimoniaux du divorce).`,
    );
  }
  if (parental && parental.jurisdiction.basis === "none") {
    notes.push(
      "Responsabilité parentale : aucun chef de compétence retenu — tester un autre État membre ou envisager l'art. 11 (présence de l'enfant).",
    );
  }

  const out: CrisisAnalysis = {
    bii,
    rome3,
    matrimonial,
    orchestration: { orderOfOperations: order, notes },
  };
  if (parental) out.parental = parental;
  return out;
}
