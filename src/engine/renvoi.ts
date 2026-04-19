import { isBoundMemberState } from "../data/memberStates.js";
import {
  describeSituatedLaws,
  getThirdStateRule,
  type PilDesignation,
} from "../data/thirdStatePIL.js";
import type {
  ApplicableLawDetermination,
  CountryCode,
  ReasoningStep,
  RenvoiAnalysis,
  SuccessionCase,
} from "../types.js";

// Implements Art. 34 of Reg. (EU) 650/2012.
//
//   Where the law designated by the Regulation is the law of a third
//   State, "law" means the rules in force in that State, including
//   rules of private international law, insofar as those rules make a
//   renvoi:
//     (a) to the law of a Member State; or
//     (b) to the law of another third State which would apply its own
//         law.
//   Paragraph 2 blocks renvoi when the applicable law is designated
//   under Art. 21(2), 22, 24, 25, 27, 28(b) or 30.

export function analyseRenvoi(
  input: SuccessionCase,
  law: ApplicableLawDetermination,
): RenvoiAnalysis {
  const reasoning: ReasoningStep[] = [];
  const warnings: string[] = [];

  const blocked = isRenvoiBlocked(law);
  if (blocked) {
    return {
      considered: false,
      blockedByArt34_2: true,
      designatedStateAppliesOwnLaw: null,
      referralAccepted: false,
      referralTarget: null,
      rationale: "Art. 34(2) : aucun renvoi lorsque la loi est désignée par l'art. 21(2), 22, 24, 25, 27, 28(b) ou 30.",
      reasoning,
      warnings,
    };
  }
  if (!law.applicableLaw) {
    return {
      considered: false,
      blockedByArt34_2: false,
      designatedStateAppliesOwnLaw: null,
      referralAccepted: false,
      referralTarget: null,
      rationale: "Aucune loi désignée — renvoi sans objet.",
      reasoning,
      warnings,
    };
  }

  const designated = law.applicableLaw.toUpperCase();
  if (isBoundMemberState(designated)) {
    // No renvoi needed when the designated law is that of a bound MS.
    return {
      considered: false,
      blockedByArt34_2: false,
      designatedStateAppliesOwnLaw: null,
      referralAccepted: false,
      referralTarget: designated,
      rationale:
        "La loi désignée est celle d'un État membre lié — l'art. 34 ne joue pas.",
      reasoning,
      warnings,
    };
  }

  // We are looking at a third-state law. Try to apply its PIL.
  const rule = getThirdStateRule(designated);
  if (!rule) {
    warnings.push(
      `DIP de ${designated} non embarqué : à examiner manuellement. Tester si ${designated} renvoie (a) à la loi d'un État membre, (b) à la loi d'un autre État tiers qui appliquerait sa propre loi.`,
    );
    return {
      considered: true,
      blockedByArt34_2: false,
      designatedStateAppliesOwnLaw: null,
      referralAccepted: false,
      referralTarget: null,
      rationale: `Règles de DIP de ${designated} indisponibles.`,
      reasoning,
      warnings,
    };
  }

  const designation = rule.designate(input);
  reasoning.push({
    article: "Art. 34(1) Règl. (UE) 650/2012",
    rule:
      "L'application de la loi d'un État tiers désignée par le règlement s'entend comme celle des règles juridiques en vigueur dans cet État, y compris ses règles de DIP, pour autant que ces règles renvoient (a) à la loi d'un État membre, ou (b) à la loi d'un autre État tiers qui appliquerait sa propre loi.",
    appliedTo: `Loi désignée : ${designated}. Source DIP : ${rule.source}.`,
    conclusion: describeDesignation(designation),
  });

  switch (designation.kind) {
    case "own-law": {
      return {
        considered: true,
        blockedByArt34_2: false,
        designatedStateAppliesOwnLaw: true,
        referralAccepted: false,
        referralTarget: designated,
        rationale: `${designated} applique sa propre loi ; aucun renvoi.`,
        dataSource: rule.source,
        reasoning,
        warnings,
      };
    }
    case "refer-to": {
      const target = designation.country.toUpperCase();
      return resolveReferral(designated, target, rule.source, reasoning, warnings, input);
    }
    case "scission": {
      const immovables = describeSituatedLaws(input);
      if (immovables.length > 0) {
        warnings.push(
          `Système scissioniste (${designated}) : les immeubles situés en ${immovables.join(", ")} sont régis par leur lex rei sitae ; les meubles suivent un autre rattachement.`,
        );
      }
      if (designation.movables.kind === "own-law") {
        return {
          considered: true,
          blockedByArt34_2: false,
          designatedStateAppliesOwnLaw: true,
          referralAccepted: false,
          referralTarget: designated,
          rationale: `Système scissioniste de ${designated} : mobilier = propre loi. Pour les immeubles, lex rei sitae.`,
          dataSource: rule.source,
          reasoning,
          warnings,
        };
      }
      const target = designation.movables.country.toUpperCase();
      const res = resolveReferral(
        designated,
        target,
        rule.source,
        reasoning,
        warnings,
        input,
      );
      res.rationale = `Mobilier : ${res.rationale} — pour les immeubles : lex rei sitae, voir drapeaux.`;
      return res;
    }
  }
}

function describeDesignation(d: PilDesignation): string {
  switch (d.kind) {
    case "own-law":
      return "Règle DIP locale : l'État tiers désigné applique sa propre loi.";
    case "refer-to":
      return `Règle DIP locale : renvoi à la loi de ${d.country}. ${d.rationale}`;
    case "scission":
      return `Règle DIP locale scissioniste : ${d.rationale}`;
  }
}

function resolveReferral(
  from: CountryCode,
  target: CountryCode,
  source: string,
  reasoning: ReasoningStep[],
  warnings: string[],
  input: SuccessionCase,
): RenvoiAnalysis {
  // Self-reference: the third state's conflict rule designates the
  // very same state — equivalent to applying its own law.
  if (target === from) {
    reasoning.push({
      article: "Art. 34(1) Règl. (UE) 650/2012",
      rule: "Lorsque la règle de DIP de l'État désigné désigne à nouveau cette même loi, elle est assimilée à l'application par cet État de sa propre loi (pas de renvoi).",
      appliedTo: `${from} se désigne lui-même comme applicable.`,
      conclusion: `Application de la loi matérielle de ${from}.`,
    });
    return {
      considered: true,
      blockedByArt34_2: false,
      designatedStateAppliesOwnLaw: true,
      referralAccepted: true,
      referralTarget: from,
      rationale: `La règle de DIP de ${from} désigne à nouveau ${from} ; application de la loi matérielle de ${from}.`,
      dataSource: source,
      reasoning,
      warnings,
    };
  }
  // Art. 34(1)(a): target is a Member State — accept.
  if (isBoundMemberState(target)) {
    reasoning.push({
      article: "Art. 34(1)(a) Règl. (UE) 650/2012",
      rule: "Le renvoi est accepté lorsque la loi de l'État tiers désignée renvoie à la loi d'un État membre.",
      appliedTo: `${from} renvoie à ${target} (État membre lié).`,
      conclusion: `Renvoi accepté : application de la loi de ${target}.`,
    });
    return {
      considered: true,
      blockedByArt34_2: false,
      designatedStateAppliesOwnLaw: false,
      referralAccepted: true,
      referralTarget: target,
      rationale: `Renvoi de ${from} vers ${target} (EM) accepté.`,
      dataSource: source,
      reasoning,
      warnings,
    };
  }

  // Art. 34(1)(b): target is another third state — check whether that
  // state would apply its own law.
  const targetRule = getThirdStateRule(target);
  if (!targetRule) {
    warnings.push(
      `${from} renvoie vers ${target}, État tiers dont le DIP n'est pas embarqué. Vérifier manuellement si ${target} appliquerait sa propre loi (art. 34(1)(b)).`,
    );
    return {
      considered: true,
      blockedByArt34_2: false,
      designatedStateAppliesOwnLaw: false,
      referralAccepted: false,
      referralTarget: null,
      rationale: `${from} renvoie à ${target} ; règles de ${target} indisponibles.`,
      dataSource: source,
      reasoning,
      warnings,
    };
  }
  const d2 = targetRule.designate(input);
  reasoning.push({
    article: "Art. 34(1)(b) Règl. (UE) 650/2012",
    rule: "Le renvoi est accepté lorsque la loi de l'État tiers désignée renvoie à la loi d'un autre État tiers qui appliquerait sa propre loi.",
    appliedTo: `${from} renvoie à ${target} ; règle DIP de ${target} consultée.`,
    conclusion: describeDesignation(d2),
  });
  if (d2.kind === "own-law") {
    return {
      considered: true,
      blockedByArt34_2: false,
      designatedStateAppliesOwnLaw: false,
      referralAccepted: true,
      referralTarget: target,
      rationale: `Renvoi de ${from} vers ${target} (État tiers) qui applique sa propre loi — accepté.`,
      dataSource: `${source} ; ${targetRule.source}`,
      reasoning,
      warnings,
    };
  }
  warnings.push(
    `Chaîne de renvoi non résolue : ${from} → ${target} → ... Le règlement n'accepte pas un renvoi en cascade indéfini ; en pratique, appliquer la loi matérielle de ${from}.`,
  );
  return {
    considered: true,
    blockedByArt34_2: false,
    designatedStateAppliesOwnLaw: false,
    referralAccepted: false,
    referralTarget: null,
    rationale: `Chaîne de renvoi depuis ${from} vers ${target} non aboutie ; en principe, appliquer la loi matérielle de ${from}.`,
    dataSource: `${source} ; ${targetRule.source}`,
    reasoning,
    warnings,
  };
}

function isRenvoiBlocked(law: ApplicableLawDetermination): boolean {
  switch (law.basis) {
    case "art-22-professio-juris":
    case "art-21-2-manifestly-closer-connection":
    case "regulation-not-applicable-ratione-temporis":
      return true;
    default:
      return false;
  }
}
