import { describe, expect, it } from "vitest";
import { determineRome3ApplicableLaw } from "../src/divorce/engine.js";
import type { DivorceCase } from "../src/divorce/types.js";

describe("Rome III — chronologie du choix de loi (art. 5(2))", () => {
  it("signale un choix postérieur à la saisine", () => {
    const input: DivorceCase = {
      spouses: [
        { id: "A", nationalities: ["FR"], habitualResidence: "FR" },
        { id: "B", nationalities: ["FR"], habitualResidence: "FR" },
      ],
      proceeding: "divorce",
      forumState: "FR",
      dateCourtSeised: "2024-03-01",
      choiceOfLaw: {
        chosenLaw: "FR",
        dateOfChoice: "2024-04-15", // après la saisine
        inWritingDatedSigned: true,
      },
    };
    const d = determineRome3ApplicableLaw(input);
    expect(d.warnings.some((w) => w.includes("Art. 5(2)"))).toBe(true);
  });

  it("ne signale rien si le choix précède la saisine", () => {
    const input: DivorceCase = {
      spouses: [
        { id: "A", nationalities: ["FR"], habitualResidence: "FR" },
        { id: "B", nationalities: ["FR"], habitualResidence: "FR" },
      ],
      proceeding: "divorce",
      forumState: "FR",
      dateCourtSeised: "2024-03-01",
      choiceOfLaw: {
        chosenLaw: "FR",
        dateOfChoice: "2023-10-01",
        inWritingDatedSigned: true,
      },
    };
    const d = determineRome3ApplicableLaw(input);
    expect(d.warnings.some((w) => w.includes("Art. 5(2)"))).toBe(false);
  });
});
