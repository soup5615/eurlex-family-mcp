import type {
  Asset,
  Disposition,
  FormalValidityAnalysis,
  FormalValidityBasis,
  ReasoningStep,
  SuccessionCase,
} from "../types.js";

// Art. 27 — Formal validity of written dispositions of property upon
// death. A written disposition is valid in form if it conforms to the
// law of at least one of the following:
//   (a) the State in which the disposition was made or the pact concluded;
//   (b) a State whose nationality the testator (or at least one person
//       bound by a pact) possessed, at the time of making or at death;
//   (c) a State where they had their domicile, at those same times;
//   (d) a State where they had their habitual residence, at those same times;
//   (e) for immovable property, the State in which it is situated.
// Art. 27(3): rules restricting permitted forms by reference to age,
// nationality or other personal qualifications of the testator are
// deemed to pertain to form.

export function analyseFormalValidity(
  d: Disposition,
  input: SuccessionCase,
): FormalValidityAnalysis {
  const reasoning: ReasoningStep[] = [];
  const warnings: string[] = [];

  // Art. 27 applies to written dispositions only. If unspecified,
  // assume written (the usual case).
  const written = d.form?.written !== false;
  if (!written) {
    reasoning.push({
      article: "Art. 1(2)(f) Règl. (UE) 650/2012",
      rule: "La validité formelle des dispositions à cause de mort faites oralement est exclue du champ du règlement.",
      appliedTo: `Disposition déclarée non écrite (form.written = false).`,
      conclusion: "Art. 27 non applicable ; consulter le droit national.",
    });
    return {
      applicable: false,
      candidateLaws: [],
      reasoning,
      warnings,
    };
  }

  const candidates: FormalValidityBasis[] = [];
  const seen = new Set<string>();
  const add = (b: FormalValidityBasis) => {
    const key = `${b.law}|${b.connection}`;
    if (!seen.has(key)) {
      seen.add(key);
      candidates.push(b);
    }
  };

  const form = d.form;

  // (a) locus regit actum
  if (form?.placeOfMaking) {
    add({
      law: form.placeOfMaking.toUpperCase(),
      connection: "art-27-1-a-locus-regit-actum",
      explanation: `Lieu où la disposition a été établie (${form.placeOfMaking}).`,
    });
  } else {
    warnings.push(
      "Lieu d'établissement inconnu : la conformité à la loi du lieu (art. 27(1)(a)) ne peut être testée.",
    );
  }

  // (b) nationality at making
  for (const n of form?.nationalitiesAtMaking ?? []) {
    add({
      law: n.toUpperCase(),
      connection: "art-27-1-b-nationality-at-making",
      explanation: `Nationalité au moment de la disposition (${n}).`,
    });
  }
  // (b) nationality at death
  for (const n of input.deceased.nationalities) {
    add({
      law: n.toUpperCase(),
      connection: "art-27-1-b-nationality-at-death",
      explanation: `Nationalité au décès (${n}).`,
    });
  }

  // (c) domicile at making / death
  if (form?.domicileAtMaking) {
    add({
      law: form.domicileAtMaking.toUpperCase(),
      connection: "art-27-1-c-domicile-at-making",
      explanation: `Domicile au moment de la disposition (${form.domicileAtMaking}).`,
    });
  }
  // Reg. 650 does not use domicile as a general connecting factor; the
  // domicile at death is ordinarily identical to the HR. This engine
  // does not synthesise a "domicile at death" from HR but flags it.
  warnings.push(
    "Le règlement ne définit pas la notion de « domicile » (art. 27(1)(c), 27(2)) : elle est appréciée par chaque loi désignée.",
  );

  // (d) habitual residence at making / death
  if (form?.habitualResidenceAtMaking) {
    add({
      law: form.habitualResidenceAtMaking.toUpperCase(),
      connection: "art-27-1-d-habitual-residence-at-making",
      explanation: `Résidence habituelle au moment de la disposition (${form.habitualResidenceAtMaking}).`,
    });
  }
  add({
    law: input.deceased.lastHabitualResidence.toUpperCase(),
    connection: "art-27-1-d-habitual-residence-at-death",
    explanation: `Résidence habituelle au décès (${input.deceased.lastHabitualResidence}).`,
  });

  // (e) lex rei sitae for immovables
  const immovables = (input.assets ?? []).filter(
    (a: Asset) => a.kind === "immovable",
  );
  for (const a of immovables) {
    add({
      law: a.locatedIn.toUpperCase(),
      connection: "art-27-1-e-lex-rei-sitae-immovables",
      explanation: `Loi du lieu de situation de l'immeuble (${a.locatedIn}) — pour cet immeuble uniquement.`,
    });
  }

  reasoning.push({
    article: "Art. 27(1) Règl. (UE) 650/2012",
    rule: "Une disposition à cause de mort écrite est valable quant à la forme si elle est conforme à la loi de l'État (a) du lieu de la disposition, (b) d'une nationalité du disposant au moment de la disposition ou du décès, (c) du domicile à ces mêmes moments, (d) de la résidence habituelle à ces mêmes moments, ou (e) pour les immeubles, de l'État de situation.",
    appliedTo: `Disposition du ${d.dateExecuted}${form?.joint ? " (acte conjonctif)" : ""}.`,
    conclusion: `Lois potentiellement validant la forme : ${
      candidates.length > 0
        ? Array.from(new Set(candidates.map((c) => c.law))).join(", ")
        : "(aucune testable sur les faits fournis)"
    }. La disposition est formellement valable si au moins l'une de ces lois la valide.`,
  });

  if (form?.joint) {
    reasoning.push({
      article: "Art. 27(2) Règl. (UE) 650/2012",
      rule: "Le paragraphe 1 s'applique également aux dispositions modifiant ou révoquant une disposition antérieure ; en cas d'acte conjonctif, les rattachements du paragraphe 1 sont évalués pour chaque disposant.",
      appliedTo: "Acte conjonctif signalé ; les rattachements des autres disposants doivent également être fournis.",
      conclusion:
        "Prévoir de tester la validité selon les lois désignées par les rattachements de chaque disposant.",
    });
  }

  if (form?.holograph) {
    warnings.push(
      "Art. 27(3) : les exigences de forme liées à la qualité du disposant (capacité, âge, nationalité, forme olographe) sont rattachées à la forme — la loi qui autorise le testament olographe est présumée le valider à ce titre.",
    );
  }

  warnings.push(
    "Art. 75(1) : la Convention de La Haye du 5 octobre 1961 sur la loi applicable à la forme des dispositions testamentaires reste applicable dans les États membres qui y sont parties (notamment AT, BE, DE, EE, ES, FI, FR, GR, HR, IE, LU, NL, PL, SI). Elle retient des rattachements comparables à l'art. 27.",
  );

  return {
    applicable: true,
    candidateLaws: candidates,
    reasoning,
    warnings,
  };
}
