import { describe, expect, it } from "vitest";
import { determineMatrimonialApplicableLaw } from "../src/matrimonial/engine/applicableLaw.js";
import type { MatrimonialCase } from "../src/matrimonial/types.js";

describe("Loi applicable régime matrimonial (art. 22, 26, 32)", () => {
  it("art. 22 : choix de la loi française valide (nationalité d'un époux)", () => {
    const input: MatrimonialCase = {
      spouses: [
        { id: "A", nationalities: ["FR"], habitualResidence: "DE" },
        { id: "B", nationalities: ["DE"], habitualResidence: "DE" },
      ],
      marriage: { dateOfMarriage: "2020-01-01" },
      choiceOfLaw: {
        chosenLaw: "FR",
        form: "express-writing",
        dateOfChoice: "2021-06-01",
      },
      context: {},
    };
    const d = determineMatrimonialApplicableLaw(input);
    expect(d.applicableLaw).toBe("FR");
    expect(d.basis).toBe("art-22-choice");
    expect(d.renvoiExcluded).toBe(true);
  });

  it("art. 22 invalide : loi sans lien de rattachement → repli art. 26", () => {
    const input: MatrimonialCase = {
      spouses: [
        { id: "A", nationalities: ["IT"], habitualResidence: "IT" },
        { id: "B", nationalities: ["ES"], habitualResidence: "IT" },
      ],
      marriage: { dateOfMarriage: "2020-01-01" },
      choiceOfLaw: {
        chosenLaw: "FR", // ni HR ni nationalité
        form: "express-writing",
        dateOfChoice: "2021-06-01",
      },
      context: {},
    };
    const d = determineMatrimonialApplicableLaw(input);
    expect(d.basis).toBe("art-26-1-a-first-common-hr");
    expect(d.applicableLaw).toBe("IT");
  });

  it("art. 26(1)(a) : première RH commune = Italie", () => {
    const input: MatrimonialCase = {
      spouses: [
        { id: "A", nationalities: ["FR"], habitualResidence: "IT" },
        { id: "B", nationalities: ["ES"], habitualResidence: "IT" },
      ],
      marriage: { dateOfMarriage: "2020-01-01" },
      context: {},
    };
    const d = determineMatrimonialApplicableLaw(input);
    expect(d.applicableLaw).toBe("IT");
    expect(d.basis).toBe("art-26-1-a-first-common-hr");
  });

  it("art. 26(1)(b) : nationalité commune française si pas de RH commune", () => {
    const input: MatrimonialCase = {
      spouses: [
        { id: "A", nationalities: ["FR"], habitualResidence: "BE" },
        { id: "B", nationalities: ["FR"], habitualResidence: "PT" },
      ],
      marriage: { dateOfMarriage: "2020-01-01" },
      context: {},
    };
    const d = determineMatrimonialApplicableLaw(input);
    expect(d.applicableLaw).toBe("FR");
    expect(d.basis).toBe("art-26-1-b-common-nationality");
  });

  it("art. 26(1)(b) ne joue pas avec plusieurs nationalités communes → art. 26(1)(c)", () => {
    const input: MatrimonialCase = {
      spouses: [
        { id: "A", nationalities: ["FR", "DE"], habitualResidence: "BE" },
        { id: "B", nationalities: ["FR", "DE"], habitualResidence: "PT" },
      ],
      marriage: { dateOfMarriage: "2020-01-01" },
      context: {},
    };
    const d = determineMatrimonialApplicableLaw(input);
    expect(d.applicableLaw).toBeNull();
    expect(d.basis).toBe("art-26-1-c-closest-connection");
  });
});
