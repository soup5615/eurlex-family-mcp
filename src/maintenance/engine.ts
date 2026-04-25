import {
  isMaintenanceBoundState,
  maintenanceStatus,
  protocolApplies,
} from "./memberStates.js";
import type {
  MaintenanceAnalysis,
  MaintenanceApplicableLawDetermination,
  MaintenanceCase,
  MaintenanceJurisdictionDetermination,
  MaintenanceTemporalScope,
  ReasoningStep,
} from "./types.js";

const APPLICATION_START = "2011-06-18";

export function checkMaintenanceTemporalScope(
  input: MaintenanceCase,
): MaintenanceTemporalScope {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dateCourtSeised)) {
    return { applicable: false, reason: "Date de saisine invalide." };
  }
  if (input.dateCourtSeised < APPLICATION_START) {
    return {
      applicable: false,
      reason: `Règl. 4/2009 applicable depuis le 18 juin 2011 ; saisine du ${input.dateCourtSeised} antérieure.`,
    };
  }
  return {
    applicable: true,
    reason: `Règl. 4/2009 applicable ratione temporis (saisine du ${input.dateCourtSeised}).`,
  };
}

// Art. 3 — alternative grounds of jurisdiction. We test the supplied
// `forumState` and return the first ground it satisfies. Callers can
// iterate over multiple candidate fora to enumerate all available
// venues.
export function determineMaintenanceJurisdiction(
  input: MaintenanceCase,
): MaintenanceJurisdictionDetermination {
  const reasoning: ReasoningStep[] = [];
  const warnings: string[] = [];
  const forum = input.forumState.toUpperCase();

  if (!isMaintenanceBoundState(forum)) {
    warnings.push(
      `Forum ${forum} : non lié par le règlement. Compétence à examiner sous le DIP national.`,
    );
    return { competentForum: null, basis: "none", reasoning, warnings };
  }

  // Art. 4 — choice of court. Excluded for child support (art. 4(3)).
  if (input.choiceOfCourt && !input.creditor.isMinor) {
    const coc = input.choiceOfCourt;
    if (coc.forumState.toUpperCase() === forum && coc.inWritingDatedSigned) {
      const validity = validateChoiceOfCourt(input, forum);
      if (validity.valid) {
        reasoning.push({
          article: "Art. 4 Règl. (CE) 4/2009",
          rule: "Les parties peuvent convenir d'attribuer compétence aux juridictions d'un État membre lié à au moins l'une d'elles (RH ou nationalité), ou — pour les époux/ex-époux — à la juridiction de la cause matrimoniale ou de la dernière RH commune ≥ 1 an. Convention écrite, datée, signée.",
          appliedTo: `For choisi : ${forum} (${validity.branch}).`,
          conclusion: `Juridictions de ${forum} compétentes (élection de for).`,
        });
        return {
          competentForum: forum,
          basis: "art-4-choice-of-court",
          reasoning,
          warnings,
        };
      }
      warnings.push(`Art. 4 : choix de for non valide (${validity.reason}).`);
    } else if (!coc.inWritingDatedSigned) {
      warnings.push(
        "Art. 4(2) : la convention d'élection de for doit être écrite, datée et signée.",
      );
    }
  }
  if (input.choiceOfCourt && input.creditor.isMinor) {
    warnings.push(
      "Art. 4(3) : l'élection de for ne s'applique pas à une obligation alimentaire concernant un enfant de moins de 18 ans.",
    );
  }

  // Art. 3(a) — respondent's HR.
  if (input.debtor.habitualResidence.toUpperCase() === forum) {
    reasoning.push({
      article: "Art. 3(a) Règl. (CE) 4/2009",
      rule: "Compétence des juridictions de l'État membre de la résidence habituelle du défendeur.",
      appliedTo: `RH du défendeur (débiteur) : ${forum}.`,
      conclusion: `Juridictions de ${forum} compétentes.`,
    });
    return {
      competentForum: forum,
      basis: "art-3-a-respondent-hr",
      reasoning,
      warnings,
    };
  }

  // Art. 3(b) — creditor's HR.
  if (input.creditor.habitualResidence.toUpperCase() === forum) {
    reasoning.push({
      article: "Art. 3(b) Règl. (CE) 4/2009",
      rule: "Compétence des juridictions de l'État membre de la résidence habituelle du créancier.",
      appliedTo: `RH du créancier : ${forum}.`,
      conclusion: `Juridictions de ${forum} compétentes.`,
    });
    return {
      competentForum: forum,
      basis: "art-3-b-creditor-hr",
      reasoning,
      warnings,
    };
  }

  // Art. 3(c) — court of a related status proceeding.
  if (
    input.relatedStatusProceedingsIn?.toUpperCase() === forum &&
    !input.relatedStatusProceedingsBasedOnNationalityOnly
  ) {
    reasoning.push({
      article: "Art. 3(c) Règl. (CE) 4/2009",
      rule: "Compétence accessoire à une action relative à l'état des personnes (sauf si la compétence est fondée uniquement sur la nationalité).",
      appliedTo: `Procédure relative à l'état des personnes pendante devant ${forum}.`,
      conclusion: `Juridictions de ${forum} compétentes (accessoire).`,
    });
    return {
      competentForum: forum,
      basis: "art-3-c-related-status-court",
      reasoning,
      warnings,
    };
  }

  // Art. 3(d) — court of a related parental-responsibility proceeding.
  if (
    input.relatedParentalProceedingsIn?.toUpperCase() === forum &&
    !input.relatedParentalProceedingsBasedOnNationalityOnly
  ) {
    reasoning.push({
      article: "Art. 3(d) Règl. (CE) 4/2009",
      rule: "Compétence accessoire à une action relative à la responsabilité parentale (sauf si la compétence est fondée uniquement sur la nationalité).",
      appliedTo: `Procédure de responsabilité parentale pendante devant ${forum}.`,
      conclusion: `Juridictions de ${forum} compétentes (accessoire).`,
    });
    return {
      competentForum: forum,
      basis: "art-3-d-related-parental-court",
      reasoning,
      warnings,
    };
  }

  // Art. 6 — subsidiary common nationality.
  const natsCreditor = input.creditor.nationalities.map((n) => n.toUpperCase());
  const natsDebtor = input.debtor.nationalities.map((n) => n.toUpperCase());
  const commonNat = natsCreditor.find((n) => natsDebtor.includes(n));
  if (commonNat && commonNat === forum) {
    reasoning.push({
      article: "Art. 6 Règl. (CE) 4/2009",
      rule: "Compétence subsidiaire des juridictions de l'État membre de la nationalité commune des parties lorsque aucun chef des art. 3 à 5 ne fonde la compétence d'une juridiction d'un EM ou d'un État Lugano.",
      appliedTo: `Nationalité commune : ${forum}.`,
      conclusion: `Juridictions de ${forum} compétentes (subsidiaire).`,
    });
    return {
      competentForum: forum,
      basis: "art-6-subsidiary-common-nationality",
      reasoning,
      warnings,
    };
  }

  warnings.push(
    "Art. 7 : un forum necessitatis dans un EM reste envisageable à titre exceptionnel.",
  );

  return { competentForum: null, basis: "none", reasoning, warnings };
}

interface ChoiceValidity {
  valid: boolean;
  reason: string;
  branch?: "art-4-1-a-hr" | "art-4-1-b-nationality" | "art-4-1-c-matrimonial" | "art-4-1-d-last-common-hr";
}

function validateChoiceOfCourt(input: MaintenanceCase, forum: string): ChoiceValidity {
  const hrs = new Set([
    input.creditor.habitualResidence.toUpperCase(),
    input.debtor.habitualResidence.toUpperCase(),
  ]);
  if (hrs.has(forum)) return { valid: true, reason: "RH d'une partie", branch: "art-4-1-a-hr" };
  const nats = new Set([
    ...input.creditor.nationalities.map((n) => n.toUpperCase()),
    ...input.debtor.nationalities.map((n) => n.toUpperCase()),
  ]);
  if (nats.has(forum)) return { valid: true, reason: "nationalité d'une partie", branch: "art-4-1-b-nationality" };
  if (
    (input.relation === "spouse" || input.relation === "former-spouse") &&
    input.relatedStatusProceedingsIn?.toUpperCase() === forum
  ) {
    return { valid: true, reason: "for de la cause matrimoniale", branch: "art-4-1-c-matrimonial" };
  }
  return {
    valid: false,
    reason: `${forum} ne correspond à aucun rattachement de l'art. 4(1) (RH, nationalité, cause matrimoniale, dernière RH commune ≥ 1 an).`,
  };
}

// Hague Protocol 2007 — applicable-law engine.
export function determineMaintenanceApplicableLaw(
  input: MaintenanceCase,
): MaintenanceApplicableLawDetermination {
  const reasoning: ReasoningStep[] = [];
  const warnings: string[] = [];
  const protocol = protocolApplies(input.forumState);
  if (!protocol) {
    return {
      applicableLaw: null,
      basis: "denmark-protocol-not-applicable",
      protocolApplies: false,
      renvoiExcluded: false,
      reasoning: [
        {
          article: "Art. 15 Règl. 4/2009",
          rule: "Le Danemark n'est pas lié par le Protocole de La Haye 2007. Sa loi applicable est déterminée par son DIP national.",
          appliedTo: `For : ${input.forumState.toUpperCase()}.`,
          conclusion: "Protocole 2007 inapplicable ; DIP danois à appliquer.",
        },
      ],
      warnings,
    };
  }

  // Art. 7 — choice for a specific proceeding (lex fori).
  if (input.choiceOfLaw?.scope === "specific-proceedings") {
    const chosen = input.choiceOfLaw.chosenLaw.toUpperCase();
    if (chosen === input.forumState.toUpperCase()) {
      reasoning.push({
        article: "Protocole 2007, art. 7",
        rule: "Le créancier et le débiteur peuvent expressément désigner la loi du for pour une procédure particulière.",
        appliedTo: `Loi du for choisie : ${chosen}.`,
        conclusion: `Loi applicable : droit de ${chosen}.`,
      });
      return {
        applicableLaw: chosen,
        basis: "protocol-art-7-specific-choice",
        protocolApplies: true,
        renvoiExcluded: true,
        reasoning,
        warnings,
      };
    }
    warnings.push(
      "Art. 7 : la loi désignée doit être celle de l'État du for. Choix non valide ici ; vérifier l'art. 8.",
    );
  }

  // Art. 8 — general designation. Excluded for under-18 / adult vuln.
  if (input.choiceOfLaw?.scope === "general") {
    if (input.creditor.isMinor) {
      warnings.push(
        "Art. 8(1) : la désignation générale ne s'applique pas à une personne âgée de moins de 18 ans.",
      );
    } else {
      const chosen = input.choiceOfLaw.chosenLaw.toUpperCase();
      const allowed = new Set<string>([
        ...input.creditor.nationalities.map((n) => n.toUpperCase()),
        ...input.debtor.nationalities.map((n) => n.toUpperCase()),
        input.creditor.habitualResidence.toUpperCase(),
        input.debtor.habitualResidence.toUpperCase(),
      ]);
      if (allowed.has(chosen)) {
        reasoning.push({
          article: "Protocole 2007, art. 8",
          rule: "Le créancier et le débiteur peuvent désigner comme loi applicable celle de la nationalité, de la résidence habituelle de l'un d'eux, ou (pour les époux) la loi régissant leur régime matrimonial / leur divorce.",
          appliedTo: `Loi désignée : ${chosen}.`,
          conclusion: `Loi applicable : droit de ${chosen}.`,
        });
        return {
          applicableLaw: chosen,
          basis: "protocol-art-8-general-choice",
          protocolApplies: true,
          renvoiExcluded: true,
          reasoning,
          warnings,
        };
      }
      warnings.push(
        `Art. 8 : la loi désignée (${chosen}) ne correspond à aucun rattachement admissible.`,
      );
    }
  }

  // Art. 4 — special rule for privileged creditors (children, persons
  // under 21 outside spouses, parents → children).
  const isPrivileged =
    input.relation === "child" ||
    (input.relation === "ascendant" && input.creditor.isMinor !== true) ||
    (input.relation === "other-family" && input.creditor.isMinor === true);

  if (isPrivileged) {
    const forumIsDebtorHR =
      input.forumState.toUpperCase() ===
      input.debtor.habitualResidence.toUpperCase();
    const hrCreditor = input.creditor.habitualResidence.toUpperCase();
    const forum = input.forumState.toUpperCase();
    const natsCred = input.creditor.nationalities.map((n) => n.toUpperCase());
    const natsDeb = input.debtor.nationalities.map((n) => n.toUpperCase());
    const common = natsCred.find((n) => natsDeb.includes(n));

    interface Step {
      basis:
        | "protocol-art-4-cascade-creditor-hr"
        | "protocol-art-4-cascade-fori"
        | "protocol-art-4-cascade-common-nationality";
      law: string | undefined;
      allows: boolean;
      article: string;
      rule: string;
      appliedTo: string;
    }
    // Chain depends on whether the forum is the debtor's HR.
    //   - forum == debtor HR : fori → creditor HR → common nationality
    //   - otherwise          : creditor HR → fori → common nationality
    const chain: Step[] = forumIsDebtorHR
      ? [
          {
            basis: "protocol-art-4-cascade-fori",
            law: forum,
            allows: input.forumLawAllowsMaintenance !== false,
            article: "Protocole 2007, art. 4(3)",
            rule:
              "Lorsque le créancier privilégié saisit l'autorité de l'État de la RH du débiteur, la loi du for s'applique en premier lieu.",
            appliedTo: `For : ${forum} = RH du débiteur.`,
          },
          {
            basis: "protocol-art-4-cascade-creditor-hr",
            law: hrCreditor,
            allows: input.hrCreditorLawAllowsMaintenance !== false,
            article: "Protocole 2007, art. 4(3)",
            rule:
              "Si le créancier ne peut obtenir d'aliments en vertu de la loi du for, la loi de la RH du créancier s'applique.",
            appliedTo: `RH du créancier : ${hrCreditor}.`,
          },
        ]
      : [
          {
            basis: "protocol-art-4-cascade-creditor-hr",
            law: hrCreditor,
            allows: input.hrCreditorLawAllowsMaintenance !== false,
            article: "Protocole 2007, art. 4(2)",
            rule:
              "Pour les créanciers privilégiés, la loi de la RH du créancier s'applique en premier lieu (cascade en cas d'échec).",
            appliedTo: `RH du créancier : ${hrCreditor}.`,
          },
          {
            basis: "protocol-art-4-cascade-fori",
            law: forum,
            allows: input.forumLawAllowsMaintenance !== false,
            article: "Protocole 2007, art. 4(2)",
            rule:
              "Si la loi de la RH du créancier ne permet pas l'obligation, la loi du for s'applique.",
            appliedTo: `For : ${forum}.`,
          },
        ];
    if (common) {
      chain.push({
        basis: "protocol-art-4-cascade-common-nationality",
        law: common,
        allows: true,
        article: "Protocole 2007, art. 4(4)",
        rule:
          "Si ni la loi de la RH du créancier ni la loi du for ne permettent l'obligation, la loi de la nationalité commune s'applique.",
        appliedTo: `Nationalité commune : ${common}.`,
      });
    }

    for (const step of chain) {
      if (!step.law) continue;
      if (step.allows) {
        reasoning.push({
          article: step.article,
          rule: step.rule,
          appliedTo: step.appliedTo,
          conclusion: `Loi applicable : droit de ${step.law}.`,
        });
        return {
          applicableLaw: step.law,
          basis: step.basis,
          protocolApplies: true,
          renvoiExcluded: true,
          reasoning,
          warnings,
        };
      }
    }
    warnings.push(
      "Art. 4 : la cascade est épuisée sans résultat ; la prétention pourrait être rejetée matériellement.",
    );
  }

  // Art. 5 — spouse/former-spouse exception.
  if (input.relation === "spouse" || input.relation === "former-spouse") {
    if (input.spouseObjection?.closerConnectionWith) {
      const other = input.spouseObjection.closerConnectionWith.toUpperCase();
      reasoning.push({
        article: "Protocole 2007, art. 5",
        rule: "Pour les obligations entre époux/ex-époux, la règle de l'art. 3 ne s'applique pas si l'une des parties s'y oppose et que la loi d'un autre État (notamment la dernière RH commune) présente des liens plus étroits avec le mariage.",
        appliedTo: `Opposition retenue ; loi de ${other} aux liens plus étroits avec le mariage.`,
        conclusion: `Loi applicable : droit de ${other}.`,
      });
      return {
        applicableLaw: other,
        basis: "protocol-art-5-spouse-closer-connection",
        protocolApplies: true,
        renvoiExcluded: true,
        reasoning,
        warnings,
      };
    }
  }

  // Art. 3 — general rule: HR of the creditor.
  const hrCreditor = input.creditor.habitualResidence.toUpperCase();
  reasoning.push({
    article: "Protocole 2007, art. 3",
    rule: "Les obligations alimentaires sont régies par la loi de l'État de la résidence habituelle du créancier.",
    appliedTo: `RH du créancier : ${hrCreditor}.`,
    conclusion: `Loi applicable : droit de ${hrCreditor}.`,
  });
  return {
    applicableLaw: hrCreditor,
    basis: "protocol-art-3-creditor-hr",
    protocolApplies: true,
    renvoiExcluded: true,
    reasoning,
    warnings,
  };
}

export function analyseMaintenance(input: MaintenanceCase): MaintenanceAnalysis {
  const temporalScope = checkMaintenanceTemporalScope(input);
  const flags: string[] = [];

  if (!temporalScope.applicable) {
    return {
      input,
      temporalScope,
      jurisdiction: {
        competentForum: null,
        basis: "regulation-not-applicable-ratione-temporis",
        reasoning: [],
        warnings: [temporalScope.reason],
      },
      applicableLaw: {
        applicableLaw: null,
        basis: "regulation-not-applicable-ratione-temporis",
        protocolApplies: false,
        renvoiExcluded: false,
        reasoning: [],
        warnings: [temporalScope.reason],
      },
      flags: [
        "Procédure antérieure à l'application du Règl. 4/2009 — appliquer le Règlement Bruxelles I (44/2001) et le DIP national.",
      ],
    };
  }

  const jurisdiction = determineMaintenanceJurisdiction(input);
  const applicableLaw = determineMaintenanceApplicableLaw(input);

  if (
    maintenanceStatus(input.forumState) === "bound-no-protocol" &&
    applicableLaw.basis === "denmark-protocol-not-applicable"
  ) {
    flags.push(
      "Forum DK : le Protocole de La Haye 2007 ne s'applique pas — appliquer les règles danoises de DIP.",
    );
  }
  if (jurisdiction.basis === "none") {
    flags.push(
      "Aucun chef de compétence du règlement ne fonde la saisine du for indiqué — examiner art. 7 (forum necessitatis) ou un autre EM.",
    );
  }
  if (input.creditor.isMinor && input.choiceOfCourt) {
    flags.push(
      "Art. 4(3) : élection de for invalide pour les obligations alimentaires concernant un enfant de moins de 18 ans.",
    );
  }

  return { input, temporalScope, jurisdiction, applicableLaw, flags };
}
