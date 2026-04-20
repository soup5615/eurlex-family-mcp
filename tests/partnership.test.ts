import { describe, expect, it } from "vitest";
import { analysePartnership } from "../src/partnerships/engine.js";
import type { PartnershipCase } from "../src/partnerships/types.js";

describe("Régl. 2016/1104 — partenariats enregistrés", () => {
  it("art. 26(1) par défaut : loi de l'État sous la loi duquel le partenariat a été créé", () => {
    const input: PartnershipCase = {
      partners: [
        { id: "A", nationalities: ["FR"], habitualResidence: "DE" },
        { id: "B", nationalities: ["DE"], habitualResidence: "DE" },
      ],
      partnership: {
        dateOfRegistration: "2020-06-01",
        stateOfCreation: "FR",
      },
      context: {},
    };
    const a = analysePartnership(input);
    expect(a.applicableLaw.basis).toBe("art-26-1-state-of-creation");
    expect(a.applicableLaw.applicableLaw).toBe("FR");
    expect(a.applicableLaw.renvoiExcluded).toBe(true);
  });

  it("art. 22 choix : loi de l'État de création éligible au choix", () => {
    const input: PartnershipCase = {
      partners: [
        { id: "A", nationalities: ["ES"], habitualResidence: "BE" },
        { id: "B", nationalities: ["PT"], habitualResidence: "BE" },
      ],
      partnership: {
        dateOfRegistration: "2020-06-01",
        stateOfCreation: "MT",
      },
      choiceOfLaw: {
        chosenLaw: "MT",
        form: "express-writing",
        dateOfChoice: "2021-02-10",
      },
      context: {},
    };
    const a = analysePartnership(input);
    expect(a.applicableLaw.basis).toBe("art-22-choice");
    expect(a.applicableLaw.applicableLaw).toBe("MT");
  });

  it("art. 6(1)(e) : à défaut d'autre rattachement, compétence de l'État de création", () => {
    const input: PartnershipCase = {
      partners: [
        { id: "A", nationalities: ["US"], habitualResidence: "US" },
        { id: "B", nationalities: ["AU"], habitualResidence: "AU" },
      ],
      partnership: {
        dateOfRegistration: "2020-06-01",
        stateOfCreation: "FR",
      },
      context: {},
    };
    const a = analysePartnership(input);
    expect(a.jurisdiction.basis).toBe("art-6-1-e-state-of-creation");
    expect(a.jurisdiction.competentForum).toBe("FR");
  });

  it("art. 26(2) exception retenue si confiance établie", () => {
    const input: PartnershipCase = {
      partners: [
        { id: "A", nationalities: ["FR"], habitualResidence: "IT" },
        { id: "B", nationalities: ["IT"], habitualResidence: "IT" },
      ],
      partnership: {
        dateOfRegistration: "2020-01-01",
        stateOfCreation: "FR",
      },
      context: {},
      closerConnectionException: {
        requestedByPartnerId: "A",
        otherState: "IT",
        bothPartnersRelied: true,
      },
    };
    const a = analysePartnership(input);
    expect(a.applicableLaw.basis).toBe("art-26-2-closer-connection-exception");
    expect(a.applicableLaw.applicableLaw).toBe("IT");
  });

  it("champ temporel : partenariat antérieur au 29 janv. 2019 sans choix → inapplicable", () => {
    const input: PartnershipCase = {
      partners: [
        { id: "A", nationalities: ["FR"], habitualResidence: "FR" },
        { id: "B", nationalities: ["FR"], habitualResidence: "FR" },
      ],
      partnership: {
        dateOfRegistration: "2012-01-01",
        stateOfCreation: "FR",
      },
      context: {},
    };
    const a = analysePartnership(input);
    expect(a.temporalScope.applicable).toBe(false);
    expect(a.applicableLaw.applicableLaw).toBeNull();
  });
});
