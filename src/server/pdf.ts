// HTML → PDF rendering via headless Chrome / Chromium. The Chrome
// binary is detected at runtime; the user can override via the
// CHROME_PATH env var or the `chromePath` server option.

import { spawn } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
  existsSync,
  statSync,
} from "node:fs";
import { delimiter, join } from "node:path";
import { tmpdir } from "node:os";

export class ChromeNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChromeNotFoundError";
  }
}

const CANDIDATES = [
  "google-chrome",
  "google-chrome-stable",
  "chrome",
  "chromium",
  "chromium-browser",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/opt/google/chrome/chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
];

export function detectChrome(): string | null {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  for (const c of CANDIDATES) {
    if (c.includes("/") || c.includes("\\")) {
      if (existsSync(c)) return c;
      continue;
    }
    const onPath = lookupOnPath(c);
    if (onPath) return onPath;
  }
  return null;
}

// PATH lookup with the right extensions on Windows. We avoid spawning
// `which`/`where` to keep this fast and dependency-free.
function lookupOnPath(name: string): string | null {
  const PATH = process.env.PATH ?? "";
  if (!PATH) return null;
  const dirs = PATH.split(delimiter);
  const isWin = process.platform === "win32";
  const exts = isWin
    ? (process.env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD").split(";")
    : [""];
  for (const dir of dirs) {
    if (!dir) continue;
    for (const ext of exts) {
      const candidate = join(dir, name + ext);
      try {
        const s = statSync(candidate);
        if (s.isFile()) return candidate;
      } catch {
        /* not found, try next */
      }
    }
  }
  return null;
}

export interface RenderPdfOptions {
  chromePath?: string;
  // Page format hints passed to Chrome.
  format?: "A4" | "Letter";
  // Render timeout in milliseconds.
  timeoutMs?: number;
}

export async function renderPdf(
  html: string,
  opts: RenderPdfOptions = {},
): Promise<Buffer> {
  const chrome = opts.chromePath ?? detectChrome();
  if (!chrome) {
    throw new ChromeNotFoundError(
      "Chrome/Chromium introuvable. Installer Chrome/Chromium ou définir la variable d'environnement CHROME_PATH.",
    );
  }
  const dir = mkdtempSync(join(tmpdir(), "eurlex-pdf-"));
  const htmlPath = join(dir, "input.html");
  const pdfPath = join(dir, "output.pdf");
  writeFileSync(htmlPath, html, "utf8");
  try {
    await runChrome(chrome, htmlPath, pdfPath, opts);
    return readFileSync(pdfPath);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function runChrome(
  bin: string,
  htmlPath: string,
  pdfPath: string,
  opts: RenderPdfOptions,
): Promise<void> {
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--no-pdf-header-footer",
    `--print-to-pdf=${pdfPath}`,
    `--print-to-pdf-no-header`,
    `--virtual-time-budget=2000`,
    `file://${htmlPath}`,
  ];
  if (opts.format) {
    // Chrome respects @page CSS for size; we add a hint via inline CSS
    // upstream rather than CLI flags, which Chrome ignores. The format
    // option is informational.
  }
  return new Promise<void>((resolve, reject) => {
    const proc = spawn(bin, args, { stdio: "ignore" });
    const timeoutMs = opts.timeoutMs ?? 30_000;
    const timer = setTimeout(() => {
      proc.kill("SIGKILL");
      reject(new Error(`PDF rendering timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    proc.on("exit", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`Chrome exited with code ${code}`));
    });
  });
}
