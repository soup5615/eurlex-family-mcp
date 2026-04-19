import { regulationStatus } from "../data/memberStates.js";
import type {
  ApplicableLawDetermination,
  CountryCode,
  ProfessioJuris,
  ReasoningStep,
  SuccessionCase,
} from "../types.js";

export function determineApplicableLaw(
  input: SuccessionCase,
): ApplicableLawDetermination {
  const reasoning: ReasoningStep[] = [];
  const warnings: string[] = [];

  const hr = input.deceased.lastHabitualResidence.toUpperCase();
  const nats = input.deceased.nationalities.map((n) => n.toUpperCase());

  // Art. 22 — professio juris takes precedence over Art. 21.
  if (input.professioJuris) {
    const pj = input.professioJuris;
    const chosen = pj.chosenLaw.toUpperCase();
    const validity = validateProfessioJuris(pj, nats);
    if (validity.valid) {
      reasoning.push({
        article: "Art. 22 Règl. (UE) 650/2012",
        rule: "Une personne peut choisir comme loi régissant sa succession la loi de l'État dont elle a la nationalité au moment du choix ou au moment du décès. Le choix doit être exprès ou résulter des termes d'une disposition à cause de mort.",
        appliedTo: `Nationalités : ${nats.join(", ") || "(aucune)"} ; loi choisie : ${chosen} ; forme : ${pj.form}${pj.dateOfChoice ? ` ; date du choix : ${pj.dateOfChoice}` : ""}.`,
        conclusion: `Loi successorale applicable : droit de ${chosen} (choix valable).`,
      });
      return {
        applicableLaw: chosen,
        basis: "art-22-professio-juris",
        universalApplication: true,
        renvoiConsidered: false, // Art. 34(2): pas de renvoi si art. 22.
        reasoning,
        warnings,
      };
    }
    warnings.push(
      `Art. 22 : choix de loi présumé invalide (${validity.reason}). Retour à la règle générale de l'art. 21.`,
    );
  }

  // Art. 21(2) — manifestly closer connection.
  const closer = input.manifestlyCloserConnectionWith?.toUpperCase();
  if (closer && closer !== hr) {
    reasoning.push({
      article: "Art. 21(2) Règl. (UE) 650/2012",
      rule: "À titre exceptionnel, lorsque le défunt présentait, au moment du décès, des liens manifestement plus étroits avec un État autre que celui de sa résidence habituelle, la loi de cet autre État s'applique.",
      appliedTo: `Liens manifestement plus étroits signalés avec ${closer} (résidence habituelle : ${hr}).`,
      conclusion: `Loi successorale applicable : droit de ${closer} (clause d'exception de l'art. 21(2)).`,
    });
    warnings.push(
      "Art. 21(2) est une dérogation à caractère exceptionnel ; le juge doit motiver finement l'ensemble des circonstances (durée, stabilité, centre des intérêts, famille, biens).",
    );
    return {
      applicableLaw: closer,
      basis: "art-21-2-manifestly-closer-connection",
      universalApplication: true,
      renvoiConsidered: false, // Art. 34(2): pas de renvoi si art. 21(2).
      reasoning,
      warnings,
    };
  }

  // Art. 21(1) — general rule: last habitual residence.
  reasoning.push({
    article: "Art. 21(1) Règl. (UE) 650/2012",
    rule: "La loi applicable à l'ensemble d'une succession est celle de l'État dans lequel le défunt avait sa résidence habituelle au moment du décès.",
    appliedTo: `Résidence habituelle au décès : ${hr}.`,
    conclusion: `Loi successorale désignée : droit de ${hr} (art. 20 : application universelle, même si ${hr} n'est pas un État membre).`,
  });

  // Art. 34 — renvoi may apply when the designated law is that of a third
  // state.
  const hrStatus = regulationStatus(hr);
  const out: ApplicableLawDetermination = {
    applicableLaw: hr,
    basis: "art-21-1-habitual-residence",
    universalApplication: true,
    renvoiConsidered: hrStatus === "third-state",
    reasoning,
    warnings,
  };

  if (hrStatus === "third-state") {
    warnings.push(
      `Art. 34 : ${hr} étant un État tiers, le moteur examine le renvoi via son DIP (voir section renvoi).`,
    );
  } else if (hrStatus === "eu-not-bound") {
    warnings.push(
      `${hr} est un État membre non lié par le règlement (Danemark / Irlande) mais est traité comme un État tiers aux fins du règlement ; l'art. 34 s'applique donc également.`,
    );
    out.renvoiConsidered = true;
  }

  return out;
}

export interface ProfessioJurisValidity {
  valid: boolean;
  reason: string;
}

export function validateProfessioJuris(
  pj: ProfessioJuris,
  nationalitiesAtDeath: CountryCode[],
): ProfessioJurisValidity {
  const chosen = pj.chosenLaw.toUpperCase();
  const nats = nationalitiesAtDeath.map((n) => n.toUpperCase());
  // The person must have had the chosen nationality either at the time
  // of the choice OR at the time of death. This engine does not track
  // historical nationalities; if the chosen law matches a nationality at
  // death, the choice is considered valid. Otherwise we flag for manual
  // review (the user may have had the nationality at the time of choice
  // only, which is still valid under Art. 22(1)).
  if (nats.includes(chosen)) {
    return { valid: true, reason: "nationalité présente au décès" };
  }
  return {
    valid: false,
    reason: `la loi choisie (${chosen}) ne correspond à aucune nationalité au décès ; vérifier si cette nationalité existait au moment du choix (art. 22(1) le permet).`,
  };
}
