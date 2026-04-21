import { describe, expect, it } from "vitest";
import { analyseRome3, determineRome3ApplicableLaw } from "../src/divorce/engine.js";
import type { DivorceCase } from "../src/divorce/types.js";

describe("Rome III — loi applicable (art. 5, 8, 10)", () => {
  it("art. 8(a) : RH commune FR → loi française", () => {
    const input: DivorceCase = {
      spouses: [
        { id: "A", nationalities: ["FR"], habitualResidence: "FR" },
        { id: "B", nationalities: ["IT"], habitualResidence: "FR" },
      ],
      proceeding: "divorce",
      forumState: "FR",
      dateCourtSeised: "2024-03-01",
    };
    const d = determineRome3ApplicableLaw(input);
    expect(d.basis).toBe("art-8-a-hr-at-seisin");
    expect(d.applicableLaw).toBe("FR");
  });

  it("art. 8(b) : dernière RH commune < 1 an, un époux y réside encore", () => {
    const input: DivorceCase = {
      spouses: [
        { id: "A", nationalities: ["FR"], habitualResidence: "BE" },
        { id: "B", nationalities: ["FR"], habitualResidence: "FR" },
      ],
      proceeding: "divorce",
      forumState: "FR",
      dateCourtSeised: "2024-03-01",
      lastCommonHR: { country: "FR", yearsSinceLeft: 0.5 },
    };
    const d = determineRome3ApplicableLaw(input);
    expect(d.basis).toBe("art-8-b-last-common-hr");
    expect(d.applicableLaw).toBe("FR");
  });

  it("art. 8(c) : nationalité commune à défaut de RH commune", () => {
    const input: DivorceCase = {
      spouses: [
        { id: "A", nationalities: ["DE"], habitualResidence: "ES" },
        { id: "B", nationalities: ["DE"], habitualResidence: "IT" },
      ],
      proceeding: "divorce",
      forumState: "IT",
      dateCourtSeised: "2024-03-01",
    };
    const d = determineRome3ApplicableLaw(input);
    expect(d.basis).toBe("art-8-c-common-nationality");
    expect(d.applicableLaw).toBe("DE");
  });

  it("art. 8(d) : lex fori par défaut", () => {
    const input: DivorceCase = {
      spouses: [
        { id: "A", nationalities: ["FR"], habitualResidence: "ES" },
        { id: "B", nationalities: ["DE"], habitualResidence: "IT" },
      ],
      proceeding: "divorce",
      forumState: "IT",
      dateCourtSeised: "2024-03-01",
    };
    const d = determineRome3ApplicableLaw(input);
    expect(d.basis).toBe("art-8-d-lex-fori");
    expect(d.applicableLaw).toBe("IT");
  });

  it("art. 5 : choix de la loi allemande (nationalité)", () => {
    const input: DivorceCase = {
      spouses: [
        { id: "A", nationalities: ["FR", "DE"], habitualResidence: "IT" },
        { id: "B", nationalities: ["IT"], habitualResidence: "IT" },
      ],
      proceeding: "divorce",
      forumState: "IT",
      dateCourtSeised: "2024-03-01",
      choiceOfLaw: {
        chosenLaw: "DE",
        dateOfChoice: "2023-10-01",
        inWritingDatedSigned: true,
      },
    };
    const d = determineRome3ApplicableLaw(input);
    expect(d.basis).toBe("art-5-1-c-nationality-agreement");
    expect(d.applicableLaw).toBe("DE");
  });

  it("art. 10 : loi désignée ne permettant pas le divorce → loi du for", () => {
    const input: DivorceCase = {
      spouses: [
        { id: "A", nationalities: ["MA"], habitualResidence: "FR" },
        { id: "B", nationalities: ["MA"], habitualResidence: "FR" },
      ],
      proceeding: "divorce",
      forumState: "FR",
      dateCourtSeised: "2024-03-01",
      designatedLawDoesNotAllowDivorce: true,
    };
    const d = determineRome3ApplicableLaw(input);
    expect(d.basis).toBe("art-10-lex-fori-fallback");
    expect(d.applicableLaw).toBe("FR");
  });

  it("champ : forum en NL (non participant) → règlement non applicable ratione loci", () => {
    const input: DivorceCase = {
      spouses: [
        { id: "A", nationalities: ["FR"], habitualResidence: "NL" },
        { id: "B", nationalities: ["NL"], habitualResidence: "NL" },
      ],
      proceeding: "divorce",
      forumState: "NL",
      dateCourtSeised: "2024-03-01",
    };
    const a = analyseRome3(input);
    expect(a.temporalScope.applicable).toBe(false);
    expect(a.applicableLaw.basis).toBe("regulation-not-applicable-ratione-loci");
  });
});
