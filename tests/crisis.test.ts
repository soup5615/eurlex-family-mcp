import { describe, expect, it } from "vitest";
import { analyseCrisis } from "../src/brussels2/crisis.js";

describe("Analyse crise conjugale (compétence + Rome III + régime)", () => {
  it("divorce FR d'un couple FR-IT résidant en FR : FR compétent, loi FR pour le divorce et le régime", () => {
    const analysis = analyseCrisis({
      divorce: {
        spouses: [
          { id: "A", nationalities: ["FR"], habitualResidence: "FR" },
          { id: "B", nationalities: ["IT"], habitualResidence: "FR" },
        ],
        proceeding: "divorce",
        forumState: "FR",
        dateCourtSeised: "2024-03-01",
      },
      matrimonial: {
        spouses: [
          { id: "A", nationalities: ["FR"], habitualResidence: "FR" },
          { id: "B", nationalities: ["IT"], habitualResidence: "FR" },
        ],
        marriage: { dateOfMarriage: "2020-06-01" },
      },
    });
    expect(analysis.bii.jurisdiction.competentForum).toBe("FR");
    expect(analysis.bii.jurisdiction.basis).toBe("art-3-1-a-i-common-hr");
    expect(analysis.rome3.applicableLaw.applicableLaw).toBe("FR");
    expect(analysis.matrimonial.jurisdiction.basis).toBe(
      "art-5-concentration-matrimonial-cause",
    );
    expect(analysis.matrimonial.applicableLaw.applicableLaw).toBe("FR");
  });

  it("couple germano-italien résidant en IT avec enfant en FR : divorce IT, parental FR", () => {
    const analysis = analyseCrisis({
      divorce: {
        spouses: [
          { id: "A", nationalities: ["DE"], habitualResidence: "IT" },
          { id: "B", nationalities: ["IT"], habitualResidence: "IT" },
        ],
        proceeding: "divorce",
        forumState: "IT",
        dateCourtSeised: "2024-03-01",
      },
      matrimonial: {
        spouses: [
          { id: "A", nationalities: ["DE"], habitualResidence: "IT" },
          { id: "B", nationalities: ["IT"], habitualResidence: "IT" },
        ],
        marriage: { dateOfMarriage: "2020-06-01" },
      },
      parentalResponsibility: {
        child: { id: "C", habitualResidence: "FR" },
        forumState: "FR",
        dateCourtSeised: "2024-03-01",
      },
    });
    expect(analysis.bii.jurisdiction.competentForum).toBe("IT");
    expect(analysis.parental?.jurisdiction.competentForum).toBe("FR");
    expect(analysis.parental?.jurisdiction.basis).toBe(
      "art-7-general-hr-of-child",
    );
  });
});
