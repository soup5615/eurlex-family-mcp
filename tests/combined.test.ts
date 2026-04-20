import { describe, expect, it } from "vitest";
import { analyseCombined } from "../src/matrimonial/combined.js";

describe("Analyse combinée succession + régime matrimonial", () => {
  it("Mahnkopf-like : défunt DE vivant en FR, épouse DE, mariage 2020, FR concentrant", () => {
    const analysis = analyseCombined({
      succession: {
        deceased: {
          nationalities: ["DE"],
          lastHabitualResidence: "FR",
          dateOfDeath: "2023-03-10",
        },
        assets: [
          { kind: "immovable", locatedIn: "DE" },
          { kind: "movable", locatedIn: "FR" },
        ],
      },
      marriage: { dateOfMarriage: "2020-09-12", placeOfMarriage: "DE" },
      survivingSpouse: {
        id: "veuve",
        nationalities: ["DE"],
        habitualResidence: "FR",
      },
    });
    // Succession : FR compétent (art. 4 R650/2012), loi FR.
    expect(analysis.succession.jurisdiction.competentForum).toBe("FR");
    expect(analysis.succession.applicableLaw.applicableLaw).toBe("FR");
    // Matrimonial : art. 4 R2016/1103 concentre devant FR.
    expect(analysis.matrimonial.jurisdiction.competentForum).toBe("FR");
    expect(analysis.matrimonial.jurisdiction.basis).toBe(
      "art-4-concentration-succession",
    );
    // Orchestration : concentration retenue.
    expect(analysis.orchestration.concentrationApplies).toBe(true);
    expect(analysis.orchestration.competentForum).toBe("FR");
  });

  it("mariage antérieur à 2019-01-29 sans choix : flag règles applicable inapplicables", () => {
    const analysis = analyseCombined({
      succession: {
        deceased: {
          nationalities: ["FR"],
          lastHabitualResidence: "FR",
          dateOfDeath: "2023-01-01",
        },
      },
      marriage: { dateOfMarriage: "2010-05-01" },
      survivingSpouse: {
        id: "B",
        nationalities: ["FR"],
        habitualResidence: "FR",
      },
    });
    expect(analysis.matrimonial.temporalScope.applicable).toBe(false);
    expect(
      analysis.orchestration.notes.some((n) =>
        n.includes("Convention de La Haye 1978"),
      ),
    ).toBe(true);
  });
});
