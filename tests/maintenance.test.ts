import { describe, expect, it } from "vitest";
import {
  analyseMaintenance,
  determineMaintenanceApplicableLaw,
  determineMaintenanceJurisdiction,
} from "../src/maintenance/engine.js";
import { maintenanceStatus } from "../src/maintenance/memberStates.js";
import type { MaintenanceCase } from "../src/maintenance/types.js";

describe("Maintenance — compétence (art. 3-7)", () => {
  it("art. 3(b) : RH du créancier (enfant en FR, père en DE → FR)", () => {
    const input: MaintenanceCase = {
      creditor: {
        id: "child",
        habitualResidence: "FR",
        nationalities: ["FR"],
        isMinor: true,
      },
      debtor: { id: "father", habitualResidence: "DE", nationalities: ["DE"] },
      relation: "child",
      forumState: "FR",
      dateCourtSeised: "2024-04-01",
    };
    const j = determineMaintenanceJurisdiction(input);
    expect(j.basis).toBe("art-3-b-creditor-hr");
    expect(j.competentForum).toBe("FR");
  });

  it("art. 3(a) : RH du défendeur si saisine en DE", () => {
    const input: MaintenanceCase = {
      creditor: {
        id: "child",
        habitualResidence: "FR",
        nationalities: ["FR"],
        isMinor: true,
      },
      debtor: { id: "father", habitualResidence: "DE", nationalities: ["DE"] },
      relation: "child",
      forumState: "DE",
      dateCourtSeised: "2024-04-01",
    };
    const j = determineMaintenanceJurisdiction(input);
    expect(j.basis).toBe("art-3-a-respondent-hr");
    expect(j.competentForum).toBe("DE");
  });

  it("art. 4(3) : élection de for invalide pour enfant mineur", () => {
    const input: MaintenanceCase = {
      creditor: {
        id: "child",
        habitualResidence: "ES",
        nationalities: ["FR"],
        isMinor: true,
      },
      debtor: { id: "father", habitualResidence: "DE", nationalities: ["DE"] },
      relation: "child",
      forumState: "FR",
      dateCourtSeised: "2024-04-01",
      choiceOfCourt: { forumState: "FR", inWritingDatedSigned: true },
    };
    const a = analyseMaintenance(input);
    expect(a.flags.some((f) => f.includes("4(3)"))).toBe(true);
  });

  it("art. 6 : nationalité commune subsidiaire", () => {
    const input: MaintenanceCase = {
      creditor: {
        id: "wife",
        habitualResidence: "GB",
        nationalities: ["FR"],
      },
      debtor: {
        id: "husband",
        habitualResidence: "CH",
        nationalities: ["FR"],
      },
      relation: "former-spouse",
      forumState: "FR",
      dateCourtSeised: "2024-04-01",
    };
    const j = determineMaintenanceJurisdiction(input);
    expect(j.basis).toBe("art-6-subsidiary-common-nationality");
    expect(j.competentForum).toBe("FR");
  });

  it("forum DK : règlement applicable mais Protocole pas applicable à la loi", () => {
    expect(maintenanceStatus("DK")).toBe("bound-no-protocol");
    const input: MaintenanceCase = {
      creditor: {
        id: "wife",
        habitualResidence: "DK",
        nationalities: ["DK"],
      },
      debtor: {
        id: "husband",
        habitualResidence: "DK",
        nationalities: ["DK"],
      },
      relation: "former-spouse",
      forumState: "DK",
      dateCourtSeised: "2024-04-01",
    };
    const a = analyseMaintenance(input);
    expect(a.applicableLaw.protocolApplies).toBe(false);
    expect(a.applicableLaw.basis).toBe("denmark-protocol-not-applicable");
  });
});

describe("Maintenance — loi applicable (Protocole 2007)", () => {
  it("art. 3 : RH du créancier (par défaut)", () => {
    const input: MaintenanceCase = {
      creditor: { id: "c", habitualResidence: "ES", nationalities: ["ES"] },
      debtor: { id: "d", habitualResidence: "DE", nationalities: ["DE"] },
      relation: "former-spouse",
      forumState: "ES",
      dateCourtSeised: "2024-04-01",
    };
    const d = determineMaintenanceApplicableLaw(input);
    expect(d.basis).toBe("protocol-art-3-creditor-hr");
    expect(d.applicableLaw).toBe("ES");
  });

  it("art. 4(3) : créancier privilégié saisit l'État de RH du débiteur → lex fori", () => {
    const input: MaintenanceCase = {
      creditor: {
        id: "child",
        habitualResidence: "FR",
        nationalities: ["FR"],
        isMinor: true,
      },
      debtor: { id: "father", habitualResidence: "DE", nationalities: ["DE"] },
      relation: "child",
      forumState: "DE",
      dateCourtSeised: "2024-04-01",
    };
    const d = determineMaintenanceApplicableLaw(input);
    expect(d.basis).toBe("protocol-art-4-cascade-fori");
    expect(d.applicableLaw).toBe("DE");
  });

  it("art. 4(2) : cascade fallback fori si la loi de la RH créancier ne permet pas", () => {
    const input: MaintenanceCase = {
      creditor: {
        id: "child",
        habitualResidence: "MA",
        nationalities: ["MA"],
        isMinor: true,
      },
      debtor: { id: "father", habitualResidence: "DE", nationalities: ["DE"] },
      relation: "child",
      forumState: "FR",
      dateCourtSeised: "2024-04-01",
      hrCreditorLawAllowsMaintenance: false,
    };
    const d = determineMaintenanceApplicableLaw(input);
    expect(d.basis).toBe("protocol-art-4-cascade-fori");
    expect(d.applicableLaw).toBe("FR");
  });

  it("art. 4(4) : cascade nationality commune si RH-créancier ET fori échouent", () => {
    const input: MaintenanceCase = {
      creditor: {
        id: "child",
        habitualResidence: "MA",
        nationalities: ["FR"],
        isMinor: true,
      },
      debtor: { id: "father", habitualResidence: "DE", nationalities: ["FR"] },
      relation: "child",
      forumState: "DE",
      dateCourtSeised: "2024-04-01",
      hrCreditorLawAllowsMaintenance: false,
      forumLawAllowsMaintenance: false,
    };
    const d = determineMaintenanceApplicableLaw(input);
    // forum=DE matches debtor.HR=DE → art-4-cascade-fori s'applique d'abord
    // mais forumLawAllowsMaintenance=false → fallback nationalité commune.
    expect(d.basis).toBe("protocol-art-4-cascade-common-nationality");
    expect(d.applicableLaw).toBe("FR");
  });

  it("art. 5 : opposition de l'époux pour liens plus étroits avec autre État", () => {
    const input: MaintenanceCase = {
      creditor: { id: "wife", habitualResidence: "FR", nationalities: ["FR"] },
      debtor: { id: "husband", habitualResidence: "IT", nationalities: ["IT"] },
      relation: "former-spouse",
      forumState: "FR",
      dateCourtSeised: "2024-04-01",
      spouseObjection: { closerConnectionWith: "IT" },
    };
    const d = determineMaintenanceApplicableLaw(input);
    expect(d.basis).toBe("protocol-art-5-spouse-closer-connection");
    expect(d.applicableLaw).toBe("IT");
  });

  it("art. 7 : choix lex fori pour une procédure", () => {
    const input: MaintenanceCase = {
      creditor: { id: "wife", habitualResidence: "FR", nationalities: ["FR"] },
      debtor: { id: "husband", habitualResidence: "IT", nationalities: ["IT"] },
      relation: "former-spouse",
      forumState: "FR",
      dateCourtSeised: "2024-04-01",
      choiceOfLaw: {
        chosenLaw: "FR",
        scope: "specific-proceedings",
        inWritingDatedSigned: true,
      },
    };
    const d = determineMaintenanceApplicableLaw(input);
    expect(d.basis).toBe("protocol-art-7-specific-choice");
    expect(d.applicableLaw).toBe("FR");
  });

  it("art. 8 : désignation générale interdite pour mineur", () => {
    const input: MaintenanceCase = {
      creditor: {
        id: "child",
        habitualResidence: "FR",
        nationalities: ["FR"],
        isMinor: true,
      },
      debtor: { id: "father", habitualResidence: "DE", nationalities: ["DE"] },
      relation: "child",
      forumState: "FR",
      dateCourtSeised: "2024-04-01",
      choiceOfLaw: {
        chosenLaw: "DE",
        scope: "general",
        inWritingDatedSigned: true,
      },
    };
    const d = determineMaintenanceApplicableLaw(input);
    expect(d.basis).not.toBe("protocol-art-8-general-choice");
    expect(d.warnings.some((w) => w.includes("Art. 8"))).toBe(true);
  });
});

describe("Maintenance — orchestrateur", () => {
  it("annonce DK comme non couvert par le Protocole", () => {
    const input: MaintenanceCase = {
      creditor: {
        id: "wife",
        habitualResidence: "DK",
        nationalities: ["DK"],
      },
      debtor: {
        id: "husband",
        habitualResidence: "DK",
        nationalities: ["DK"],
      },
      relation: "former-spouse",
      forumState: "DK",
      dateCourtSeised: "2024-04-01",
    };
    const a = analyseMaintenance(input);
    expect(a.flags.some((f) => f.includes("Forum DK"))).toBe(true);
  });
});
