import { describe, expect, it } from "vitest";
import { determineApplicableLaw } from "../src/engine/applicableLaw.js";
import type { SuccessionCase } from "../src/types.js";

describe("Loi applicable (art. 20-22, 34)", () => {
  it("art. 21(1) : HR en Espagne → loi espagnole", () => {
    const input: SuccessionCase = {
      deceased: {
        nationalities: ["FR"],
        lastHabitualResidence: "ES",
        dateOfDeath: "2022-03-15",
      },
    };
    const d = determineApplicableLaw(input);
    expect(d.applicableLaw).toBe("ES");
    expect(d.basis).toBe("art-21-1-habitual-residence");
    expect(d.universalApplication).toBe(true);
    expect(d.renvoiConsidered).toBe(false);
  });

  it("art. 20 + art. 34 : HR en Suisse → loi suisse désignée, renvoi à examiner", () => {
    const input: SuccessionCase = {
      deceased: {
        nationalities: ["FR"],
        lastHabitualResidence: "CH",
        dateOfDeath: "2022-03-15",
      },
    };
    const d = determineApplicableLaw(input);
    expect(d.applicableLaw).toBe("CH");
    expect(d.basis).toBe("art-21-1-habitual-residence");
    expect(d.universalApplication).toBe(true);
    expect(d.renvoiConsidered).toBe(true);
  });

  it("art. 22 : choix de la loi française par ressortissant français résidant en Allemagne", () => {
    const input: SuccessionCase = {
      deceased: {
        nationalities: ["FR"],
        lastHabitualResidence: "DE",
        dateOfDeath: "2023-01-01",
      },
      professioJuris: { chosenLaw: "FR", form: "express" },
    };
    const d = determineApplicableLaw(input);
    expect(d.applicableLaw).toBe("FR");
    expect(d.basis).toBe("art-22-professio-juris");
    expect(d.renvoiConsidered).toBe(false); // art. 34(2) exclut le renvoi.
  });

  it("art. 22 invalide : loi choisie ne correspond à aucune nationalité au décès → repli sur art. 21(1)", () => {
    const input: SuccessionCase = {
      deceased: {
        nationalities: ["IT"],
        lastHabitualResidence: "IT",
        dateOfDeath: "2023-01-01",
      },
      professioJuris: { chosenLaw: "FR", form: "express" },
    };
    const d = determineApplicableLaw(input);
    expect(d.applicableLaw).toBe("IT");
    expect(d.basis).toBe("art-21-1-habitual-residence");
    expect(
      d.warnings.some((w) => w.includes("choix de loi présumé invalide")),
    ).toBe(true);
  });

  it("art. 21(2) : liens manifestement plus étroits signalés avec un autre État", () => {
    const input: SuccessionCase = {
      deceased: {
        nationalities: ["FR"],
        lastHabitualResidence: "BE",
        dateOfDeath: "2023-01-01",
      },
      manifestlyCloserConnectionWith: "FR",
    };
    const d = determineApplicableLaw(input);
    expect(d.applicableLaw).toBe("FR");
    expect(d.basis).toBe("art-21-2-manifestly-closer-connection");
    expect(d.renvoiConsidered).toBe(false); // art. 34(2) exclut le renvoi.
  });
});
