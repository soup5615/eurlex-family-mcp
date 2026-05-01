import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AddressInfo } from "node:net";
import { startServer } from "../src/server/server.js";
import { UserStore } from "../src/server/auth.js";
import { renderConsultationHTML } from "../src/render/html.js";
import { analyseSuccession } from "../src/engine/analyze.js";

describe("UserStore — branding persistence", () => {
  it("stocke et restitue un branding", () => {
    const dir = mkdtempSync(join(tmpdir(), "eurlex-br-"));
    try {
      const us = new UserStore(join(dir, "u.json"));
      const u = us.create("a@x.fr", "password1234");
      const updated = us.setBranding(u.id, {
        firmName: "Cab. Dupont",
        authorName: "Maître Dupont",
      });
      expect(updated?.branding?.firmName).toBe("Cab. Dupont");
      // Reload and verify persistence.
      const us2 = new UserStore(join(dir, "u.json"));
      expect(us2.get(u.id)?.branding?.firmName).toBe("Cab. Dupont");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("supprime le branding sur reset", () => {
    const dir = mkdtempSync(join(tmpdir(), "eurlex-br-"));
    try {
      const us = new UserStore(join(dir, "u.json"));
      const u = us.create("b@x.fr", "password1234");
      us.setBranding(u.id, { firmName: "X" });
      us.setBranding(u.id, null);
      expect(us.get(u.id)?.branding).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("publicView inclut branding s'il existe", () => {
    const dir = mkdtempSync(join(tmpdir(), "eurlex-br-"));
    try {
      const us = new UserStore(join(dir, "u.json"));
      const u = us.create("c@x.fr", "password1234");
      expect(us.publicView(u).branding).toBeUndefined();
      us.setBranding(u.id, { firmName: "Cab" });
      expect(us.publicView(us.get(u.id)!).branding?.firmName).toBe("Cab");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("renderConsultationHTML — branding", () => {
  const a = analyseSuccession({
    deceased: {
      nationalities: ["FR"],
      lastHabitualResidence: "FR",
      dateOfDeath: "2023-01-01",
    },
  });

  it("sans branding : pas de page de garde", () => {
    const html = renderConsultationHTML(a);
    expect(html).not.toContain('class="cover"');
    expect(html).not.toContain("@page");
  });

  it("avec branding : page de garde + page d'avertissement + @page CSS", () => {
    const html = renderConsultationHTML(a, {
      title: "Dossier 2024-042",
      branding: {
        firmName: "Cab. Dupont",
        authorName: "Maître Dupont",
        clientReference: "DUP/2024/042",
      },
    });
    expect(html).toContain('class="cover"');
    expect(html).toContain("Cab. Dupont");
    expect(html).toContain("Maître Dupont");
    expect(html).toContain("DUP/2024/042");
    expect(html).toContain('class="disclaimer-page"');
    expect(html).toContain("@page");
    expect(html).toContain("counter(page)");
  });

  it("la bannière de disclaimer inline n'est pas dupliquée quand le PDF a la page Avertissement", () => {
    const html = renderConsultationHTML(a, {
      branding: { firmName: "X" },
    });
    // legal-disclaimer = bannière inline ; on vérifie qu'elle est
    // omise au profit de la page Avertissement dédiée.
    expect(html).not.toContain('class="legal-disclaimer"');
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
  const dir = mkdtempSync(join(tmpdir(), "eurlex-brsrv-"));
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
    body: JSON.stringify({ email: "br@x.fr", password: "password1234" }),
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

describe("HTTP /api/auth/me/branding", () => {
  it("PUT enregistre, GET /me retourne le branding", async () => {
    const r = await fetch(`${ctx!.url}/api/auth/me/branding`, {
      method: "PUT",
      headers: { "content-type": "application/json", cookie: ctx!.cookie },
      body: JSON.stringify({
        firmName: "Cab. Test",
        authorName: "Maître X",
      }),
    });
    expect(r.status).toBe(200);
    const me = await fetch(`${ctx!.url}/api/auth/me`, {
      headers: { cookie: ctx!.cookie },
    }).then((r) => r.json());
    expect(me.branding.firmName).toBe("Cab. Test");
  });

  it("Reset supprime le branding", async () => {
    await fetch(`${ctx!.url}/api/auth/me/branding`, {
      method: "PUT",
      headers: { "content-type": "application/json", cookie: ctx!.cookie },
      body: JSON.stringify({ firmName: "Cab. À effacer" }),
    });
    const r = await fetch(`${ctx!.url}/api/auth/me/branding`, {
      method: "PUT",
      headers: { "content-type": "application/json", cookie: ctx!.cookie },
      body: JSON.stringify({ reset: true }),
    });
    expect(r.status).toBe(200);
    const me = await fetch(`${ctx!.url}/api/auth/me`, {
      headers: { cookie: ctx!.cookie },
    }).then((r) => r.json());
    expect(me.branding).toBeUndefined();
  });

  it("401 sans session", async () => {
    const r = await fetch(`${ctx!.url}/api/auth/me/branding`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ firmName: "X" }),
    });
    expect(r.status).toBe(401);
  });

  it("Le branding utilisateur est auto-injecté dans /api/succession/consultation", async () => {
    await fetch(`${ctx!.url}/api/auth/me/branding`, {
      method: "PUT",
      headers: { "content-type": "application/json", cookie: ctx!.cookie },
      body: JSON.stringify({ firmName: "Auto-injected Cab" }),
    });
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
    expect(html).toContain("Auto-injected Cab");
    expect(html).toContain('class="cover"');
  });
});
