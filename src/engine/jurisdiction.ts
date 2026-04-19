import {
  isBoundMemberState,
  regulationStatus,
} from "../data/memberStates.js";
import type {
  CountryCode,
  JurisdictionDetermination,
  ReasoningStep,
  SuccessionCase,
} from "../types.js";

export function determineJurisdiction(
  input: SuccessionCase,
): JurisdictionDetermination {
  const reasoning: ReasoningStep[] = [];
  const warnings: string[] = [];

  const hr = input.deceased.lastHabitualResidence.toUpperCase();
  const hrStatus = regulationStatus(hr);

  // Art. 4 — primary rule: last habitual residence in a bound MS.
  if (hrStatus === "bound") {
    reasoning.push({
      article: "Art. 4 Règl. (UE) 650/2012",
      rule: "Les juridictions de l'État membre de la résidence habituelle du défunt au moment du décès sont compétentes pour statuer sur l'ensemble de la succession.",
      appliedTo: `Résidence habituelle au décès : ${hr} (État membre lié par le règlement).`,
      conclusion: `Juridictions de ${hr} compétentes pour l'ensemble de la succession.`,
    });

    // Art. 5-7: if professio juris points to another bound MS, note the
    // possibility of a choice-of-court agreement or declinatoire.
    const pj = input.professioJuris?.chosenLaw.toUpperCase();
    if (pj && pj !== hr && isBoundMemberState(pj)) {
      warnings.push(
        `Art. 5-7 : la loi choisie (art. 22) est celle de ${pj} ; les parties peuvent convenir de la compétence exclusive des juridictions de ${pj} (art. 5) ou solliciter un déclinatoire au bénéfice de ${pj} (art. 6-7).`,
      );
    }

    return {
      competentForum: hr,
      basis: "art-4-habitual-residence",
      scope: "entire-succession",
      reasoning,
      warnings,
    };
  }

  if (hrStatus === "eu-not-bound") {
    warnings.push(
      `Résidence habituelle dans un État membre non lié (${hr} : Danemark / Irlande). Aux fins du règlement, ce pays est traité comme un État tiers (considérants 82-83). Les art. 10 et 11 peuvent trouver à s'appliquer.`,
    );
  }

  // Art. 10 — subsidiary jurisdiction when HR is not in a bound MS.
  const forum = input.forumState?.toUpperCase();
  const forumHasAssets = input.assets?.some(
    (a) => a.locatedIn.toUpperCase() === forum,
  ) ?? false;

  if (forum && isBoundMemberState(forum) && forumHasAssets) {
    // Art. 10(1)(a): nationality of the forum MS at time of death.
    const hadNationality = input.deceased.nationalities
      .map((n) => n.toUpperCase())
      .includes(forum);
    if (hadNationality) {
      reasoning.push({
        article: "Art. 10(1)(a) Règl. (UE) 650/2012",
        rule: "Lorsque la résidence habituelle du défunt n'est pas dans un État membre, les juridictions d'un État membre dans lequel des biens successoraux sont situés sont compétentes pour l'ensemble de la succession si le défunt avait la nationalité de cet État membre au moment du décès.",
        appliedTo: `HR : ${hr} (hors EM lié) ; biens situés dans ${forum} ; nationalité ${forum} au décès.`,
        conclusion: `Juridictions de ${forum} compétentes pour l'ensemble de la succession (compétence subsidiaire).`,
      });
      return {
        competentForum: forum,
        basis: "art-10-1-subsidiary-nationality",
        scope: "entire-succession",
        reasoning,
        warnings,
      };
    }

    // Art. 10(1)(b): previous habitual residence in forum MS, <=5y before seisin.
    const prior = input.deceased.residenceHistory?.find(
      (r) => r.country.toUpperCase() === forum,
    );
    if (prior && prior.years <= 5) {
      reasoning.push({
        article: "Art. 10(1)(b) Règl. (UE) 650/2012",
        rule: "À défaut, les juridictions d'un État membre sont compétentes pour l'ensemble de la succession si le défunt avait sa résidence habituelle antérieure dans cet État membre et pour autant qu'il ne se soit pas écoulé plus de cinq ans depuis le changement de cette résidence au moment où la juridiction est saisie.",
        appliedTo: `HR antérieure dans ${forum} il y a ${prior.years} an(s).`,
        conclusion: `Juridictions de ${forum} compétentes pour l'ensemble de la succession.`,
      });
      return {
        competentForum: forum,
        basis: "art-10-1-subsidiary-previous-residence",
        scope: "entire-succession",
        reasoning,
        warnings,
      };
    }

    // Art. 10(2): jurisdiction limited to assets located in the forum MS.
    reasoning.push({
      article: "Art. 10(2) Règl. (UE) 650/2012",
      rule: "Lorsque aucune juridiction d'un État membre n'est compétente en vertu du paragraphe 1, les juridictions de l'État membre dans lequel des biens successoraux sont situés sont néanmoins compétentes pour statuer sur ces biens.",
      appliedTo: `HR : ${hr} ; aucun critère de l'art. 10(1) rempli ; biens situés dans ${forum}.`,
      conclusion: `Juridictions de ${forum} compétentes limitativement pour les biens situés dans ${forum}.`,
    });
    warnings.push(
      "Art. 10(2) : compétence limitée aux biens situés dans l'État du for. Une procédure séparée peut être nécessaire pour d'autres biens.",
    );
    return {
      competentForum: forum,
      basis: "art-10-2-limited-to-assets",
      scope: "assets-in-forum-only",
      reasoning,
      warnings,
    };
  }

  // Art. 11 — forum necessitatis (narrow exception, fact-intensive).
  warnings.push(
    "Art. 11 : un forum necessitatis dans un État membre reste envisageable à titre exceptionnel, s'il est impossible d'introduire ou de conduire la procédure dans un État tiers présentant un lien étroit, et que l'affaire présente un lien suffisant avec l'État membre saisi. À apprécier au cas par cas.",
  );

  return {
    competentForum: null,
    basis: "none",
    scope: "none",
    reasoning,
    warnings,
  };
}

// Helper: should V A et Z A (C-645/20) be invoked — art. 10 is d'office?
export function isArticle10MandatorilyRaisedExOfficio(
  determination: JurisdictionDetermination,
): boolean {
  return (
    determination.basis === "art-10-1-subsidiary-nationality" ||
    determination.basis === "art-10-1-subsidiary-previous-residence" ||
    determination.basis === "art-10-2-limited-to-assets"
  );
}

// Exposed for callers who want to know whether the forum even makes sense.
export function validateForum(
  forum: CountryCode | undefined,
): { ok: boolean; reason: string } {
  if (!forum) return { ok: true, reason: "aucun for précisé" };
  const s = regulationStatus(forum);
  if (s === "bound") return { ok: true, reason: `${forum}: État membre lié` };
  return {
    ok: false,
    reason: `${forum}: le règlement ne s'applique pas dans cet État (statut : ${s}).`,
  };
}
