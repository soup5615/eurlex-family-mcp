import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, chmodSync } from "node:fs";
import { delimiter, join } from "node:path";
import { tmpdir } from "node:os";
import { detectChrome } from "../src/server/pdf.js";

let savedPath: string | undefined;
let savedChromePath: string | undefined;

beforeEach(() => {
  savedPath = process.env.PATH;
  savedChromePath = process.env.CHROME_PATH;
});

afterEach(() => {
  if (savedPath !== undefined) process.env.PATH = savedPath;
  else delete process.env.PATH;
  if (savedChromePath !== undefined) process.env.CHROME_PATH = savedChromePath;
  else delete process.env.CHROME_PATH;
});

describe("detectChrome — PATH lookup", () => {
  it("trouve un binaire dont le nom est sur PATH", () => {
    if (process.platform === "win32") return; // CI Windows skip
    const dir = mkdtempSync(join(tmpdir(), "eurlex-path-"));
    try {
      const fake = join(dir, "chromium");
      writeFileSync(fake, "#!/bin/sh\nexit 0\n", "utf8");
      chmodSync(fake, 0o755);
      // Restrict PATH to our temp dir to make the test deterministic.
      process.env.PATH = dir;
      delete process.env.CHROME_PATH;
      const found = detectChrome();
      expect(found).toBe(fake);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("renvoie null quand rien n'est trouvable et que CHROME_PATH n'existe pas", () => {
    process.env.PATH = "/nonexistent-dir-xyz";
    process.env.CHROME_PATH = "/also/nonexistent";
    expect(detectChrome()).toBeNull();
  });

  it("préfère CHROME_PATH s'il existe", () => {
    if (process.platform === "win32") return;
    const dir = mkdtempSync(join(tmpdir(), "eurlex-path-"));
    try {
      const fake = join(dir, "my-chrome");
      writeFileSync(fake, "#!/bin/sh\nexit 0\n", "utf8");
      chmodSync(fake, 0o755);
      process.env.CHROME_PATH = fake;
      // PATH purposely empty so we can prove CHROME_PATH wins.
      process.env.PATH = "/nonexistent-xyz";
      expect(detectChrome()).toBe(fake);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
