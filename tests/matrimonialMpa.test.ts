import { describe, expect, it } from "vitest";
import {
  analyseChoiceOfLawFormalValidity,
  analyseMpaFormalValidity,
} from "../src/matrimonial/engine/mpa.js";
import type { MatrimonialCase } from "../src/matrimonial/types.js";

const baseCase: MatrimonialCase = {
  spouses: [
    { id: "A", nationalities: ["FR"], habitualResidence: "FR" },
    { id: "B", nationalities: ["DE"], habitualResidence: "FR" },
  ],
  marriage: { dateOfMarriage: "2020-05-10" },
  context: {},
};

describe("Validité formelle MPA (art. 25)", () => {
  it("baseline non satisfaite → baselineSatisfied = false", () => {
    const input: MatrimonialCase = {
      ...baseCase,
      mpa: {
        dateExecuted: "2021-06-01",
        kind: "separation-of-property",
        inWritingDatedSigned: false,
      },
    };
    const r = analyseMpaFormalValidity(input);
    expect(r?.baselineSatisfied).toBe(false);
  });

  it("HR commune en FR → FR listé comme loi dont les formalités s'ajoutent", () => {
    const input: MatrimonialCase = {
      ...baseCase,
      mpa: {
        dateExecuted: "2021-06-01",
        kind: "community-of-property",
        inWritingDatedSigned: true,
      },
    };
    const r = analyseMpaFormalValidity(input);
    expect(r?.candidateAdditionalLaws).toContain("FR");
  });

  it("HR distinctes en deux EM liés → formalités cumulatives/alternatives", () => {
    const input: MatrimonialCase = {
      spouses: [
        { id: "A", nationalities: ["FR"], habitualResidence: "FR" },
        { id: "B", nationalities: ["DE"], habitualResidence: "DE" },
      ],
      marriage: { dateOfMarriage: "2020-05-10" },
      context: {},
      mpa: {
        dateExecuted: "2021-06-01",
        kind: "separation-of-property",
        inWritingDatedSigned: true,
      },
    };
    const r = analyseMpaFormalValidity(input);
    expect(new Set(r?.candidateAdditionalLaws)).toEqual(
      new Set(["FR", "DE"]),
    );
  });
});

describe("Validité formelle du choix de loi (art. 23)", () => {
  it("baselineSatisfied = true + formalités additionnelles", () => {
    const input: MatrimonialCase = {
      ...baseCase,
      choiceOfLaw: {
        chosenLaw: "FR",
        form: "express-writing",
        dateOfChoice: "2021-06-01",
        inWritingDatedSigned: true,
      },
    };
    const r = analyseChoiceOfLawFormalValidity(input);
    expect(r?.baselineSatisfied).toBe(true);
    expect(r?.candidateAdditionalLaws).toContain("FR");
  });
});
