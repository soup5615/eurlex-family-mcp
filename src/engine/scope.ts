import type { SuccessionCase, TemporalScope, MaterialScope } from "../types.js";

// Regulation 650/2012 applies to successions of persons who died on or
// after 17 August 2015 (Art. 83(1) / Art. 84).
const APPLICATION_START = "2015-08-17";

export function checkTemporalScope(input: SuccessionCase): TemporalScope {
  const d = input.deceased.dateOfDeath;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    return {
      applicable: false,
      reason: `Date de décès invalide (attendu YYYY-MM-DD) : "${d}".`,
    };
  }
  if (d < APPLICATION_START) {
    return {
      applicable: false,
      reason: `Art. 83(1) : le règlement ne s'applique qu'aux successions des personnes décédées le 17 août 2015 ou après ; date fournie : ${d}.`,
    };
  }
  return {
    applicable: true,
    reason: `Art. 83(1) : décès du ${d} postérieur au 17 août 2015, règlement applicable ratione temporis.`,
  };
}

// The material scope is positively defined by Art. 1(1) (successions to
// the estates of deceased persons). Exclusions are listed in Art. 1(2).
// The engine flags a few common boundary issues without deciding them.
const COMMON_EXCLUSIONS: string[] = [
  "questions fiscales, douanières et administratives (art. 1(2)(a))",
  "état et capacité des personnes physiques, sous réserve de la capacité à succéder (art. 1(2)(b), 23(2)(c))",
  "régimes matrimoniaux (art. 1(2)(d)) — cf. règl. 2016/1103",
  "obligations alimentaires autres que pour cause de mort (art. 1(2)(e))",
  "validité formelle des dispositions orales (art. 1(2)(f))",
  "droits et biens créés ou transférés autrement que par succession (art. 1(2)(g))",
  "questions relevant du droit des sociétés (art. 1(2)(h))",
  "dissolution des personnes morales (art. 1(2)(i))",
  "création, administration et dissolution des trusts (art. 1(2)(j))",
  "nature des droits réels (art. 1(2)(k))",
  "toute inscription dans un registre d'un droit sur un bien (art. 1(2)(l))",
];

export function checkMaterialScope(_input: SuccessionCase): MaterialScope {
  return {
    applicable: true,
    reason:
      "Art. 1(1) : successions à cause de mort. Le moteur suppose l'objet de la consultation couvert ; vérifier au cas par cas les exclusions.",
    excluded: COMMON_EXCLUSIONS,
  };
}
