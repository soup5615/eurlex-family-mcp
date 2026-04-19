# eurlex-family-mcp

Moteur de qualification en droit international successoral européen —
Règlement (UE) n° 650/2012.

**Brique 1 / 4** du projet : qualification conflictuelle (compétence, loi
applicable, dispositions à cause de mort, Certificat successoral européen).
Briques suivantes prévues : régimes matrimoniaux (Règl. 2016/1103),
partenariats (2016/1104), divorce (Rome III), responsabilité parentale
(Bruxelles II ter), interface web, base jurisprudentielle étendue.

## Architecture

```
src/
├── data/           Constantes juridiques : EM liés, articles, arrêts CJUE
├── engine/         Moteurs de raisonnement (règles typées)
│   ├── scope.ts           Champ d'application (art. 1, 83)
│   ├── jurisdiction.ts    Compétence (art. 4, 5-7, 10, 11)
│   ├── applicableLaw.ts   Loi applicable (art. 20-22, 34)
│   ├── dispositions.ts    Dispositions à cause de mort (art. 24-25)
│   ├── esc.ts             Certificat successoral européen (art. 62+)
│   └── analyze.ts         Orchestrateur
├── mcp/server.ts   Serveur MCP (stdio) exposant les outils
└── cli.ts          CLI
tests/              Tests (vitest), dont cas CJUE réels
```

## Utilisation

```bash
npm install
npm test
npm run build

# CLI
node dist/cli.js articles
node dist/cli.js article 22
node dist/cli.js case Kubicka
cat case.json | node dist/cli.js analyze
node dist/cli.js analyze --file case.json --json-out

# Serveur MCP (stdio)
node dist/mcp/server.js
```

### Format d'un cas (JSON)

```json
{
  "deceased": {
    "nationalities": ["FR"],
    "lastHabitualResidence": "DE",
    "dateOfDeath": "2023-05-10",
    "residenceHistory": [{ "country": "FR", "years": 3 }]
  },
  "professioJuris": { "chosenLaw": "FR", "form": "express" },
  "dispositions": [
    {
      "type": "will",
      "dateExecuted": "2018-01-12",
      "lawChosenForAdmissibilityAndValidity": "FR"
    }
  ],
  "assets": [
    { "kind": "immovable", "locatedIn": "FR" },
    { "kind": "movable", "locatedIn": "DE" }
  ],
  "forumState": "DE"
}
```

### Sortie

L'analyse produit, pour chaque volet (compétence, loi applicable,
dispositions, CSE), la base juridique, le raisonnement article par article
et les points de vigilance (renvoi, dissociation for/loi, compétences
subsidiaires, ordre public à vérifier).

## Outils MCP exposés

- `analyze_succession` — analyse complète
- `determine_jurisdiction` — art. 4-11
- `determine_applicable_law` — art. 20-22, 34
- `get_article` / `list_articles` — résumés d'articles
- `get_cjeu_case` / `list_cjeu_cases` — arrêts CJUE embarqués
- `list_member_states` / `regulation_status` — référentiel d'États

## Couverture jurisprudentielle (noyau)

Mahnkopf (C-558/16), Kubicka (C-218/16), Oberle (C-20/17), WB (C-658/17),
E.E. (C-80/19), UM (C-277/20), V A et Z A (C-645/20).

## Limitations connues

- Le moteur n'embarque pas encore les règles de DIP des États tiers
  nécessaires au test opérationnel de l'art. 34 (renvoi) ; il signale le
  cas et décrit le test à réaliser.
- L'art. 24(1) / 25(1) est approximé avec la résidence habituelle
  actuelle ; une future version demandera la HR à la date de la
  disposition.
- La validité formelle des dispositions (art. 27) n'est pas encore
  modélisée.
- Aucun LLM n'est utilisé : les conclusions sont déterministes et
  auditables. Un éventuel générateur de notes par LLM viendra en
  surcouche.

## Avertissement

Outil d'aide à la décision ; ne se substitue pas à la consultation d'un
professionnel du droit. Les résumés d'articles et d'arrêts sont
informatifs ; se reporter aux textes officiels (EUR-Lex, curia.europa.eu).

## Licence

Propriétaire — tous droits réservés.
