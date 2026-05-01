import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AddressInfo } from "node:net";
import { startServer } from "../src/server/server.js";
import {
  PRIMARY_DISCLAIMER,
  SCOPE_LIMITATIONS_BY_REGULATION,
  listScopeLimitations,
} from "../src/data/legalDisclaimer.js";
import { listArticles } from "../src/data/articles.js";
import { listMatrimonialArticles } from "../src/matrimonial/articles.js";
import { listMaintenanceArticles } from "../src/maintenance/articles.js";
import { analyseSuccession } from "../src/engine/analyze.js";
import { renderConsultationHTML } from "../src/render/html.js";

describe("Disclaimer + scope catalog", () => {
  it("PRIMARY_DISCLAIMER mentions explicitement « pas un conseil juridique »", () => {
    expect(PRIMARY_DISCLAIMER.toLowerCase()).toContain(
      "ne constitue pas un conseil juridique",
    );
  });

  it("Toutes les lacunes sont listées par règlement", () => {
    const all = listScopeLimitations();
    expect(all.length).toBeGreaterThanOrEqual(6);
    expect(
      Object.keys(SCOPE_LIMITATIONS_BY_REGULATION).every(
        (k) => SCOPE_LIMITATIONS_BY_REGULATION[k]!.length > 0,
      ),
    ).toBe(true);
  });
});

describe("Article verificationStatus", () => {
  it("R650 articles : status par défaut = drafted-by-claude", () => {
    const a = listArticles();
    expect(a.length).toBeGreaterThan(5);
    expect(a.every((x) => x.verificationStatus === "drafted-by-claude")).toBe(true);
  });

  it("R 2016/1103 articles : status par défaut = drafted-by-claude", () => {
    const a = listMatrimonialArticles();
    expect(a.every((x) => x.verificationStatus === "drafted-by-claude")).toBe(true);
  });

  it("R 4/2009 et Protocole 2007 : status = drafted-by-claude", () => {
    const a = listMaintenanceArticles();
    expect(a.every((x) => x.verificationStatus === "drafted-by-claude")).toBe(true);
  });
});

describe("Engine confidence on fact-sensitive determinations", () => {
  it("Art. 21(2) R650 : confidence = fact-sensitive", () => {
    const a = analyseSuccession({
      deceased: {
        nationalities: ["FR"],
        lastHabitualResidence: "BE",
        dateOfDeath: "2023-01-01",
      },
      manifestlyCloserConnectionWith: "FR",
    });
    const step = a.applicableLaw.reasoning.find((r) =>
      r.article.includes("21(2)"),
    );
    expect(step?.confidence).toBe("fact-sensitive");
  });
});

describe("Consultation HTML — disclaimer + limites", () => {
  it("Inclut la bannière d'avertissement et la section Limites du moteur", () => {
    const a = analyseSuccession({
      deceased: {
        nationalities: ["FR"],
        lastHabitualResidence: "FR",
        dateOfDeath: "2023-01-01",
      },
    });
    const html = renderConsultationHTML(a);
    expect(html).toContain("legal-disclaimer");
    expect(html).toContain("Avertissement");
    expect(html).toContain("Limites du moteur");
    expect(html.toLowerCase()).toContain("conseil juridique");
  });
});

interface Ctx {
  dir: string;
  url: string;
  close: () => Promise<void>;
}
let ctx: Ctx | null = null;

beforeEach(async () => {
  const dir = mkdtempSync(join(tmpdir(), "eurlex-disc-"));
  const started = startServer({
    port: 0,
    host: "127.0.0.1",
    dataPath: join(dir, "cases.json"),
    usersPath: join(dir, "users.json"),
    webRoot: "src/web",
  });
  await new Promise<void>((r) => started.server.once("listening", () => r()));
  const addr = started.server.address() as AddressInfo;
  ctx = {
    dir,
    url: `http://127.0.0.1:${addr.port}`,
    close: () => new Promise<void>((r) => started.server.close(() => r())),
  };
});

afterEach(async () => {
  await ctx?.close();
  if (ctx) rmSync(ctx.dir, { recursive: true, force: true });
  ctx = null;
});

describe("HTTP /api/disclaimer (public)", () => {
  it("Retourne le disclaimer principal et les limites de scope", async () => {
    const r = await fetch(`${ctx!.url}/api/disclaimer`);
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.primary.toLowerCase()).toContain("conseil juridique");
    expect(Array.isArray(j.scopeLimitations)).toBe(true);
    expect(j.scopeLimitations.length).toBeGreaterThan(0);
  });

  it("Renvoie les limites par règlement", async () => {
    const r = await fetch(`${ctx!.url}/api/scope-limitations/650-2012`);
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.regulation).toBe("650-2012");
    expect(j.limitations.length).toBeGreaterThan(0);
  });

  it("404 sur règlement inconnu", async () => {
    const r = await fetch(`${ctx!.url}/api/scope-limitations/foo`);
    expect(r.status).toBe(404);
  });
});

describe("Web UI banner", () => {
  it("Page d'accueil sert la bannière permanente", async () => {
    const r = await fetch(`${ctx!.url}/`);
    const html = await r.text();
    expect(html).toContain('class="legal-banner"');
    expect(html.toLowerCase()).toContain("conseil juridique");
  });
});
