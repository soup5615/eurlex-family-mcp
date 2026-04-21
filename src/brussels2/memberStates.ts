// Regulation (EU) 2019/1111 (Brussels IIter) binds all EU Member
// States except Denmark.

import type { CountryCode } from "../types.js";

const BOUND: readonly CountryCode[] = [
  "AT", "BE", "BG", "CY", "CZ", "DE", "EE", "GR", "ES",
  "FI", "FR", "HR", "HU", "IE", "IT", "LV", "LT", "LU",
  "MT", "NL", "PL", "PT", "RO", "SK", "SI", "SE",
] as const;

export type BiiStatus = "bound" | "eu-not-bound" | "third-state";

export function biiStatus(country: CountryCode): BiiStatus {
  const c = country.toUpperCase() === "EL" ? "GR" : country.toUpperCase();
  if (BOUND.includes(c)) return "bound";
  if (c === "DK") return "eu-not-bound";
  return "third-state";
}

export function isBiiBoundState(country: CountryCode): boolean {
  return biiStatus(country) === "bound";
}

export function listBiiBoundStates(): readonly CountryCode[] {
  return BOUND;
}
