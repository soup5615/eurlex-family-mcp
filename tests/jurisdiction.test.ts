import { describe, expect, it } from "vitest";
import { determineJurisdiction } from "../src/engine/jurisdiction.js";
import type { SuccessionCase } from "../src/types.js";

describe("Compétence (art. 4-11)", () => {
  it("art. 4 : résidence habituelle en France → juridictions françaises", () => {
    const input: SuccessionCase = {
      deceased: {
        nationalities: ["FR"],
        lastHabitualResidence: "FR",
        dateOfDeath: "2023-01-01",
      },
    };
    const j = determineJurisdiction(input);
    expect(j.competentForum).toBe("FR");
    expect(j.basis).toBe("art-4-habitual-residence");
    expect(j.scope).toBe("entire-succession");
  });

  it("Oberle (C-20/17) : HR en France, nationalité allemande, biens en Allemagne — pas de compétence allemande au titre de l'art. 4", () => {
    // Simulation : le for DE invoqué ne peut pas se fonder sur la nationalité
    // pour évincer l'art. 4 ; la HR est en France → FR compétent.
    const input: SuccessionCase = {
      deceased: {
        nationalities: ["DE"],
        lastHabitualResidence: "FR",
        dateOfDeath: "2017-01-01",
      },
      assets: [{ kind: "movable", locatedIn: "DE" }],
      forumState: "DE",
    };
    const j = determineJurisdiction(input);
    expect(j.competentForum).toBe("FR");
    expect(j.basis).toBe("art-4-habitual-residence");
  });

  it("art. 10(1)(a) : HR au Royaume-Uni (État tiers), nationalité française, biens en France → juridictions françaises compétentes pour l'ensemble", () => {
    const input: SuccessionCase = {
      deceased: {
        nationalities: ["FR"],
        lastHabitualResidence: "GB",
        dateOfDeath: "2023-01-01",
      },
      assets: [{ kind: "immovable", locatedIn: "FR" }],
      forumState: "FR",
    };
    const j = determineJurisdiction(input);
    expect(j.competentForum).toBe("FR");
    expect(j.basis).toBe("art-10-1-subsidiary-nationality");
    expect(j.scope).toBe("entire-succession");
  });

  it("art. 10(1)(b) : HR en Suisse, précédente HR en Allemagne < 5 ans, biens en Allemagne → juridictions allemandes", () => {
    const input: SuccessionCase = {
      deceased: {
        nationalities: ["CH"],
        lastHabitualResidence: "CH",
        residenceHistory: [{ country: "DE", years: 3 }],
        dateOfDeath: "2023-06-01",
      },
      assets: [{ kind: "movable", locatedIn: "DE" }],
      forumState: "DE",
    };
    const j = determineJurisdiction(input);
    expect(j.competentForum).toBe("DE");
    expect(j.basis).toBe("art-10-1-subsidiary-previous-residence");
    expect(j.scope).toBe("entire-succession");
  });

  it("art. 10(2) : HR en Suisse, aucun lien art. 10(1), biens en Italie → compétence italienne limitée aux biens en Italie", () => {
    const input: SuccessionCase = {
      deceased: {
        nationalities: ["CH"],
        lastHabitualResidence: "CH",
        dateOfDeath: "2023-01-01",
      },
      assets: [{ kind: "immovable", locatedIn: "IT" }],
      forumState: "IT",
    };
    const j = determineJurisdiction(input);
    expect(j.competentForum).toBe("IT");
    expect(j.basis).toBe("art-10-2-limited-to-assets");
    expect(j.scope).toBe("assets-in-forum-only");
  });

  it("Danemark (EM non lié) : HR au Danemark traité comme État tiers ; sans for alternatif, pas de compétence d'un EM lié", () => {
    const input: SuccessionCase = {
      deceased: {
        nationalities: ["DK"],
        lastHabitualResidence: "DK",
        dateOfDeath: "2023-01-01",
      },
    };
    const j = determineJurisdiction(input);
    expect(j.basis).toBe("none");
    expect(
      j.warnings.some((w) => w.includes("Danemark")),
    ).toBe(true);
  });
});
