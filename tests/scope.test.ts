import { describe, expect, it } from "vitest";
import { analyseSuccession } from "../src/engine/analyze.js";
import type { SuccessionCase } from "../src/types.js";

describe("Champ d'application temporel (art. 83)", () => {
  it("exclut une succession ouverte avant le 17 août 2015", () => {
    const input: SuccessionCase = {
      deceased: {
        nationalities: ["FR"],
        lastHabitualResidence: "FR",
        dateOfDeath: "2015-08-16",
      },
    };
    const a = analyseSuccession(input);
    expect(a.temporalScope.applicable).toBe(false);
    expect(a.jurisdiction.basis).toBe(
      "regulation-not-applicable-ratione-temporis",
    );
    expect(a.applicableLaw.applicableLaw).toBeNull();
  });

  it("admet une succession ouverte le 17 août 2015", () => {
    const input: SuccessionCase = {
      deceased: {
        nationalities: ["FR"],
        lastHabitualResidence: "FR",
        dateOfDeath: "2015-08-17",
      },
    };
    const a = analyseSuccession(input);
    expect(a.temporalScope.applicable).toBe(true);
  });

  it("rejette une date mal formée", () => {
    const input: SuccessionCase = {
      deceased: {
        nationalities: ["FR"],
        lastHabitualResidence: "FR",
        dateOfDeath: "not-a-date",
      },
    };
    const a = analyseSuccession(input);
    expect(a.temporalScope.applicable).toBe(false);
  });
});
