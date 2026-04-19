import { describe, expect, it } from "vitest";
import {
  analyseDispositions,
  habitualResidenceAt,
} from "../src/engine/dispositions.js";
import type { SuccessionCase } from "../src/types.js";

describe("habitualResidenceAt — approximation via residence history", () => {
  it("renvoie la HR au décès en l'absence d'historique", () => {
    const input: SuccessionCase = {
      deceased: {
        nationalities: ["FR"],
        lastHabitualResidence: "DE",
        dateOfDeath: "2023-06-01",
      },
    };
    const r = habitualResidenceAt("2019-01-01", input);
    expect(r.country).toBe("DE");
  });

  it("remonte dans l'historique quand la date est ancienne", () => {
    const input: SuccessionCase = {
      deceased: {
        nationalities: ["FR"],
        lastHabitualResidence: "DE",
        residenceHistory: [
          { country: "FR", years: 3 },
          { country: "IT", years: 10 },
        ],
        dateOfDeath: "2023-06-01",
      },
    };
    // 2 ans avant le décès → DE (HR courante).
    expect(habitualResidenceAt("2021-06-01", input).country).toBe("DE");
    // 3.5 ans avant → FR (dans la fenêtre FR).
    expect(habitualResidenceAt("2019-12-01", input).country).toBe("FR");
    // 15 ans avant → IT.
    expect(habitualResidenceAt("2008-01-01", input).country).toBe("IT");
  });
});

describe("Analyse des dispositions — art. 24(1) avec historique", () => {
  it("applique la HR historique (FR) à une disposition ancienne, plutôt que la HR actuelle (DE)", () => {
    // Le défunt a quitté la France il y a 4 ans pour s'installer en DE.
    // La disposition a été établie ~6 ans avant le décès, donc pendant
    // la période française.
    const input: SuccessionCase = {
      deceased: {
        nationalities: ["FR"],
        lastHabitualResidence: "DE",
        residenceHistory: [{ country: "FR", years: 4 }],
        dateOfDeath: "2023-06-01",
      },
      dispositions: [{ type: "will", dateExecuted: "2017-01-01" }],
    };
    const [d] = analyseDispositions(input);
    expect(d?.basis).toBe("art-24-1-hypothetical-succession-law");
    expect(d?.lawGoverningAdmissibilityAndValidity).toBe("FR");
  });
});
