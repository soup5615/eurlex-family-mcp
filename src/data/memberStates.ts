// Status of each country with respect to Regulation (EU) No 650/2012
// on jurisdiction, applicable law, recognition and enforcement of
// decisions, and the European Certificate of Succession.
//
// - "bound": EU Member State bound by the Regulation (participates).
// - "eu-not-bound": EU Member State that did NOT opt in (Ireland, Denmark).
// - "third-state": non-EU state. The Regulation still applies in a
//   bound MS but can designate the law of a third state (Art. 20,
//   universal application).

export type CountryCode = string; // ISO 3166-1 alpha-2, uppercase.

export type RegulationStatus = "bound" | "eu-not-bound" | "third-state";

const BOUND: readonly CountryCode[] = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "EE", "FI", "FR", "DE",
  "GR", "HU", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT",
  "RO", "SK", "SI", "ES", "SE",
] as const;

const EU_NOT_BOUND: readonly CountryCode[] = ["IE", "DK"] as const;

export function regulationStatus(country: CountryCode): RegulationStatus {
  const c = country.toUpperCase();
  if (BOUND.includes(c)) return "bound";
  if (EU_NOT_BOUND.includes(c)) return "eu-not-bound";
  return "third-state";
}

export function isBoundMemberState(country: CountryCode): boolean {
  return regulationStatus(country) === "bound";
}

export function listBoundMemberStates(): readonly CountryCode[] {
  return BOUND;
}
