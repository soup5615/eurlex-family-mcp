// Key articles of Regulation (EU) 2016/1104 (registered partnerships).
// Summaries only — authoritative text on EUR-Lex 32016R1104.

export interface PartnershipArticleSummary {
  id: string;
  title: string;
  summary: string;
}

export const PARTNERSHIP_ARTICLES: Record<string, PartnershipArticleSummary> = {
  "1": {
    id: "Art. 1",
    title: "Champ d'application matériel",
    summary:
      "Le règlement s'applique aux effets patrimoniaux des partenariats enregistrés. Sont notamment exclus : la capacité juridique, l'existence, la validité ou la reconnaissance du partenariat, les obligations alimentaires, la succession, la sécurité sociale, les droits à pension/retraite non convertis, la nature des droits réels, les inscriptions dans un registre.",
  },
  "3": {
    id: "Art. 3",
    title: "Définitions",
    summary:
      "« Partenariat enregistré » : régime de vie commune entre deux personnes, prévu par la loi, dont l'enregistrement est obligatoire en vertu de cette loi et qui répond aux exigences formelles prévues par la loi en vue de sa création.",
  },
  "4": {
    id: "Art. 4",
    title: "Compétence en cas de décès d'un partenaire",
    summary:
      "La juridiction d'un État membre saisie, en vertu du Règl. 650/2012, de la succession d'un partenaire est également compétente pour les questions patrimoniales du partenariat liées à cette succession.",
  },
  "5": {
    id: "Art. 5",
    title: "Compétence en cas de dissolution ou d'annulation",
    summary:
      "La juridiction d'un État membre compétente pour connaître de la dissolution ou de l'annulation du partenariat est également compétente pour statuer sur les effets patrimoniaux, sous réserve de l'accord des partenaires.",
  },
  "6": {
    id: "Art. 6",
    title: "Compétence dans les autres cas",
    summary:
      "En l'absence des chefs art. 4 et 5, sont compétentes, dans l'ordre, les juridictions de l'État membre (a) de la résidence habituelle commune des partenaires à la saisine ; (b) de la dernière RH commune, pour autant que l'un y réside encore ; (c) de la RH du défendeur ; (d) de la nationalité commune ; (e) sous la loi duquel le partenariat a été créé.",
  },
  "7": {
    id: "Art. 7",
    title: "Choix de juridiction",
    summary:
      "Les partenaires peuvent convenir que les juridictions de l'État membre dont la loi est applicable en vertu de l'art. 22 ou de l'art. 26(1) sont seules compétentes. L'accord est écrit, daté, signé.",
  },
  "9": {
    id: "Art. 9",
    title: "Compétence alternative",
    summary:
      "Si la juridiction saisie estime que son droit national ne connaît pas l'institution du partenariat enregistré ou ne la reconnaît pas aux fins du règlement, elle peut décliner sa compétence. Dans ce cas, les partenaires peuvent saisir une juridiction de l'État membre dont la loi est applicable ou de l'État membre dans lequel le partenariat a été créé.",
  },
  "10": {
    id: "Art. 10",
    title: "Compétences subsidiaires",
    summary:
      "À défaut, les juridictions d'un État membre sont compétentes dans la mesure où des biens immobiliers de l'un ou des deux partenaires sont situés sur son territoire — pour ces biens uniquement.",
  },
  "11": {
    id: "Art. 11",
    title: "Forum necessitatis",
    summary:
      "Possibilité exceptionnelle pour un État membre de statuer en l'absence de toute autre compétence, lorsqu'une procédure ne peut être raisonnablement conduite dans un État tiers, sous réserve d'un lien suffisant avec l'État saisi.",
  },
  "20": {
    id: "Art. 20",
    title: "Application universelle",
    summary:
      "Toute loi désignée par le règlement s'applique, même si cette loi n'est pas celle d'un État membre.",
  },
  "22": {
    id: "Art. 22",
    title: "Choix de la loi applicable",
    summary:
      "Les partenaires peuvent choisir comme loi applicable aux effets patrimoniaux de leur partenariat : (a) la loi de l'État de la résidence habituelle de l'un ou des deux partenaires au moment du choix ; (b) la loi de l'État de la nationalité de l'un des partenaires au moment du choix ; (c) la loi de l'État sous la loi duquel le partenariat a été créé. La loi choisie doit attacher des effets patrimoniaux à l'institution du partenariat.",
  },
  "23": {
    id: "Art. 23",
    title: "Validité formelle de la convention de choix de loi",
    summary:
      "La convention de choix est écrite, datée et signée. Mode électronique durable assimilé à l'écrit. Exigences additionnelles du droit de la RH commune (ou de l'une des RH) au moment du choix applicables.",
  },
  "25": {
    id: "Art. 25",
    title: "Validité formelle de la convention patrimoniale",
    summary:
      "La convention patrimoniale est écrite, datée, signée par les deux partenaires. Exigences formelles supplémentaires de l'État membre de RH commune (ou, en cas de RH distinctes, de l'un d'eux) applicables.",
  },
  "26": {
    id: "Art. 26",
    title: "Loi applicable à défaut de choix",
    summary:
      "À défaut de choix, la loi applicable aux effets patrimoniaux du partenariat est celle de l'État sous la loi duquel le partenariat a été créé. (2) À titre exceptionnel et à la demande d'un partenaire, la juridiction peut appliquer la loi d'un autre État avec lequel les partenaires présentent conjointement des liens manifestement plus étroits, sous réserve d'une confiance légitime des deux partenaires et de l'absence de convention patrimoniale antérieure.",
  },
  "27": {
    id: "Art. 27",
    title: "Domaine de la loi applicable",
    summary:
      "La loi applicable régit notamment la classification des biens, les transferts entre catégories, la responsabilité d'un partenaire pour les dettes de l'autre, les pouvoirs et droits, la dissolution et le partage.",
  },
  "30": {
    id: "Art. 30",
    title: "Lois de police",
    summary:
      "Les lois de police du for s'imposent indépendamment de la loi désignée.",
  },
  "32": {
    id: "Art. 32",
    title: "Exclusion du renvoi",
    summary:
      "L'application de la loi de tout État désignée par le règlement s'entend comme l'application des règles de fond de cet État, à l'exclusion de ses règles de droit international privé.",
  },
  "35": {
    id: "Art. 35",
    title: "Ordre public",
    summary:
      "Une règle de la loi désignée ne peut être écartée que si elle est manifestement incompatible avec l'ordre public du for. Le règlement précise que la non-reconnaissance par un État membre du partenariat enregistré n'est pas, en soi, contraire à son ordre public (considérant 73).",
  },
  "69": {
    id: "Art. 69",
    title: "Dispositions transitoires",
    summary:
      "Le règlement s'applique aux actions juridiques, actes authentiques et transactions judiciaires intervenus à partir du 29 janvier 2019. Les règles sur la loi applicable s'appliquent aux partenaires ayant enregistré leur partenariat ou ayant choisi la loi applicable à partir du 29 janvier 2019.",
  },
};

export function getPartnershipArticle(
  id: string,
): PartnershipArticleSummary | undefined {
  return PARTNERSHIP_ARTICLES[id.replace(/[^0-9]/g, "")];
}

export function listPartnershipArticles(): PartnershipArticleSummary[] {
  return Object.values(PARTNERSHIP_ARTICLES);
}
