// Minimal HTTP server (no framework) exposing the engines and a small
// case store, and serving the static web UI.
//
// Routes:
//   GET  /health
//   POST /api/succession/analyze
//   POST /api/succession/consultation
//   POST /api/matrimonial/analyze
//   POST /api/matrimonial/consultation
//   POST /api/combined/analyze
//   POST /api/combined/consultation
//   POST /api/partnership/analyze
//   POST /api/divorce/analyze
//   POST /api/bii/matrimonial
//   POST /api/bii/parental
//   POST /api/crisis/analyze
//   GET  /api/articles/:regulation          (list)
//   GET  /api/articles/:regulation/:id      (one)
//   GET  /api/cjeu-cases
//   GET  /api/member-states/:regulation
//   GET  /api/cases                         (list, ?kind= & ?q=)
//   POST /api/cases                         (create)
//   GET  /api/cases/:id
//   PUT  /api/cases/:id
//   DELETE /api/cases/:id
//   GET  /                                   (serves web UI)

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { analyseSuccession } from "../engine/analyze.js";
import { listArticles, getArticle } from "../data/articles.js";
import { CJEU_CASES } from "../data/cjeuCases.js";
import { listBoundMemberStates } from "../data/memberStates.js";
import { renderConsultationHTML } from "../render/html.js";

import { analyseMatrimonial } from "../matrimonial/engine/analyze.js";
import {
  renderCombinedHTML,
  renderMatrimonialHTML,
} from "../render/matrimonialHtml.js";
import {
  analyseCombined,
  type CombinedCase,
} from "../matrimonial/combined.js";
import {
  listMatrimonialArticles,
  getMatrimonialArticle,
} from "../matrimonial/articles.js";
import { listMatrimonialBoundStates } from "../matrimonial/memberStates.js";

import { analysePartnership } from "../partnerships/engine.js";
import {
  listPartnershipArticles,
  getPartnershipArticle,
} from "../partnerships/articles.js";
import { listPartnershipBoundStates } from "../partnerships/memberStates.js";

import { analyseRome3 } from "../divorce/engine.js";
import {
  listRome3Articles,
  getRome3Article,
} from "../divorce/articles.js";
import { listRome3BoundStates } from "../divorce/memberStates.js";

import {
  analyseBiiMatrimonial,
  analyseBiiParental,
} from "../brussels2/engine.js";
import {
  listBiiArticles,
  getBiiArticle,
} from "../brussels2/articles.js";
import { listBiiBoundStates } from "../brussels2/memberStates.js";
import { analyseCrisis, type CrisisCase } from "../brussels2/crisis.js";

import { CaseStore, type CaseKind } from "./storage.js";
import {
  buildSessionCookie,
  clearSessionCookie,
  parseCookies,
  SESSION_COOKIE,
  UserStore,
  type User,
} from "./auth.js";
import { ChromeNotFoundError, renderPdf } from "./pdf.js";
import { getTemplate, listTemplates } from "./templates.js";
import type { SuccessionCase } from "../types.js";
import type { MatrimonialCase } from "../matrimonial/types.js";
import type { PartnershipCase } from "../partnerships/types.js";
import type { DivorceCase } from "../divorce/types.js";
import type {
  BiiMatrimonialCase,
  BiiParentalResponsibilityCase,
} from "../brussels2/types.js";

export interface ServerOptions {
  port: number;
  host?: string;
  dataPath?: string; // path to cases JSON
  usersPath?: string; // path to users JSON (defaults next to dataPath)
  webRoot?: string;
  cookieSecure?: boolean; // emit Secure cookie attribute
  // "required": every /api/* route except /api/auth/* requires a session.
  // "off"     : auth routes still exist but other routes accept an
  //             implicit "anonymous" user (used by tests).
  auth?: "required" | "off";
}

interface RouteCtx {
  params: Record<string, string>;
  store: CaseStore;
  users: UserStore;
  webRoot: string;
  user: User | null; // resolved by middleware
  cookieSecure: boolean;
}

type Handler = (req: IncomingMessage, res: ServerResponse, ctx: RouteCtx) => Promise<void> | void;

interface Route {
  method: "GET" | "POST" | "PUT" | "DELETE";
  pattern: RegExp;
  keys: string[];
  handler: Handler;
  // If true, the route is reachable without a valid session even when
  // auth mode is "required" (used for /api/auth/* and /health).
  public?: boolean;
}

export function buildRoutes(): Route[] {
  const routes: Route[] = [];
  const add = (
    method: Route["method"],
    pattern: string,
    handler: Handler,
    opts: { public?: boolean } = {},
  ) => {
    const keys: string[] = [];
    const re = new RegExp(
      "^" +
        pattern.replace(/:([A-Za-z0-9_]+)/g, (_m, k: string) => {
          keys.push(k);
          return "([^/]+)";
        }) +
        "/?$",
    );
    routes.push({ method, pattern: re, keys, handler, ...(opts.public ? { public: true } : {}) });
  };

  add("GET", "/health", (_req, res) => json(res, 200, { ok: true }), { public: true });

  // Auth routes — public by definition.
  add(
    "POST",
    "/api/auth/register",
    async (req, res, { users, cookieSecure }) => {
      const body = await readJson<{ email?: string; password?: string }>(req);
      if (!body.email || !body.password) {
        return json(res, 400, { error: "email et password requis" });
      }
      try {
        const u = users.create(body.email, body.password);
        const token = users.issueSession(u.id);
        res.setHeader("set-cookie", buildSessionCookie(token, { secure: cookieSecure }));
        json(res, 201, users.publicView(u));
      } catch (err) {
        json(res, 400, { error: (err as Error).message });
      }
    },
    { public: true },
  );
  add(
    "POST",
    "/api/auth/login",
    async (req, res, { users, cookieSecure }) => {
      const body = await readJson<{ email?: string; password?: string }>(req);
      if (!body.email || !body.password) {
        return json(res, 400, { error: "email et password requis" });
      }
      const u = users.findByEmail(body.email);
      if (!u || !users.verifyPassword(u, body.password)) {
        return json(res, 401, { error: "identifiants invalides" });
      }
      const token = users.issueSession(u.id);
      res.setHeader("set-cookie", buildSessionCookie(token, { secure: cookieSecure }));
      json(res, 200, users.publicView(u));
    },
    { public: true },
  );
  add(
    "POST",
    "/api/auth/logout",
    (_req, res, { cookieSecure }) => {
      res.setHeader("set-cookie", clearSessionCookie({ secure: cookieSecure }));
      json(res, 204, null);
    },
    { public: true },
  );
  add("GET", "/api/auth/me", (_req, res, { user, users }) => {
    if (!user) return json(res, 401, { error: "non authentifié" });
    json(res, 200, users.publicView(user));
  }, { public: true });

  // Engines — analysis
  add("POST", "/api/succession/analyze", async (req, res) => {
    const body = await readJson<SuccessionCase>(req);
    json(res, 200, analyseSuccession(body));
  });
  add("POST", "/api/succession/consultation", async (req, res) => {
    const { case: c, title } = await readJson<{ case: SuccessionCase; title?: string }>(req);
    const a = analyseSuccession(c);
    html(res, 200, renderConsultationHTML(a, title ? { title } : {}));
  });
  add("POST", "/api/succession/pdf", async (req, res) => {
    const { case: c, title } = await readJson<{ case: SuccessionCase; title?: string }>(req);
    const a = analyseSuccession(c);
    const out = renderConsultationHTML(a, title ? { title } : {});
    await sendPdf(res, out, slug(title ?? "consultation-succession"));
  });

  add("POST", "/api/matrimonial/analyze", async (req, res) => {
    json(res, 200, analyseMatrimonial(await readJson<MatrimonialCase>(req)));
  });
  add("POST", "/api/matrimonial/consultation", async (req, res) => {
    const { case: c, title } = await readJson<{ case: MatrimonialCase; title?: string }>(req);
    const a = analyseMatrimonial(c);
    html(res, 200, renderMatrimonialHTML(a, title ? { title } : {}));
  });
  add("POST", "/api/matrimonial/pdf", async (req, res) => {
    const { case: c, title } = await readJson<{ case: MatrimonialCase; title?: string }>(req);
    const a = analyseMatrimonial(c);
    const out = renderMatrimonialHTML(a, title ? { title } : {});
    await sendPdf(res, out, slug(title ?? "consultation-matrimonial"));
  });

  add("POST", "/api/combined/analyze", async (req, res) => {
    json(res, 200, analyseCombined(await readJson<CombinedCase>(req)));
  });
  add("POST", "/api/combined/consultation", async (req, res) => {
    const body = await readJson<CombinedCase & { title?: string }>(req);
    const { title, ...rest } = body;
    const a = analyseCombined(rest);
    html(res, 200, renderCombinedHTML(a, title ? { title } : {}));
  });
  add("POST", "/api/combined/pdf", async (req, res) => {
    const body = await readJson<CombinedCase & { title?: string }>(req);
    const { title, ...rest } = body;
    const a = analyseCombined(rest);
    const out = renderCombinedHTML(a, title ? { title } : {});
    await sendPdf(res, out, slug(title ?? "consultation-combinee"));
  });

  // Generic PDF endpoint — useful for callers who already have HTML.
  add("POST", "/api/pdf", async (req, res) => {
    const body = await readJson<{ html: string; filename?: string }>(req);
    if (!body.html) return json(res, 400, { error: "html requis" });
    await sendPdf(res, body.html, slug(body.filename ?? "consultation"));
  });

  add("POST", "/api/partnership/analyze", async (req, res) => {
    json(res, 200, analysePartnership(await readJson<PartnershipCase>(req)));
  });

  add("POST", "/api/divorce/analyze", async (req, res) => {
    json(res, 200, analyseRome3(await readJson<DivorceCase>(req)));
  });

  add("POST", "/api/bii/matrimonial", async (req, res) => {
    json(res, 200, analyseBiiMatrimonial(await readJson<BiiMatrimonialCase>(req)));
  });
  add("POST", "/api/bii/parental", async (req, res) => {
    json(
      res,
      200,
      analyseBiiParental(await readJson<BiiParentalResponsibilityCase>(req)),
    );
  });

  add("POST", "/api/crisis/analyze", async (req, res) => {
    json(res, 200, analyseCrisis(await readJson<CrisisCase>(req)));
  });

  // Reference data
  add("GET", "/api/articles/:regulation", (_req, res, { params }) => {
    const r = params.regulation;
    const out =
      r === "650" ? listArticles()
      : r === "2016-1103" ? listMatrimonialArticles()
      : r === "2016-1104" ? listPartnershipArticles()
      : r === "rome3" || r === "1259" ? listRome3Articles()
      : r === "bii" || r === "2019-1111" ? listBiiArticles()
      : null;
    if (!out) return json(res, 404, { error: `unknown regulation ${r}` });
    json(res, 200, out);
  });
  add("GET", "/api/articles/:regulation/:id", (_req, res, { params }) => {
    const { regulation: r, id } = params;
    const out =
      r === "650" ? getArticle(id!)
      : r === "2016-1103" ? getMatrimonialArticle(id!)
      : r === "2016-1104" ? getPartnershipArticle(id!)
      : r === "rome3" || r === "1259" ? getRome3Article(id!)
      : r === "bii" || r === "2019-1111" ? getBiiArticle(id!)
      : null;
    if (!out) return json(res, 404, { error: "not found" });
    json(res, 200, out);
  });

  add("GET", "/api/cjeu-cases", (_req, res) => json(res, 200, CJEU_CASES));

  add("GET", "/api/member-states/:regulation", (_req, res, { params }) => {
    const r = params.regulation;
    const out =
      r === "650" ? listBoundMemberStates()
      : r === "2016-1103" || r === "2016-1104" ? listMatrimonialBoundStates()
      : r === "rome3" || r === "1259" ? listRome3BoundStates()
      : r === "bii" || r === "2019-1111" ? listBiiBoundStates()
      : null;
    if (!out) return json(res, 404, { error: `unknown regulation ${r}` });
    json(res, 200, out);
  });
  // Compat alias — 2016/1104 partnerships have their own list fn.
  add("GET", "/api/member-states/partnerships", (_req, res) =>
    json(res, 200, listPartnershipBoundStates()),
  );

  // Sectoral case templates (read-only, public).
  add("GET", "/api/templates", (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const kind = url.searchParams.get("kind") as CaseKind | null;
    json(res, 200, listTemplates(kind ? { kind } : undefined));
  });
  add("GET", "/api/templates/:id", (_req, res, { params }) => {
    const t = getTemplate(params.id!);
    if (!t) return json(res, 404, { error: "template not found" });
    json(res, 200, t);
  });

  // Case library — scoped to the current user.
  add("GET", "/api/cases", (req, res, { store, user }) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const kind = url.searchParams.get("kind") as CaseKind | null;
    const q = url.searchParams.get("q");
    json(
      res,
      200,
      store.list({
        ownerId: user?.id ?? "anonymous",
        ...(kind ? { kind } : {}),
        ...(q ? { query: q } : {}),
      }),
    );
  });
  add("POST", "/api/cases", async (req, res, { store, user }) => {
    const body = await readJson<{
      title: string;
      kind: CaseKind;
      payload: unknown;
      tags?: string[];
      notes?: string;
    }>(req);
    if (!body.title || !body.kind || body.payload === undefined) {
      return json(res, 400, { error: "title, kind, payload required" });
    }
    json(res, 201, store.create({ ...body, ownerId: user?.id ?? "anonymous" }));
  });
  add("GET", "/api/cases/:id", (_req, res, { params, store, user }) => {
    const c = store.get(params.id!, user?.id ?? "anonymous");
    if (!c) return json(res, 404, { error: "not found" });
    json(res, 200, c);
  });
  add("PUT", "/api/cases/:id", async (req, res, { params, store, user }) => {
    const patch = await readJson<{
      title?: string;
      payload?: unknown;
      tags?: string[];
      notes?: string;
    }>(req);
    const c = store.update(params.id!, user?.id ?? "anonymous", patch);
    if (!c) return json(res, 404, { error: "not found" });
    json(res, 200, c);
  });
  add("DELETE", "/api/cases/:id", (_req, res, { params, store, user }) => {
    const ok = store.delete(params.id!, user?.id ?? "anonymous");
    if (!ok) return json(res, 404, { error: "not found" });
    json(res, 204, null);
  });

  return routes;
}

function resolveWebRoot(explicit?: string): string {
  if (explicit) return explicit;
  const here = fileURLToPath(new URL(".", import.meta.url));
  // Running from dist/server/ → look for dist/web/ next to us, then
  // fall back to src/web/ (dev mode via tsx).
  const candidates = [
    join(here, "..", "web"),
    join(here, "..", "..", "src", "web"),
    join(here, "..", "..", "..", "src", "web"),
  ];
  for (const c of candidates) {
    if (existsSync(join(c, "index.html"))) return c;
  }
  return candidates[0]!;
}

export function startServer(opts: ServerOptions): {
  server: ReturnType<typeof createServer>;
  url: string;
  store: CaseStore;
  users: UserStore;
} {
  const dataPath = opts.dataPath ?? "./data/cases.json";
  const usersPath =
    opts.usersPath ??
    (dataPath.endsWith("cases.json")
      ? dataPath.replace(/cases\.json$/, "users.json")
      : `${dataPath}.users.json`);
  const store = new CaseStore(dataPath);
  const users = new UserStore(usersPath);
  const webRoot = resolveWebRoot(opts.webRoot);
  const cookieSecure = opts.cookieSecure ?? false;
  const authMode = opts.auth ?? "required";
  const routes = buildRoutes();

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      const method = (req.method ?? "GET").toUpperCase() as Route["method"];

      // Serve web UI
      if (method === "GET" && !url.pathname.startsWith("/api/") && url.pathname !== "/health") {
        await serveStatic(webRoot, url.pathname, res);
        return;
      }

      // Resolve session.
      const cookies = parseCookies(req.headers.cookie);
      const sess = users.verifySession(cookies[SESSION_COOKIE]);
      const user = sess ? users.get(sess.userId) ?? null : null;

      for (const r of routes) {
        if (r.method !== method) continue;
        const m = r.pattern.exec(url.pathname);
        if (!m) continue;
        const params: Record<string, string> = {};
        r.keys.forEach((k, i) => {
          params[k] = decodeURIComponent(m[i + 1] ?? "");
        });
        // Authentication gate.
        if (authMode === "required" && !r.public && !user) {
          return json(res, 401, { error: "non authentifié" });
        }
        await r.handler(req, res, {
          params,
          store,
          users,
          webRoot,
          user,
          cookieSecure,
        });
        return;
      }
      json(res, 404, { error: "not found" });
    } catch (err) {
      const msg = (err as Error).message || "internal error";
      json(res, 500, { error: msg });
    }
  });

  server.listen(opts.port, opts.host ?? "127.0.0.1");
  const url = `http://${opts.host ?? "127.0.0.1"}:${opts.port}`;
  return { server, url, store, users };
}

async function readJson<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {} as T;
  return JSON.parse(raw) as T;
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  if (body === null) {
    res.end();
    return;
  }
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function html(res: ServerResponse, status: number, body: string): void {
  res.statusCode = status;
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.end(body);
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80) || "consultation";
}

async function sendPdf(
  res: ServerResponse,
  htmlBody: string,
  filename: string,
): Promise<void> {
  try {
    const pdf = await renderPdf(htmlBody);
    res.statusCode = 200;
    res.setHeader("content-type", "application/pdf");
    res.setHeader(
      "content-disposition",
      `attachment; filename="${filename}.pdf"`,
    );
    res.end(pdf);
  } catch (err) {
    if (err instanceof ChromeNotFoundError) {
      json(res, 503, {
        error: err.message,
        hint:
          "Définir CHROME_PATH ou installer Chrome/Chromium ; à défaut, télécharger la note HTML et imprimer depuis le navigateur.",
      });
      return;
    }
    json(res, 500, { error: (err as Error).message || "PDF rendering failed" });
  }
}

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

async function serveStatic(
  root: string,
  pathname: string,
  res: ServerResponse,
): Promise<void> {
  // Prevent directory traversal.
  const safe = pathname.replace(/\.\.+/g, ".");
  const p = safe === "/" ? "/index.html" : safe;
  const full = join(root, p);
  try {
    const content = await readFile(full);
    const mime = MIME[extname(full)] ?? "application/octet-stream";
    res.statusCode = 200;
    res.setHeader("content-type", mime);
    res.setHeader("cache-control", "no-store");
    res.end(content);
  } catch {
    res.statusCode = 404;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end("not found");
  }
}
