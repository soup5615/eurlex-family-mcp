import type { Asset, CountryCode, SuccessionCase } from "../types.js";

// PIL of third states — succession conflict-of-laws rules used to test
// renvoi under Art. 34 of Reg. (EU) No 650/2012.
//
// A third state's PIL may:
//   (a) apply its own law (no renvoi),
//   (b) refer to the law of a Member State bound by the Regulation,
//   (c) refer to the law of another third state (then we look at that
//       state's rule to decide whether it would apply its own law — see
//       Art. 34(1)(b)).
//
// Some systems are scissionist (distinct rules for movables and
// immovables). The outcome may differ depending on whether we look at a
// specific asset. This module returns the designation for the
// "succession as a whole" unless the caller drills down by asset.
//
// SOURCES (informational, not official):
//  - CH: LDIP art. 86-91
//  - GB (E&W): common-law conflict rules — movables: last domicile;
//    immovables: lex rei sitae
//  - NO: Act on succession conflicts of 2021 — habitual residence
//  - IS: Icelandic Act on private international law (largely follows
//    Hague Convention principles) — nationality principle with
//    corrections; we model simply as "applies Icelandic law if HR in
//    IS" and refer to nationality otherwise.
//  - RU: art. 1224 Civil Code — last domicile; immovables: lex rei sitae.
//  - UA: art. 70 Ukrainian Private International Law Act — last domicile;
//    immovables: lex rei sitae.
//  - TR: art. 20 Turkish Private International Law Act — national law of
//    deceased; immovables: lex rei sitae.
//  - MA: succession of Moroccans governed by Moroccan personal status
//    (Code de la famille) — nationality principle for Muslim Moroccans.
//  - DZ: art. 16 Algerian Civil Code — national law of deceased.
//  - TN: art. 54 Tunisian Code of Private International Law — national
//    law of deceased.
//  - US: state-by-state; generally last domicile for movables, lex rei
//    sitae for immovables. Here we use that aggregate rule.
//  - CN: last domicile for movables, lex rei sitae for immovables (art.
//    31 Chinese Private International Law Act).

export type PilDesignation =
  | { kind: "own-law" }
  | { kind: "refer-to"; country: CountryCode; rationale: string }
  | {
      kind: "scission";
      movables: { kind: "refer-to"; country: CountryCode; rationale: string } | { kind: "own-law" };
      immovables: "lex-rei-sitae";
      rationale: string;
    };

export interface ThirdStatePilRule {
  country: CountryCode;
  source: string;
  designate: (input: SuccessionCase) => PilDesignation;
}

const hrOf = (i: SuccessionCase) =>
  i.deceased.lastHabitualResidence.toUpperCase();
const natsOf = (i: SuccessionCase) =>
  i.deceased.nationalities.map((n) => n.toUpperCase());

const RULES: ThirdStatePilRule[] = [
  {
    country: "CH",
    source: "Loi fédérale suisse sur le droit international privé, art. 90-91",
    designate(i) {
      // Art. 90 LDIP: CH last domicile → Swiss law.
      // Art. 91 LDIP: foreign last domicile → law designated by the PIL
      // of that state (renvoi accepted).
      if (hrOf(i) === "CH") return { kind: "own-law" };
      return {
        kind: "refer-to",
        country: hrOf(i),
        rationale:
          "Art. 91 LDIP : succession d'un défunt ayant son dernier domicile à l'étranger, régie par la loi désignée par le DIP de cet État.",
      };
    },
  },
  {
    country: "GB",
    source: "Common law (E&W) conflict rules",
    designate(i) {
      return {
        kind: "scission",
        movables: {
          kind: "refer-to",
          country: hrOf(i), // approximation: last domicile ≈ last HR
          rationale:
            "Common-law : succession mobilière régie par la loi du dernier domicile du défunt (approximé ici par la dernière résidence habituelle).",
        },
        immovables: "lex-rei-sitae",
        rationale:
          "Système scissioniste : mobilier = dernier domicile ; immeubles = lex rei sitae.",
      };
    },
  },
  {
    country: "NO",
    source: "Norwegian Succession Conflict of Laws Act 2021",
    designate(i) {
      if (hrOf(i) === "NO") return { kind: "own-law" };
      return {
        kind: "refer-to",
        country: hrOf(i),
        rationale:
          "Rattachement de principe à la résidence habituelle du défunt (aligné sur le règlement 650/2012).",
      };
    },
  },
  {
    country: "IS",
    source: "Icelandic PIL — nationality principle with corrections",
    designate(i) {
      const nats = natsOf(i);
      if (nats.includes("IS") && hrOf(i) === "IS") {
        return { kind: "own-law" };
      }
      if (nats.length > 0) {
        const first = nats[0]!;
        return {
          kind: "refer-to",
          country: first,
          rationale: `Rattachement à la nationalité du défunt (${first}) ; en présence de plusieurs nationalités, appréciation in concreto.`,
        };
      }
      return {
        kind: "refer-to",
        country: hrOf(i),
        rationale: "À défaut de nationalité, rattachement à la résidence habituelle.",
      };
    },
  },
  {
    country: "RU",
    source: "Code civil russe, art. 1224",
    designate(i) {
      return {
        kind: "scission",
        movables: {
          kind: "refer-to",
          country: hrOf(i),
          rationale:
            "Art. 1224(1) CC russe : mobilier régi par la loi du dernier domicile du défunt.",
        },
        immovables: "lex-rei-sitae",
        rationale: "Scission mobilier/immeubles ; immeubles = lex rei sitae.",
      };
    },
  },
  {
    country: "UA",
    source: "Loi ukrainienne sur le DIP, art. 70-72",
    designate(i) {
      return {
        kind: "scission",
        movables: {
          kind: "refer-to",
          country: hrOf(i),
          rationale: "Art. 70 DIP ukrainien : mobilier = dernier domicile du défunt.",
        },
        immovables: "lex-rei-sitae",
        rationale: "Art. 71 DIP ukrainien : immeubles = lex rei sitae.",
      };
    },
  },
  {
    country: "TR",
    source: "Loi turque sur le DIP, art. 20",
    designate(i) {
      const nats = natsOf(i);
      return {
        kind: "scission",
        movables: nats[0]
          ? {
              kind: "refer-to",
              country: nats[0],
              rationale: `Art. 20(1) DIP turc : mobilier régi par la loi nationale du défunt (${nats[0]}).`,
            }
          : { kind: "own-law" },
        immovables: "lex-rei-sitae",
        rationale: "Art. 20(2) DIP turc : immeubles = lex rei sitae.",
      };
    },
  },
  {
    country: "MA",
    source: "Code marocain de la famille (Moudawana) ; personnel statut",
    designate(i) {
      const nats = natsOf(i);
      if (nats[0]) {
        return {
          kind: "refer-to",
          country: nats[0],
          rationale: `Principe de la nationalité : succession régie par la loi nationale (${nats[0]}).`,
        };
      }
      return { kind: "own-law" };
    },
  },
  {
    country: "DZ",
    source: "Code civil algérien, art. 16",
    designate(i) {
      const nats = natsOf(i);
      if (nats[0]) {
        return {
          kind: "refer-to",
          country: nats[0],
          rationale: `Art. 16 CC algérien : loi nationale du défunt (${nats[0]}).`,
        };
      }
      return { kind: "own-law" };
    },
  },
  {
    country: "TN",
    source: "Code tunisien de DIP, art. 54",
    designate(i) {
      const nats = natsOf(i);
      if (nats[0]) {
        return {
          kind: "refer-to",
          country: nats[0],
          rationale: `Art. 54 CDIP tunisien : loi nationale du défunt (${nats[0]}).`,
        };
      }
      return { kind: "own-law" };
    },
  },
  {
    country: "US",
    source: "Conflict-of-laws (Restatement) — movables = last domicile; immovables = lex rei sitae",
    designate(i) {
      return {
        kind: "scission",
        movables: {
          kind: "refer-to",
          country: hrOf(i),
          rationale: "Mobilier : loi du dernier domicile (approximé par la résidence habituelle).",
        },
        immovables: "lex-rei-sitae",
        rationale: "Système scissioniste fédéral-approximé.",
      };
    },
  },
  {
    country: "CN",
    source: "Loi chinoise sur le DIP 2010, art. 31",
    designate(i) {
      return {
        kind: "scission",
        movables: {
          kind: "refer-to",
          country: hrOf(i),
          rationale: "Art. 31 : mobilier = loi de la résidence habituelle au décès.",
        },
        immovables: "lex-rei-sitae",
        rationale: "Art. 31 : immeubles = lex rei sitae.",
      };
    },
  },
];

export function getThirdStateRule(
  country: CountryCode,
): ThirdStatePilRule | undefined {
  const c = country.toUpperCase();
  return RULES.find((r) => r.country === c);
}

export function listThirdStateRules(): ThirdStatePilRule[] {
  return [...RULES];
}

export function describeSituatedLaws(input: SuccessionCase): CountryCode[] {
  return Array.from(
    new Set(
      (input.assets ?? [])
        .filter((a: Asset) => a.kind === "immovable")
        .map((a: Asset) => a.locatedIn.toUpperCase()),
    ),
  );
}
