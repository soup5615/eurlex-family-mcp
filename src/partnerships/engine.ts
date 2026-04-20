import {
  isPartnershipBoundState,
  normaliseCountry,
  partnershipRegulationStatus,
} from "./memberStates.js";
import type {
  PartnershipAgreementFormalValidity,
  PartnershipAnalysis,
  PartnershipApplicableLawDetermination,
  PartnershipCase,
  PartnershipJurisdictionDetermination,
  PartnershipMaterialScope,
  PartnershipTemporalScope,
  ReasoningStep,
} from "./types.js";

const APPLICATION_START = "2019-01-29";

export function checkPartnershipTemporalScope(
  input: PartnershipCase,
): PartnershipTemporalScope {
  const d = input.partnership.dateOfRegistration;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    return {
      applicable: false,
      reason: `Date d'enregistrement invalide : "${d}".`,
    };
  }
  const registeredAfter = d >= APPLICATION_START;
  const choiceAfter = input.choiceOfLaw
    ? input.choiceOfLaw.dateOfChoice >= APPLICATION_START
    : false;
  if (registeredAfter || choiceAfter) {
    return {
      applicable: true,
      reason: registeredAfter
        ? `Art. 69(3) : partenariat enregistré le ${d} (≥ 29 janv. 2019).`
        : `Art. 69(3) : choix de loi postérieur au 29 janv. 2019 (${input.choiceOfLaw?.dateOfChoice}).`,
    };
  }
  return {
    applicable: false,
    reason: `Art. 69(3) : partenariat antérieur au 29 janvier 2019 sans choix postérieur — règles sur la loi applicable inapplicables ; appliquer le DIP national.`,
  };
}

const COMMON_EXCLUSIONS = [
  "capacité juridique des partenaires (art. 1(2)(a))",
  "existence, validité ou reconnaissance du partenariat (art. 1(2)(b))",
  "obligations alimentaires (art. 1(2)(c))",
  "succession à cause de mort d'un partenaire (art. 1(2)(d))",
  "sécurité sociale (art. 1(2)(e))",
  "pensions/retraites non converties (art. 1(2)(f))",
  "nature des droits réels (art. 1(2)(g))",
  "inscriptions dans un registre (art. 1(2)(h))",
];

export function checkPartnershipMaterialScope(
  _input: PartnershipCase,
): PartnershipMaterialScope {
  return {
    applicable: true,
    reason:
      "Art. 1(1) : effets patrimoniaux du partenariat enregistré. Délimitation avec les autres règlements à vérifier au cas par cas.",
    excluded: COMMON_EXCLUSIONS,
  };
}

export function determinePartnershipJurisdiction(
  input: PartnershipCase,
): PartnershipJurisdictionDetermination {
  const reasoning: ReasoningStep[] = [];
  const warnings: string[] = [];

  if (input.context.deathOfPartner?.forumSeisedForSuccession) {
    const forum = normaliseCountry(
      input.context.deathOfPartner.forumSeisedForSuccession,
    );
    if (isPartnershipBoundState(forum)) {
      reasoning.push({
        article: "Art. 4 Règl. (UE) 2016/1104",
        rule: "La juridiction saisie de la succession d'un partenaire, en vertu du règl. 650/2012, est également compétente pour les effets patrimoniaux du partenariat liés à cette succession.",
        appliedTo: `Juridiction successorale : ${forum}.`,
        conclusion: `Juridictions de ${forum} compétentes pour les aspects patrimoniaux.`,
      });
      return {
        competentForum: forum,
        basis: "art-4-concentration-succession",
        scope: "regime-concentrated-with-other-proceedings",
        reasoning,
        warnings,
      };
    }
  }

  if (input.context.dissolution?.forumSeisedForDissolution) {
    const forum = normaliseCountry(
      input.context.dissolution.forumSeisedForDissolution,
    );
    if (isPartnershipBoundState(forum)) {
      reasoning.push({
        article: "Art. 5 Règl. (UE) 2016/1104",
        rule: "La juridiction compétente pour la dissolution ou l'annulation du partenariat est également compétente pour les effets patrimoniaux, sous réserve de l'accord des partenaires.",
        appliedTo: `Juridiction de dissolution : ${forum}.`,
        conclusion: `Juridictions de ${forum} compétentes.`,
      });
      warnings.push(
        "Art. 5 : la compétence du juge de la dissolution sur le volet patrimonial est subordonnée à l'accord des partenaires.",
      );
      return {
        competentForum: forum,
        basis: "art-5-concentration-dissolution",
        scope: "regime-concentrated-with-other-proceedings",
        reasoning,
        warnings,
      };
    }
  }

  if (input.context.choiceOfCourt) {
    const coc = input.context.choiceOfCourt;
    const t = normaliseCountry(coc.mostRecentState);
    if (isPartnershipBoundState(t) && coc.inWritingDatedSigned) {
      reasoning.push({
        article: "Art. 7 Règl. (UE) 2016/1104",
        rule: "Les partenaires peuvent convenir que les juridictions de l'État de la loi applicable (art. 22 ou 26) sont seules compétentes. L'accord doit être écrit, daté, signé.",
        appliedTo: `Accord vers ${t}.`,
        conclusion: `Juridictions de ${t} seules compétentes.`,
      });
      return {
        competentForum: t,
        basis: "art-7-choice-of-court",
        scope: "entire-regime",
        reasoning,
        warnings,
      };
    }
  }

  const [a, b] = input.partners;
  const hrA = normaliseCountry(a.habitualResidence);
  const hrB = normaliseCountry(b.habitualResidence);

  if (hrA === hrB && isPartnershipBoundState(hrA)) {
    reasoning.push({
      article: "Art. 6(1)(a) Règl. (UE) 2016/1104",
      rule: "Juridictions de l'État de la résidence habituelle commune à la saisine.",
      appliedTo: `RH commune : ${hrA}.`,
      conclusion: `Juridictions de ${hrA} compétentes.`,
    });
    return {
      competentForum: hrA,
      basis: "art-6-1-a-common-hr",
      scope: "entire-regime",
      reasoning,
      warnings,
    };
  }

  const forum = input.context.forumState
    ? normaliseCountry(input.context.forumState)
    : undefined;
  if (forum && (forum === hrA || forum === hrB) && isPartnershipBoundState(forum)) {
    reasoning.push({
      article: "Art. 6(1)(c) Règl. (UE) 2016/1104",
      rule: "À défaut de RH commune ou de dernière RH commune avec un résident, juridictions de l'État de la résidence habituelle du défendeur.",
      appliedTo: `Défendeur résidant dans ${forum}.`,
      conclusion: `Juridictions de ${forum} compétentes.`,
    });
    return {
      competentForum: forum,
      basis: "art-6-1-c-hr-respondent",
      scope: "entire-regime",
      reasoning,
      warnings,
    };
  }

  const natsA = a.nationalities.map(normaliseCountry);
  const natsB = b.nationalities.map(normaliseCountry);
  const common = natsA.find((n) => natsB.includes(n));
  if (common && isPartnershipBoundState(common)) {
    reasoning.push({
      article: "Art. 6(1)(d) Règl. (UE) 2016/1104",
      rule: "À défaut, juridictions de l'État de la nationalité commune à la saisine.",
      appliedTo: `Nationalité commune : ${common}.`,
      conclusion: `Juridictions de ${common} compétentes.`,
    });
    return {
      competentForum: common,
      basis: "art-6-1-d-common-nationality",
      scope: "entire-regime",
      reasoning,
      warnings,
    };
  }

  // Distinctive chef (e): State under whose law the partnership was
  // created.
  const soc = normaliseCountry(input.partnership.stateOfCreation);
  if (isPartnershipBoundState(soc)) {
    reasoning.push({
      article: "Art. 6(1)(e) Règl. (UE) 2016/1104",
      rule: "À défaut de tout autre chef, juridictions de l'État sous la loi duquel le partenariat a été créé.",
      appliedTo: `État de création : ${soc}.`,
      conclusion: `Juridictions de ${soc} compétentes.`,
    });
    return {
      competentForum: soc,
      basis: "art-6-1-e-state-of-creation",
      scope: "entire-regime",
      reasoning,
      warnings,
    };
  }

  // Art. 10 immovable subsidiary.
  const forumHasImmov = forum
    ? (input.jurisdictionAssets ?? []).some(
        (x) => x.kind === "immovable" && normaliseCountry(x.locatedIn) === forum,
      )
    : false;
  if (forum && forumHasImmov && isPartnershipBoundState(forum)) {
    reasoning.push({
      article: "Art. 10 Règl. (UE) 2016/1104",
      rule: "Compétence subsidiaire limitée aux biens immobiliers situés sur le territoire du for.",
      appliedTo: `Immeuble dans ${forum}.`,
      conclusion: `Juridictions de ${forum} compétentes pour cet immeuble uniquement.`,
    });
    warnings.push(
      "Art. 10 : portée limitée aux biens immobiliers situés dans l'État du for.",
    );
    return {
      competentForum: forum,
      basis: "art-10-subsidiary-immovable",
      scope: "immovable-only",
      reasoning,
      warnings,
    };
  }

  warnings.push(
    "Art. 9 : un État membre dont le droit ne connaît pas l'institution du partenariat peut décliner sa compétence ; envisager ensuite l'État de création (art. 9 §2).",
  );

  if (partnershipRegulationStatus(hrA) !== "bound" && partnershipRegulationStatus(hrB) !== "bound") {
    warnings.push(
      "Aucun partenaire n'a sa résidence habituelle dans un EM lié au règl. 2016/1104 — examiner le DIP national.",
    );
  }

  return {
    competentForum: null,
    basis: "none",
    scope: "none",
    reasoning,
    warnings,
  };
}

export function determinePartnershipApplicableLaw(
  input: PartnershipCase,
): PartnershipApplicableLawDetermination {
  const reasoning: ReasoningStep[] = [];
  const warnings: string[] = [];

  if (input.choiceOfLaw) {
    const chosen = normaliseCountry(input.choiceOfLaw.chosenLaw);
    const validity = validateChoice(input, chosen);
    if (validity.valid) {
      reasoning.push({
        article: "Art. 22 Règl. (UE) 2016/1104",
        rule: "Les partenaires peuvent choisir comme loi applicable : (a) la loi de la RH de l'un/des deux au moment du choix ; (b) la loi de la nationalité de l'un d'eux au moment du choix ; (c) la loi de l'État sous la loi duquel le partenariat a été créé. La loi choisie doit attacher des effets patrimoniaux à l'institution.",
        appliedTo: `Loi choisie : ${chosen} (${validity.branch}).`,
        conclusion: `Loi applicable : droit de ${chosen}.`,
      });
      warnings.push(
        "Art. 22 : la loi choisie doit attacher des effets patrimoniaux à l'institution du partenariat, sous peine d'impossibilité d'application.",
      );
      return {
        applicableLaw: chosen,
        basis: "art-22-choice",
        universalApplication: true,
        renvoiExcluded: true,
        reasoning,
        warnings,
      };
    }
    warnings.push(
      `Art. 22 : choix de loi présumé invalide (${validity.reason}) ; repli sur l'art. 26.`,
    );
  }

  // Art. 26(2) exception, if applicable (only valid against art. 26(1)
  // default and subject to art. 26(3) MPA-before-HR block — we don't
  // have a "first common HR" here, but the reliance rationale still
  // applies; we block if an agreement was concluded before the choice
  // is made.
  if (input.closerConnectionException) {
    const ex = input.closerConnectionException;
    if (ex.bothPartnersRelied) {
      reasoning.push({
        article: "Art. 26(2) Règl. (UE) 2016/1104",
        rule: "À titre exceptionnel, à la demande d'un partenaire, la juridiction peut décider d'appliquer la loi d'un État autre que celui sous la loi duquel le partenariat a été créé, avec lequel les partenaires présentent conjointement des liens manifestement plus étroits, sous réserve d'une confiance établie sur cette loi pour organiser leurs rapports patrimoniaux.",
        appliedTo: `Demande de ${ex.requestedByPartnerId ?? "(non précisé)"} ; liens plus étroits avec ${normaliseCountry(ex.otherState)}.`,
        conclusion: `Loi applicable : droit de ${normaliseCountry(ex.otherState)} (exception retenue).`,
      });
      warnings.push(
        "Art. 26(3) : l'exception est écartée si une convention patrimoniale a été conclue avant la date retenue pour le rattachement — à vérifier.",
      );
      return {
        applicableLaw: normaliseCountry(ex.otherState),
        basis: "art-26-2-closer-connection-exception",
        universalApplication: true,
        renvoiExcluded: true,
        reasoning,
        warnings,
      };
    }
    warnings.push(
      "Art. 26(2) : absence de confiance légitime démontrée — exception non retenue.",
    );
  }

  // Art. 26(1) default: law of the State of creation.
  const soc = normaliseCountry(input.partnership.stateOfCreation);
  reasoning.push({
    article: "Art. 26(1) Règl. (UE) 2016/1104",
    rule: "À défaut de choix, la loi applicable aux effets patrimoniaux du partenariat est celle de l'État sous la loi duquel le partenariat a été créé.",
    appliedTo: `État sous la loi duquel le partenariat a été créé : ${soc}.`,
    conclusion: `Loi applicable : droit de ${soc} (art. 32 : exclusion du renvoi).`,
  });
  return {
    applicableLaw: soc,
    basis: "art-26-1-state-of-creation",
    universalApplication: true,
    renvoiExcluded: true,
    reasoning,
    warnings,
  };
}

interface ChoiceValidity {
  valid: boolean;
  reason: string;
  branch?:
    | "art-22-1-a-hr"
    | "art-22-1-b-nationality"
    | "art-22-1-c-state-of-creation";
}

function validateChoice(input: PartnershipCase, chosen: string): ChoiceValidity {
  const [a, b] = input.partners;
  const hrs = new Set([
    normaliseCountry(a.habitualResidence),
    normaliseCountry(b.habitualResidence),
  ]);
  if (hrs.has(chosen)) {
    return { valid: true, reason: "RH d'un partenaire", branch: "art-22-1-a-hr" };
  }
  const nats = new Set([
    ...a.nationalities.map(normaliseCountry),
    ...b.nationalities.map(normaliseCountry),
  ]);
  if (nats.has(chosen)) {
    return {
      valid: true,
      reason: "nationalité d'un partenaire",
      branch: "art-22-1-b-nationality",
    };
  }
  if (normaliseCountry(input.partnership.stateOfCreation) === chosen) {
    return {
      valid: true,
      reason: "État de création du partenariat",
      branch: "art-22-1-c-state-of-creation",
    };
  }
  return {
    valid: false,
    reason: `${chosen} sans rattachement admissible (ni RH, ni nationalité, ni État de création).`,
  };
}

export function analysePartnershipAgreementFormalValidity(
  input: PartnershipCase,
): PartnershipAgreementFormalValidity | undefined {
  if (!input.agreement) return undefined;
  const reasoning: ReasoningStep[] = [];
  const warnings: string[] = [];
  const baseline = input.agreement.inWritingDatedSigned ?? null;
  reasoning.push({
    article: "Art. 25(1) Règl. (UE) 2016/1104",
    rule: "La convention patrimoniale est écrite, datée, signée par les deux partenaires. Mode électronique durable assimilé à l'écrit.",
    appliedTo: `Convention du ${input.agreement.dateExecuted}.`,
    conclusion:
      baseline === true
        ? "Condition de base satisfaite."
        : baseline === false
          ? "Condition de base non satisfaite."
          : "À vérifier.",
  });
  const candidate = new Set<string>();
  const [a, b] = input.partners;
  const hrA = normaliseCountry(a.habitualResidence);
  const hrB = normaliseCountry(b.habitualResidence);
  if (isPartnershipBoundState(hrA)) candidate.add(hrA);
  if (isPartnershipBoundState(hrB)) candidate.add(hrB);
  reasoning.push({
    article: "Art. 25(2) Règl. (UE) 2016/1104",
    rule: "Formalités supplémentaires du droit de l'État membre de la RH commune (ou, à défaut, de l'une des RH) au moment de la conclusion applicables.",
    appliedTo: `RH à la conclusion : ${hrA} / ${hrB}.`,
    conclusion: `Formalités à tester : ${[...candidate].join(", ") || "(aucune EM liée)"}.`,
  });
  return {
    baselineSatisfied: baseline,
    candidateAdditionalLaws: [...candidate],
    reasoning,
    warnings,
  };
}

export function analysePartnership(input: PartnershipCase): PartnershipAnalysis {
  const temporalScope = checkPartnershipTemporalScope(input);
  const materialScope = checkPartnershipMaterialScope(input);
  const flags: string[] = [];
  const jurisdiction = determinePartnershipJurisdiction(input);

  if (!temporalScope.applicable) {
    flags.push(
      "Règles de loi applicable non applicables ratione temporis (art. 69(3)) — appliquer le DIP national.",
    );
    return {
      input,
      temporalScope,
      materialScope,
      jurisdiction,
      applicableLaw: {
        applicableLaw: null,
        basis: "regulation-not-applicable-ratione-temporis",
        universalApplication: false,
        renvoiExcluded: false,
        reasoning: [],
        warnings: [temporalScope.reason],
      },
      flags,
    };
  }

  const applicableLaw = determinePartnershipApplicableLaw(input);
  const agreement = analysePartnershipAgreementFormalValidity(input);

  if (jurisdiction.basis === "art-10-subsidiary-immovable") {
    flags.push(
      "Compétence cantonnée aux biens immobiliers situés dans l'État du for (art. 10).",
    );
  }
  if (
    applicableLaw.basis === "art-22-choice" &&
    jurisdiction.competentForum !== applicableLaw.applicableLaw &&
    jurisdiction.basis !== "art-7-choice-of-court"
  ) {
    flags.push(
      "Dissociation for / loi applicable : envisager un accord d'élection de for (art. 7).",
    );
  }

  const out: PartnershipAnalysis = {
    input,
    temporalScope,
    materialScope,
    jurisdiction,
    applicableLaw,
    flags,
  };
  if (agreement) out.agreement = agreement;
  return out;
}
