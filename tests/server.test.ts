import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AddressInfo } from "node:net";
import { startServer } from "../src/server/server.js";

let ctx: { dir: string; url: string; close: () => Promise<void> } | null = null;

beforeEach(async () => {
  const dir = mkdtempSync(join(tmpdir(), "eurlex-srv-"));
  const started = startServer({
    port: 0,
    host: "127.0.0.1",
    dataPath: join(dir, "cases.json"),
    webRoot: "src/web",
  });
  // Wait for listen
  await new Promise<void>((resolve) => started.server.once("listening", () => resolve()));
  const addr = started.server.address() as AddressInfo;
  ctx = {
    dir,
    url: `http://127.0.0.1:${addr.port}`,
    close: () =>
      new Promise<void>((r) => started.server.close(() => r())),
  };
});

afterEach(async () => {
  await ctx?.close();
  if (ctx) rmSync(ctx.dir, { recursive: true, force: true });
  ctx = null;
});

describe("HTTP server", () => {
  it("GET /health → ok", async () => {
    const r = await fetch(`${ctx!.url}/health`);
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.ok).toBe(true);
  });

  it("GET / sert la page HTML", async () => {
    const r = await fetch(`${ctx!.url}/`);
    expect(r.status).toBe(200);
    const text = await r.text();
    expect(text).toContain("<title>eurlex-family");
  });

  it("POST /api/succession/analyze → analyse", async () => {
    const r = await fetch(`${ctx!.url}/api/succession/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        deceased: {
          nationalities: ["FR"],
          lastHabitualResidence: "FR",
          dateOfDeath: "2023-01-01",
        },
      }),
    });
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.jurisdiction.competentForum).toBe("FR");
  });

  it("GET /api/articles/650 → liste articles", async () => {
    const r = await fetch(`${ctx!.url}/api/articles/650`);
    expect(r.status).toBe(200);
    const list = await r.json();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(5);
  });

  it("CRUD /api/cases", async () => {
    const create = await fetch(`${ctx!.url}/api/cases`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Test API",
        kind: "succession",
        payload: { foo: 1 },
      }),
    });
    expect(create.status).toBe(201);
    const c = await create.json();

    const list = await fetch(`${ctx!.url}/api/cases?kind=succession`).then(
      (r) => r.json(),
    );
    expect(list).toHaveLength(1);

    const put = await fetch(`${ctx!.url}/api/cases/${c.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    });
    expect(put.status).toBe(200);

    const del = await fetch(`${ctx!.url}/api/cases/${c.id}`, {
      method: "DELETE",
    });
    expect(del.status).toBe(204);

    const listAfter = await fetch(`${ctx!.url}/api/cases`).then((r) => r.json());
    expect(listAfter).toHaveLength(0);
  });

  it("POST /api/combined/consultation → HTML", async () => {
    const r = await fetch(`${ctx!.url}/api/combined/consultation`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        succession: {
          deceased: {
            nationalities: ["FR"],
            lastHabitualResidence: "FR",
            dateOfDeath: "2023-01-01",
          },
        },
        marriage: { dateOfMarriage: "2020-01-01" },
        survivingSpouse: {
          id: "B",
          nationalities: ["FR"],
          habitualResidence: "FR",
        },
      }),
    });
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toContain("text/html");
    const text = await r.text();
    expect(text).toContain("<!doctype html>");
  });
});
