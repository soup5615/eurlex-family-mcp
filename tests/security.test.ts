import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AddressInfo } from "node:net";
import { startServer } from "../src/server/server.js";

interface Ctx {
  dir: string;
  url: string;
  cookie: string;
  close: () => Promise<void>;
}
let ctx: Ctx | null = null;

beforeEach(async () => {
  const dir = mkdtempSync(join(tmpdir(), "eurlex-sec-"));
  // Build an isolated webRoot so we can assert traversal rejection
  // without relying on src/ layout.
  const webRoot = join(dir, "web");
  mkdirSync(webRoot, { recursive: true });
  writeFileSync(join(webRoot, "index.html"), "<html>safe</html>", "utf8");
  writeFileSync(join(dir, "secret.txt"), "TOP-SECRET", "utf8");

  const started = startServer({
    port: 0,
    host: "127.0.0.1",
    dataPath: join(dir, "cases.json"),
    usersPath: join(dir, "users.json"),
    webRoot,
  });
  await new Promise<void>((r) => started.server.once("listening", () => r()));
  const addr = started.server.address() as AddressInfo;
  const url = `http://127.0.0.1:${addr.port}`;
  // We need a session for body-size tests against authenticated routes.
  const reg = await fetch(`${url}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "sec@x.fr", password: "password1234" }),
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

describe("Path traversal", () => {
  it("rejette les remontées hors du webRoot", async () => {
    // Encoded `..` to slip past trivial replace-based filters.
    const r = await fetch(
      `${ctx!.url}/%2e%2e/secret.txt`,
    );
    expect([403, 404]).toContain(r.status);
    const text = await r.text();
    expect(text).not.toContain("TOP-SECRET");
  });

  it("rejette les .. en clair", async () => {
    const r = await fetch(`${ctx!.url}/../secret.txt`);
    expect([403, 404]).toContain(r.status);
    const text = await r.text();
    expect(text).not.toContain("TOP-SECRET");
  });

  it("sert correctement /index.html", async () => {
    const r = await fetch(`${ctx!.url}/`);
    expect(r.status).toBe(200);
    const text = await r.text();
    expect(text).toContain("safe");
  });
});

describe("Body size limit", () => {
  it("renvoie 413 lorsque le corps dépasse la limite", async () => {
    const huge = "x".repeat(1_200_000); // > 1 MiB cap
    const body = JSON.stringify({ huge });
    const r = await fetch(`${ctx!.url}/api/succession/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: ctx!.cookie },
      body,
    });
    expect(r.status).toBe(413);
    const j = await r.json();
    expect(j.error).toContain("body");
  });

  it("renvoie 400 sur du JSON invalide", async () => {
    const r = await fetch(`${ctx!.url}/api/succession/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: ctx!.cookie },
      body: "{not json",
    });
    expect(r.status).toBe(400);
  });
});
