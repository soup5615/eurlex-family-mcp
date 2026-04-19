// Key CJEU judgments interpreting Regulation (EU) No 650/2012.
// Summaries are informational; read the full judgments on curia.europa.eu.

export interface CjeuCase {
  caseNumber: string;
  name: string;
  date: string; // ISO
  articles: string[];
  holding: string;
  relevance: string;
}

export const CJEU_CASES: CjeuCase[] = [
  {
    caseNumber: "C-558/16",
    name: "Mahnkopf",
    date: "2018-03-01",
    articles: ["1(2)(d)", "1(1)"],
    holding:
      "Une règle nationale telle que l'art. 1371(1) BGB, qui, en cas de décès d'un conjoint, détermine une majoration forfaitaire de la part successorale du conjoint survivant soumis au régime de la communauté différée, relève du champ d'application du règlement successions (et non des régimes matrimoniaux exclus par l'art. 1(2)(d)), et peut donc figurer dans le CSE.",
    relevance:
      "Qualification des institutions hybrides successions/régime matrimonial — importante pour les successions franco-allemandes.",
  },
  {
    caseNumber: "C-218/16",
    name: "Kubicka",
    date: "2017-10-12",
    articles: ["1(2)(k)", "1(2)(l)", "23(2)(e)", "31"],
    holding:
      "Les art. 1(2)(k) et (l) et 31 s'opposent au refus par une autorité d'un État membre de reconnaître les effets réels d'un legs « par vindication » prévu par la loi successorale choisie par le testateur (loi polonaise), lorsque ce refus est fondé sur le fait que le legs porte sur un immeuble situé dans un autre État membre (Allemagne) dont le droit ne connaît pas ce type de legs à effet réel direct.",
    relevance:
      "Primauté de la loi successorale désignée sur la lex rei sitae pour le transfert successoral, sous réserve de l'adaptation (art. 31).",
  },
  {
    caseNumber: "C-20/17",
    name: "Oberle",
    date: "2018-06-21",
    articles: ["4"],
    holding:
      "L'art. 4 doit être interprété en ce sens qu'il s'oppose à une réglementation d'un État membre en vertu de laquelle, bien que le défunt n'ait pas, au moment de son décès, eu sa résidence habituelle dans cet État membre, les juridictions de ce dernier demeurent compétentes pour la délivrance de certificats successoraux nationaux, lorsque des biens successoraux sont situés sur le territoire dudit État membre ou que le défunt avait la nationalité de ce même État membre.",
    relevance:
      "Effet exclusif de la compétence de l'art. 4 : pas de compétence nationale parallèle pour un certificat national.",
  },
  {
    caseNumber: "C-658/17",
    name: "WB",
    date: "2019-05-23",
    articles: ["3(2)", "3(1)(g)", "3(1)(i)"],
    holding:
      "Un notaire polonais qui établit un acte de certification d'hérédité à la demande unanime des intéressés n'exerce pas de fonctions juridictionnelles au sens de l'art. 3(2) ; un tel acte constitue toutefois un « acte authentique » au sens de l'art. 3(1)(i), dont la délivrance produit les effets de force probante de l'art. 59.",
    relevance:
      "Distinction juridiction / autorité — détermine régime de circulation (art. 39 ss pour décisions, art. 59 pour actes authentiques).",
  },
  {
    caseNumber: "C-80/19",
    name: "E.E.",
    date: "2020-07-16",
    articles: ["3(2)", "4", "5", "7", "22", "83(2)", "83(4)"],
    holding:
      "La notion de « résidence habituelle » du défunt au sens du règlement doit correspondre au lieu avec lequel le défunt entretenait des liens étroits et stables, au regard de l'ensemble des circonstances de sa vie ; une seule résidence habituelle peut être retenue. Lorsque le défunt, ressortissant d'un État membre, résidait dans un autre État membre mais avait conservé des liens avec son État d'origine (où se trouvent ses biens), il appartient à la juridiction saisie de déterminer la résidence habituelle.",
    relevance:
      "Méthode d'établissement de la résidence habituelle — centrale pour l'art. 4 et l'art. 21(1).",
  },
  {
    caseNumber: "C-277/20",
    name: "UM (Contrat de donation à cause de mort)",
    date: "2021-09-09",
    articles: ["3(1)(b)", "83(2)"],
    holding:
      "La notion de pacte successoral au sens de l'art. 3(1)(b) englobe un contrat en vertu duquel une personne prévoit le transfert futur, à son décès, de la propriété d'un immeuble lui appartenant à d'autres parties contractantes. Les dispositions transitoires de l'art. 83(2) s'appliquent à un tel choix de loi implicite.",
    relevance:
      "Large acception du pacte successoral + application des règles transitoires de l'art. 83.",
  },
  {
    caseNumber: "C-645/20",
    name: "V A et Z A",
    date: "2022-03-07",
    articles: ["10(1)(a)"],
    holding:
      "L'art. 10(1)(a), qui prévoit une compétence subsidiaire des juridictions d'un État membre lorsque la résidence habituelle du défunt au moment du décès n'est pas située dans un État membre, doit être interprété en ce sens qu'il doit être appliqué d'office par la juridiction saisie, dès lors que les conditions qu'il prévoit sont remplies.",
    relevance:
      "Caractère impératif des compétences subsidiaires — le juge doit relever d'office sa compétence.",
  },
];

export function findCase(id: string): CjeuCase | undefined {
  const norm = (s: string) => s.toUpperCase().replace(/\s+/g, "");
  const target = norm(id);
  return CJEU_CASES.find(
    (c) => norm(c.caseNumber) === target || norm(c.name) === target,
  );
}
