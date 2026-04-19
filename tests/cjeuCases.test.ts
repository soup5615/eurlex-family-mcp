import { describe, expect, it } from "vitest";
import { analyseSuccession } from "../src/engine/analyze.js";
import { findCase } from "../src/data/cjeuCases.js";
import type { SuccessionCase } from "../src/types.js";

// Ces tests valident la cohérence du moteur avec les solutions dégagées
// par la CJUE. Ils n'exécutent pas le raisonnement de chaque arrêt : ils
// vérifient que la qualification opérationnelle produite par le moteur
// sur des faits inspirés des affaires correspond au résultat de la Cour.

describe("Cohérence avec la jurisprudence CJUE", () => {
  it("Oberle (C-20/17) : résidence habituelle en FR, nationalité DE, biens en DE — seul le for FR est compétent au titre de l'art. 4", () => {
    const c = findCase("Oberle");
    expect(c).toBeDefined();

    // Faits (simplifiés) : défunt vivait en France, nationalité allemande,
    // laissait des biens en Allemagne. Question : un tribunal allemand
    // pouvait-il délivrer un certificat successoral national ? La CJUE a
    // jugé que l'art. 4 évince la compétence nationale.
    const input: SuccessionCase = {
      deceased: {
        nationalities: ["DE"],
        lastHabitualResidence: "FR",
        dateOfDeath: "2017-01-01",
      },
      assets: [{ kind: "immovable", locatedIn: "DE" }],
      forumState: "DE",
    };
    const a = analyseSuccession(input);
    expect(a.jurisdiction.competentForum).toBe("FR");
    expect(a.jurisdiction.basis).toBe("art-4-habitual-residence");
  });

  it("E.E. (C-80/19) : ressortissant lituanien résidant en DE, biens en LT → HR unique à déterminer ; si HR en DE, compétence DE (art. 4)", () => {
    const c = findCase("E.E.");
    expect(c).toBeDefined();

    // La Cour rappelle qu'il existe UNE seule résidence habituelle.
    // Hypothèse retenue par le juge : HR en Allemagne.
    const input: SuccessionCase = {
      deceased: {
        nationalities: ["LT"],
        lastHabitualResidence: "DE",
        dateOfDeath: "2018-01-01",
      },
      assets: [{ kind: "immovable", locatedIn: "LT" }],
      forumState: "LT",
    };
    const a = analyseSuccession(input);
    expect(a.jurisdiction.competentForum).toBe("DE");
    expect(a.jurisdiction.basis).toBe("art-4-habitual-residence");
  });

  it("V A et Z A (C-645/20) : HR hors UE, défunt de nationalité française, biens en France — art. 10(1)(a) à relever d'office", () => {
    const c = findCase("V A et Z A");
    expect(c).toBeDefined();

    const input: SuccessionCase = {
      deceased: {
        nationalities: ["FR"],
        lastHabitualResidence: "GB", // Royaume-Uni, État tiers
        dateOfDeath: "2020-06-01",
      },
      assets: [{ kind: "immovable", locatedIn: "FR" }],
      forumState: "FR",
    };
    const a = analyseSuccession(input);
    expect(a.jurisdiction.competentForum).toBe("FR");
    expect(a.jurisdiction.basis).toBe("art-10-1-subsidiary-nationality");
  });

  it("Kubicka (C-218/16) : ressortissante polonaise, HR et loi choisie = PL, immeuble en DE ; la loi successorale (PL) régit le legs par vindication", () => {
    const c = findCase("Kubicka");
    expect(c).toBeDefined();

    const input: SuccessionCase = {
      deceased: {
        nationalities: ["PL"],
        lastHabitualResidence: "PL",
        dateOfDeath: "2016-06-01",
      },
      professioJuris: { chosenLaw: "PL", form: "express" },
      dispositions: [
        {
          type: "will",
          dateExecuted: "2015-09-01",
          lawChosenForAdmissibilityAndValidity: "PL",
        },
      ],
      assets: [{ kind: "immovable", locatedIn: "DE" }],
    };
    const a = analyseSuccession(input);
    expect(a.applicableLaw.applicableLaw).toBe("PL");
    expect(a.applicableLaw.basis).toBe("art-22-professio-juris");
    expect(a.dispositions[0]?.lawGoverningAdmissibilityAndValidity).toBe("PL");
    expect(a.dispositions[0]?.basis).toBe("art-24-2-choice");
    // Le CSE est utile (biens dans DE + PL).
    expect(a.esc.recommended).toBe(true);
    expect(a.esc.issuingAuthorityState).toBe("PL");
  });
});
