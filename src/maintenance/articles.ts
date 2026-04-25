// Concise French summaries of the key articles of Reg. (CE) 4/2009 and
// of the Hague Protocol of 23 November 2007. Summaries only —
// authoritative texts: EUR-Lex 32009R0004 and HCCH conventions.

export interface MaintenanceArticleSummary {
  id: string;
  title: string;
  summary: string;
}

export const MAINTENANCE_ARTICLES: Record<string, MaintenanceArticleSummary> = {
  // Regulation 4/2009
  "1": {
    id: "Art. 1",
    title: "Champ d'application",
    summary:
      "Le règlement s'applique aux obligations alimentaires découlant de relations de famille, de parenté, de mariage ou d'alliance. Il s'applique dans les 27 États membres de l'UE, sous réserve de la non-participation du Danemark à la chapitre III (loi applicable, qui incorpore le Protocole de La Haye).",
  },
  "3": {
    id: "Art. 3",
    title: "Compétence générale",
    summary:
      "Sont compétentes (au choix du demandeur) les juridictions de l'État membre : (a) où le défendeur a sa résidence habituelle ; (b) où le créancier a sa résidence habituelle ; (c) qui sont compétentes pour connaître d'une action relative à l'état des personnes lorsque la demande relative à une obligation alimentaire est accessoire à cette action, sauf si cette compétence est fondée uniquement sur la nationalité de l'une des parties ; (d) qui sont compétentes pour connaître d'une action relative à la responsabilité parentale lorsque la demande relative à une obligation alimentaire est accessoire à cette action, sauf si cette compétence est fondée uniquement sur la nationalité de l'une des parties.",
  },
  "4": {
    id: "Art. 4",
    title: "Élection de for",
    summary:
      "Les parties peuvent convenir d'attribuer compétence aux juridictions d'un État membre : (a) de la résidence habituelle de l'une d'elles ; (b) de la nationalité de l'une d'elles ; (c) pour les obligations entre époux ou ex-époux, à la juridiction compétente pour connaître de la cause matrimoniale, ou (d) à la juridiction de la dernière résidence habituelle commune ayant duré au moins un an. La convention est écrite, datée et signée. Cet article ne s'applique pas aux obligations alimentaires concernant un enfant de moins de 18 ans (art. 4(3)).",
  },
  "5": {
    id: "Art. 5",
    title: "Compétence fondée sur la comparution",
    summary:
      "Outre les cas où sa compétence résulte d'autres dispositions, la juridiction est compétente lorsque le défendeur comparaît, sauf si la comparution a pour objet de contester la compétence.",
  },
  "6": {
    id: "Art. 6",
    title: "Compétence subsidiaire",
    summary:
      "Lorsque aucune juridiction d'un État membre n'est compétente en vertu des art. 3 à 5 et qu'aucune juridiction d'un État partie à la Convention de Lugano qui n'est pas un État membre ne l'est, sont compétentes les juridictions de l'État membre de la nationalité commune des parties.",
  },
  "7": {
    id: "Art. 7",
    title: "Forum necessitatis",
    summary:
      "Lorsque aucune juridiction d'un État membre n'est compétente en vertu des art. 3 à 6, les juridictions d'un État membre peuvent, à titre exceptionnel, connaître du litige si une procédure ne peut raisonnablement être introduite ou conduite, ou se révèle impossible, dans un État tiers avec lequel le litige a un lien étroit. Le litige doit présenter un lien suffisant avec l'État membre saisi.",
  },
  "15": {
    id: "Art. 15",
    title: "Détermination de la loi applicable",
    summary:
      "La loi applicable aux obligations alimentaires est déterminée conformément au Protocole de La Haye du 23 novembre 2007 relatif à la loi applicable aux obligations alimentaires, dans les États membres liés par ce Protocole (tous sauf le Danemark).",
  },
  "75": {
    id: "Art. 75",
    title: "Disposition transitoire",
    summary:
      "Le règlement s'applique aux procédures engagées, aux transactions judiciaires approuvées ou conclues et aux actes authentiques établis postérieurement à sa date d'application (18 juin 2011), sous réserve de règles de transition pour les décisions antérieures.",
  },
  // Hague Protocol 2007 — referenced under "P.<n>"
  "P.3": {
    id: "Protocole 2007, art. 3",
    title: "Règle générale (loi applicable)",
    summary:
      "Les obligations alimentaires sont régies par la loi de l'État de la résidence habituelle du créancier, sauf si le présent Protocole en dispose autrement. En cas de changement de résidence habituelle du créancier, la loi du nouvel État de résidence habituelle s'applique à compter du changement.",
  },
  "P.4": {
    id: "Protocole 2007, art. 4",
    title: "Règles spéciales — créanciers privilégiés",
    summary:
      "Pour les obligations alimentaires des parents envers leurs enfants, des personnes (autres que les parents) envers une personne âgée de moins de 21 ans (sauf entre époux/ex-époux), et des enfants envers leurs parents : si le créancier ne peut obtenir d'aliments en vertu de la loi de sa résidence habituelle (art. 3), la loi du for s'applique. À défaut, la loi de la nationalité commune. La loi du for s'applique en outre lorsque le créancier saisit l'autorité de l'État de la résidence habituelle du débiteur.",
  },
  "P.5": {
    id: "Protocole 2007, art. 5",
    title: "Règle spéciale — époux et ex-époux",
    summary:
      "Pour les obligations alimentaires entre époux, ex-époux ou personnes ayant fait l'objet d'une annulation de mariage, l'art. 3 ne s'applique pas si l'une des parties s'y oppose et si la loi d'un autre État, notamment celui de la dernière résidence habituelle commune, présente des liens plus étroits avec le mariage. Cette autre loi s'applique dans ce cas.",
  },
  "P.6": {
    id: "Protocole 2007, art. 6",
    title: "Moyen de défense spécial",
    summary:
      "Pour les obligations alimentaires autres que celles envers les enfants découlant d'une relation parents-enfants et celles entre époux/ex-époux, le débiteur peut contester la prétention du créancier en se fondant sur le fait qu'il n'existe pas, en vertu de la loi de sa résidence habituelle ni de la loi de la nationalité commune (s'il en existe une), d'obligation alimentaire à son égard.",
  },
  "P.7": {
    id: "Protocole 2007, art. 7",
    title: "Désignation de la loi du for pour une procédure",
    summary:
      "Pour une procédure particulière, le créancier et le débiteur peuvent expressément désigner la loi de l'État du for comme loi applicable à l'obligation alimentaire. La désignation faite avant l'introduction de la procédure doit faire l'objet d'un accord écrit, signé.",
  },
  "P.8": {
    id: "Protocole 2007, art. 8",
    title: "Désignation générale de la loi applicable",
    summary:
      "À tout moment, le créancier et le débiteur peuvent désigner comme loi applicable à l'obligation alimentaire : (a) la loi de la nationalité de l'un d'eux ; (b) la loi de la résidence habituelle de l'un d'eux ; (c) la loi déjà choisie ou réellement applicable au régime patrimonial des époux ; (d) la loi déjà choisie ou réellement appliquée à leur divorce. La désignation est écrite ou enregistrée sur un support durable, signée. Elle ne s'applique pas aux obligations envers une personne âgée de moins de 18 ans ni à un adulte vulnérable. La portée d'une telle désignation est limitée à certaines questions par l'art. 8(4)-(5).",
  },
  "P.13": {
    id: "Protocole 2007, art. 13",
    title: "Ordre public",
    summary:
      "L'application de la loi désignée ne peut être écartée que si elle est manifestement incompatible avec l'ordre public du for.",
  },
  "P.14": {
    id: "Protocole 2007, art. 14",
    title: "Détermination du montant",
    summary:
      "Même si la loi applicable en dispose autrement, les besoins du créancier et les ressources du débiteur, ainsi que toute compensation accordée au créancier en lieu et place d'un paiement périodique, sont pris en compte pour déterminer le montant des aliments.",
  },
  "P.15": {
    id: "Protocole 2007, art. 15",
    title: "Non-application aux États plurilegislatifs internes",
    summary:
      "Le Protocole peut ne pas être appliqué par un État plurilegislatif aux conflits de lois purement internes, à condition de le déclarer.",
  },
  "P.12": {
    id: "Protocole 2007, art. 12",
    title: "Exclusion du renvoi",
    summary:
      "Aux fins du Protocole, le terme « loi » désigne le droit en vigueur dans un État, à l'exclusion de ses règles de conflit de lois.",
  },
};

export function getMaintenanceArticle(id: string): MaintenanceArticleSummary | undefined {
  // Accept "P.3" / "P3" / "P 3" for Protocol references, plain numbers
  // (e.g. "3", "15") for the Regulation.
  const key = id.toUpperCase().replace(/\s+/g, "");
  if (MAINTENANCE_ARTICLES[key]) return MAINTENANCE_ARTICLES[key];
  const pmatch = key.match(/^P\.?(\d+)$/);
  if (pmatch) return MAINTENANCE_ARTICLES[`P.${pmatch[1]}`];
  return MAINTENANCE_ARTICLES[id.replace(/[^0-9]/g, "")];
}

export function listMaintenanceArticles(): MaintenanceArticleSummary[] {
  return Object.values(MAINTENANCE_ARTICLES);
}
