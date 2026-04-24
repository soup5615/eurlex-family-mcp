import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AddressInfo } from "node:net";
import { startServer } from "../src/server/server.js";
import { UserStore } from "../src/server/auth.js";

interface Ctx {
  dir: string;
  url: string;
  close: () => Promise<void>;
}

let ctx: Ctx | null = null;

beforeEach(async () => {
  const dir = mkdtempSync(join(tmpdir(), "eurlex-auth-"));
  const started = startServer({
    port: 0,
    host: "127.0.0.1",
    dataPath: join(dir, "cases.json"),
    usersPath: join(dir, "users.json"),
    webRoot: "src/web",
  });
  await new Promise<void>((resolve) => started.server.once("listening", () => resolve()));
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

describe("UserStore", () => {
  it("hache et vérifie un mot de passe", () => {
    const dir = mkdtempSync(join(tmpdir(), "eurlex-us-"));
    try {
      const us = new UserStore(join(dir, "u.json"));
      const u = us.create("a@b.fr", "password1234");
      expect(us.verifyPassword(u, "password1234")).toBe(true);
      expect(us.verifyPassword(u, "wrong-password")).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("le premier utilisateur est admin", () => {
    const dir = mkdtempSync(join(tmpdir(), "eurlex-us-"));
    try {
      const us = new UserStore(join(dir, "u.json"));
      expect(us.create("first@x.fr", "password1234").role).toBe("admin");
      expect(us.create("second@x.fr", "password1234").role).toBe("user");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("rejette mots de passe trop courts et e-mails dupliqués", () => {
    const dir = mkdtempSync(join(tmpdir(), "eurlex-us-"));
    try {
      const us = new UserStore(join(dir, "u.json"));
      expect(() => us.create("a@b.fr", "short")).toThrow();
      us.create("dup@b.fr", "password1234");
      expect(() => us.create("dup@b.fr", "anotherpass1")).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("émet et vérifie une session signée", () => {
    const dir = mkdtempSync(join(tmpdir(), "eurlex-us-"));
    try {
      const us = new UserStore(join(dir, "u.json"));
      const u = us.create("s@b.fr", "password1234");
      const tok = us.issueSession(u.id);
      expect(us.verifySession(tok)?.userId).toBe(u.id);
      // Tampered token must fail.
      const tampered = tok.slice(0, -1) + (tok.endsWith("a") ? "b" : "a");
      expect(us.verifySession(tampered)).toBeNull();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("HTTP auth", () => {
  it("register → me retourne l'utilisateur", async () => {
    const r = await fetch(`${ctx!.url}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "alice@x.fr", password: "password1234" }),
    });
    expect(r.status).toBe(201);
    const cookie = (r.headers.get("set-cookie") ?? "").split(";")[0]!;
    const me = await fetch(`${ctx!.url}/api/auth/me`, { headers: { cookie } });
    expect(me.status).toBe(200);
    const u = await me.json();
    expect(u.email).toBe("alice@x.fr");
    expect(u.role).toBe("admin");
  });

  it("login fonctionne après register, mauvaise paire échoue", async () => {
    await fetch(`${ctx!.url}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "bob@x.fr", password: "password1234" }),
    });
    const ok = await fetch(`${ctx!.url}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "bob@x.fr", password: "password1234" }),
    });
    expect(ok.status).toBe(200);
    const ko = await fetch(`${ctx!.url}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "bob@x.fr", password: "wrongwrong" }),
    });
    expect(ko.status).toBe(401);
  });

  it("logout invalide la session côté client (cookie effacé)", async () => {
    const reg = await fetch(`${ctx!.url}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "carol@x.fr", password: "password1234" }),
    });
    const cookie = (reg.headers.get("set-cookie") ?? "").split(";")[0]!;
    const out = await fetch(`${ctx!.url}/api/auth/logout`, {
      method: "POST",
      headers: { cookie },
    });
    expect(out.status).toBe(204);
    const setCookie = out.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(/Max-Age=0/);
  });

  it("isolation : les cas d'Alice ne sont pas visibles à Bob", async () => {
    const reg = async (email: string) => {
      const r = await fetch(`${ctx!.url}/api/auth/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password: "password1234" }),
      });
      return (r.headers.get("set-cookie") ?? "").split(";")[0]!;
    };
    const aliceCookie = await reg("alice2@x.fr");
    const bobCookie = await reg("bob2@x.fr");
    const create = await fetch(`${ctx!.url}/api/cases`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: aliceCookie },
      body: JSON.stringify({
        title: "Alice case",
        kind: "succession",
        payload: { foo: 1 },
      }),
    });
    expect(create.status).toBe(201);
    const aliceList = await fetch(`${ctx!.url}/api/cases`, {
      headers: { cookie: aliceCookie },
    }).then((r) => r.json());
    expect(aliceList).toHaveLength(1);
    const bobList = await fetch(`${ctx!.url}/api/cases`, {
      headers: { cookie: bobCookie },
    }).then((r) => r.json());
    expect(bobList).toHaveLength(0);
  });
});
