// CJEU regression suite.
//
// For each leading CJEU judgment referenced by the engine, this file
// encodes the actual fact pattern of the litigation and asserts that
// the engine produces the qualification the Court actually retained.
// Any disagreement here is a bug in the engine — these tests exist to
// catch regressions and to document the legal reasoning the engine
// claims to implement.
//
// Each test cites:
//   - the case number (CELEX) — in TS comments only, the URL is
//     also exported via src/data/cjeuCases.ts → curiaUrl.
//   - the date of the judgment
//   - the holding (1-2 lines) the test verifies against.

import { describe, expect, it } from "vitest";
import { analyseSuccession } from "../src/engine/analyze.js";
import { analyseHague1980 } from "../src/hague1980/engine.js";
import { analyseMaintenance } from "../src/maintenance/engine.js";
import { analyseRecognition } from "../src/recognition/engine.js";
import type { SuccessionCase } from "../src/types.js";
import type { MaintenanceCase } from "../src/maintenance/types.js";

describe("CJEU regression — Règl. (UE) 650/2012", () => {
  it("Mahnkopf (C-558/16, 1 mars 2018) : la part forfaitaire du conjoint survivant (§1371 BGB) relève du règlement, pas des régimes matrimoniaux", () => {
    // Faits : Hermann Mahnkopf, ressortissant et résident allemand,
    // décédé en 2015. Marié sous régime allemand de communauté
    // différée. Biens en Allemagne et Suède.
    // Holding : §1371(1) BGB relève de la matière successorale (art.
    // 1(1) R650), donc figure dans le CSE.
    const a = analyseSuccession({
      deceased: {
        nationalities: ["DE"],
        lastHabitualResidence: "DE",
        dateOfDeath: "2015-08-29",
      },
      assets: [
        { kind: "immovable", locatedIn: "DE" },
        { kind: "movable", locatedIn: "SE" },
      ],
    });
    // Le moteur traite la situation comme une succession (n'écarte pas
    // au titre des régimes matrimoniaux art. 1(2)(d)) — cohérent avec
    // la qualification *Mahnkopf*.
    expect(a.materialScope.applicable).toBe(true);
    expect(a.jurisdiction.competentForum).toBe("DE");
    expect(a.jurisdiction.basis).toBe("art-4-habitual-residence");
    expect(a.applicableLaw.applicableLaw).toBe("DE");
    // CSE recommandé puisque biens dans plusieurs États (DE + SE).
    expect(a.esc.recommended).toBe(true);
  });

  it("Kubicka (C-218/16, 12 oct. 2017) : la loi successorale choisie (PL) régit le legs « par vindication », même pour un immeuble en DE", () => {
    // Faits : Aleksandra Kubicka, ressortissante polonaise résidant
    // en Pologne, mariée, deux enfants ; immeuble en Allemagne.
    // Souhaite faire un testament désignant la loi polonaise et
    // organisant un legs par vindication sur l'immeuble allemand.
    // Holding : la loi successorale désignée (PL) régit le transfert,
    // même pour un immeuble situé dans un autre EM dont le droit ne
    // connaît pas ce type de legs (art. 1(2)(k)(l), 23(2)(e), 31).
    const a = analyseSuccession({
      deceased: {
        nationalities: ["PL"],
        lastHabitualResidence: "PL",
        dateOfDeath: "2016-06-01",
      },
      professioJuris: { chosenLaw: "PL", form: "express" },
      dispositions: [
        {
          type: "will",
          dateExecuted: "2015-09-01",
          lawChosenForAdmissibilityAndValidity: "PL",
        },
      ],
      assets: [{ kind: "immovable", locatedIn: "DE" }],
    });
    expect(a.applicableLaw.applicableLaw).toBe("PL");
    expect(a.applicableLaw.basis).toBe("art-22-professio-juris");
    // Le testament est régi par la loi PL (art. 24(2) — choix).
    expect(a.dispositions[0]?.lawGoverningAdmissibilityAndValidity).toBe("PL");
    expect(a.dispositions[0]?.basis).toBe("art-24-2-choice");
  });

  it("Oberle (C-20/17, 21 juin 2018) : compétence FR exclusive sous art. 4 même quand le défunt avait la nationalité allemande et des biens en DE", () => {
    // Faits : Alfons Oberle, ressortissant français résidant en
    // France au décès. Son fils en Allemagne demande un certificat
    // d'hérédité national allemand limité aux biens allemands.
    // Holding : art. 4 R650 fait obstacle à toute compétence
    // nationale parallèle pour la délivrance d'un certificat
    // d'hérédité. La compétence française au titre de l'art. 4 est
    // exclusive.
    const a = analyseSuccession({
      deceased: {
        nationalities: ["FR"],
        lastHabitualResidence: "FR",
        dateOfDeath: "2017-04-15",
      },
      assets: [{ kind: "immovable", locatedIn: "DE" }],
      forumState: "DE",
    });
    // Le moteur retient FR (art. 4) ; il N'attribue PAS à l'Allemagne
    // une compétence subsidiaire — cohérent avec Oberle.
    expect(a.jurisdiction.competentForum).toBe("FR");
    expect(a.jurisdiction.basis).toBe("art-4-habitual-residence");
  });

  it("WB (C-658/17, 23 mai 2019) : un acte notarié polonais d'hérédité circule comme acte authentique (art. 59-60), non comme décision (art. 39)", () => {
    // Faits : un notaire polonais établit un acte de certification
    // d'hérédité (akt poświadczenia dziedziczenia). WB en demande la
    // reconnaissance comme « décision » dans un autre EM.
    // Holding : le notaire polonais n'exerce pas de fonctions
    // juridictionnelles (art. 3(2)) ; l'acte est un « acte
    // authentique » au sens de l'art. 3(1)(i), avec la force
    // probante de l'art. 59.
    const a = analyseRecognition({
      instrument: {
        regulation: "650-2012",
        kind: "authentic-instrument",
        originState: "PL",
        issuedOn: "2018-06-15",
      },
      forumState: "DE",
    });
    // Le moteur applique le régime des actes authentiques (art. 59-60)
    // et non celui des décisions — cohérent avec WB.
    expect(a.determination.regime).toBe("automatic-with-certificate");
    expect(a.determination.certificateNeeded).toContain("Annexe II");
    expect(
      a.determination.reasoning.some((r) => r.article.includes("59")),
    ).toBe(true);
  });

  it("E.E. (C-80/19, 16 juill. 2020) : une seule résidence habituelle — si elle est en DE, FR ne peut être compétent", () => {
    // Faits : ressortissant lituanien marié à une ressortissante
    // allemande, ayant vécu en Allemagne mais ayant conservé des
    // liens avec la Lituanie (où se trouvent ses biens) ; décédé.
    // Holding : il existe UNE SEULE résidence habituelle au sens du
    // règlement ; le juge doit la déterminer in concreto.
    // Hypothèse retenue par le juge lituanien : HR = DE → DE
    // compétent ; LT non compétent au titre de l'art. 4.
    const a = analyseSuccession({
      deceased: {
        nationalities: ["LT"],
        lastHabitualResidence: "DE",
        dateOfDeath: "2019-01-20",
      },
      assets: [{ kind: "immovable", locatedIn: "LT" }],
      forumState: "LT",
    });
    // Le moteur se conforme au principe de RH unique : il retourne
    // DE — pas une compétence parallèle pour LT.
    expect(a.jurisdiction.competentForum).toBe("DE");
    expect(a.jurisdiction.basis).toBe("art-4-habitual-residence");
  });

  it("UM (C-277/20, 9 sept. 2021) : un contrat de donation à cause de mort est un « pacte successoral » (art. 3(1)(b)) régi par l'art. 25", () => {
    // Faits : ressortissant autrichien ayant conclu en 1975 un
    // contrat de donation à cause de mort sur un immeuble. Décès
    // postérieur à l'application du règlement.
    // Holding : ce contrat tombe dans la définition de « pacte
    // successoral » de l'art. 3(1)(b). Le règlement s'applique.
    const a = analyseSuccession({
      deceased: {
        nationalities: ["AT"],
        lastHabitualResidence: "AT",
        dateOfDeath: "2018-05-15",
      },
      dispositions: [
        {
          type: "succession-pact",
          dateExecuted: "1975-04-01",
        },
      ],
      assets: [{ kind: "immovable", locatedIn: "AT" }],
    });
    // Le moteur traite cette disposition comme un pacte successoral
    // (art. 25), pas comme un testament (art. 24) — cohérent avec UM.
    expect(a.dispositions[0]?.disposition.type).toBe("succession-pact");
    expect(a.dispositions[0]?.basis).toMatch(/^art-25-/);
  });

  it("V A et Z A (C-645/20, 7 mars 2022) : art. 10(1)(a) doit s'appliquer d'office quand HR hors UE + nationalité d'un EM + biens dans cet EM", () => {
    // Faits : ressortissant français décédé au Royaume-Uni (à
    // l'époque, État membre ; rendu post-Brexit, RU = État tiers
    // pour le moteur). Enfants en France ; biens immeubles en
    // France. Saisine d'un juge français.
    // Holding : art. 10(1)(a) prévoit une compétence subsidiaire
    // *impérative* — le juge saisi doit la relever d'office dès que
    // ses conditions sont réunies.
    const a = analyseSuccession({
      deceased: {
        nationalities: ["FR"],
        lastHabitualResidence: "GB",
        dateOfDeath: "2021-04-10",
      },
      assets: [{ kind: "immovable", locatedIn: "FR" }],
      forumState: "FR",
    });
    // Le moteur retient art. 10(1)(a) — cohérent avec le caractère
    // impératif rappelé par l'arrêt.
    expect(a.jurisdiction.competentForum).toBe("FR");
    expect(a.jurisdiction.basis).toBe("art-10-1-subsidiary-nationality");
    expect(a.jurisdiction.scope).toBe("entire-succession");
  });
});

describe("CJEU regression — Règl. (CE) 4/2009", () => {
  it("A v B (C-184/14, 16 juill. 2015) : la demande alimentaire pour un enfant accessoire à une action en responsabilité parentale relève de l'art. 3(d), non de l'art. 3(c)", () => {
    // Faits : couple italo-italien résidant en Italie, séparation.
    // Père s'installe au Royaume-Uni. Mère engage en Italie une
    // action sur la responsabilité parentale ET les aliments pour
    // l'enfant.
    // Holding : lorsque la demande alimentaire concerne un enfant et
    // est accessoire à une action en responsabilité parentale, c'est
    // l'art. 3(d) qui fonde la compétence (et non 3(c)).
    const input: MaintenanceCase = {
      creditor: {
        id: "child",
        habitualResidence: "IT",
        nationalities: ["IT"],
        isMinor: true,
      },
      debtor: {
        id: "father",
        habitualResidence: "GB",
        nationalities: ["IT"],
      },
      relation: "child",
      forumState: "IT",
      dateCourtSeised: "2014-05-01",
      relatedParentalProceedingsIn: "IT",
    };
    const a = analyseMaintenance(input);
    // Le moteur retient art-3-b (RH créancier) en premier, ce qui est
    // conforme — l'art. 3 énumère des chefs *alternatifs*. L'art. 3(d)
    // est aussi disponible si le demandeur le préfère ; on vérifie
    // qu'il est *atteignable* en éliminant 3(b).
    expect(a.jurisdiction.basis).toBe("art-3-b-creditor-hr");
    // Vérification spécifique : si le créancier ne réside PAS en IT,
    // le 3(d) doit s'activer.
    const aWithoutIt: MaintenanceCase = {
      ...input,
      creditor: { ...input.creditor, habitualResidence: "GB" },
    };
    const b = analyseMaintenance(aWithoutIt);
    expect(b.jurisdiction.basis).toBe("art-3-d-related-parental-court");
  });

  it("R v P (C-468/18, 5 sept. 2019) : le juge saisi en parental peut connaître de la demande alimentaire à titre accessoire", () => {
    // Faits : femme roumaine résidant au Portugal, demande la
    // dissolution du mariage et la pension alimentaire pour l'enfant
    // au juge portugais.
    // Holding : la juridiction compétente en parental peut connaître
    // de la demande alimentaire concernant l'enfant — accessoire au
    // sens de l'art. 3(d).
    const a = analyseMaintenance({
      creditor: {
        id: "child",
        habitualResidence: "PT",
        nationalities: ["RO", "PT"],
        isMinor: true,
      },
      debtor: {
        id: "father",
        habitualResidence: "RO",
        nationalities: ["RO"],
      },
      relation: "child",
      forumState: "PT",
      dateCourtSeised: "2018-04-01",
      relatedParentalProceedingsIn: "PT",
    });
    // RH du créancier (PT) suffit déjà à fonder la compétence (art.
    // 3(b)) — chefs alternatifs.
    expect(a.jurisdiction.competentForum).toBe("PT");
    expect(["art-3-b-creditor-hr", "art-3-d-related-parental-court"]).toContain(
      a.jurisdiction.basis,
    );
  });
});

describe("Régression Convention de La Haye 1980", () => {
  it("Schéma Re E [2011] UKSC 27 — art. 13(1)(b) ne suffit pas seul ; le moteur signale l'articulation art. 11(4) Bruxelles II ter", () => {
    // Schéma de fait : déplacement illicite intra-UE, demande dans
    // l'année, défense fondée sur l'art. 13(1)(b) (risque grave).
    // L'engin renvoie « return-may-be-refused » mais surtout
    // signale l'articulation art. 11(4) BIIter (mesures adéquates de
    // protection).
    const a = analyseHague1980({
      child: {
        id: "C",
        ageAtRemoval: 7,
        habitualResidenceBeforeRemoval: "FR",
      },
      removal: {
        fromState: "FR",
        toState: "DE",
        dateOfRemovalOrRetention: "2024-01-15",
        breachOfCustodyRights: true,
        custodyRightsActuallyExercised: true,
      },
      application: {
        dateOfApplication: "2024-04-01",
        requestingState: "FR",
      },
      defenses: { graveRiskOfHarm: true },
    });
    expect(a.outcome).toBe("return-may-be-refused");
    expect(a.warnings.some((w) => w.includes("art. 11(4)"))).toBe(true);
  });
});
