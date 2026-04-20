// Concise French-language summaries of the core articles of
// Regulation (EU) 2016/1103. Summaries, not official text.

export interface MatrimonialArticleSummary {
  id: string;
  title: string;
  summary: string;
}

export const MATRIMONIAL_ARTICLES: Record<string, MatrimonialArticleSummary> = {
  "1": {
    id: "Art. 1",
    title: "Champ d'application matériel",
    summary:
      "Le règlement s'applique aux régimes matrimoniaux. Sont notamment exclus : la capacité juridique des époux, l'existence, la validité ou la reconnaissance du mariage, les obligations alimentaires, la succession à cause de mort (Règl. 650/2012), la sécurité sociale, les droits à prestations de retraite/invalidité accumulés pendant le mariage non convertis en revenus, la nature des droits réels, les inscriptions dans un registre.",
  },
  "4": {
    id: "Art. 4",
    title: "Compétence en cas de décès d'un époux",
    summary:
      "Lorsqu'une juridiction d'un État membre est saisie, en vertu du Règl. 650/2012, de la succession d'un époux, les juridictions de cet État sont également compétentes pour statuer sur les questions du régime matrimonial liées à cette succession.",
  },
  "5": {
    id: "Art. 5",
    title: "Compétence en cas de dissolution du mariage",
    summary:
      "Lorsqu'une juridiction d'un État membre est saisie d'un divorce, d'une séparation de corps ou d'une annulation en vertu du Règl. Bruxelles II ter, elle est également compétente pour statuer sur les questions du régime matrimonial liées à cette cause. Dans certains cas visés au Règl. Bruxelles II ter (art. 3(1) § a) 5e ou 6e tiret, art. 5 et 7), la compétence est soumise à l'accord des époux.",
  },
  "6": {
    id: "Art. 6",
    title: "Compétence dans les autres cas",
    summary:
      "En dehors des art. 4 et 5, sont compétentes, dans l'ordre, les juridictions de l'État membre : (a) de la résidence habituelle des époux au moment de la saisine ; ou, à défaut (b) de la dernière résidence habituelle, pour autant que l'un des époux y réside encore ; (c) de la résidence habituelle du défendeur ; (d) de la nationalité commune des époux au moment de la saisine.",
  },
  "7": {
    id: "Art. 7",
    title: "Choix de juridiction",
    summary:
      "Les parties peuvent convenir que les juridictions de l'État membre dont la loi est applicable en vertu de l'art. 22 (choix) ou de l'art. 26(1)(a)-(b) (loi de la première résidence habituelle commune ou de la nationalité commune au mariage) sont seules compétentes. L'accord est par écrit, daté et signé.",
  },
  "8": {
    id: "Art. 8",
    title: "Compétence fondée sur la comparution",
    summary:
      "Outre les cas où sa compétence résulte des autres dispositions, la juridiction d'un État membre est compétente si le défendeur comparaît sans la contester, sauf si la juridiction vérifie qu'il a été informé de son droit de la contester.",
  },
  "9": {
    id: "Art. 9",
    title: "Compétence alternative",
    summary:
      "Si la juridiction saisie en vertu de l'art. 4 ou 6 estime que, en vertu de son droit international privé, le mariage n'est pas reconnu aux fins du régime matrimonial, elle peut décliner sa compétence. Elle statue sur cette question sans délai. Le demandeur peut alors saisir une juridiction d'un autre État membre compétent.",
  },
  "10": {
    id: "Art. 10",
    title: "Compétences subsidiaires",
    summary:
      "Lorsque aucune juridiction d'un État membre n'est compétente en vertu des art. 4, 5, 6, 7 ou 8, ou que la juridiction a décliné sa compétence (art. 9), les juridictions d'un État membre sont compétentes dans la mesure où des biens immobiliers de l'un ou des deux époux sont situés dans cet État — pour ces biens uniquement.",
  },
  "11": {
    id: "Art. 11",
    title: "Forum necessitatis",
    summary:
      "Lorsque aucune juridiction d'un État membre n'est compétente en vertu des autres dispositions, les juridictions d'un État membre peuvent, à titre exceptionnel, statuer si une procédure ne peut raisonnablement être introduite ou conduite, ou se révèle impossible, dans un État tiers avec lequel l'affaire a un lien étroit. Un lien suffisant avec l'État membre saisi est exigé.",
  },
  "20": {
    id: "Art. 20",
    title: "Application universelle",
    summary:
      "Toute loi désignée par le règlement s'applique, même si cette loi n'est pas celle d'un État membre.",
  },
  "21": {
    id: "Art. 21",
    title: "Unité de la loi applicable",
    summary:
      "La loi applicable au régime matrimonial s'applique à l'ensemble des biens des époux, quel que soit leur lieu de situation.",
  },
  "22": {
    id: "Art. 22",
    title: "Choix de la loi applicable",
    summary:
      "Les époux peuvent choisir comme loi applicable à leur régime matrimonial : (a) la loi de l'État de la résidence habituelle de l'un ou des deux époux au moment du choix, ou (b) la loi d'un État de la nationalité de l'un des époux au moment du choix. Un changement de loi n'a d'effet que pour l'avenir, sauf convention contraire et sans préjudice des droits des tiers.",
  },
  "23": {
    id: "Art. 23",
    title: "Validité formelle de la convention de choix de loi",
    summary:
      "La convention de choix de loi est formulée par écrit, datée et signée. Tout mode électronique permettant un enregistrement durable est assimilé à un écrit. Des exigences supplémentaires de forme prévues par le droit de l'État membre dans lequel les deux époux ont leur résidence habituelle au moment du choix, ou, en cas de résidences habituelles distinctes, par celui de l'un d'eux, s'appliquent.",
  },
  "24": {
    id: "Art. 24",
    title: "Consentement et validité au fond",
    summary:
      "L'existence et la validité d'une convention de choix de loi ou d'une de ses dispositions sont déterminées par la loi qui serait applicable en vertu de l'art. 22 si la convention était valable. Toutefois, un époux peut, pour établir qu'il n'a pas consenti, se fonder sur la loi de sa résidence habituelle au moment de la saisine.",
  },
  "25": {
    id: "Art. 25",
    title: "Validité formelle de la convention matrimoniale",
    summary:
      "La convention matrimoniale est formulée par écrit, datée et signée. Des exigences formelles supplémentaires du droit de la résidence habituelle commune au moment de la conclusion s'appliquent ; si les époux résidaient dans des États membres différents exigeant des formalités différentes, la convention est valable si elle satisfait à l'une d'entre elles. Si la loi applicable impose des exigences formelles supplémentaires, celles-ci s'appliquent.",
  },
  "26": {
    id: "Art. 26",
    title: "Loi applicable à défaut de choix",
    summary:
      "La loi applicable au régime matrimonial est, à défaut de choix : (1)(a) la loi de la première résidence habituelle commune des époux après la célébration du mariage ; à défaut, (1)(b) la loi de la nationalité commune des deux époux au moment de la célébration (pas applicable si plusieurs nationalités communes) ; à défaut, (1)(c) la loi de l'État avec lequel les deux époux présentent conjointement les liens les plus étroits au moment de la célébration. (2) À titre exceptionnel, à la demande d'un époux, la juridiction peut décider d'appliquer la loi d'un autre État dans lequel les époux ont eu leur dernière résidence habituelle commune pendant une durée significativement plus longue que celle de la première, si les deux époux se sont fondés sur cette loi pour organiser leurs rapports patrimoniaux. (3) Cette dérogation ne joue pas si les époux ont conclu une convention matrimoniale avant l'établissement de leur première résidence habituelle commune.",
  },
  "27": {
    id: "Art. 27",
    title: "Domaine de la loi applicable",
    summary:
      "La loi applicable régit notamment la classification des biens de chaque époux en différentes catégories pendant et après le mariage, les transferts entre ces catégories, la responsabilité d'un époux pour les dettes de l'autre, les pouvoirs et droits, et la dissolution / liquidation du régime et le partage.",
  },
  "28": {
    id: "Art. 28",
    title: "Effets à l'égard des tiers",
    summary:
      "La loi applicable entre les époux ne peut être opposée au tiers que s'il avait connaissance ou aurait dû avoir connaissance de cette loi. Des règles de protection sont prévues : connaissance effective, publication dans un registre du régime, résidence habituelle commune dans un MS dont la loi s'applique, ou loi de la résidence habituelle du tiers dans l'État où l'acte est passé.",
  },
  "30": {
    id: "Art. 30",
    title: "Lois de police",
    summary:
      "Les règles impératives auxquelles un État membre accorde une telle importance qu'elles doivent s'appliquer à toute situation relevant de leur champ (lois de police) s'imposent indépendamment de la loi désignée par le règlement.",
  },
  "32": {
    id: "Art. 32",
    title: "Exclusion du renvoi",
    summary:
      "L'application de la loi de tout État désignée par le règlement s'entend comme l'application des règles de fond de cet État, à l'exclusion de ses règles de droit international privé (exclusion du renvoi).",
  },
  "35": {
    id: "Art. 35",
    title: "Ordre public",
    summary:
      "L'application d'une règle de la loi désignée ne peut être écartée que si elle est manifestement incompatible avec l'ordre public du for.",
  },
  "69": {
    id: "Art. 69",
    title: "Dispositions transitoires",
    summary:
      "Le règlement s'applique aux actions juridiques intentées, aux actes authentiques établis et aux transactions judiciaires approuvées/conclues à partir du 29 janvier 2019. Les règles sur la loi applicable s'appliquent aux époux qui se sont mariés ou ont choisi la loi applicable à leur régime matrimonial à partir du 29 janvier 2019.",
  },
  "70": {
    id: "Art. 70",
    title: "Entrée en application",
    summary:
      "Le règlement est entré en application le 29 janvier 2019 dans les 18 États membres participant à la coopération renforcée.",
  },
};

export function getMatrimonialArticle(
  id: string,
): MatrimonialArticleSummary | undefined {
  return MATRIMONIAL_ARTICLES[id.replace(/[^0-9]/g, "")];
}

export function listMatrimonialArticles(): MatrimonialArticleSummary[] {
  return Object.values(MATRIMONIAL_ARTICLES);
}
