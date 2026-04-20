import { describe, expect, it } from "vitest";
import { determineMatrimonialJurisdiction } from "../src/matrimonial/engine/jurisdiction.js";
import type { MatrimonialCase } from "../src/matrimonial/types.js";

describe("Compétence régimes matrimoniaux (art. 4-11)", () => {
  it("art. 4 : concentration avec la succession — EM lié (DE) compétent", () => {
    const input: MatrimonialCase = {
      spouses: [
        { id: "A", nationalities: ["FR"], habitualResidence: "DE" },
        { id: "B", nationalities: ["DE"], habitualResidence: "DE" },
      ],
      marriage: { dateOfMarriage: "2020-06-01" },
      context: {
        deathOfSpouse: {
          spouseId: "A",
          forumSeisedForSuccession: "DE",
        },
      },
    };
    const j = determineMatrimonialJurisdiction(input);
    expect(j.competentForum).toBe("DE");
    expect(j.basis).toBe("art-4-concentration-succession");
  });

  it("art. 5 : concentration avec le divorce — FR compétent", () => {
    const input: MatrimonialCase = {
      spouses: [
        { id: "A", nationalities: ["FR"], habitualResidence: "FR" },
        { id: "B", nationalities: ["BE"], habitualResidence: "FR" },
      ],
      marriage: { dateOfMarriage: "2020-06-01" },
      context: {
        matrimonialCause: {
          kind: "divorce",
          forumSeisedForDivorce: "FR",
        },
      },
    };
    const j = determineMatrimonialJurisdiction(input);
    expect(j.competentForum).toBe("FR");
    expect(j.basis).toBe("art-5-concentration-matrimonial-cause");
  });

  it("art. 6(1)(a) : résidence habituelle commune en Italie", () => {
    const input: MatrimonialCase = {
      spouses: [
        { id: "A", nationalities: ["FR"], habitualResidence: "IT" },
        { id: "B", nationalities: ["DE"], habitualResidence: "IT" },
      ],
      marriage: { dateOfMarriage: "2020-01-01" },
      context: {},
    };
    const j = determineMatrimonialJurisdiction(input);
    expect(j.competentForum).toBe("IT");
    expect(j.basis).toBe("art-6-1-a-common-hr");
  });

  it("art. 7 : accord d'élection de for vers l'État de la loi choisie", () => {
    const input: MatrimonialCase = {
      spouses: [
        { id: "A", nationalities: ["ES"], habitualResidence: "NL" },
        { id: "B", nationalities: ["FR"], habitualResidence: "NL" },
      ],
      marriage: { dateOfMarriage: "2020-01-01" },
      choiceOfLaw: {
        chosenLaw: "FR",
        form: "express-writing",
        dateOfChoice: "2021-05-01",
      },
      context: {
        choiceOfCourt: {
          mostRecentState: "FR",
          inWritingDatedSigned: true,
        },
      },
    };
    const j = determineMatrimonialJurisdiction(input);
    expect(j.competentForum).toBe("FR");
    expect(j.basis).toBe("art-7-choice-of-court");
  });

  it("art. 6(1)(d) : nationalité commune française à défaut d'autre rattachement", () => {
    const input: MatrimonialCase = {
      spouses: [
        { id: "A", nationalities: ["FR"], habitualResidence: "GB" },
        { id: "B", nationalities: ["FR"], habitualResidence: "CH" },
      ],
      marriage: { dateOfMarriage: "2020-01-01" },
      context: {},
    };
    const j = determineMatrimonialJurisdiction(input);
    expect(j.competentForum).toBe("FR");
    expect(j.basis).toBe("art-6-1-d-common-nationality");
  });

  it("art. 10 : subsidiaire immobilier — ES compétent pour l'immeuble en ES uniquement", () => {
    const input: MatrimonialCase = {
      spouses: [
        { id: "A", nationalities: ["US"], habitualResidence: "US" },
        { id: "B", nationalities: ["AU"], habitualResidence: "AU" },
      ],
      marriage: { dateOfMarriage: "2020-01-01" },
      context: { forumState: "ES" },
      jurisdictionAssets: [{ kind: "immovable", locatedIn: "ES" }],
    };
    const j = determineMatrimonialJurisdiction(input);
    expect(j.competentForum).toBe("ES");
    expect(j.basis).toBe("art-10-subsidiary-immovable");
    expect(j.scope).toBe("immovable-only");
  });
});
