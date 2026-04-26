// Sectoral case templates — realistic factual patterns covering the
// most common cross-border family-law situations encountered in
// practice. Each template is fully ready: load it, click "Analyser",
// get a meaningful result. Templates are organised by case kind so
// the UI can offer them in the right tab.

import type { SuccessionCase } from "../types.js";
import type { MatrimonialCase } from "../matrimonial/types.js";
import type { PartnershipCase } from "../partnerships/types.js";
import type { DivorceCase } from "../divorce/types.js";
import type {
  BiiMatrimonialCase,
  BiiParentalResponsibilityCase,
} from "../brussels2/types.js";
import type { CombinedCase } from "../matrimonial/combined.js";
import type { CrisisCase } from "../brussels2/crisis.js";
import type { MaintenanceCase } from "../maintenance/types.js";
import type { RecognitionCase } from "../recognition/engine.js";
import type { Hague1980Case } from "../hague1980/engine.js";
import type { CaseKind } from "./storage.js";

export interface CaseTemplate<Payload = unknown> {
  id: string;
  kind: CaseKind;
  title: string;
  summary: string; // 1-2 sentences
  tags: string[];
  payload: Payload;
}

export const TEMPLATES: CaseTemplate[] = [
  // ─── Successions (R650/2012) ─────────────────────────────────────
  {
    id: "succ-fr-resident-de-immobilier-fr",
    kind: "succession",
    title: "Successions — résident allemand, immeuble en France",
    summary:
      "Ressortissant français, dernière RH en Allemagne, immeuble en France et comptes bancaires en Allemagne. Choix de la loi française par testament.",
    tags: ["650/2012", "FR-DE", "professio juris", "immeuble"],
    payload: {
      deceased: {
        nationalities: ["FR"],
        lastHabitualResidence: "DE",
        dateOfDeath: "2023-05-10",
      },
      professioJuris: { chosenLaw: "FR", form: "express" },
      dispositions: [
        {
          type: "will",
          dateExecuted: "2018-01-12",
          lawChosenForAdmissibilityAndValidity: "FR",
          form: {
            written: true,
            placeOfMaking: "FR",
            nationalitiesAtMaking: ["FR"],
            habitualResidenceAtMaking: "FR",
          },
        },
      ],
      assets: [
        { kind: "immovable", locatedIn: "FR" },
        { kind: "movable", locatedIn: "DE" },
      ],
    } satisfies SuccessionCase,
  },
  {
    id: "succ-expat-fr-suisse",
    kind: "succession",
    title: "Successions — expatrié français résidant en Suisse",
    summary:
      "Ressortissant français installé en Suisse depuis 12 ans, sans choix de loi. Renvoi (art. 34) à examiner via le DIP suisse.",
    tags: ["650/2012", "renvoi", "Suisse", "FR-CH"],
    payload: {
      deceased: {
        nationalities: ["FR"],
        lastHabitualResidence: "CH",
        dateOfDeath: "2023-09-20",
      },
      assets: [
        { kind: "immovable", locatedIn: "FR" },
        { kind: "movable", locatedIn: "CH" },
      ],
      forumState: "FR",
    } satisfies SuccessionCase,
  },
  {
    id: "succ-uk-citizen-pl-property",
    kind: "succession",
    title: "Successions — défunt britannique avec immeuble en Pologne (Kubicka)",
    summary:
      "Inspiré de CJUE Kubicka (C-218/16) : disposition adoptant la loi polonaise (legs « par vindication ») applicable à un immeuble en Allemagne.",
    tags: ["650/2012", "Kubicka", "professio juris", "PL"],
    payload: {
      deceased: {
        nationalities: ["PL"],
        lastHabitualResidence: "PL",
        dateOfDeath: "2023-04-05",
      },
      professioJuris: { chosenLaw: "PL", form: "express" },
      dispositions: [
        {
          type: "will",
          dateExecuted: "2020-06-15",
          lawChosenForAdmissibilityAndValidity: "PL",
        },
      ],
      assets: [{ kind: "immovable", locatedIn: "DE" }],
    } satisfies SuccessionCase,
  },
  {
    id: "succ-mahnkopf",
    kind: "succession",
    title: "Successions — Mahnkopf (qualification §1371 BGB)",
    summary:
      "Inspiré de CJUE Mahnkopf (C-558/16) : la majoration forfaitaire de la part successorale du conjoint survivant en droit allemand relève du règlement successions.",
    tags: ["650/2012", "Mahnkopf", "DE", "qualification"],
    payload: {
      deceased: {
        nationalities: ["DE"],
        lastHabitualResidence: "DE",
        dateOfDeath: "2023-02-15",
      },
      assets: [
        { kind: "immovable", locatedIn: "DE" },
        { kind: "movable", locatedIn: "SE" },
      ],
    } satisfies SuccessionCase,
  },
  {
    id: "succ-ma-citizen-resident-fr",
    kind: "succession",
    title: "Successions — ressortissant marocain résidant en France",
    summary:
      "Marocain installé en France depuis 20 ans, immeuble au Maroc. Renvoi du DIP marocain (loi nationale) vers loi marocaine — application substantielle marocaine.",
    tags: ["650/2012", "renvoi", "Maroc", "ordre public"],
    payload: {
      deceased: {
        nationalities: ["MA"],
        lastHabitualResidence: "FR",
        dateOfDeath: "2023-11-08",
      },
      assets: [
        { kind: "immovable", locatedIn: "MA" },
        { kind: "movable", locatedIn: "FR" },
      ],
    } satisfies SuccessionCase,
  },

  // ─── Régimes matrimoniaux (R2016/1103) ──────────────────────────
  {
    id: "mat-binational-fr-de",
    kind: "matrimonial",
    title: "Régime — couple binational FR-DE marié en France",
    summary:
      "Mariage 2020 en France, époux de nationalités française et allemande, RH commune en France. Pas de choix ni de MPA.",
    tags: ["2016/1103", "FR-DE", "art. 26(1)(a)"],
    payload: {
      spouses: [
        { id: "A", nationalities: ["FR"], habitualResidence: "FR" },
        { id: "B", nationalities: ["DE"], habitualResidence: "FR" },
      ],
      marriage: { dateOfMarriage: "2020-06-15", placeOfMarriage: "FR" },
      context: { forumState: "FR" },
    } satisfies MatrimonialCase,
  },
  {
    id: "mat-choix-loi-allemande-mpa",
    kind: "matrimonial",
    title: "Régime — choix de loi DE par MPA notariée",
    summary:
      "Couple germano-italien résidant en France, contrat de mariage notarié 2021 désignant la loi allemande (art. 22).",
    tags: ["2016/1103", "professio juris", "MPA", "DE"],
    payload: {
      spouses: [
        { id: "A", nationalities: ["DE"], habitualResidence: "FR" },
        { id: "B", nationalities: ["IT"], habitualResidence: "FR" },
      ],
      marriage: { dateOfMarriage: "2021-04-12", placeOfMarriage: "FR" },
      choiceOfLaw: {
        chosenLaw: "DE",
        form: "express-writing",
        dateOfChoice: "2021-04-12",
        inWritingDatedSigned: true,
      },
      mpa: {
        dateExecuted: "2021-04-12",
        kind: "separation-of-property",
        inWritingDatedSigned: true,
      },
      context: { forumState: "FR" },
    } satisfies MatrimonialCase,
  },
  {
    id: "mat-exception-26-2",
    kind: "matrimonial",
    title: "Régime — exception art. 26(2) (RH actuelle bien plus longue)",
    summary:
      "Couple FR marié 2019, première RH commune Belgique (1 an), puis Italie (15 ans). Demande d'application de la loi italienne au titre de l'art. 26(2).",
    tags: ["2016/1103", "art. 26(2)", "exception"],
    payload: {
      spouses: [
        {
          id: "A",
          nationalities: ["FR"],
          habitualResidence: "IT",
          residenceHistory: [{ country: "BE", years: 14 }],
        },
        {
          id: "B",
          nationalities: ["FR"],
          habitualResidence: "IT",
          residenceHistory: [{ country: "BE", years: 14 }],
        },
      ],
      marriage: { dateOfMarriage: "2019-06-01", placeOfMarriage: "BE" },
      context: { forumState: "IT" },
      closerConnectionException: {
        requestedBySpouseId: "A",
        lastCommonHR: "IT",
        yearsInFirstCommonHR: 1,
        yearsInLastCommonHR: 14,
        bothSpousesRelied: true,
      },
    } satisfies MatrimonialCase,
  },

  // ─── Partenariats (R2016/1104) ───────────────────────────────────
  {
    id: "part-pacs-franco-allemand",
    kind: "partnership",
    title: "Partenariat — PACS franco-allemand",
    summary:
      "PACS conclu en France entre un Français et un Allemand résidant tous deux en Allemagne. Loi de l'État de création (FR) par défaut (art. 26(1)).",
    tags: ["2016/1104", "PACS", "FR-DE"],
    payload: {
      partners: [
        { id: "A", nationalities: ["FR"], habitualResidence: "DE" },
        { id: "B", nationalities: ["DE"], habitualResidence: "DE" },
      ],
      partnership: {
        dateOfRegistration: "2020-06-01",
        stateOfCreation: "FR",
        placeOfRegistration: "FR",
      },
      context: { forumState: "DE" },
    } satisfies PartnershipCase,
  },
  {
    id: "part-belge-resident-mt",
    kind: "partnership",
    title: "Partenariat — couple belgo-portugais à Malte",
    summary:
      "Partenariat enregistré à Malte, partenaires belge et portugais résidant à Malte. Choix de la loi maltaise possible (art. 22(1)(c)).",
    tags: ["2016/1104", "MT", "professio juris"],
    payload: {
      partners: [
        { id: "A", nationalities: ["BE"], habitualResidence: "MT" },
        { id: "B", nationalities: ["PT"], habitualResidence: "MT" },
      ],
      partnership: {
        dateOfRegistration: "2021-09-15",
        stateOfCreation: "MT",
      },
      choiceOfLaw: {
        chosenLaw: "MT",
        form: "express-writing",
        dateOfChoice: "2021-09-15",
        inWritingDatedSigned: true,
      },
      context: { forumState: "MT" },
    } satisfies PartnershipCase,
  },

  // ─── Divorce (Rome III) ──────────────────────────────────────────
  {
    id: "div-fr-couple-resident-fr",
    kind: "divorce",
    title: "Divorce — couple FR résidant en France",
    summary:
      "Cas standard : époux français résidant en France, saisine d'un tribunal français. Loi française par art. 8(a).",
    tags: ["1259/2010", "art. 8(a)", "FR"],
    payload: {
      spouses: [
        { id: "A", nationalities: ["FR"], habitualResidence: "FR" },
        { id: "B", nationalities: ["FR"], habitualResidence: "FR" },
      ],
      proceeding: "divorce",
      forumState: "FR",
      dateCourtSeised: "2024-03-01",
    } satisfies DivorceCase,
  },
  {
    id: "div-couple-mixte-choix-loi",
    kind: "divorce",
    title: "Divorce — choix de loi allemande par couple FR-DE",
    summary:
      "Couple FR-DE résidant en Italie, ayant choisi la loi allemande par convention écrite. Saisine en Italie.",
    tags: ["1259/2010", "art. 5", "professio juris"],
    payload: {
      spouses: [
        { id: "A", nationalities: ["FR", "DE"], habitualResidence: "IT" },
        { id: "B", nationalities: ["IT"], habitualResidence: "IT" },
      ],
      proceeding: "divorce",
      forumState: "IT",
      dateCourtSeised: "2024-03-01",
      choiceOfLaw: {
        chosenLaw: "DE",
        dateOfChoice: "2023-10-01",
        inWritingDatedSigned: true,
      },
    } satisfies DivorceCase,
  },
  {
    id: "div-loi-prive-pas-divorce",
    kind: "divorce",
    title: "Divorce — loi désignée ne permettant pas le divorce (art. 10)",
    summary:
      "Couple marocain résidant en France ; selon les rattachements habituels la loi marocaine pourrait être désignée. Application de l'art. 10 (lex fori).",
    tags: ["1259/2010", "art. 10", "ordre public"],
    payload: {
      spouses: [
        { id: "A", nationalities: ["MA"], habitualResidence: "FR" },
        { id: "B", nationalities: ["MA"], habitualResidence: "FR" },
      ],
      proceeding: "divorce",
      forumState: "FR",
      dateCourtSeised: "2024-03-01",
      designatedLawDoesNotAllowDivorce: true,
    } satisfies DivorceCase,
  },

  // ─── Bruxelles II ter — matrimonial ──────────────────────────────
  {
    id: "bii-mat-applicant-1y-fr",
    kind: "bii-matrimonial",
    title: "B IIter matrimonial — demandeur FR depuis 14 mois",
    summary:
      "Le demandeur français résidant en France depuis 14 mois (art. 3(1)(a)(v)) ; défendeur allemand résidant en DE.",
    tags: ["2019/1111", "art. 3", "FR"],
    payload: {
      spouses: [
        {
          id: "A",
          nationalities: ["FR"],
          habitualResidence: "FR",
          monthsInHabitualResidence: 14,
        },
        { id: "B", nationalities: ["DE"], habitualResidence: "DE" },
      ],
      proceeding: "divorce",
      dateCourtSeised: "2024-03-01",
      forumState: "FR",
      applicantId: "A",
    } satisfies BiiMatrimonialCase,
  },

  // ─── Bruxelles II ter — parental ─────────────────────────────────
  {
    id: "bii-par-enlevement-illicite",
    kind: "bii-parental",
    title: "B IIter parental — enlèvement illicite FR → GB",
    summary:
      "Enfant déplacé illicitement de France vers le Royaume-Uni en novembre 2023. Compétence FR maintenue (art. 9).",
    tags: ["2019/1111", "art. 9", "enlèvement"],
    payload: {
      child: { id: "C", habitualResidence: "GB" },
      unlawfulRemoval: {
        fromState: "FR",
        toState: "GB",
        dateOfRemoval: "2023-11-20",
      },
      forumState: "FR",
      dateCourtSeised: "2024-01-15",
    } satisfies BiiParentalResponsibilityCase,
  },

  // ─── Décès d'un conjoint (combined) ─────────────────────────────
  {
    id: "comb-deces-conjoint-fr-de",
    kind: "combined",
    title: "Décès d'un conjoint — défunt allemand résidant en France",
    summary:
      "Concentration art. 4 R2016/1103 sur le for successoral FR ; orchestration succession + régime.",
    tags: ["650/2012", "2016/1103", "art. 4", "Mahnkopf"],
    payload: {
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
    } satisfies CombinedCase,
  },

  // ─── Aliments (Règl. 4/2009 + Protocole 2007) ────────────────────
  {
    id: "main-child-fr-de",
    kind: "maintenance",
    title: "Aliments — enfant FR vs père en DE",
    summary:
      "Pension alimentaire pour un enfant mineur résidant en France réclamée à son père installé en Allemagne. Saisine du juge français.",
    tags: ["4/2009", "P.3", "child", "FR-DE"],
    payload: {
      creditor: {
        id: "child",
        habitualResidence: "FR",
        nationalities: ["FR"],
        isMinor: true,
      },
      debtor: {
        id: "father",
        habitualResidence: "DE",
        nationalities: ["DE"],
      },
      relation: "child",
      forumState: "FR",
      dateCourtSeised: "2024-04-01",
    } satisfies MaintenanceCase,
  },
  {
    id: "main-spouse-it-fr-objection",
    kind: "maintenance",
    title: "Aliments — entre époux IT-FR avec opposition art. 5",
    summary:
      "Demande d'aliments entre ex-époux résidant respectivement en Italie et en France ; le débiteur invoque la loi italienne (dernière RH commune).",
    tags: ["4/2009", "P.5", "spouse"],
    payload: {
      creditor: {
        id: "wife",
        habitualResidence: "FR",
        nationalities: ["FR"],
      },
      debtor: {
        id: "husband",
        habitualResidence: "IT",
        nationalities: ["IT"],
      },
      relation: "former-spouse",
      forumState: "FR",
      dateCourtSeised: "2024-04-01",
      spouseObjection: { closerConnectionWith: "IT" },
    } satisfies MaintenanceCase,
  },
  {
    id: "main-elder-care-fr-pt",
    kind: "maintenance",
    title: "Aliments — parent âgé en PT, enfant en FR",
    summary:
      "Parent portugais résidant au Portugal sollicitant des aliments de son enfant adulte établi en France.",
    tags: ["4/2009", "P.3", "ascendant"],
    payload: {
      creditor: {
        id: "mother",
        habitualResidence: "PT",
        nationalities: ["PT"],
      },
      debtor: {
        id: "son",
        habitualResidence: "FR",
        nationalities: ["PT", "FR"],
      },
      relation: "ascendant",
      forumState: "FR",
      dateCourtSeised: "2024-04-01",
    } satisfies MaintenanceCase,
  },

  // ─── Reconnaissance & exécution ──────────────────────────────────
  {
    id: "rec-r650-judgment-de-fr",
    kind: "recognition",
    title: "Reconnaissance — décision successorale DE en FR (R 650)",
    summary:
      "Décision juridictionnelle successorale rendue en Allemagne, à invoquer/exécuter en France. Reconnaissance auto art. 39 ; déclaration d'exécution art. 43.",
    tags: ["650/2012", "reconnaissance", "exéquatur"],
    payload: {
      instrument: {
        regulation: "650-2012",
        kind: "judgment",
        originState: "DE",
        issuedOn: "2023-06-01",
      },
      forumState: "FR",
    } satisfies RecognitionCase,
  },
  {
    id: "rec-r4-protocol-fr",
    kind: "recognition",
    title: "Aliments — décision FR à exécuter en DE (Section 1, R 4/2009)",
    summary:
      "Origine FR (lié au Protocole 2007). Reconnaissance et exécution sans aucune procédure (art. 17, 20). Refus uniquement sur les motifs limités de l'art. 21.",
    tags: ["4/2009", "Protocole 2007", "reconnaissance directe"],
    payload: {
      instrument: {
        regulation: "4-2009",
        kind: "judgment",
        originState: "FR",
        issuedOn: "2023-09-15",
      },
      forumState: "DE",
      originBoundByHagueProtocol: true,
    } satisfies RecognitionCase,
  },
  {
    id: "rec-bii-parental",
    kind: "recognition",
    title: "Décision parentale IT en FR (B IIter — exéquatur aboli)",
    summary:
      "Décision en matière de responsabilité parentale rendue en Italie. Bruxelles II ter abolit l'exéquatur (art. 30, 34) — exécution directe avec annexe III.",
    tags: ["2019/1111", "parental", "exéquatur aboli"],
    payload: {
      instrument: {
        regulation: "2019-1111",
        kind: "judgment",
        originState: "IT",
        issuedOn: "2023-04-01",
      },
      forumState: "FR",
    } satisfies RecognitionCase,
  },
  {
    id: "rec-r4-section2-dk",
    kind: "recognition",
    title: "Aliments DK → FR (Section 2 R 4/2009 — exéquatur conservé)",
    summary:
      "Origine DK (non lié par le Protocole 2007). Procédure d'exequatur de la Section 2 ; motifs de refus étendus (art. 24).",
    tags: ["4/2009", "DK", "Section 2", "exéquatur"],
    payload: {
      instrument: {
        regulation: "4-2009",
        kind: "judgment",
        originState: "DK",
        issuedOn: "2023-02-10",
      },
      forumState: "FR",
      originBoundByHagueProtocol: false,
    } satisfies RecognitionCase,
  },

  // ─── Enlèvement (La Haye 1980) ───────────────────────────────────
  {
    id: "h1980-fr-de-onyear",
    kind: "hague-1980",
    title: "Enlèvement FR → DE, demande dans l'année",
    summary:
      "Enfant déplacé illicitement de France vers l'Allemagne, demande de retour introduite 3 mois après. Retour présumé (art. 12 al. 1).",
    tags: ["La Haye 1980", "art. 12", "retour"],
    payload: {
      child: {
        id: "C",
        ageAtRemoval: 8,
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
    } satisfies Hague1980Case,
  },
  {
    id: "h1980-fr-gb-grave-risk",
    kind: "hague-1980",
    title: "Enlèvement FR → GB avec art. 13(1)(b) invoqué",
    summary:
      "Risque grave de danger invoqué par le parent ravisseur. Le retour peut être refusé sous réserve d'appréciation in concreto et art. 11(4) B IIter.",
    tags: ["La Haye 1980", "art. 13(1)(b)", "risque grave"],
    payload: {
      child: {
        id: "C",
        ageAtRemoval: 5,
        habitualResidenceBeforeRemoval: "FR",
      },
      removal: {
        fromState: "FR",
        toState: "GB",
        dateOfRemovalOrRetention: "2023-11-20",
        breachOfCustodyRights: true,
        custodyRightsActuallyExercised: true,
      },
      application: {
        dateOfApplication: "2024-02-15",
        requestingState: "FR",
      },
      defenses: { graveRiskOfHarm: true },
    } satisfies Hague1980Case,
  },

  // ─── Crise conjugale (crisis) ────────────────────────────────────
  {
    id: "crisis-fr-it-divorce-enfant-fr",
    kind: "crisis",
    title: "Crise — divorce FR-IT à Paris avec enfant en France",
    summary:
      "Divorce d'un couple franco-italien résidant en France, un enfant. Compétence FR (art. 3 B IIter), loi française divorce + régime, parental FR.",
    tags: ["650", "1103", "1259", "2019/1111", "crise"],
    payload: {
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
        marriage: { dateOfMarriage: "2020-06-01", placeOfMarriage: "FR" },
      },
      parentalResponsibility: {
        child: { id: "C", habitualResidence: "FR" },
        forumState: "FR",
        dateCourtSeised: "2024-03-01",
      },
    } satisfies CrisisCase,
  },
];

export interface TemplateMeta {
  id: string;
  kind: CaseKind;
  title: string;
  summary: string;
  tags: string[];
}

export function listTemplates(filter?: { kind?: CaseKind }): TemplateMeta[] {
  const out = filter?.kind
    ? TEMPLATES.filter((t) => t.kind === filter.kind)
    : TEMPLATES;
  return out.map(({ payload: _p, ...meta }) => meta);
}

export function getTemplate(id: string): CaseTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
