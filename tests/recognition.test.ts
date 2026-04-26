import { describe, expect, it } from "vitest";
import {
  analyseRecognition,
  type RecognitionCase,
} from "../src/recognition/engine.js";

describe("Recognition & enforcement", () => {
  it("R650 jugement DE→FR : reconnaissance auto + déclaration d'exécution", () => {
    const input: RecognitionCase = {
      instrument: {
        regulation: "650-2012",
        kind: "judgment",
        originState: "DE",
        issuedOn: "2023-06-01",
      },
      forumState: "FR",
    };
    const a = analyseRecognition(input);
    expect(a.determination.regime).toBe("automatic-with-certificate");
    expect(a.determination.enforceabilityRequiresDeclaration).toBe(true);
    expect(a.determination.certificateNeeded).toContain("Annexe I");
  });

  it("R650 CSE : effet direct (art. 69)", () => {
    const a = analyseRecognition({
      instrument: {
        regulation: "650-2012",
        kind: "european-succession-certificate",
        originState: "FR",
        issuedOn: "2023-06-01",
      },
      forumState: "DE",
    });
    expect(a.determination.regime).toBe("esc-direct-effect");
    expect(a.determination.enforceabilityRequiresDeclaration).toBe(false);
  });

  it("B IIter : exéquatur aboli, exécution directe", () => {
    const a = analyseRecognition({
      instrument: {
        regulation: "2019-1111",
        kind: "judgment",
        originState: "IT",
        issuedOn: "2023-04-01",
      },
      forumState: "FR",
    });
    expect(a.determination.regime).toBe("automatic-no-procedure");
    expect(a.determination.enforceabilityRequiresDeclaration).toBe(false);
  });

  it("R 4/2009 Section 1 (origine FR liée au Protocole) : pas d'exéquatur", () => {
    const a = analyseRecognition({
      instrument: {
        regulation: "4-2009",
        kind: "judgment",
        originState: "FR",
        issuedOn: "2023-09-15",
      },
      forumState: "DE",
      originBoundByHagueProtocol: true,
    });
    expect(a.determination.regime).toBe("automatic-no-procedure");
  });

  it("R 4/2009 Section 2 (origine DK non liée) : exéquatur conservé", () => {
    const a = analyseRecognition({
      instrument: {
        regulation: "4-2009",
        kind: "judgment",
        originState: "DK",
        issuedOn: "2023-02-10",
      },
      forumState: "FR",
      originBoundByHagueProtocol: false,
    });
    expect(a.determination.regime).toBe("limited-section-2-of-r-4-2009");
    expect(a.determination.enforceabilityRequiresDeclaration).toBe(true);
  });

  it("Origine non liée par le règlement → not-covered", () => {
    const a = analyseRecognition({
      instrument: {
        regulation: "650-2012",
        kind: "judgment",
        originState: "DK", // pas dans R650
        issuedOn: "2023-06-01",
      },
      forumState: "FR",
    });
    expect(a.determination.regime).toBe("not-covered");
  });

  it("Décision antérieure à l'application du règlement : not-covered", () => {
    const a = analyseRecognition({
      instrument: {
        regulation: "2019-1111",
        kind: "judgment",
        originState: "FR",
        issuedOn: "2022-06-01", // avant 1er août 2022
      },
      forumState: "DE",
    });
    expect(a.determination.regime).toBe("not-covered");
  });

  it("Motifs de refus : ordre public déclenché", () => {
    const a = analyseRecognition({
      instrument: {
        regulation: "650-2012",
        kind: "judgment",
        originState: "DE",
        issuedOn: "2023-06-01",
      },
      forumState: "FR",
      refusalHints: { publicPolicyConcern: true },
    });
    expect(
      a.determination.refusalGrounds.some(
        (g) => g.ground.includes("ordre public") && g.triggered,
      ),
    ).toBe(true);
  });
});
