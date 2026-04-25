// Key articles of Regulation (EU) No 1259/2010 (Rome III).
// Summaries only — authoritative text on EUR-Lex 32010R1259.

import { regulationSource } from "../data/sources.js";

const REGULATION_KEY = "1259-2010" as const;

export interface Rome3ArticleSummary {
  id: string;
  title: string;
  summary: string;
  regulation?: string;
  officialUrl?: string;
}

export const ROME3_ARTICLES: Record<string, Rome3ArticleSummary> = {
  "1": {
    id: "Art. 1",
    title: "Champ d'application",
    summary:
      "Le règlement s'applique, dans les situations qui comportent un conflit de lois, au divorce et à la séparation de corps. Il ne s'applique pas aux questions suivantes : capacité juridique, existence, validité ou reconnaissance du mariage, annulation, nom des époux, effets patrimoniaux, responsabilité parentale, obligations alimentaires, trusts/successions.",
  },
  "4": {
    id: "Art. 4",
    title: "Application universelle",
    summary:
      "La loi désignée par le règlement s'applique même si elle n'est pas celle d'un État membre participant.",
  },
  "5": {
    id: "Art. 5",
    title: "Choix de la loi applicable par les parties",
    summary:
      "Les époux peuvent désigner, d'un commun accord, comme loi applicable au divorce ou à la séparation de corps : (a) la loi de l'État de leur résidence habituelle au moment de la conclusion de la convention ; (b) la loi de l'État de la dernière résidence habituelle commune, pour autant que l'un des époux y réside encore au moment de la conclusion ; (c) la loi d'un État de la nationalité de l'un des époux au moment de la conclusion ; (d) la loi du for. La convention peut être conclue au plus tard au moment de la saisine de la juridiction ; la loi du for peut le permettre jusqu'à une date plus tardive.",
  },
  "6": {
    id: "Art. 6",
    title: "Consentement et validité au fond",
    summary:
      "L'existence et la validité de la convention de choix sont régies par la loi qui serait applicable si la convention était valable. Un époux peut, pour établir son absence de consentement, se fonder sur la loi de sa résidence habituelle au moment de la saisine si les circonstances laissent à penser que ce raisonnement n'est pas raisonnable.",
  },
  "7": {
    id: "Art. 7",
    title: "Validité formelle",
    summary:
      "La convention est formulée par écrit, datée et signée par les deux époux. Si la loi d'un État membre participant dans lequel, au moment de la conclusion, au moins un des époux a sa résidence habituelle prévoit des exigences formelles supplémentaires, celles-ci s'appliquent. Si les époux ont leur résidence habituelle dans des EM participants différents, la convention est valable si elle satisfait aux conditions de l'une ou l'autre. Si un seul époux a sa résidence habituelle dans un EM participant à la conclusion et que cette loi prévoit des exigences additionnelles, celles-ci s'appliquent.",
  },
  "8": {
    id: "Art. 8",
    title: "Loi applicable à défaut de choix",
    summary:
      "À défaut de choix, la loi applicable est celle de l'État : (a) de la résidence habituelle des époux au moment de la saisine ; à défaut, (b) de la dernière résidence habituelle commune, pour autant qu'il ne se soit pas écoulé plus d'un an depuis que cette résidence a cessé et que l'un des époux y réside encore à la saisine ; à défaut, (c) de la nationalité commune des deux époux à la saisine ; à défaut, (d) du for.",
  },
  "9": {
    id: "Art. 9",
    title: "Conversion de la séparation de corps en divorce",
    summary:
      "En cas de conversion de la séparation de corps en divorce, la loi applicable à la séparation s'applique également au divorce, sauf convention contraire des parties au titre de l'art. 5. Toutefois, si la loi applicable à la séparation ne prévoit pas le divorce, l'art. 10 s'applique.",
  },
  "10": {
    id: "Art. 10",
    title: "Application de la loi du for",
    summary:
      "Lorsque la loi désignée en vertu des art. 5 ou 8 ne prévoit pas le divorce ou n'accorde pas à l'un des époux, en raison de son appartenance à l'un ou l'autre sexe, l'égalité d'accès au divorce ou à la séparation de corps, la loi du for s'applique.",
  },
  "11": {
    id: "Art. 11",
    title: "Exclusion du renvoi",
    summary:
      "L'application de la loi désignée par le règlement s'entend comme l'application des règles de fond de cet État, à l'exclusion de ses règles de droit international privé.",
  },
  "12": {
    id: "Art. 12",
    title: "Ordre public",
    summary:
      "L'application d'une disposition de la loi désignée ne peut être écartée que si cette application est manifestement incompatible avec l'ordre public du for.",
  },
  "13": {
    id: "Art. 13",
    title: "Différences de droits nationaux",
    summary:
      "Aucune disposition du règlement n'oblige les juridictions d'un État membre participant dont la loi ne prévoit pas le divorce ou ne considère pas le mariage en question comme valable aux fins d'une procédure de divorce à prononcer un divorce.",
  },
  "18": {
    id: "Art. 18",
    title: "Dispositions transitoires",
    summary:
      "Le règlement s'applique aux actions juridiques engagées et aux conventions visées à l'art. 5 conclues à compter du 21 juin 2012. Toutefois, un choix de loi conforme conclu avant le 21 juin 2012 produit ses effets s'il satisfait aux conditions des art. 6 et 7.",
  },
  "21": {
    id: "Art. 21",
    title: "Entrée en application",
    summary:
      "Le règlement est applicable à partir du 21 juin 2012 dans les 14 États membres initialement participants. Lituanie : 22 mai 2014 ; Grèce : 29 juillet 2015 ; Estonie : 11 février 2018.",
  },
};

function decorate(a: Rome3ArticleSummary): Rome3ArticleSummary {
  const src = regulationSource(REGULATION_KEY);
  return { ...a, regulation: src.shortTitle, officialUrl: src.officialUrl };
}

export function getRome3Article(id: string): Rome3ArticleSummary | undefined {
  const raw = ROME3_ARTICLES[id.replace(/[^0-9]/g, "")];
  return raw ? decorate(raw) : undefined;
}

export function listRome3Articles(): Rome3ArticleSummary[] {
  return Object.values(ROME3_ARTICLES).map(decorate);
}
