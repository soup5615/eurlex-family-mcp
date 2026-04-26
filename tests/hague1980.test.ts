import { describe, expect, it } from "vitest";
import {
  analyseHague1980,
  isParty,
  type Hague1980Case,
} from "../src/hague1980/engine.js";

describe("La Haye 1980 — applicabilité", () => {
  it("FR et DE sont parties", () => {
    expect(isParty("FR")).toBe(true);
    expect(isParty("DE")).toBe(true);
  });

  it("Convention inapplicable si État de refuge non partie", () => {
    const a = analyseHague1980({
      child: { id: "C", ageAtRemoval: 8, habitualResidenceBeforeRemoval: "FR" },
      removal: {
        fromState: "FR",
        toState: "ZZ", // fictif
        dateOfRemovalOrRetention: "2024-01-01",
        breachOfCustodyRights: true,
        custodyRightsActuallyExercised: true,
      },
      application: { dateOfApplication: "2024-04-01", requestingState: "FR" },
    });
    expect(a.outcome).toBe("convention-not-applicable");
  });

  it("Enfant ≥ 16 ans → Convention inapplicable", () => {
    const a = analyseHague1980({
      child: { id: "C", ageAtRemoval: 16, habitualResidenceBeforeRemoval: "FR" },
      removal: {
        fromState: "FR",
        toState: "DE",
        dateOfRemovalOrRetention: "2024-01-01",
        breachOfCustodyRights: true,
        custodyRightsActuallyExercised: true,
      },
      application: { dateOfApplication: "2024-04-01", requestingState: "FR" },
    });
    expect(a.outcome).toBe("convention-not-applicable");
  });
});

describe("La Haye 1980 — issues", () => {
  const base: Hague1980Case = {
    child: { id: "C", ageAtRemoval: 8, habitualResidenceBeforeRemoval: "FR" },
    removal: {
      fromState: "FR",
      toState: "DE",
      dateOfRemovalOrRetention: "2024-01-15",
      breachOfCustodyRights: true,
      custodyRightsActuallyExercised: true,
    },
    application: {
      dateOfApplication: "2024-04-01", // ~2.5 mois après
      requestingState: "FR",
    },
  };

  it("Demande dans l'année + aucune exception → return-presumed", () => {
    const a = analyseHague1980(base);
    expect(a.outcome).toBe("return-presumed");
  });

  it("Risque grave invoqué → return-may-be-refused + warning art. 11(4) B IIter", () => {
    const a = analyseHague1980({
      ...base,
      defenses: { graveRiskOfHarm: true },
    });
    expect(a.outcome).toBe("return-may-be-refused");
    expect(a.warnings.some((w) => w.includes("art. 11(4)"))).toBe(true);
  });

  it("Demande > 1 an sans intégration invoquée → out-of-time-with-discretion", () => {
    const a = analyseHague1980({
      ...base,
      application: {
        dateOfApplication: "2025-06-01", // ~16 mois après
        requestingState: "FR",
      },
    });
    expect(a.outcome).toBe("out-of-time-with-discretion");
  });

  it("Garde non effectivement exercée → Convention inapplicable", () => {
    const a = analyseHague1980({
      ...base,
      removal: { ...base.removal, custodyRightsActuallyExercised: false },
    });
    expect(a.outcome).toBe("convention-not-applicable");
  });
});
