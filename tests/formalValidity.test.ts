import { describe, expect, it } from "vitest";
import { analyseFormalValidity } from "../src/engine/formalValidity.js";
import type { Disposition, SuccessionCase } from "../src/types.js";

const baseCase: SuccessionCase = {
  deceased: {
    nationalities: ["FR", "IT"],
    lastHabitualResidence: "DE",
    dateOfDeath: "2023-06-01",
  },
  assets: [
    { kind: "immovable", locatedIn: "ES" },
    { kind: "movable", locatedIn: "DE" },
  ],
};

describe("Validité formelle (art. 27)", () => {
  it("liste les rattachements (lieu, nationalités, HR, lex rei sitae pour l'immeuble)", () => {
    const d: Disposition = {
      type: "will",
      dateExecuted: "2019-03-01",
      form: {
        written: true,
        placeOfMaking: "DE",
        nationalitiesAtMaking: ["FR"],
        habitualResidenceAtMaking: "FR",
      },
    };
    const fv = analyseFormalValidity(d, baseCase);
    expect(fv.applicable).toBe(true);
    const laws = new Set(fv.candidateLaws.map((c) => c.law));
    expect(laws.has("DE")).toBe(true); // lieu + HR au décès
    expect(laws.has("FR")).toBe(true); // nationalité + HR au moment
    expect(laws.has("IT")).toBe(true); // nationalité au décès
    expect(laws.has("ES")).toBe(true); // lex rei sitae (immeuble)
  });

  it("n'applique pas l'art. 27 aux dispositions orales", () => {
    const d: Disposition = {
      type: "will",
      dateExecuted: "2019-03-01",
      form: { written: false },
    };
    const fv = analyseFormalValidity(d, baseCase);
    expect(fv.applicable).toBe(false);
    expect(fv.candidateLaws).toHaveLength(0);
  });

  it("retient la lex rei sitae pour chaque immeuble", () => {
    const input: SuccessionCase = {
      ...baseCase,
      assets: [
        { kind: "immovable", locatedIn: "ES" },
        { kind: "immovable", locatedIn: "PT" },
      ],
    };
    const fv = analyseFormalValidity(
      { type: "will", dateExecuted: "2020-01-01", form: { written: true } },
      input,
    );
    const laws = new Set(fv.candidateLaws.map((c) => c.law));
    expect(laws.has("ES")).toBe(true);
    expect(laws.has("PT")).toBe(true);
  });
});
