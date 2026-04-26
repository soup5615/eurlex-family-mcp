import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AddressInfo } from "node:net";
import { startServer } from "../src/server/server.js";
import {
  getTemplate,
  listTemplates,
  TEMPLATES,
} from "../src/server/templates.js";
import { analyseSuccession } from "../src/engine/analyze.js";
import { analyseMatrimonial } from "../src/matrimonial/engine/analyze.js";
import { analysePartnership } from "../src/partnerships/engine.js";
import { analyseRome3 } from "../src/divorce/engine.js";
import {
  analyseBiiMatrimonial,
  analyseBiiParental,
} from "../src/brussels2/engine.js";
import { analyseCombined } from "../src/matrimonial/combined.js";
import { analyseCrisis } from "../src/brussels2/crisis.js";
import { analyseRecognition } from "../src/recognition/engine.js";
import { analyseHague1980 } from "../src/hague1980/engine.js";
import { analyseMaintenance } from "../src/maintenance/engine.js";

describe("Templates — catalogue", () => {
  it("au moins un template par type de cas", () => {
    const kinds = new Set(TEMPLATES.map((t) => t.kind));
    for (const expected of [
      "succession",
      "matrimonial",
      "partnership",
      "divorce",
      "bii-matrimonial",
      "bii-parental",
      "combined",
      "crisis",
      "maintenance",
      "recognition",
      "hague-1980",
    ] as const) {
      expect(kinds.has(expected)).toBe(true);
    }
  });

  it("ids uniques", () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getTemplate / listTemplates filtre par kind", () => {
    expect(getTemplate("succ-fr-resident-de-immobilier-fr")).toBeDefined();
    expect(getTemplate("inexistant")).toBeUndefined();
    const succ = listTemplates({ kind: "succession" });
    expect(succ.length).toBeGreaterThan(0);
    expect(succ.every((t) => t.kind === "succession")).toBe(true);
  });

  it("chaque template est analysable par son moteur sans erreur", () => {
    for (const t of TEMPLATES) {
      switch (t.kind) {
        case "succession":
          expect(() => analyseSuccession(t.payload as never)).not.toThrow();
          break;
        case "matrimonial":
          expect(() => analyseMatrimonial(t.payload as never)).not.toThrow();
          break;
        case "partnership":
          expect(() => analysePartnership(t.payload as never)).not.toThrow();
          break;
        case "divorce":
          expect(() => analyseRome3(t.payload as never)).not.toThrow();
          break;
        case "bii-matrimonial":
          expect(() => analyseBiiMatrimonial(t.payload as never)).not.toThrow();
          break;
        case "bii-parental":
          expect(() => analyseBiiParental(t.payload as never)).not.toThrow();
          break;
        case "combined":
          expect(() => analyseCombined(t.payload as never)).not.toThrow();
          break;
        case "crisis":
          expect(() => analyseCrisis(t.payload as never)).not.toThrow();
          break;
        case "maintenance":
          expect(() => analyseMaintenance(t.payload as never)).not.toThrow();
          break;
        case "recognition":
          expect(() => analyseRecognition(t.payload as never)).not.toThrow();
          break;
        case "hague-1980":
          expect(() => analyseHague1980(t.payload as never)).not.toThrow();
          break;
      }
    }
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
  const dir = mkdtempSync(join(tmpdir(), "eurlex-tpl-"));
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
    body: JSON.stringify({ email: "tpl@x.fr", password: "password1234" }),
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

describe("HTTP /api/templates", () => {
  it("liste tous les modèles", async () => {
    const r = await fetch(`${ctx!.url}/api/templates`, {
      headers: { cookie: ctx!.cookie },
    });
    expect(r.status).toBe(200);
    const list = await r.json();
    expect(list.length).toBeGreaterThanOrEqual(8);
    expect(list[0]).toHaveProperty("title");
    expect(list[0]).toHaveProperty("tags");
  });

  it("filtre par kind", async () => {
    const r = await fetch(`${ctx!.url}/api/templates?kind=succession`, {
      headers: { cookie: ctx!.cookie },
    });
    const list = await r.json();
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((t: { kind: string }) => t.kind === "succession")).toBe(true);
  });

  it("récupère un modèle complet par id", async () => {
    const r = await fetch(
      `${ctx!.url}/api/templates/succ-fr-resident-de-immobilier-fr`,
      { headers: { cookie: ctx!.cookie } },
    );
    expect(r.status).toBe(200);
    const t = await r.json();
    expect(t.payload).toBeDefined();
    expect(t.payload.deceased.lastHabitualResidence).toBe("DE");
  });

  it("404 sur un id inconnu", async () => {
    const r = await fetch(`${ctx!.url}/api/templates/inexistant`, {
      headers: { cookie: ctx!.cookie },
    });
    expect(r.status).toBe(404);
  });
});
