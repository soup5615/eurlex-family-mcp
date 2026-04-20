import type {
  MatrimonialCase,
  MatrimonialMaterialScope,
  MatrimonialTemporalScope,
} from "../types.js";

// Art. 69-70: the Regulation applies to legal proceedings instituted,
// authentic instruments formally drawn up and court settlements
// approved or concluded on or after 29 January 2019. The rules on
// applicable law apply to spouses married or who chose the applicable
// law on or after that date.
const APPLICATION_START = "2019-01-29";

export function checkMatrimonialTemporalScope(
  input: MatrimonialCase,
): MatrimonialTemporalScope {
  const dateOfMarriage = input.marriage.dateOfMarriage;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfMarriage)) {
    return {
      applicable: false,
      reason: `Date du mariage invalide (attendu YYYY-MM-DD) : "${dateOfMarriage}".`,
    };
  }
  const choseLawAfterApplication =
    input.choiceOfLaw?.dateOfChoice
      ? input.choiceOfLaw.dateOfChoice >= APPLICATION_START
      : false;
  const marriedAfterApplication = dateOfMarriage >= APPLICATION_START;

  if (marriedAfterApplication || choseLawAfterApplication) {
    return {
      applicable: true,
      reason: marriedAfterApplication
        ? `Art. 69(3) : mariage célébré le ${dateOfMarriage}, postérieur au 29 janvier 2019. Règles de loi applicable du règlement applicables.`
        : `Art. 69(3) : choix de loi postérieur au 29 janvier 2019 (${input.choiceOfLaw?.dateOfChoice}). Règles de loi applicable du règlement applicables.`,
    };
  }
  return {
    applicable: false,
    reason: `Art. 69(3) : mariage antérieur au 29 janvier 2019 et aucun choix de loi postérieur. Les règles sur la loi applicable du règlement ne jouent pas ; appliquer le DIP national (pour la France : rattachements jurisprudentiels ; Convention de La Haye du 14 mars 1978 pour les mariages entre 1992-09-01 et 2019-01-28).`,
  };
}

const COMMON_EXCLUSIONS: string[] = [
  "capacité juridique des époux (art. 1(2)(a))",
  "existence, validité ou reconnaissance du mariage (art. 1(2)(b))",
  "obligations alimentaires (art. 1(2)(c)) — cf. règl. 4/2009",
  "succession à cause de mort d'un époux (art. 1(2)(d)) — cf. règl. 650/2012",
  "sécurité sociale (art. 1(2)(e))",
  "droit au transfert/à l'ajustement entre époux, en cas de divorce, des droits à pension/retraite/invalidité non convertis en revenus (art. 1(2)(f))",
  "nature des droits réels (art. 1(2)(g))",
  "toute inscription dans un registre de droits sur un bien (art. 1(2)(h))",
];

export function checkMatrimonialMaterialScope(
  _input: MatrimonialCase,
): MatrimonialMaterialScope {
  return {
    applicable: true,
    reason:
      "Art. 1(1) : aspects patrimoniaux du mariage. Le moteur suppose que l'objet de la consultation relève du régime matrimonial ; vérifier les frontières au cas par cas (succession : règl. 650/2012 ; aliments : règl. 4/2009 ; divorce : règl. Bruxelles II ter / Rome III).",
    excluded: COMMON_EXCLUSIONS,
  };
}
