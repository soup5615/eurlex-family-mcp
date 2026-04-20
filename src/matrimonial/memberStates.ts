// Member States participating in the enhanced cooperation on the law
// applicable to matrimonial property regimes (Reg. (EU) 2016/1103).
//
// Council Decision (EU) 2016/954 of 9 June 2016 authorised enhanced
// cooperation among 17 MS; Cyprus joined subsequently under Decision
// 2017/2284 with applicability from 29 January 2019 for the 18 MS.
//
// Non-participating EU MS (treated as third States for the purposes
// of this Regulation's jurisdiction/applicable-law rules, subject to
// national PIL for the same matters).

import type { CountryCode } from "../types.js";

export type MatrimonialRegulationStatus =
  | "bound"
  | "eu-not-bound"
  | "third-state";

const BOUND: readonly CountryCode[] = [
  "BE", "BG", "CY", "CZ", "DE", "EL", "ES", "FI", "FR",
  "HR", "IT", "LU", "MT", "NL", "AT", "PT", "SI", "SE",
] as const;

// EL = Greece ISO-like; Greece's ISO code is actually "GR". We
// accept both for robustness.
const ALIASES: Record<string, CountryCode> = { EL: "GR" };

const EU_NOT_BOUND: readonly CountryCode[] = [
  "DK", "IE", "EE", "HU", "LV", "LT", "PL", "RO", "SK",
] as const;

export function normaliseCountry(c: CountryCode): CountryCode {
  const up = c.toUpperCase();
  return ALIASES[up] ?? up;
}

export function matrimonialRegulationStatus(
  country: CountryCode,
): MatrimonialRegulationStatus {
  const c = normaliseCountry(country);
  if (BOUND.includes(c) || c === "GR") return "bound";
  if (EU_NOT_BOUND.includes(c)) return "eu-not-bound";
  return "third-state";
}

export function isMatrimonialBoundState(country: CountryCode): boolean {
  return matrimonialRegulationStatus(country) === "bound";
}

export function listMatrimonialBoundStates(): readonly CountryCode[] {
  // Return canonical codes (GR instead of EL).
  return BOUND.map((c) => (c === "EL" ? "GR" : c));
}
