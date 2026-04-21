import { describe, expect, it } from "vitest";
import {
  analyseBiiMatrimonial,
  analyseBiiParental,
} from "../src/brussels2/engine.js";
import type {
  BiiMatrimonialCase,
  BiiParentalResponsibilityCase,
} from "../src/brussels2/types.js";

describe("Bruxelles II ter — compétence matrimoniale (art. 3)", () => {
  it("art. 3(1)(a)(i) : résidence habituelle commune en FR", () => {
    const input: BiiMatrimonialCase = {
      spouses: [
        { id: "A", nationalities: ["FR"], habitualResidence: "FR" },
        { id: "B", nationalities: ["IT"], habitualResidence: "FR" },
      ],
      proceeding: "divorce",
      dateCourtSeised: "2024-03-01",
      forumState: "FR",
    };
    const a = analyseBiiMatrimonial(input);
    expect(a.jurisdiction.basis).toBe("art-3-1-a-i-common-hr");
    expect(a.jurisdiction.competentForum).toBe("FR");
  });

  it("art. 3(1)(a)(iii) : RH du défendeur", () => {
    const input: BiiMatrimonialCase = {
      spouses: [
        { id: "A", nationalities: ["FR"], habitualResidence: "IT" },
        { id: "B", nationalities: ["DE"], habitualResidence: "DE" },
      ],
      proceeding: "divorce",
      dateCourtSeised: "2024-03-01",
      forumState: "DE",
      applicantId: "A",
    };
    const a = analyseBiiMatrimonial(input);
    expect(a.jurisdiction.basis).toBe("art-3-1-a-iii-respondent-hr");
    expect(a.jurisdiction.competentForum).toBe("DE");
  });

  it("art. 3(1)(a)(v) : RH du demandeur depuis ≥ 1 an", () => {
    const input: BiiMatrimonialCase = {
      spouses: [
        { id: "A", nationalities: ["FR"], habitualResidence: "IT", monthsInHabitualResidence: 14 },
        { id: "B", nationalities: ["DE"], habitualResidence: "DE" },
      ],
      proceeding: "divorce",
      dateCourtSeised: "2024-03-01",
      forumState: "IT",
      applicantId: "A",
    };
    const a = analyseBiiMatrimonial(input);
    expect(a.jurisdiction.basis).toBe("art-3-1-a-v-applicant-hr-1-year");
    expect(a.jurisdiction.competentForum).toBe("IT");
  });

  it("art. 3(1)(a)(vi) : RH du demandeur ≥ 6 mois + ressortissant", () => {
    const input: BiiMatrimonialCase = {
      spouses: [
        { id: "A", nationalities: ["FR"], habitualResidence: "FR", monthsInHabitualResidence: 8 },
        { id: "B", nationalities: ["DE"], habitualResidence: "DE" },
      ],
      proceeding: "divorce",
      dateCourtSeised: "2024-03-01",
      forumState: "FR",
      applicantId: "A",
    };
    const a = analyseBiiMatrimonial(input);
    expect(a.jurisdiction.basis).toBe("art-3-1-a-vi-applicant-hr-6-months-national");
    expect(a.jurisdiction.competentForum).toBe("FR");
  });

  it("art. 3(1)(b) : nationalité commune des deux époux", () => {
    const input: BiiMatrimonialCase = {
      spouses: [
        { id: "A", nationalities: ["IT"], habitualResidence: "GB" },
        { id: "B", nationalities: ["IT"], habitualResidence: "US" },
      ],
      proceeding: "divorce",
      dateCourtSeised: "2024-03-01",
      forumState: "IT",
    };
    const a = analyseBiiMatrimonial(input);
    expect(a.jurisdiction.basis).toBe("art-3-1-b-common-nationality");
    expect(a.jurisdiction.competentForum).toBe("IT");
  });

  it("DK non lié → forum DK rejeté", () => {
    const input: BiiMatrimonialCase = {
      spouses: [
        { id: "A", nationalities: ["DK"], habitualResidence: "DK" },
        { id: "B", nationalities: ["DK"], habitualResidence: "DK" },
      ],
      proceeding: "divorce",
      dateCourtSeised: "2024-03-01",
      forumState: "DK",
    };
    const a = analyseBiiMatrimonial(input);
    expect(a.jurisdiction.basis).toBe("none");
  });

  it("saisine antérieure au 01/08/2022 → Bruxelles II bis applicable, IIter non", () => {
    const input: BiiMatrimonialCase = {
      spouses: [
        { id: "A", nationalities: ["FR"], habitualResidence: "FR" },
        { id: "B", nationalities: ["FR"], habitualResidence: "FR" },
      ],
      proceeding: "divorce",
      dateCourtSeised: "2022-06-30",
      forumState: "FR",
    };
    const a = analyseBiiMatrimonial(input);
    expect(a.scope.applicable).toBe(false);
    expect(a.jurisdiction.basis).toBe("regulation-not-applicable-ratione-temporis");
  });
});

describe("Bruxelles II ter — compétence responsabilité parentale (art. 7-10)", () => {
  it("art. 7 : RH de l'enfant", () => {
    const input: BiiParentalResponsibilityCase = {
      child: { id: "C", habitualResidence: "FR" },
      forumState: "FR",
      dateCourtSeised: "2024-03-01",
    };
    const a = analyseBiiParental(input);
    expect(a.jurisdiction.basis).toBe("art-7-general-hr-of-child");
    expect(a.jurisdiction.competentForum).toBe("FR");
  });

  it("art. 8 : maintien 3 mois après déménagement légal", () => {
    const input: BiiParentalResponsibilityCase = {
      child: { id: "C", habitualResidence: "DE" },
      formerHabitualResidence: "FR",
      monthsSinceMoveFromFormer: 2,
      forumState: "FR",
      dateCourtSeised: "2024-03-01",
    };
    const a = analyseBiiParental(input);
    expect(a.jurisdiction.basis).toBe("art-8-continuing-jurisdiction-after-move");
  });

  it("art. 9 : enlèvement illicite — compétence maintenue", () => {
    const input: BiiParentalResponsibilityCase = {
      child: { id: "C", habitualResidence: "GB" },
      unlawfulRemoval: {
        fromState: "FR",
        toState: "GB",
        dateOfRemoval: "2023-11-20",
      },
      forumState: "FR",
      dateCourtSeised: "2024-01-15",
    };
    const a = analyseBiiParental(input);
    expect(a.jurisdiction.basis).toBe("art-9-unlawful-removal-continuing");
  });

  it("art. 10 : prorogation volontaire avec acceptation et lien étroit", () => {
    const input: BiiParentalResponsibilityCase = {
      child: { id: "C", habitualResidence: "FR" },
      prorogation: {
        chosenForum: "IT",
        allPartiesAccepted: true,
        substantialConnection: true,
      },
      forumState: "IT",
      dateCourtSeised: "2024-03-01",
    };
    const a = analyseBiiParental(input);
    expect(a.jurisdiction.basis).toBe("art-10-prorogation");
  });
});
