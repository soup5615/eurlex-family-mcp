#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { analyseSuccession } from "../engine/analyze.js";
import { determineJurisdiction } from "../engine/jurisdiction.js";
import { determineApplicableLaw } from "../engine/applicableLaw.js";
import { analyseRenvoi } from "../engine/renvoi.js";
import { analyseFormalValidity } from "../engine/formalValidity.js";
import { getArticle, listArticles } from "../data/articles.js";
import { CJEU_CASES, findCase } from "../data/cjeuCases.js";
import {
  listBoundMemberStates,
  regulationStatus,
} from "../data/memberStates.js";
import { listThirdStateRules } from "../data/thirdStatePIL.js";
import { renderConsultationHTML } from "../render/html.js";
import { analyseMatrimonial } from "../matrimonial/engine/analyze.js";
import { determineMatrimonialJurisdiction } from "../matrimonial/engine/jurisdiction.js";
import { determineMatrimonialApplicableLaw } from "../matrimonial/engine/applicableLaw.js";
import {
  getMatrimonialArticle,
  listMatrimonialArticles,
} from "../matrimonial/articles.js";
import {
  listMatrimonialBoundStates,
  matrimonialRegulationStatus,
} from "../matrimonial/memberStates.js";
import type { Disposition, SuccessionCase } from "../types.js";
import type { MatrimonialCase } from "../matrimonial/types.js";

const CountryCode = z
  .string()
  .regex(/^[A-Za-z]{2}$/, "ISO 3166-1 alpha-2")
  .describe("Code pays ISO 3166-1 alpha-2 (ex. FR, DE, IT)");

const ResidencePeriod = z.object({
  country: CountryCode,
  years: z.number().nonnegative(),
});

const Deceased = z.object({
  nationalities: z.array(CountryCode).min(0),
  lastHabitualResidence: CountryCode,
  residenceHistory: z.array(ResidencePeriod).optional(),
  dateOfDeath: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const ProfessioJuris = z.object({
  chosenLaw: CountryCode,
  form: z.enum(["express", "implicit-from-disposition"]),
  dateOfChoice: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const DispositionForm = z.object({
  written: z.boolean().optional(),
  holograph: z.boolean().optional(),
  joint: z.boolean().optional(),
  placeOfMaking: CountryCode.optional(),
  nationalitiesAtMaking: z.array(CountryCode).optional(),
  domicileAtMaking: CountryCode.optional(),
  habitualResidenceAtMaking: CountryCode.optional(),
});

const DispositionSchema = z.object({
  type: z.enum(["will", "joint-will", "succession-pact"]),
  dateExecuted: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lawChosenForAdmissibilityAndValidity: CountryCode.optional(),
  otherPartyNationalities: z.array(z.array(CountryCode)).optional(),
  form: DispositionForm.optional(),
});

const Asset = z.object({
  kind: z.enum(["movable", "immovable"]),
  locatedIn: CountryCode,
  estimatedValueEUR: z.number().nonnegative().optional(),
});

const SuccessionCaseShape = {
  deceased: Deceased,
  professioJuris: ProfessioJuris.optional(),
  dispositions: z.array(DispositionSchema).optional(),
  assets: z.array(Asset).optional(),
  forumState: CountryCode.optional(),
  manifestlyCloserConnectionWith: CountryCode.optional(),
};

function asText(obj: unknown): { content: { type: "text"; text: string }[] } {
  return {
    content: [
      { type: "text", text: JSON.stringify(obj, null, 2) },
    ],
  };
}

export function buildServer(): McpServer {
  const server = new McpServer(
    { name: "eurlex-family-mcp", version: "0.1.0" },
    {
      capabilities: { tools: {}, resources: {}, prompts: {} },
      instructions:
        "Moteur de qualification en droit international successoral européen. Outils : analyze_succession, determine_jurisdiction, determine_applicable_law, get_article, list_articles, get_cjeu_case, list_cjeu_cases, list_member_states, regulation_status.",
    },
  );

  server.registerTool(
    "analyze_succession",
    {
      title: "Analyser une succession (Règl. UE 650/2012)",
      description:
        "Analyse complète d'une situation successorale : champ temporel, juridiction (art. 4-11), loi applicable (art. 21-22, 34), dispositions à cause de mort (art. 24-25), recommandation CSE.",
      inputSchema: SuccessionCaseShape,
    },
    async (input) => {
      const analysis = analyseSuccession(input as SuccessionCase);
      return asText(analysis);
    },
  );

  server.registerTool(
    "determine_jurisdiction",
    {
      title: "Déterminer la juridiction compétente",
      description:
        "Détermine la juridiction compétente selon les art. 4, 5-7, 10 et 11 du Règl. (UE) 650/2012.",
      inputSchema: SuccessionCaseShape,
    },
    async (input) => {
      return asText(determineJurisdiction(input as SuccessionCase));
    },
  );

  server.registerTool(
    "determine_applicable_law",
    {
      title: "Déterminer la loi applicable à la succession",
      description:
        "Détermine la loi successorale applicable selon les art. 20-22 et 34 du Règl. (UE) 650/2012.",
      inputSchema: SuccessionCaseShape,
    },
    async (input) => {
      return asText(determineApplicableLaw(input as SuccessionCase));
    },
  );

  server.registerTool(
    "analyse_renvoi",
    {
      title: "Analyser le renvoi (art. 34)",
      description:
        "Applique les règles de DIP de l'État désigné et, le cas échéant, accepte un renvoi vers la loi d'un EM (art. 34(1)(a)) ou d'un État tiers appliquant sa propre loi (art. 34(1)(b)).",
      inputSchema: SuccessionCaseShape,
    },
    async (input) => {
      const law = determineApplicableLaw(input as SuccessionCase);
      return asText(analyseRenvoi(input as SuccessionCase, law));
    },
  );

  server.registerTool(
    "analyse_formal_validity",
    {
      title: "Valider la forme d'une disposition (art. 27)",
      description:
        "Liste les lois qui, en vertu de l'art. 27, pourraient valider la forme d'une disposition écrite (lieu, nationalité, domicile, résidence habituelle, lex rei sitae).",
      inputSchema: {
        case: z.object(SuccessionCaseShape),
        disposition: DispositionSchema,
      },
    },
    async ({ case: c, disposition }) => {
      return asText(
        analyseFormalValidity(
          disposition as Disposition,
          c as SuccessionCase,
        ),
      );
    },
  );

  server.registerTool(
    "consultation_html",
    {
      title: "Générer une note de consultation (HTML)",
      description:
        "Produit une note de consultation HTML exhaustive à partir d'un cas.",
      inputSchema: {
        case: z.object(SuccessionCaseShape),
        title: z.string().optional(),
      },
    },
    async ({ case: c, title }) => {
      const analysis = analyseSuccession(c as SuccessionCase);
      const html = renderConsultationHTML(
        analysis,
        title ? { title } : {},
      );
      return { content: [{ type: "text", text: html }] };
    },
  );

  server.registerTool(
    "list_third_states",
    {
      title: "États tiers dont le DIP est embarqué (art. 34)",
      description:
        "Liste les États tiers pour lesquels le moteur peut tester un renvoi opérationnel.",
      inputSchema: {},
    },
    async () => {
      const items = listThirdStateRules().map((r) => ({
        country: r.country,
        source: r.source,
      }));
      return asText(items);
    },
  );

  server.registerTool(
    "get_article",
    {
      title: "Résumé d'un article du règlement",
      description:
        "Renvoie le titre et un résumé d'un article du Règl. (UE) 650/2012.",
      inputSchema: {
        articleNumber: z
          .string()
          .describe("Numéro d'article (ex. '21', '22', '34')"),
      },
    },
    async ({ articleNumber }) => {
      const a = getArticle(articleNumber);
      if (!a) {
        return asText({ error: `Article ${articleNumber} non trouvé.` });
      }
      return asText(a);
    },
  );

  server.registerTool(
    "list_articles",
    {
      title: "Liste des articles référencés",
      description: "Liste les articles du règlement disponibles dans le moteur.",
      inputSchema: {},
    },
    async () => asText(listArticles()),
  );

  server.registerTool(
    "get_cjeu_case",
    {
      title: "Fiche d'une décision CJUE",
      description:
        "Renvoie la fiche d'une décision de la CJUE interprétant le Règl. (UE) 650/2012.",
      inputSchema: {
        identifier: z
          .string()
          .describe("Numéro d'affaire (ex. 'C-218/16') ou nom (ex. 'Kubicka')"),
      },
    },
    async ({ identifier }) => {
      const c = findCase(identifier);
      if (!c) return asText({ error: `Affaire ${identifier} non trouvée.` });
      return asText(c);
    },
  );

  server.registerTool(
    "list_cjeu_cases",
    {
      title: "Décisions CJUE référencées",
      description: "Liste les décisions CJUE embarquées dans le moteur.",
      inputSchema: {},
    },
    async () => asText(CJEU_CASES),
  );

  server.registerTool(
    "list_member_states",
    {
      title: "États membres liés par le règlement",
      description:
        "Liste les codes ISO des États membres de l'UE liés par le Règl. (UE) 650/2012.",
      inputSchema: {},
    },
    async () => asText(listBoundMemberStates()),
  );

  server.registerTool(
    "regulation_status",
    {
      title: "Statut d'un pays au regard du règlement",
      description:
        "Renvoie 'bound' (EM lié), 'eu-not-bound' (IE/DK) ou 'third-state'.",
      inputSchema: { country: CountryCode },
    },
    async ({ country }) => {
      return asText({ country: country.toUpperCase(), status: regulationStatus(country) });
    },
  );

  // -----------------------------------------------------------------
  // Brique 2 — Regulation (EU) 2016/1103 (matrimonial property regimes)
  // -----------------------------------------------------------------

  const Spouse = z.object({
    id: z.string(),
    nationalities: z.array(CountryCode),
    habitualResidence: CountryCode,
    residenceHistory: z.array(ResidencePeriod).optional(),
  });

  const Marriage = z.object({
    dateOfMarriage: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    placeOfMarriage: CountryCode.optional(),
  });

  const MatrimonialChoiceOfLaw = z.object({
    chosenLaw: CountryCode,
    form: z.enum(["express-writing", "implicit-from-mpa"]),
    dateOfChoice: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    retroactive: z.boolean().optional(),
    inWritingDatedSigned: z.boolean().optional(),
    hrAtChoice: z
      .array(z.object({ spouseId: z.string(), country: CountryCode }))
      .optional(),
  });

  const MpaSchema = z.object({
    dateExecuted: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    kind: z.enum([
      "separation-of-property",
      "community-of-property",
      "participation-in-acquisitions",
      "other",
      "none",
    ]),
    placeOfExecution: CountryCode.optional(),
    inWritingDatedSigned: z.boolean().optional(),
  });

  const MatrimonialContext = z.object({
    deathOfSpouse: z
      .object({
        spouseId: z.string(),
        forumSeisedForSuccession: CountryCode.optional(),
      })
      .optional(),
    matrimonialCause: z
      .object({
        kind: z.enum(["divorce", "separation", "annulment"]),
        forumSeisedForDivorce: CountryCode.optional(),
        seisedAfterJanuary29_2019: z.boolean().optional(),
      })
      .optional(),
    forumState: CountryCode.optional(),
    choiceOfCourt: z
      .object({
        mostRecentState: CountryCode,
        inWritingDatedSigned: z.boolean(),
      })
      .optional(),
  });

  const MatrimonialCaseShape = {
    spouses: z.tuple([Spouse, Spouse]),
    marriage: Marriage,
    choiceOfLaw: MatrimonialChoiceOfLaw.optional(),
    mpa: MpaSchema.optional(),
    context: MatrimonialContext,
    jurisdictionAssets: z
      .array(
        z.object({
          locatedIn: CountryCode,
          kind: z.enum(["movable", "immovable"]),
        }),
      )
      .optional(),
  };

  server.registerTool(
    "analyze_matrimonial_regime",
    {
      title: "Analyser un régime matrimonial (Règl. UE 2016/1103)",
      description:
        "Analyse complète d'un régime matrimonial : champ temporel (art. 69), juridiction (art. 4-11), loi applicable (art. 22, 26, 32), validité formelle MPA/choix de loi (art. 23, 25).",
      inputSchema: MatrimonialCaseShape,
    },
    async (input) => asText(analyseMatrimonial(input as MatrimonialCase)),
  );

  server.registerTool(
    "determine_matrimonial_jurisdiction",
    {
      title: "Déterminer la juridiction compétente (régime matrimonial)",
      description:
        "Détermine la juridiction compétente selon les art. 4, 5, 6, 7, 10 et 11 du Règl. (UE) 2016/1103.",
      inputSchema: MatrimonialCaseShape,
    },
    async (input) =>
      asText(determineMatrimonialJurisdiction(input as MatrimonialCase)),
  );

  server.registerTool(
    "determine_matrimonial_applicable_law",
    {
      title: "Déterminer la loi applicable au régime matrimonial",
      description:
        "Applique l'art. 22 (choix) puis la cascade de l'art. 26 ; rappelle l'exclusion du renvoi (art. 32).",
      inputSchema: MatrimonialCaseShape,
    },
    async (input) =>
      asText(determineMatrimonialApplicableLaw(input as MatrimonialCase)),
  );

  server.registerTool(
    "get_matrimonial_article",
    {
      title: "Résumé d'un article du Règl. 2016/1103",
      description: "Renvoie le résumé d'un article du règlement régimes matrimoniaux.",
      inputSchema: {
        articleNumber: z.string(),
      },
    },
    async ({ articleNumber }) => {
      const a = getMatrimonialArticle(articleNumber);
      if (!a) return asText({ error: `Article ${articleNumber} non trouvé.` });
      return asText(a);
    },
  );

  server.registerTool(
    "list_matrimonial_articles",
    {
      title: "Liste des articles du Règl. 2016/1103 référencés",
      description:
        "Liste les articles couverts par le moteur régimes matrimoniaux.",
      inputSchema: {},
    },
    async () => asText(listMatrimonialArticles()),
  );

  server.registerTool(
    "list_matrimonial_member_states",
    {
      title: "États liés par le Règl. 2016/1103 (coopération renforcée)",
      description:
        "Liste les 18 États membres participant à la coopération renforcée sur les régimes matrimoniaux.",
      inputSchema: {},
    },
    async () => asText(listMatrimonialBoundStates()),
  );

  server.registerTool(
    "matrimonial_regulation_status",
    {
      title: "Statut d'un pays au regard du Règl. 2016/1103",
      description:
        "Renvoie 'bound' (EM participant), 'eu-not-bound' ou 'third-state'.",
      inputSchema: { country: CountryCode },
    },
    async ({ country }) => {
      return asText({
        country: country.toUpperCase(),
        status: matrimonialRegulationStatus(country),
      });
    },
  );

  return server;
}

async function main(): Promise<void> {
  const server = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

const entry =
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("server.ts") || process.argv[1].endsWith("server.js"));

if (entry) {
  main().catch((err) => {
    process.stderr.write(`MCP server error: ${(err as Error).stack ?? err}\n`);
    process.exit(1);
  });
}
