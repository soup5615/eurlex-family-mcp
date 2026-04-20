import { describe, expect, it } from "vitest";
import { determineMatrimonialApplicableLaw } from "../src/matrimonial/engine/applicableLaw.js";
import type { MatrimonialCase } from "../src/matrimonial/types.js";

describe("Art. 26(2) — exception liens manifestement plus étroits", () => {
  it("retient l'exception lorsque durée significativement plus longue + confiance", () => {
    const input: MatrimonialCase = {
      spouses: [
        {
          id: "A",
          nationalities: ["FR"],
          habitualResidence: "IT",
          residenceHistory: [{ country: "FR", years: 1 }],
        },
        {
          id: "B",
          nationalities: ["FR"],
          habitualResidence: "IT",
          residenceHistory: [{ country: "FR", years: 1 }],
        },
      ],
      marriage: { dateOfMarriage: "2019-06-01" },
      context: {},
      // Première RH commune = FR (avant IT) selon l'heuristique.
      closerConnectionException: {
        requestedBySpouseId: "A",
        lastCommonHR: "IT",
        yearsInFirstCommonHR: 1,
        yearsInLastCommonHR: 15,
        bothSpousesRelied: true,
      },
    };
    const d = determineMatrimonialApplicableLaw(input);
    expect(d.basis).toBe("art-26-2-exception-last-common-hr");
    expect(d.applicableLaw).toBe("IT");
  });

  it("refuse l'exception si la durée n'est pas significativement plus longue", () => {
    const input: MatrimonialCase = {
      spouses: [
        {
          id: "A",
          nationalities: ["FR"],
          habitualResidence: "IT",
          residenceHistory: [{ country: "FR", years: 1 }],
        },
        {
          id: "B",
          nationalities: ["FR"],
          habitualResidence: "IT",
          residenceHistory: [{ country: "FR", years: 1 }],
        },
      ],
      marriage: { dateOfMarriage: "2019-06-01" },
      context: {},
      closerConnectionException: {
        lastCommonHR: "IT",
        yearsInFirstCommonHR: 5,
        yearsInLastCommonHR: 6,
        bothSpousesRelied: true,
      },
    };
    const d = determineMatrimonialApplicableLaw(input);
    expect(d.basis).toBe("art-26-1-a-first-common-hr");
    expect(d.applicableLaw).toBe("FR");
  });

  it("refuse l'exception en présence d'une MPA antérieure au mariage (art. 26(3))", () => {
    const input: MatrimonialCase = {
      spouses: [
        {
          id: "A",
          nationalities: ["FR"],
          habitualResidence: "IT",
          residenceHistory: [{ country: "FR", years: 1 }],
        },
        {
          id: "B",
          nationalities: ["FR"],
          habitualResidence: "IT",
          residenceHistory: [{ country: "FR", years: 1 }],
        },
      ],
      marriage: { dateOfMarriage: "2019-06-01" },
      mpa: {
        dateExecuted: "2019-05-01", // antérieure au mariage
        kind: "separation-of-property",
        inWritingDatedSigned: true,
      },
      context: {},
      closerConnectionException: {
        lastCommonHR: "IT",
        yearsInFirstCommonHR: 1,
        yearsInLastCommonHR: 20,
        bothSpousesRelied: true,
      },
    };
    const d = determineMatrimonialApplicableLaw(input);
    expect(d.basis).toBe("art-26-1-a-first-common-hr");
    expect(d.applicableLaw).toBe("FR");
    expect(
      d.warnings.some((w) => w.includes("Art. 26(3)")),
    ).toBe(true);
  });
});
