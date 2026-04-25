import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  chmodSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AddressInfo } from "node:net";
import { startServer } from "../src/server/server.js";
import { ChromeNotFoundError, renderPdf } from "../src/server/pdf.js";

interface Ctx {
  dir: string;
  url: string;
  cookie: string;
  close: () => Promise<void>;
}

let ctx: Ctx | null = null;

beforeEach(async () => {
  const dir = mkdtempSync(join(tmpdir(), "eurlex-pdf-"));
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
  // Register and capture cookie.
  const reg = await fetch(`${url}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "pdf@test.fr", password: "password1234" }),
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
  delete process.env.CHROME_PATH;
});

describe("PDF rendering", () => {
  it("renderPdf jette ChromeNotFoundError quand aucun binaire", async () => {
    process.env.CHROME_PATH = "/nonexistent/chrome";
    await expect(renderPdf("<p>hi</p>")).rejects.toBeInstanceOf(ChromeNotFoundError);
    delete process.env.CHROME_PATH;
  });

  it("renderPdf utilise le binaire fourni et lit l'output", async () => {
    // Stub binary: a shell script that copies a fixed PDF byte sequence
    // to the path supplied via --print-to-pdf=<path>.
    const stubDir = mkdtempSync(join(tmpdir(), "eurlex-stub-"));
    try {
      const stub = join(stubDir, "fake-chrome.sh");
      writeFileSync(
        stub,
        `#!/usr/bin/env bash
set -e
out=""
for arg in "$@"; do
  case "$arg" in
    --print-to-pdf=*) out="\${arg#--print-to-pdf=}" ;;
  esac
done
[ -n "$out" ] || exit 1
printf '%%PDF-1.4\\n%%fake\\n' > "$out"
exit 0
`,
        "utf8",
      );
      chmodSync(stub, 0o755);
      const buf = await renderPdf("<p>hi</p>", { chromePath: stub });
      expect(buf.toString("utf8")).toContain("%PDF-1.4");
    } finally {
      rmSync(stubDir, { recursive: true, force: true });
    }
  });

  it("HTTP /api/succession/pdf renvoie 503 si Chrome introuvable", async () => {
    process.env.CHROME_PATH = "/nonexistent/chrome";
    const r = await fetch(`${ctx!.url}/api/succession/pdf`, {
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
        title: "smoke",
      }),
    });
    expect(r.status).toBe(503);
    const body = await r.json();
    expect(body.error).toContain("Chrome");
    expect(body.hint).toBeTruthy();
  });

  it("HTTP /api/pdf accepte du HTML brut (avec stub binary)", async () => {
    const stubDir = mkdtempSync(join(tmpdir(), "eurlex-stub-"));
    try {
      const stub = join(stubDir, "fake-chrome.sh");
      writeFileSync(
        stub,
        `#!/usr/bin/env bash
set -e
out=""
for arg in "$@"; do
  case "$arg" in --print-to-pdf=*) out="\${arg#--print-to-pdf=}" ;; esac
done
printf '%%PDF-1.4\\nfake\\n' > "$out"
`,
        "utf8",
      );
      chmodSync(stub, 0o755);
      process.env.CHROME_PATH = stub;
      const r = await fetch(`${ctx!.url}/api/pdf`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie: ctx!.cookie },
        body: JSON.stringify({ html: "<p>hello</p>", filename: "smoke" }),
      });
      expect(r.status).toBe(200);
      expect(r.headers.get("content-type")).toBe("application/pdf");
      expect(r.headers.get("content-disposition")).toContain("smoke.pdf");
      const buf = Buffer.from(await r.arrayBuffer());
      expect(buf.toString("utf8")).toContain("%PDF-1.4");
    } finally {
      rmSync(stubDir, { recursive: true, force: true });
    }
  });
});
