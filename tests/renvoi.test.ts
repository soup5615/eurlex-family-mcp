import { describe, expect, it } from "vitest";
import { analyseSuccession } from "../src/engine/analyze.js";
import { analyseRenvoi } from "../src/engine/renvoi.js";
import { determineApplicableLaw } from "../src/engine/applicableLaw.js";
import type { SuccessionCase } from "../src/types.js";

describe("Renvoi (art. 34)", () => {
  it("loi désignée = EM lié → renvoi non applicable", () => {
    const input: SuccessionCase = {
      deceased: {
        nationalities: ["FR"],
        lastHabitualResidence: "FR",
        dateOfDeath: "2023-01-01",
      },
    };
    const law = determineApplicableLaw(input);
    const r = analyseRenvoi(input, law);
    expect(r.considered).toBe(false);
    expect(r.referralTarget).toBe("FR");
  });

  it("art. 34(2) bloque le renvoi si professio juris (art. 22)", () => {
    const input: SuccessionCase = {
      deceased: {
        nationalities: ["FR"],
        lastHabitualResidence: "CH",
        dateOfDeath: "2023-01-01",
      },
      professioJuris: { chosenLaw: "FR", form: "express" },
    };
    const law = determineApplicableLaw(input);
    const r = analyseRenvoi(input, law);
    expect(r.blockedByArt34_2).toBe(true);
    expect(r.considered).toBe(false);
  });

  it("CH (LDIP art. 90) : HR en CH → CH applique sa propre loi, pas de renvoi", () => {
    const input: SuccessionCase = {
      deceased: {
        nationalities: ["CH"],
        lastHabitualResidence: "CH",
        dateOfDeath: "2023-01-01",
      },
    };
    const a = analyseSuccession(input);
    expect(a.applicableLaw.applicableLaw).toBe("CH");
    expect(a.renvoi.designatedStateAppliesOwnLaw).toBe(true);
    expect(a.renvoi.referralAccepted).toBe(false);
  });

  it("Système scissioniste (GB) : renvoi mobilier à la loi du domicile approximé = HR", () => {
    // Défunt domicilié / HR en GB au décès, nationalité FR, biens en GB et FR.
    // Art. 21(1) désigne la loi GB ; DIP GB : mobilier = dernier domicile
    // (GB → sa propre loi) ; immeubles = lex rei sitae.
    const input: SuccessionCase = {
      deceased: {
        nationalities: ["FR"],
        lastHabitualResidence: "GB",
        dateOfDeath: "2023-01-01",
      },
      assets: [
        { kind: "movable", locatedIn: "GB" },
        { kind: "immovable", locatedIn: "FR" },
      ],
    };
    const a = analyseSuccession(input);
    expect(a.applicableLaw.applicableLaw).toBe("GB");
    // Le DIP GB pour mobiliers renvoie à la loi du dernier domicile = GB
    // lui-même ; pas de renvoi réciproque.
    expect(a.renvoi.considered).toBe(true);
    expect(
      a.renvoi.warnings.some((w) => w.includes("scissioniste")),
    ).toBe(true);
  });

  it("TR (DIP scissioniste, nationalité) : HR TR, nationalité FR → renvoi mobilier accepté vers FR (EM)", () => {
    const input: SuccessionCase = {
      deceased: {
        nationalities: ["FR"],
        lastHabitualResidence: "TR",
        dateOfDeath: "2022-09-15",
      },
      assets: [
        { kind: "movable", locatedIn: "FR" },
        { kind: "immovable", locatedIn: "TR" },
      ],
    };
    const a = analyseSuccession(input);
    expect(a.applicableLaw.applicableLaw).toBe("TR");
    expect(a.renvoi.referralAccepted).toBe(true);
    expect(a.renvoi.referralTarget).toBe("FR");
  });

  it("MA : défunt de nationalité MA résidant en CH → CH renvoie à HR puis chaîne non aboutie", () => {
    const input: SuccessionCase = {
      deceased: {
        nationalities: ["MA"],
        lastHabitualResidence: "MA",
        dateOfDeath: "2023-01-01",
      },
    };
    const a = analyseSuccession(input);
    expect(a.applicableLaw.applicableLaw).toBe("MA");
    // MA (nationalité) → MA même → auto-désignation
    expect(a.renvoi.referralAccepted).toBe(true);
    expect(a.renvoi.referralTarget).toBe("MA");
  });
});
