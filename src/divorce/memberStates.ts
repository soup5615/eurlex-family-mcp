// Member States participating in the enhanced cooperation on the law
// applicable to divorce and legal separation (Reg. (EU) No 1259/2010).
// 14 initial MS, then Lithuania (2014), Greece (2015), Estonia (2018).

import type { CountryCode } from "../types.js";

export type Rome3Status = "bound" | "eu-not-bound" | "third-state";

const BOUND: readonly CountryCode[] = [
  "AT", "BE", "BG", "DE", "EE", "ES", "FR", "GR", "HU",
  "IT", "LT", "LU", "LV", "MT", "PT", "RO", "SI",
] as const;

const EU_NOT_BOUND: readonly CountryCode[] = [
  "CY", "CZ", "DK", "FI", "HR", "IE", "NL", "PL", "SE", "SK",
] as const;

export function rome3Status(country: CountryCode): Rome3Status {
  const c = country.toUpperCase() === "EL" ? "GR" : country.toUpperCase();
  if (BOUND.includes(c)) return "bound";
  if (EU_NOT_BOUND.includes(c)) return "eu-not-bound";
  return "third-state";
}

export function isRome3BoundState(country: CountryCode): boolean {
  return rome3Status(country) === "bound";
}

export function listRome3BoundStates(): readonly CountryCode[] {
  return BOUND;
}
