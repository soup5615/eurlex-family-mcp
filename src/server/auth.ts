// User accounts, password hashing (scrypt — built-in, no native deps)
// and HMAC-signed session cookies. Storage is a JSON file alongside
// the case store.

import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  createHmac,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

export type UserRole = "admin" | "user";

export interface UserBranding {
  firmName?: string;
  firmAddress?: string;
  firmTagline?: string;
  logoDataUrl?: string;
  authorName?: string;
  authorTitle?: string;
  jurisdictionTag?: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  // scrypt-derived; we store {salt, hash} hex-encoded.
  passwordSalt: string;
  passwordHash: string;
  branding?: UserBranding;
}

interface UserStoreShape {
  version: 1;
  users: Record<string, User>;
  // HMAC secret used to sign session cookies. Generated on first use
  // and persisted so existing sessions survive a restart.
  sessionSecret: string;
}

function emptyShape(): UserStoreShape {
  return {
    version: 1,
    users: {},
    sessionSecret: randomBytes(32).toString("hex"),
  };
}

const SCRYPT_KEYLEN = 64;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export class UserStore {
  private readonly path: string;
  private state: UserStoreShape;

  constructor(path: string) {
    this.path = path;
    this.state = load(path);
    // Persist on first boot to fix the session secret.
    if (!existedOnLoad(path)) this.persist();
  }

  count(): number {
    return Object.keys(this.state.users).length;
  }

  list(): User[] {
    return Object.values(this.state.users);
  }

  findByEmail(email: string): User | undefined {
    const e = email.toLowerCase();
    return this.list().find((u) => u.email.toLowerCase() === e);
  }

  get(id: string): User | undefined {
    return this.state.users[id];
  }

  create(email: string, password: string, role: UserRole = "user"): User {
    if (!isValidEmail(email)) throw new Error("E-mail invalide.");
    if (!password || password.length < 8) {
      throw new Error("Mot de passe trop court (8 caractères minimum).");
    }
    if (this.findByEmail(email)) throw new Error("E-mail déjà enregistré.");
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
    const u: User = {
      id: randomUUID(),
      email,
      role: this.count() === 0 ? "admin" : role,
      createdAt: new Date().toISOString(),
      passwordSalt: salt,
      passwordHash: hash,
    };
    this.state.users[u.id] = u;
    this.persist();
    return u;
  }

  verifyPassword(user: User, password: string): boolean {
    const computed = scryptSync(password, user.passwordSalt, SCRYPT_KEYLEN);
    const stored = Buffer.from(user.passwordHash, "hex");
    if (computed.length !== stored.length) return false;
    return timingSafeEqual(computed, stored);
  }

  // Issues a signed session token for the given user.
  issueSession(userId: string): string {
    const expiresAt = Date.now() + SESSION_TTL_MS;
    const payload = JSON.stringify({ userId, expiresAt });
    const b64 = Buffer.from(payload, "utf8").toString("base64url");
    const sig = createHmac("sha256", this.state.sessionSecret)
      .update(b64)
      .digest("base64url");
    return `${b64}.${sig}`;
  }

  // Returns the userId if the token is valid and unexpired.
  verifySession(token: string | undefined): { userId: string } | null {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [b64, sig] = parts;
    if (!b64 || !sig) return null;
    const expected = createHmac("sha256", this.state.sessionSecret)
      .update(b64)
      .digest("base64url");
    if (
      sig.length !== expected.length ||
      !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ) {
      return null;
    }
    let payload: { userId?: string; expiresAt?: number };
    try {
      payload = JSON.parse(Buffer.from(b64, "base64url").toString("utf8"));
    } catch {
      return null;
    }
    if (
      typeof payload.userId !== "string" ||
      typeof payload.expiresAt !== "number" ||
      payload.expiresAt < Date.now()
    ) {
      return null;
    }
    if (!this.state.users[payload.userId]) return null;
    return { userId: payload.userId };
  }

  // Public projection (no password material).
  publicView(user: User): {
    id: string;
    email: string;
    role: UserRole;
    createdAt: string;
    branding?: UserBranding;
  } {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      ...(user.branding ? { branding: user.branding } : {}),
    };
  }

  setBranding(userId: string, branding: UserBranding | null): User | undefined {
    const u = this.state.users[userId];
    if (!u) return undefined;
    if (branding == null) {
      delete u.branding;
    } else {
      u.branding = branding;
    }
    this.persist();
    return u;
  }

  private persist(): void {
    mkdirSync(dirname(this.path), { recursive: true });
    const tmp = `${this.path}.tmp`;
    writeFileSync(tmp, JSON.stringify(this.state, null, 2), "utf8");
    renameSync(tmp, this.path);
  }
}

function load(path: string): UserStoreShape {
  try {
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as UserStoreShape;
    if (parsed?.version !== 1 || typeof parsed.users !== "object") {
      throw new Error("bad shape");
    }
    if (!parsed.sessionSecret) parsed.sessionSecret = randomBytes(32).toString("hex");
    return parsed;
  } catch {
    return emptyShape();
  }
}

function existedOnLoad(path: string): boolean {
  try {
    readFileSync(path, "utf8");
    return true;
  } catch {
    return false;
  }
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

// Cookie helpers.
export const SESSION_COOKIE = "eurlex_sess";

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (!k) continue;
    out[k] = decodeURIComponent(rest.join("="));
  }
  return out;
}

export function buildSessionCookie(token: string, opts: { secure?: boolean } = {}): string {
  const attrs = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ];
  if (opts.secure) attrs.push("Secure");
  return attrs.join("; ");
}

export function clearSessionCookie(opts: { secure?: boolean } = {}): string {
  const attrs = [
    `${SESSION_COOKIE}=`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    "Max-Age=0",
  ];
  if (opts.secure) attrs.push("Secure");
  return attrs.join("; ");
}
