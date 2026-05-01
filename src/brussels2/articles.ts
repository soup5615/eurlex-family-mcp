// Key articles of Regulation (EU) 2019/1111 (Brussels IIter).
// Summaries only — authoritative text on EUR-Lex 32019R1111.

import { regulationSource } from "../data/sources.js";
import type { VerificationStatus } from "../data/legalDisclaimer.js";

const REGULATION_KEY = "2019-1111" as const;
const DEFAULT_STATUS: VerificationStatus = "drafted-by-claude";

export interface BiiArticleSummary {
  id: string;
  title: string;
  summary: string;
  regulation?: string;
  officialUrl?: string;
  verificationStatus?: VerificationStatus;
}

export const BII_ARTICLES: Record<string, BiiArticleSummary> = {
  "1": {
    id: "Art. 1",
    title: "Champ d'application",
    summary:
      "Le règlement s'applique aux matières civiles relatives au divorce, à la séparation de corps et à l'annulation du mariage, ainsi qu'à l'attribution, l'exercice, la délégation, le retrait total ou partiel de la responsabilité parentale. Couvre notamment les droits de garde et de visite, la tutelle, le placement de l'enfant, les mesures de protection. Exclut : état des personnes, paternité/maternité, adoption, émancipation, aliments, trusts/successions, mesures liées aux infractions pénales commises par des enfants.",
  },
  "3": {
    id: "Art. 3",
    title: "Compétence générale en matière matrimoniale",
    summary:
      "Sont compétentes en matière de divorce, séparation de corps ou annulation du mariage les juridictions de l'État membre : (a) sur le territoire duquel se trouve : (i) la résidence habituelle des époux ; (ii) la dernière RH commune si l'un des époux y réside encore ; (iii) la RH du défendeur ; (iv) en cas de demande conjointe, la RH de l'un des époux ; (v) la RH du demandeur s'il y a résidé au moins un an immédiatement avant la saisine ; (vi) la RH du demandeur s'il y a résidé au moins six mois et s'il est ressortissant de l'État membre considéré ou (pour IE) y a son domicile ; ou (b) la nationalité des deux époux ou (pour IE) leur domicile commun.",
  },
  "4": {
    id: "Art. 4",
    title: "Demande reconventionnelle",
    summary:
      "La juridiction devant laquelle est pendante la demande principale est également compétente pour connaître d'une demande reconventionnelle, pour autant que celle-ci entre dans le champ du règlement.",
  },
  "5": {
    id: "Art. 5",
    title: "Conversion d'une séparation de corps en divorce",
    summary:
      "La juridiction de l'État membre qui a rendu la décision de séparation de corps est également compétente pour convertir celle-ci en divorce, dès lors que la loi de cet État membre le prévoit.",
  },
  "6": {
    id: "Art. 6",
    title: "Compétence résiduelle",
    summary:
      "Aucun des chefs de compétence des art. 3 à 5 ne s'appliquant, la compétence est déterminée par la loi de chaque État membre, sous réserve de l'art. 6(2) (un ressortissant d'un EM ayant sa RH dans un autre EM peut invoquer les règles de ce dernier contre le défendeur).",
  },
  "7": {
    id: "Art. 7",
    title: "Compétence générale en matière de responsabilité parentale",
    summary:
      "Les juridictions d'un État membre sont compétentes en matière de responsabilité parentale à l'égard d'un enfant qui y a sa résidence habituelle au moment où la juridiction est saisie.",
  },
  "8": {
    id: "Art. 8",
    title: "Maintien de compétence en cas de déménagement légal",
    summary:
      "En cas de déménagement légal de l'enfant d'un EM à un autre, acquisition d'une nouvelle RH dans ce dernier, les juridictions de l'ancienne RH conservent, pendant trois mois après le déménagement, compétence pour modifier une décision relative au droit de visite rendue avant le déménagement, lorsque le titulaire du droit continue à y résider.",
  },
  "9": {
    id: "Art. 9",
    title: "Compétence en cas d'enlèvement international d'enfant",
    summary:
      "En cas de déplacement ou de non-retour illicite d'un enfant, les juridictions de l'EM où l'enfant avait sa RH immédiatement avant le déplacement/non-retour restent compétentes jusqu'à ce que l'enfant ait acquis une RH dans un autre EM et que certaines conditions d'acquiescement/de passage du temps soient remplies.",
  },
  "10": {
    id: "Art. 10",
    title: "Élection de for (prorogation) en matière de responsabilité parentale",
    summary:
      "Les juridictions d'un État membre avec lequel l'enfant a un lien étroit sont compétentes si, au plus tard au moment de la saisine, toutes les parties à la procédure, les titulaires de la responsabilité parentale, ont librement accepté cette compétence de manière expresse ou sans équivoque, et si cela est conforme à l'intérêt supérieur de l'enfant.",
  },
  "11": {
    id: "Art. 11",
    title: "Compétence fondée sur la présence de l'enfant",
    summary:
      "Lorsque la résidence habituelle de l'enfant ne peut être établie et que la compétence ne peut être fondée sur l'art. 10, les juridictions de l'EM sur le territoire duquel l'enfant est présent sont compétentes.",
  },
  "12": {
    id: "Art. 12",
    title: "Transfert à une juridiction mieux placée",
    summary:
      "À titre exceptionnel, la juridiction compétente au fond peut, si elle considère qu'une juridiction d'un autre EM avec lequel l'enfant a un lien particulier est mieux placée, suspendre l'affaire et inviter les parties à saisir cette juridiction, ou solliciter directement cette autre juridiction. Le transfert est subordonné à l'intérêt supérieur de l'enfant.",
  },
  "13": {
    id: "Art. 13",
    title: "Mesures provisoires et conservatoires urgentes",
    summary:
      "Dans les cas d'urgence, les juridictions d'un EM sont compétentes pour prendre les mesures provisoires ou conservatoires prévues par leur loi à l'égard des personnes ou des biens présents sur son territoire, même si, en vertu du règlement, la compétence au fond appartient à une juridiction d'un autre EM.",
  },
  "17": {
    id: "Art. 17",
    title: "Date à laquelle la juridiction est réputée saisie",
    summary:
      "La juridiction est réputée saisie : (a) à la date du dépôt de l'acte introductif d'instance, pour autant que le demandeur ait accompli les démarches requises pour la notification au défendeur ; (b) si l'acte doit être notifié avant son dépôt, à la date de réception par l'autorité chargée de la notification.",
  },
  "20": {
    id: "Art. 20",
    title: "Litispendance et connexité",
    summary:
      "Lorsque des demandes ayant le même objet et la même cause sont formées entre les mêmes parties devant des juridictions d'EM différents, la juridiction saisie en second lieu sursoit d'office à statuer jusqu'à ce que la compétence de la juridiction saisie en premier soit établie, puis se dessaisit.",
  },
  "100": {
    id: "Art. 100",
    title: "Dispositions transitoires",
    summary:
      "Le règlement s'applique aux actions juridiques engagées, aux actes authentiques établis et aux transactions judiciaires conclues à partir du 1er août 2022. Les instruments antérieurs (notamment le Règl. 2201/2003) continuent à s'appliquer aux procédures et actes antérieurs.",
  },
};

function decorate(a: BiiArticleSummary): BiiArticleSummary {
  const src = regulationSource(REGULATION_KEY);
  return {
    ...a,
    regulation: src.shortTitle,
    officialUrl: src.officialUrl,
    verificationStatus: a.verificationStatus ?? DEFAULT_STATUS,
  };
}

export function getBiiArticle(id: string): BiiArticleSummary | undefined {
  const raw = BII_ARTICLES[id.replace(/[^0-9]/g, "")];
  return raw ? decorate(raw) : undefined;
}

export function listBiiArticles(): BiiArticleSummary[] {
  return Object.values(BII_ARTICLES).map(decorate);
}
