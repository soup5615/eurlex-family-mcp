import { describe, expect, it } from "vitest";
import { checkMatrimonialTemporalScope } from "../src/matrimonial/engine/scope.js";
import type { MatrimonialCase } from "../src/matrimonial/types.js";

const base: Omit<MatrimonialCase, "marriage"> = {
  spouses: [
    { id: "A", nationalities: ["FR"], habitualResidence: "FR" },
    { id: "B", nationalities: ["DE"], habitualResidence: "DE" },
  ],
  context: {},
};

describe("Champ temporel (art. 69)", () => {
  it("exclut les mariages antérieurs au 29 janvier 2019 (sans choix postérieur)", () => {
    const input: MatrimonialCase = {
      ...base,
      marriage: { dateOfMarriage: "2010-05-01" },
    };
    const r = checkMatrimonialTemporalScope(input);
    expect(r.applicable).toBe(false);
  });

  it("admet les mariages du 29 janvier 2019 ou postérieurs", () => {
    const input: MatrimonialCase = {
      ...base,
      marriage: { dateOfMarriage: "2019-01-29" },
    };
    const r = checkMatrimonialTemporalScope(input);
    expect(r.applicable).toBe(true);
  });

  it("admet un mariage antérieur suivi d'un choix de loi postérieur", () => {
    const input: MatrimonialCase = {
      ...base,
      marriage: { dateOfMarriage: "2010-05-01" },
      choiceOfLaw: {
        chosenLaw: "FR",
        form: "express-writing",
        dateOfChoice: "2020-06-15",
      },
    };
    const r = checkMatrimonialTemporalScope(input);
    expect(r.applicable).toBe(true);
  });
});
