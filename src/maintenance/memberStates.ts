// Reg. (EC) 4/2009 binds all 27 EU MS for jurisdiction, recognition
// and cooperation. The applicable-law chapter (art. 15) incorporates
// the Hague Protocol of 23 November 2007. Denmark did not ratify the
// Protocol; consequently DK courts apply national PIL rules to
// maintenance applicable law (the Regulation otherwise applies).
// The UK did not opt in to the Protocol either, but is now a third
// State.

import type { CountryCode } from "../types.js";

const ALL_EU = [
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "GR", "ES",
  "FI", "FR", "HR", "HU", "IE", "IT", "LV", "LT", "LU", "MT",
  "NL", "PL", "PT", "RO", "SK", "SI", "SE",
] as const;

export type MaintenanceStatus = "bound-full" | "bound-no-protocol" | "third-state";

export function maintenanceStatus(country: CountryCode): MaintenanceStatus {
  const c = country.toUpperCase() === "EL" ? "GR" : country.toUpperCase();
  if (c === "DK") return "bound-no-protocol";
  if ((ALL_EU as readonly string[]).includes(c)) return "bound-full";
  return "third-state";
}

export function isMaintenanceBoundState(country: CountryCode): boolean {
  return maintenanceStatus(country) !== "third-state";
}

export function protocolApplies(forumState: CountryCode): boolean {
  return maintenanceStatus(forumState) === "bound-full";
}

export function listMaintenanceBoundStates(): readonly CountryCode[] {
  return ALL_EU;
}
