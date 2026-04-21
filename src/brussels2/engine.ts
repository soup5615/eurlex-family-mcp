import type {
  BiiMatrimonialCase,
  BiiMatrimonialDetermination,
  BiiParentalDetermination,
  BiiParentalResponsibilityCase,
  BiiScope,
  BiiSpouse,
  ReasoningStep,
} from "./types.js";
import { isBiiBoundState } from "./memberStates.js";

const APPLICATION_START = "2022-08-01";

export function checkBiiTemporalScope(
  dateCourtSeised: string,
): BiiScope {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateCourtSeised)) {
    return { applicable: false, reason: "Date de saisine invalide." };
  }
  if (dateCourtSeised < APPLICATION_START) {
    return {
      applicable: false,
      reason: `Bruxelles II ter applicable à partir du 1er août 2022 ; saisine du ${dateCourtSeised} antérieure — Bruxelles II bis (Règl. 2201/2003) demeure applicable.`,
    };
  }
  return {
    applicable: true,
    reason: `Bruxelles II ter applicable ratione temporis (saisine du ${dateCourtSeised}).`,
  };
}

// Art. 3 — matrimonial jurisdiction cascade (non-hierarchical list of
// alternative bases). We test the spouses' facts against each head and
// return the first that the designated `forumState` satisfies. Callers
// interested in all competent fora can iterate by changing forumState.
export function determineBiiMatrimonialJurisdiction(
  input: BiiMatrimonialCase,
): BiiMatrimonialDetermination {
  const reasoning: ReasoningStep[] = [];
  const warnings: string[] = [];
  const forum = input.forumState.toUpperCase();

  if (!isBiiBoundState(forum)) {
    warnings.push(
      `Forum ${forum} : non lié par le règlement. Bruxelles II ter ne peut y fonder la compétence.`,
    );
    return {
      competentForum: null,
      basis: "none",
      reasoning,
      warnings,
    };
  }

  const [a, b] = input.spouses;
  const hrA = a.habitualResidence.toUpperCase();
  const hrB = b.habitualResidence.toUpperCase();

  // (a)(i) common HR
  if (hrA === hrB && hrA === forum) {
    reasoning.push({
      article: "Art. 3(1)(a)(i) Règl. (UE) 2019/1111",
      rule: "Résidence habituelle des deux époux.",
      appliedTo: `RH commune : ${forum}.`,
      conclusion: `Juridictions de ${forum} compétentes.`,
    });
    return {
      competentForum: forum,
      basis: "art-3-1-a-i-common-hr",
      reasoning,
      warnings,
    };
  }

  // (a)(ii) last common HR, one remains
  // We don't track last common HR explicitly in this input; callers
  // who need it should surface it through (v)/(vi) approximations.

  // (a)(iii) HR of respondent — the respondent is the spouse not the
  // applicant.
  const respondent: BiiSpouse | undefined =
    input.applicantId
      ? input.spouses.find((s) => s.id !== input.applicantId)
      : b;
  if (respondent && respondent.habitualResidence.toUpperCase() === forum) {
    reasoning.push({
      article: "Art. 3(1)(a)(iii) Règl. (UE) 2019/1111",
      rule: "Résidence habituelle du défendeur.",
      appliedTo: `Défendeur ${respondent.id} avec RH ${forum}.`,
      conclusion: `Juridictions de ${forum} compétentes.`,
    });
    return {
      competentForum: forum,
      basis: "art-3-1-a-iii-respondent-hr",
      reasoning,
      warnings,
    };
  }

  // (a)(iv) joint application — either spouse's HR.
  if (input.jointApplication && (hrA === forum || hrB === forum)) {
    reasoning.push({
      article: "Art. 3(1)(a)(iv) Règl. (UE) 2019/1111",
      rule: "Sur demande conjointe, RH de l'un des époux.",
      appliedTo: `Demande conjointe ; RH d'un époux : ${forum}.`,
      conclusion: `Juridictions de ${forum} compétentes.`,
    });
    return {
      competentForum: forum,
      basis: "art-3-1-a-iv-joint-application",
      reasoning,
      warnings,
    };
  }

  // (a)(v) applicant's HR ≥ 1 year.
  const applicant = input.applicantId
    ? input.spouses.find((s) => s.id === input.applicantId)
    : a;
  if (
    applicant &&
    applicant.habitualResidence.toUpperCase() === forum &&
    (applicant.monthsInHabitualResidence ?? 0) >= 12
  ) {
    reasoning.push({
      article: "Art. 3(1)(a)(v) Règl. (UE) 2019/1111",
      rule: "Résidence habituelle du demandeur depuis au moins un an au moment de la saisine.",
      appliedTo: `Demandeur ${applicant.id}, ${applicant.monthsInHabitualResidence} mois dans ${forum}.`,
      conclusion: `Juridictions de ${forum} compétentes.`,
    });
    return {
      competentForum: forum,
      basis: "art-3-1-a-v-applicant-hr-1-year",
      reasoning,
      warnings,
    };
  }

  // (a)(vi) applicant's HR ≥ 6 months + national.
  if (
    applicant &&
    applicant.habitualResidence.toUpperCase() === forum &&
    (applicant.monthsInHabitualResidence ?? 0) >= 6 &&
    applicant.nationalities.map((n) => n.toUpperCase()).includes(forum)
  ) {
    reasoning.push({
      article: "Art. 3(1)(a)(vi) Règl. (UE) 2019/1111",
      rule: "Résidence habituelle du demandeur depuis au moins six mois ET ressortissant de l'EM considéré (ou domicilié, pour IE).",
      appliedTo: `Demandeur ${applicant.id}, ${applicant.monthsInHabitualResidence} mois dans ${forum}, ressortissant de ${forum}.`,
      conclusion: `Juridictions de ${forum} compétentes.`,
    });
    return {
      competentForum: forum,
      basis: "art-3-1-a-vi-applicant-hr-6-months-national",
      reasoning,
      warnings,
    };
  }

  // (b) common nationality.
  const natsA = a.nationalities.map((n) => n.toUpperCase());
  const natsB = b.nationalities.map((n) => n.toUpperCase());
  const commonNat = natsA.find((n) => natsB.includes(n));
  if (commonNat && commonNat === forum) {
    reasoning.push({
      article: "Art. 3(1)(b) Règl. (UE) 2019/1111",
      rule: "Nationalité des deux époux (ou, pour IE, domicile commun).",
      appliedTo: `Nationalité commune : ${commonNat}.`,
      conclusion: `Juridictions de ${forum} compétentes.`,
    });
    return {
      competentForum: forum,
      basis: "art-3-1-b-common-nationality",
      reasoning,
      warnings,
    };
  }

  // Art. 6 residual — we don't attempt to implement each MS's
  // national rules, but flag the possibility.
  warnings.push(
    "Art. 6 : aucun chef de compétence du règlement ne fonde la saisine dans le for indiqué ; la compétence peut éventuellement être fondée sur le droit national du for (compétence résiduelle).",
  );

  return {
    competentForum: null,
    basis: "none",
    reasoning,
    warnings,
  };
}

// Art. 7-12 — parental responsibility jurisdiction.
export function determineBiiParentalJurisdiction(
  input: BiiParentalResponsibilityCase,
): BiiParentalDetermination {
  const reasoning: ReasoningStep[] = [];
  const warnings: string[] = [];
  const forum = input.forumState.toUpperCase();

  if (!isBiiBoundState(forum)) {
    return {
      competentForum: null,
      basis: "none",
      reasoning,
      warnings: [`Forum ${forum} non lié par le règlement.`],
    };
  }

  // Art. 9 — unlawful removal: the court of the former HR retains
  // jurisdiction until acquiescence or certain time conditions.
  if (input.unlawfulRemoval) {
    const from = input.unlawfulRemoval.fromState.toUpperCase();
    if (from === forum) {
      reasoning.push({
        article: "Art. 9 Règl. (UE) 2019/1111",
        rule: "En cas de déplacement ou de non-retour illicite, les juridictions de l'EM de la RH immédiatement antérieure au déplacement restent compétentes (sous conditions d'acquiescement / de passage du temps).",
        appliedTo: `Enlèvement de ${from} vers ${input.unlawfulRemoval.toState.toUpperCase()} le ${input.unlawfulRemoval.dateOfRemoval}.`,
        conclusion: `Juridictions de ${forum} compétentes (art. 9).`,
      });
      warnings.push(
        "Art. 9 : vérifier l'acquiescement des titulaires du droit de garde et l'absence de nouvelle résidence habituelle acquise par l'enfant depuis plus d'un an (conditions d'extinction).",
      );
      return {
        competentForum: forum,
        basis: "art-9-unlawful-removal-continuing",
        reasoning,
        warnings,
      };
    }
  }

  // Art. 10 — prorogation.
  if (input.prorogation) {
    const chosen = input.prorogation.chosenForum.toUpperCase();
    if (
      chosen === forum &&
      input.prorogation.allPartiesAccepted &&
      input.prorogation.substantialConnection
    ) {
      reasoning.push({
        article: "Art. 10 Règl. (UE) 2019/1111",
        rule: "Les juridictions d'un EM avec lequel l'enfant a un lien étroit sont compétentes si toutes les parties à la procédure ont librement accepté cette compétence au plus tard au moment de la saisine, et si cela répond à l'intérêt supérieur de l'enfant.",
        appliedTo: `For choisi : ${forum} ; acceptation de toutes les parties ; lien étroit avec ${forum}.`,
        conclusion: `Juridictions de ${forum} compétentes (prorogation).`,
      });
      return {
        competentForum: forum,
        basis: "art-10-prorogation",
        reasoning,
        warnings,
      };
    }
  }

  // Art. 8 — continuing jurisdiction after lawful move (3 months, for
  // visitation rights only).
  if (input.formerHabitualResidence && input.monthsSinceMoveFromFormer !== undefined) {
    const former = input.formerHabitualResidence.toUpperCase();
    if (former === forum && input.monthsSinceMoveFromFormer <= 3) {
      reasoning.push({
        article: "Art. 8 Règl. (UE) 2019/1111",
        rule: "En cas de déménagement légal de l'enfant dans un autre EM, les juridictions de l'ancienne RH demeurent compétentes, pendant trois mois après le déménagement, pour modifier une décision relative au droit de visite rendue dans cet État, si le titulaire y réside encore.",
        appliedTo: `Déménagement de ${former} il y a ${input.monthsSinceMoveFromFormer} mois.`,
        conclusion: `Juridictions de ${former} maintenues compétentes (droit de visite).`,
      });
      warnings.push(
        "Art. 8 : portée limitée à la modification d'une décision antérieure sur le droit de visite.",
      );
      return {
        competentForum: forum,
        basis: "art-8-continuing-jurisdiction-after-move",
        reasoning,
        warnings,
      };
    }
  }

  // Art. 7 — general rule: HR of the child at seisin.
  const childHr = input.child.habitualResidence.toUpperCase();
  if (childHr === forum) {
    reasoning.push({
      article: "Art. 7 Règl. (UE) 2019/1111",
      rule: "Compétence générale : juridictions de l'EM de la résidence habituelle de l'enfant au moment de la saisine.",
      appliedTo: `RH de l'enfant : ${childHr}.`,
      conclusion: `Juridictions de ${forum} compétentes.`,
    });
    return {
      competentForum: forum,
      basis: "art-7-general-hr-of-child",
      reasoning,
      warnings,
    };
  }

  // Art. 11 — presence (residual when HR cannot be established).
  warnings.push(
    "Art. 11 : compétence fondée sur la présence de l'enfant lorsque sa RH ne peut être établie — à examiner si pertinent.",
  );

  return {
    competentForum: null,
    basis: "none",
    reasoning,
    warnings,
  };
}

export function analyseBiiMatrimonial(input: BiiMatrimonialCase): {
  scope: BiiScope;
  jurisdiction: BiiMatrimonialDetermination;
  flags: string[];
} {
  const scope = checkBiiTemporalScope(input.dateCourtSeised);
  const flags: string[] = [];
  if (!scope.applicable) {
    return {
      scope,
      jurisdiction: {
        competentForum: null,
        basis: "regulation-not-applicable-ratione-temporis",
        reasoning: [],
        warnings: [scope.reason],
      },
      flags: ["Procédure antérieure au 1er août 2022 — appliquer Bruxelles II bis (Règl. 2201/2003)."],
    };
  }
  const jurisdiction = determineBiiMatrimonialJurisdiction(input);
  if (jurisdiction.basis === "none") {
    flags.push(
      "Le for testé n'est pas fondé sur l'art. 3 ; tester un autre EM ou envisager la compétence résiduelle (art. 6).",
    );
  }
  return { scope, jurisdiction, flags };
}

export function analyseBiiParental(input: BiiParentalResponsibilityCase): {
  scope: BiiScope;
  jurisdiction: BiiParentalDetermination;
  flags: string[];
} {
  const scope = checkBiiTemporalScope(input.dateCourtSeised);
  const flags: string[] = [];
  if (!scope.applicable) {
    return {
      scope,
      jurisdiction: {
        competentForum: null,
        basis: "regulation-not-applicable-ratione-temporis",
        reasoning: [],
        warnings: [scope.reason],
      },
      flags: ["Procédure antérieure au 1er août 2022."],
    };
  }
  const jurisdiction = determineBiiParentalJurisdiction(input);
  return { scope, jurisdiction, flags };
}
