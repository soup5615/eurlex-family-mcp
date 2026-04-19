// Concise French-language summaries of the core articles of
// Regulation (EU) No 650/2012. Summaries, not official text — for
// reasoning / documentation only. Authoritative text: EUR-Lex 32012R0650.

export interface ArticleSummary {
  id: string;
  title: string;
  summary: string;
}

export const ARTICLES: Record<string, ArticleSummary> = {
  "1": {
    id: "Art. 1",
    title: "Champ d'application matériel",
    summary:
      "Le règlement s'applique aux successions à cause de mort. Sont exclus notamment : les questions fiscales, douanières et administratives ; l'état et la capacité des personnes physiques ; les régimes matrimoniaux ; les obligations alimentaires ; la validité formelle des dispositions orales ; les droits et biens créés ou transférés autrement que par succession ; les trusts (sous réserve) ; la nature des droits réels.",
  },
  "4": {
    id: "Art. 4",
    title: "Compétence générale",
    summary:
      "Les juridictions de l'État membre dans lequel le défunt avait sa résidence habituelle au moment de son décès sont compétentes pour statuer sur l'ensemble de la succession.",
  },
  "5": {
    id: "Art. 5",
    title: "Accord d'élection de for",
    summary:
      "Lorsque la loi choisie par le défunt au titre de l'art. 22 est celle d'un État membre, les parties concernées peuvent convenir que les juridictions de cet État membre sont seules compétentes. L'accord d'élection de for doit être formulé par écrit, daté et signé par les parties.",
  },
  "6": {
    id: "Art. 6",
    title: "Déclinatoire de compétence en cas de choix de loi",
    summary:
      "La juridiction saisie en vertu de l'art. 4 ou 10 peut, à la demande d'une des parties, décliner sa compétence si elle considère que les juridictions de l'État membre dont la loi a été choisie sont mieux placées, ou si les parties ont conclu un accord au titre de l'art. 5.",
  },
  "7": {
    id: "Art. 7",
    title: "Compétence en cas de choix de loi",
    summary:
      "Les juridictions de l'État membre dont la loi a été choisie en vertu de l'art. 22 sont compétentes lorsque : (a) une juridiction précédemment saisie a décliné sa compétence (art. 6) ; (b) les parties ont conclu un accord (art. 5) ; ou (c) les parties ont expressément accepté la compétence de la juridiction saisie.",
  },
  "10": {
    id: "Art. 10",
    title: "Compétences subsidiaires",
    summary:
      "Lorsque la résidence habituelle du défunt n'est pas située dans un État membre, les juridictions d'un État membre dans lequel des biens successoraux sont situés sont néanmoins compétentes pour statuer sur l'ensemble de la succession si (a) le défunt avait la nationalité de cet État membre au moment du décès, ou, à défaut, (b) le défunt avait sa résidence habituelle antérieure dans cet État membre, pour autant que, au moment de la saisine, il ne se soit pas écoulé plus de cinq ans depuis le changement de résidence. À défaut, les juridictions de l'État membre dans lequel les biens sont situés sont compétentes pour statuer sur ces biens (art. 10(2)).",
  },
  "11": {
    id: "Art. 11",
    title: "Forum necessitatis",
    summary:
      "Lorsque aucune juridiction d'un État membre n'est compétente en vertu d'autres dispositions du règlement, les juridictions d'un État membre peuvent, à titre exceptionnel, statuer sur la succession si une procédure ne peut raisonnablement être introduite ou conduite, ou se révèle impossible, dans un État tiers avec lequel l'affaire a un lien étroit. L'affaire doit présenter un lien suffisant avec l'État membre de la juridiction saisie.",
  },
  "20": {
    id: "Art. 20",
    title: "Application universelle",
    summary:
      "Toute loi désignée par le règlement s'applique, même si cette loi n'est pas celle d'un État membre.",
  },
  "21": {
    id: "Art. 21",
    title: "Règle générale (loi applicable)",
    summary:
      "(1) La loi applicable à l'ensemble d'une succession est celle de l'État dans lequel le défunt avait sa résidence habituelle au moment de son décès. (2) À titre exceptionnel, s'il résulte de l'ensemble des circonstances de la cause que, au moment du décès, le défunt présentait des liens manifestement plus étroits avec un État autre que celui de sa résidence habituelle, la loi applicable est celle de cet autre État.",
  },
  "22": {
    id: "Art. 22",
    title: "Choix de loi (professio juris)",
    summary:
      "Une personne peut choisir comme loi régissant l'ensemble de sa succession la loi de l'État dont elle possède la nationalité au moment où elle fait ce choix ou au moment de son décès. Une personne ayant plusieurs nationalités peut choisir la loi de tout État dont elle a la nationalité. Le choix doit être formulé de manière expresse dans une déclaration revêtant la forme d'une disposition à cause de mort ou résulter des termes d'une telle disposition.",
  },
  "23": {
    id: "Art. 23",
    title: "Domaine de la loi applicable",
    summary:
      "La loi désignée par les art. 21 ou 22 régit l'ensemble d'une succession, notamment : les causes, le moment et le lieu d'ouverture ; la vocation successorale (héritiers, leurs parts, obligations) ; la capacité à succéder ; l'exhérédation et l'indignité ; le transfert des biens et droits ; les pouvoirs des héritiers, exécuteurs et administrateurs ; la responsabilité du passif ; la quotité disponible, les réserves héréditaires ; le rapport et la réduction des libéralités ; le partage.",
  },
  "24": {
    id: "Art. 24",
    title: "Dispositions à cause de mort autres que les pactes successoraux",
    summary:
      "(1) Leur recevabilité et leur validité au fond sont régies par la loi qui, en vertu du règlement, aurait été applicable à la succession de l'auteur s'il était décédé le jour où la disposition a été établie. (2) Par dérogation, l'auteur peut choisir comme loi régissant la recevabilité et la validité au fond la loi qu'il aurait pu choisir en vertu de l'art. 22.",
  },
  "25": {
    id: "Art. 25",
    title: "Pactes successoraux",
    summary:
      "(1) Un pacte successoral concernant la succession d'une seule personne est régi, pour sa recevabilité, sa validité au fond et ses effets obligatoires, par la loi applicable, en vertu du règlement, à la succession de cette personne si celle-ci était décédée le jour où le pacte a été conclu. (2) Lorsqu'un pacte concerne plusieurs successions, il n'est recevable que s'il l'est selon chacune des lois hypothétiquement applicables à chacune de ces successions ; sa validité au fond et ses effets obligatoires sont régis par celle de ces lois avec laquelle il présente les liens les plus étroits. (3) Les parties peuvent choisir comme loi régissant leur pacte, en ce qui concerne sa recevabilité, sa validité au fond et ses effets obligatoires, la loi qu'elles auraient pu choisir en vertu de l'art. 22.",
  },
  "27": {
    id: "Art. 27",
    title: "Validité quant à la forme des dispositions écrites",
    summary:
      "Une disposition à cause de mort écrite est valable quant à la forme si elle est conforme à la loi : (a) de l'État dans lequel la disposition a été prise ou le pacte conclu ; (b) d'un État dont le disposant ou l'une des parties au pacte avait la nationalité, au moment de la disposition ou du décès ; (c) d'un État dans lequel il avait son domicile, à ces mêmes moments ; (d) d'un État dans lequel il avait sa résidence habituelle, à ces mêmes moments ; ou (e) pour les immeubles, de l'État dans lequel ils sont situés.",
  },
  "34": {
    id: "Art. 34",
    title: "Renvoi",
    summary:
      "L'application de la loi d'un État tiers désignée par le règlement s'entend comme celle des règles juridiques en vigueur dans cet État, y compris ses règles de droit international privé, pour autant que ces règles renvoient : (a) à la loi d'un État membre ; ou (b) à la loi d'un autre État tiers qui appliquerait sa propre loi. Aucun renvoi ne s'applique aux lois visées aux art. 21(2), 22, 24, 25, 27, 28(b) et 30.",
  },
  "35": {
    id: "Art. 35",
    title: "Ordre public",
    summary:
      "L'application d'une disposition de la loi d'un État désignée par le règlement ne peut être écartée que si elle est manifestement incompatible avec l'ordre public du for.",
  },
  "62": {
    id: "Art. 62",
    title: "Création du certificat successoral européen",
    summary:
      "Le règlement crée un certificat successoral européen (CSE) destiné à être utilisé par les héritiers, légataires ayant des droits directs à la succession, exécuteurs testamentaires ou administrateurs de la succession qui, dans un autre État membre, doivent invoquer leur qualité ou exercer leurs droits. L'utilisation du certificat n'est pas obligatoire.",
  },
  "64": {
    id: "Art. 64",
    title: "Compétence pour délivrer le certificat",
    summary:
      "Le certificat est délivré dans l'État membre dont les juridictions sont compétentes en vertu des art. 4, 7, 10 ou 11. Il est délivré par une juridiction ou par une autre autorité qui, en vertu du droit national, est compétente pour régler les successions.",
  },
  "83": {
    id: "Art. 83",
    title: "Dispositions transitoires",
    summary:
      "Le règlement s'applique aux successions des personnes décédées le 17 août 2015 ou après. Les choix de loi et dispositions à cause de mort établis avant cette date sont valides selon des règles transitoires détaillées (notamment validité d'un choix de loi conforme au règlement même si antérieur).",
  },
  "84": {
    id: "Art. 84",
    title: "Entrée en vigueur",
    summary:
      "Le règlement est entré en vigueur le 17 août 2015 et est applicable à partir de cette date, sauf dispositions contraires.",
  },
};

export function getArticle(id: string): ArticleSummary | undefined {
  return ARTICLES[id.replace(/[^0-9]/g, "")];
}

export function listArticles(): ArticleSummary[] {
  return Object.values(ARTICLES);
}
