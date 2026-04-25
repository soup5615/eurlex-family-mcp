import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AddressInfo } from "node:net";
import {
  curiaCaseUrl,
  listDoctrine,
  regulationSource,
} from "../src/data/sources.js";
import { getArticle, listArticles } from "../src/data/articles.js";
import { getMaintenanceArticle } from "../src/maintenance/articles.js";
import { CJEU_CASES } from "../src/data/cjeuCases.js";
import { startServer } from "../src/server/server.js";

describe("Sources catalog", () => {
  it("regulationSource produit une URL EUR-Lex stable", () => {
    const r = regulationSource("650-2012");
    expect(r.officialUrl).toContain("eur-lex.europa.eu");
    expect(r.officialUrl).toContain("32012R0650");
    expect(r.shortTitle).toContain("650/2012");
  });

  it("curiaCaseUrl produit une URL exploitable", () => {
    const u = curiaCaseUrl("C-218/16");
    expect(u).toContain("curia.europa.eu");
    expect(u).toContain(encodeURIComponent("C-218/16"));
  });

  it("chaque règlement a au moins une entrée doctrinale", () => {
    for (const key of [
      "650-2012",
      "1259-2010",
      "2016-1103",
      "2016-1104",
      "2019-1111",
      "4-2009",
    ] as const) {
      expect(listDoctrine(key).length).toBeGreaterThan(0);
    }
  });
});

describe("Article enrichment", () => {
  it("getArticle fournit officialUrl + regulation", () => {
    const a = getArticle("21");
    expect(a).toBeDefined();
    expect(a!.officialUrl).toContain("eur-lex.europa.eu");
    expect(a!.regulation).toContain("650/2012");
  });

  it("listArticles enrichit toutes les entrées", () => {
    const all = listArticles();
    expect(all.length).toBeGreaterThan(5);
    expect(all.every((a) => a.officialUrl && a.regulation)).toBe(true);
  });

  it("Maintenance distingue Règlement et Protocole", () => {
    const reg = getMaintenanceArticle("3");
    const prot = getMaintenanceArticle("P.4");
    expect(reg!.regulation).toContain("4/2009");
    expect(prot!.regulation).toContain("Protocole de La Haye");
  });
});

describe("CJEU cases enrichment", () => {
  it("chaque arrêt expose un curiaUrl", () => {
    expect(CJEU_CASES.every((c) => c.curiaUrl.startsWith("https://curia.europa.eu/"))).toBe(true);
  });
});

interface Ctx {
  dir: string;
  url: string;
  cookie: string;
  close: () => Promise<void>;
}
let ctx: Ctx | null = null;

beforeEach(async () => {
  const dir = mkdtempSync(join(tmpdir(), "eurlex-doctr-"));
  const started = startServer({
    port: 0,
    host: "127.0.0.1",
    dataPath: join(dir, "cases.json"),
    usersPath: join(dir, "users.json"),
    webRoot: "src/web",
  });
  await new Promise<void>((r) => started.server.once("listening", () => r()));
  const addr = started.server.address() as AddressInfo;
  const url = `http://127.0.0.1:${addr.port}`;
  const reg = await fetch(`${url}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "doc@x.fr", password: "password1234" }),
  });
  const cookie = (reg.headers.get("set-cookie") ?? "").split(";")[0]!;
  ctx = {
    dir,
    url,
    cookie,
    close: () => new Promise<void>((r) => started.server.close(() => r())),
  };
});

afterEach(async () => {
  await ctx?.close();
  if (ctx) rmSync(ctx.dir, { recursive: true, force: true });
  ctx = null;
});

describe("HTTP /api/doctrine", () => {
  it("liste tous les règlements", async () => {
    const r = await fetch(`${ctx!.url}/api/doctrine`, {
      headers: { cookie: ctx!.cookie },
    });
    expect(r.status).toBe(200);
    const m = await r.json();
    expect(Object.keys(m).length).toBeGreaterThanOrEqual(6);
  });

  it("renvoie une bibliographie par règlement", async () => {
    const r = await fetch(`${ctx!.url}/api/doctrine/650-2012`, {
      headers: { cookie: ctx!.cookie },
    });
    expect(r.status).toBe(200);
    const m = await r.json();
    expect(m.regulation.officialUrl).toContain("eur-lex.europa.eu");
    expect(m.doctrine.length).toBeGreaterThan(0);
  });

  it("404 sur règlement inconnu", async () => {
    const r = await fetch(`${ctx!.url}/api/doctrine/unknown`, {
      headers: { cookie: ctx!.cookie },
    });
    expect(r.status).toBe(404);
  });
});

describe("Consultation HTML — sources block", () => {
  it("inclut une section Sources & doctrine avec EUR-Lex", async () => {
    const r = await fetch(`${ctx!.url}/api/succession/consultation`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: ctx!.cookie },
      body: JSON.stringify({
        case: {
          deceased: {
            nationalities: ["FR"],
            lastHabitualResidence: "FR",
            dateOfDeath: "2023-01-01",
          },
        },
      }),
    });
    expect(r.status).toBe(200);
    const html = await r.text();
    expect(html).toContain("Sources &amp; doctrine");
    expect(html).toContain("eur-lex.europa.eu");
  });
});
