import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AddressInfo } from "node:net";
import { CaseStore } from "../src/server/storage.js";
import { startServer } from "../src/server/server.js";

const OWNER = "u-versions";

describe("CaseStore — versionnement", () => {
  it("capture une version chaque fois que le payload change", () => {
    const dir = mkdtempSync(join(tmpdir(), "eurlex-vers-"));
    try {
      const store = new CaseStore(join(dir, "cases.json"));
      const c = store.create({
        ownerId: OWNER,
        title: "v1",
        kind: "succession",
        payload: { foo: 1 },
      });
      // Une mise à jour qui ne touche pas le payload ne crée pas de version.
      store.update(c.id, OWNER, { title: "même payload" });
      expect(store.listVersions(c.id, OWNER)).toHaveLength(0);
      // Modification du payload → snapshot.
      store.update(c.id, OWNER, { payload: { foo: 2 } }, { comment: "v2" });
      const after1 = store.listVersions(c.id, OWNER)!;
      expect(after1).toHaveLength(1);
      expect(after1[0]!.comment).toBe("v2");
      expect(after1[0]!.payload).toEqual({ foo: 1 });
      // Encore une fois.
      store.update(c.id, OWNER, { payload: { foo: 3 } });
      const after2 = store.listVersions(c.id, OWNER)!;
      expect(after2).toHaveLength(2);
      // Plus récente en tête.
      expect(after2[0]!.payload).toEqual({ foo: 2 });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("restaure une version antérieure et pousse la tête courante dans l'historique", () => {
    const dir = mkdtempSync(join(tmpdir(), "eurlex-vers-"));
    try {
      const store = new CaseStore(join(dir, "cases.json"));
      const c = store.create({
        ownerId: OWNER,
        title: "case",
        kind: "succession",
        payload: { v: "a" },
      });
      store.update(c.id, OWNER, { payload: { v: "b" } });
      store.update(c.id, OWNER, { payload: { v: "c" } });
      const versions = store.listVersions(c.id, OWNER)!;
      // Versions: [b, a]
      const targetA = versions.find(
        (v) => (v.payload as { v: string }).v === "a",
      )!;
      const restored = store.restoreVersion(c.id, OWNER, targetA.id);
      expect(restored?.payload).toEqual({ v: "a" });
      const after = store.listVersions(c.id, OWNER)!;
      // L'ancienne tête `c` doit figurer dans l'historique ; targetA n'y
      // est plus (devenu tête).
      expect(after.some((v) => (v.payload as { v: string }).v === "c")).toBe(true);
      expect(after.some((v) => v.id === targetA.id)).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("isole les versions par ownerId", () => {
    const dir = mkdtempSync(join(tmpdir(), "eurlex-vers-"));
    try {
      const store = new CaseStore(join(dir, "cases.json"));
      const c = store.create({
        ownerId: "alice",
        title: "alice",
        kind: "succession",
        payload: { x: 1 },
      });
      store.update(c.id, "alice", { payload: { x: 2 } });
      expect(store.listVersions(c.id, "bob")).toBeUndefined();
      const v = store.listVersions(c.id, "alice")![0]!;
      expect(store.getVersion(c.id, "bob", v.id)).toBeUndefined();
      expect(store.restoreVersion(c.id, "bob", v.id)).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("persiste l'historique entre deux instances", () => {
    const dir = mkdtempSync(join(tmpdir(), "eurlex-vers-"));
    try {
      const path = join(dir, "cases.json");
      const s1 = new CaseStore(path);
      const c = s1.create({
        ownerId: OWNER,
        title: "p",
        kind: "succession",
        payload: { v: 1 },
      });
      s1.update(c.id, OWNER, { payload: { v: 2 } }, { comment: "to v2" });
      const s2 = new CaseStore(path);
      const versions = s2.listVersions(c.id, OWNER)!;
      expect(versions).toHaveLength(1);
      expect(versions[0]!.comment).toBe("to v2");
    } finally {
      rmSync(dir, { recursive: true, force: true });
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
  const dir = mkdtempSync(join(tmpdir(), "eurlex-vers-srv-"));
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
    body: JSON.stringify({ email: "v@x.fr", password: "password1234" }),
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

describe("HTTP — versions", () => {
  it("liste, récupère et restaure une version via l'API", async () => {
    const create = await fetch(`${ctx!.url}/api/cases`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: ctx!.cookie },
      body: JSON.stringify({
        title: "Test",
        kind: "succession",
        payload: { v: 1 },
      }),
    });
    const c = await create.json();
    await fetch(`${ctx!.url}/api/cases/${c.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json", cookie: ctx!.cookie },
      body: JSON.stringify({ payload: { v: 2 }, comment: "v2" }),
    });
    await fetch(`${ctx!.url}/api/cases/${c.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json", cookie: ctx!.cookie },
      body: JSON.stringify({ payload: { v: 3 } }),
    });

    const list = await fetch(`${ctx!.url}/api/cases/${c.id}/versions`, {
      headers: { cookie: ctx!.cookie },
    }).then((r) => r.json());
    expect(list).toHaveLength(2);
    // Pas de payload côté liste.
    expect(list[0]).not.toHaveProperty("payload");

    const v1 = list.find((v: { comment?: string }) => v.comment === "v2");
    expect(v1).toBeDefined();

    const detail = await fetch(
      `${ctx!.url}/api/cases/${c.id}/versions/${v1.id}`,
      { headers: { cookie: ctx!.cookie } },
    ).then((r) => r.json());
    expect(detail.payload).toEqual({ v: 1 });

    const restored = await fetch(
      `${ctx!.url}/api/cases/${c.id}/versions/${v1.id}/restore`,
      {
        method: "POST",
        headers: { "content-type": "application/json", cookie: ctx!.cookie },
        body: JSON.stringify({ comment: "rollback" }),
      },
    ).then((r) => r.json());
    expect(restored.payload).toEqual({ v: 1 });
  });

  it("404 sur une version inexistante", async () => {
    const create = await fetch(`${ctx!.url}/api/cases`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: ctx!.cookie },
      body: JSON.stringify({
        title: "Test",
        kind: "succession",
        payload: { v: 1 },
      }),
    });
    const c = await create.json();
    const r = await fetch(
      `${ctx!.url}/api/cases/${c.id}/versions/inexistant`,
      { headers: { cookie: ctx!.cookie } },
    );
    expect(r.status).toBe(404);
  });
});
