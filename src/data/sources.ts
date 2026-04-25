// Authoritative sources catalog.
//
// 1. EUR-Lex — official, free, faisant foi. We compute stable CELEX
//    URLs for each Regulation; article-level anchors on EUR-Lex are
//    not stable, so we link to the regulation as a whole.
// 2. Curia — official, free, free CJEU case law.
// 3. HCCH — official, free, Hague Conventions / Protocol texts.
// 4. Doctrine — canonical works in EU PIL of family law. We list
//    citations only (most are paywalled; we deliberately do NOT link
//    to paywalled commercial databases). Open-access references are
//    linked.

export type RegulationKey =
  | "650-2012"
  | "1259-2010"
  | "2016-1103"
  | "2016-1104"
  | "2019-1111"
  | "4-2009"
  | "hague-protocol-2007";

const CELEX: Record<RegulationKey, string | null> = {
  "650-2012": "32012R0650",
  "1259-2010": "32010R1259",
  "2016-1103": "32016R1103",
  "2016-1104": "32016R1104",
  "2019-1111": "32019R1111",
  "4-2009": "32009R0004",
  "hague-protocol-2007": null, // not on EUR-Lex (HCCH instrument)
};

export interface RegulationSource {
  key: RegulationKey;
  shortTitle: string;
  fullTitle: string;
  officialUrl: string;
  consolidatedUrl?: string;
}

export function regulationSource(key: RegulationKey): RegulationSource {
  switch (key) {
    case "650-2012":
      return {
        key,
        shortTitle: "Règl. (UE) n° 650/2012",
        fullTitle:
          "Règlement (UE) n° 650/2012 du Parlement européen et du Conseil du 4 juillet 2012 relatif à la compétence, la loi applicable, la reconnaissance et l'exécution des décisions, l'acceptation et l'exécution des actes authentiques en matière de successions et à la création d'un certificat successoral européen",
        officialUrl: eurLex(CELEX[key]),
        consolidatedUrl: eurLexConsolidated("02012R0650"),
      };
    case "1259-2010":
      return {
        key,
        shortTitle: "Règl. (UE) n° 1259/2010 (Rome III)",
        fullTitle:
          "Règlement (UE) n° 1259/2010 du Conseil du 20 décembre 2010 mettant en œuvre une coopération renforcée dans le domaine de la loi applicable au divorce et à la séparation de corps",
        officialUrl: eurLex(CELEX[key]),
        consolidatedUrl: eurLexConsolidated("02010R1259"),
      };
    case "2016-1103":
      return {
        key,
        shortTitle: "Règl. (UE) 2016/1103",
        fullTitle:
          "Règlement (UE) 2016/1103 du Conseil du 24 juin 2016 mettant en œuvre une coopération renforcée dans le domaine de la compétence, de la loi applicable, de la reconnaissance et de l'exécution des décisions en matière de régimes matrimoniaux",
        officialUrl: eurLex(CELEX[key]),
        consolidatedUrl: eurLexConsolidated("02016R1103"),
      };
    case "2016-1104":
      return {
        key,
        shortTitle: "Règl. (UE) 2016/1104",
        fullTitle:
          "Règlement (UE) 2016/1104 du Conseil du 24 juin 2016 mettant en œuvre une coopération renforcée dans le domaine de la compétence, de la loi applicable, de la reconnaissance et de l'exécution des décisions en matière d'effets patrimoniaux des partenariats enregistrés",
        officialUrl: eurLex(CELEX[key]),
        consolidatedUrl: eurLexConsolidated("02016R1104"),
      };
    case "2019-1111":
      return {
        key,
        shortTitle: "Règl. (UE) 2019/1111 (Bruxelles II ter)",
        fullTitle:
          "Règlement (UE) 2019/1111 du Conseil du 25 juin 2019 relatif à la compétence, la reconnaissance et l'exécution des décisions en matière matrimoniale et en matière de responsabilité parentale, ainsi qu'à l'enlèvement international d'enfants (refonte)",
        officialUrl: eurLex(CELEX[key]),
        consolidatedUrl: eurLexConsolidated("02019R1111"),
      };
    case "4-2009":
      return {
        key,
        shortTitle: "Règl. (CE) n° 4/2009",
        fullTitle:
          "Règlement (CE) n° 4/2009 du Conseil du 18 décembre 2008 relatif à la compétence, la loi applicable, la reconnaissance et l'exécution des décisions et la coopération en matière d'obligations alimentaires",
        officialUrl: eurLex(CELEX[key]),
        consolidatedUrl: eurLexConsolidated("02009R0004"),
      };
    case "hague-protocol-2007":
      return {
        key,
        shortTitle: "Protocole de La Haye du 23 novembre 2007",
        fullTitle:
          "Protocole sur la loi applicable aux obligations alimentaires (HCCH, 23 novembre 2007)",
        officialUrl:
          "https://www.hcch.net/fr/instruments/conventions/full-text/?cid=133",
      };
  }
}

function eurLex(celex: string | null): string {
  if (!celex) return "";
  return `https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:${celex}`;
}

function eurLexConsolidated(celex: string): string {
  return `https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:${celex}`;
}

// ───── Curia (CJUE) ────────────────────────────────────────────────

export function curiaCaseUrl(caseNumber: string): string {
  // E.g. "C-218/16" → ?num=C-218/16. Curia accepts the encoded slash.
  return `https://curia.europa.eu/juris/liste.jsf?num=${encodeURIComponent(caseNumber)}&language=fr`;
}

// ───── Doctrine (curated bibliography per regulation) ─────────────
//
// We list canonical scholarly references that practitioners typically
// rely on. Most are paywalled (Bruylant, Defrénois, LexisNexis, Cairn,
// Mohr Siebeck, Hart). We do NOT link to paywalled databases; we
// surface the bibliographic citation. Open-access references are
// linked.

export interface DoctrineEntry {
  authors: string;
  title: string;
  publisher: string;
  year: number;
  url?: string; // only for open-access references
  notes?: string;
}

export type DoctrineCatalog = Record<RegulationKey, DoctrineEntry[]>;

export const DOCTRINE: DoctrineCatalog = {
  "650-2012": [
    {
      authors: "BONOMI, A. & WAUTELET, P.",
      title:
        "Le droit européen des successions — Commentaire du règlement n° 650/2012",
      publisher: "Bruylant",
      year: 2016,
      notes: "Référence majeure (2e éd.).",
    },
    {
      authors: "KHAIRALLAH, G. & REVILLARD, M. (dir.)",
      title:
        "Droit européen des successions internationales — Le règlement du 4 juillet 2012",
      publisher: "Defrénois",
      year: 2013,
    },
    {
      authors: "LAGARDE, P.",
      title:
        "Les principes de base du nouveau règlement européen sur les successions",
      publisher: "Rev. crit. DIP",
      year: 2012,
      notes: "Vol. 101, p. 691 et s.",
    },
    {
      authors: "DUTTA, A. & WEBER, J. (dir.)",
      title: "Internationales Erbrecht — EuErbVO und EuErbVOAusG",
      publisher: "C.H. Beck",
      year: 2016,
    },
    {
      authors: "MAX PLANCK INSTITUTE FOR COMPARATIVE AND PRIVATE INTERNATIONAL LAW",
      title:
        "Comments on the European Commission's Proposal for a Regulation on Succession",
      publisher: "MPI Hamburg, Working Paper",
      year: 2010,
      url: "https://www.mpipriv.de/files/pdf3/mpi_comments_succession_proposal.pdf",
      notes: "Document libre — préparatoire au règlement.",
    },
  ],
  "1259-2010": [
    {
      authors: "BOELE-WOELKI, K., FUCHS, A. (dir.)",
      title:
        "Legal Recognition of Same-Sex Relationships in Europe — National, Cross-Border and European Perspectives",
      publisher: "Intersentia",
      year: 2012,
    },
    {
      authors: "GONZÁLEZ BEILFUSS, C.",
      title:
        "Rome III: Choice of Law in Divorce — Is the Europeanization of Family Law Going Too Far?",
      publisher: "International Journal of Law, Policy and the Family",
      year: 2009,
      notes: "Tirage en accès partiel.",
    },
    {
      authors: "FRANZINA, P.",
      title:
        "The Law Applicable to Divorce and Legal Separation under Regulation (EU) No 1259/2010",
      publisher: "Cuadernos de Derecho Transnacional",
      year: 2011,
      url: "https://e-revistas.uc3m.es/index.php/CDT/article/view/1357",
      notes: "Article en libre accès.",
    },
    {
      authors: "BOULANGER, F.",
      title: "Règlement Rome III sur le divorce — Commentaire",
      publisher: "Lexbase Hebdo, éd. priv.",
      year: 2012,
    },
  ],
  "2016-1103": [
    {
      authors: "BERGQUIST, U. et al.",
      title:
        "EU Regulations on Matrimonial and Patrimonial Property — A Commentary on Regulations 2016/1103 and 2016/1104",
      publisher: "Oxford University Press",
      year: 2019,
      notes: "Référence anglophone de premier rang.",
    },
    {
      authors: "VIARENGO, I. & FRANZINA, P. (dir.)",
      title:
        "The EU Regulations on the Property Regimes of International Couples — A Commentary",
      publisher: "Edward Elgar",
      year: 2020,
    },
    {
      authors: "MANSEL, H.-P. & THORN, K.",
      title: "Europäisches Internationales Familienrecht — Güterrecht",
      publisher: "C.H. Beck",
      year: 2018,
    },
    {
      authors: "LAGARDE, P.",
      title:
        "Règlements (UE) 2016/1103 et 2016/1104 — Une nouvelle architecture pour les couples internationaux",
      publisher: "Rev. crit. DIP",
      year: 2017,
    },
    {
      authors: "DUTTA, A.",
      title: "The European Union: A New Era for International Family Law",
      publisher: "Yearbook of Private International Law",
      year: 2017,
    },
  ],
  "2016-1104": [
    {
      authors: "BERGQUIST, U. et al.",
      title:
        "EU Regulations on Matrimonial and Patrimonial Property — A Commentary on Regulations 2016/1103 and 2016/1104",
      publisher: "Oxford University Press",
      year: 2019,
    },
    {
      authors: "VIARENGO, I.",
      title:
        "The EU Property Regimes Regulations — Implementation, Challenges and Comparative Perspective",
      publisher: "Cuadernos de Derecho Transnacional",
      year: 2019,
      url: "https://e-revistas.uc3m.es/index.php/CDT",
      notes: "Articles en libre accès dans cette revue.",
    },
    {
      authors: "FULCHIRON, H. (dir.)",
      title:
        "Le règlement européen relatif aux effets patrimoniaux des partenariats enregistrés",
      publisher: "Defrénois",
      year: 2017,
    },
  ],
  "2019-1111": [
    {
      authors: "MAGNUS, U. & MANKOWSKI, P. (dir.)",
      title:
        "European Commentaries on Private International Law — Brussels IIter Regulation",
      publisher: "Otto Schmidt",
      year: 2023,
    },
    {
      authors: "GONZÁLEZ BEILFUSS, C., HAMMJE, P., MUIR WATT, H.",
      title:
        "Le nouveau règlement Bruxelles II ter — Refonte du règlement 2201/2003",
      publisher: "Rev. crit. DIP",
      year: 2020,
    },
    {
      authors: "DUTTA, A. & SCHULZ, A.",
      title:
        "Recast of the Brussels IIa Regulation — Reform Without Substance?",
      publisher: "Yearbook of Private International Law",
      year: 2020,
    },
    {
      authors: "PICOD, F.",
      title:
        "Bruxelles II ter — Compétence et reconnaissance en matière matrimoniale et de responsabilité parentale",
      publisher: "Recueil Dalloz",
      year: 2022,
    },
    {
      authors: "EUROPEAN PARLIAMENT — POLICY DEPARTMENT",
      title:
        "The Recast of the Brussels IIa Regulation — Free Movement of Decisions in Matrimonial Matters",
      publisher: "European Parliament study",
      year: 2018,
      url: "https://www.europarl.europa.eu/RegData/etudes/STUD/2018/608838/IPOL_STU(2018)608838_EN.pdf",
    },
  ],
  "4-2009": [
    {
      authors: "BONOMI, A.",
      title:
        "The Hague Protocol of 23 November 2007 on the Law Applicable to Maintenance Obligations — Explanatory Report",
      publisher: "HCCH",
      year: 2013,
      url: "https://assets.hcch.net/docs/722f5c79-b29e-4d4c-9a25-67c5c0a5e1d1.pdf",
      notes: "Rapport explicatif officiel — référence indispensable.",
    },
    {
      authors: "BÉRAUDO, J.-P.",
      title:
        "Le règlement (CE) n° 4/2009 du 18 décembre 2008 relatif aux obligations alimentaires",
      publisher: "JCP G",
      year: 2009,
      notes: "Doctrine de référence francophone.",
    },
    {
      authors: "ANDRAE, M.",
      title: "Internationales Familienrecht — Unterhalt",
      publisher: "Nomos",
      year: 2014,
    },
    {
      authors: "BOICHÉ, A.",
      title: "Règlement « aliments » et Protocole de La Haye 2007",
      publisher: "AJ Famille",
      year: 2011,
    },
  ],
  "hague-protocol-2007": [
    {
      authors: "BONOMI, A.",
      title:
        "Rapport explicatif sur le Protocole sur la loi applicable aux obligations alimentaires",
      publisher: "HCCH",
      year: 2013,
      url: "https://assets.hcch.net/docs/722f5c79-b29e-4d4c-9a25-67c5c0a5e1d1.pdf",
    },
  ],
};

export function listDoctrine(key: RegulationKey): DoctrineEntry[] {
  return DOCTRINE[key] ?? [];
}
