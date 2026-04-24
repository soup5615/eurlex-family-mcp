// Minimal JSON-file persistence for saved cases. Stores the full
// payload as-is (regulation-agnostic), with metadata. Designed for
// practitioner volumes (hundreds to low thousands of cases); a
// migration to SQLite can follow if needed.

import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";

export type CaseKind =
  | "succession"
  | "matrimonial"
  | "partnership"
  | "divorce"
  | "bii-matrimonial"
  | "bii-parental"
  | "crisis"
  | "combined";

export interface SavedCaseMeta {
  id: string;
  ownerId: string;
  title: string;
  kind: CaseKind;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  tags?: string[];
  notes?: string;
}

export interface SavedCase extends SavedCaseMeta {
  payload: unknown; // the case object as understood by the engine
}

interface StoreShape {
  version: 2;
  cases: Record<string, SavedCase>;
}

const EMPTY: StoreShape = { version: 2, cases: {} };

export class CaseStore {
  private readonly path: string;
  private state: StoreShape;

  constructor(path: string) {
    this.path = path;
    this.state = load(path);
  }

  list(filter: {
    ownerId: string;
    kind?: CaseKind;
    query?: string;
  }): SavedCaseMeta[] {
    const arr = Object.values(this.state.cases).filter(
      (c) => c.ownerId === filter.ownerId,
    );
    const q = filter.query?.toLowerCase();
    return arr
      .filter((c) => !filter.kind || c.kind === filter.kind)
      .filter((c) => {
        if (!q) return true;
        return (
          c.title.toLowerCase().includes(q) ||
          (c.notes ?? "").toLowerCase().includes(q) ||
          (c.tags ?? []).some((t) => t.toLowerCase().includes(q))
        );
      })
      .map(({ payload: _p, ...meta }) => meta)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  get(id: string, ownerId: string): SavedCase | undefined {
    const c = this.state.cases[id];
    if (!c || c.ownerId !== ownerId) return undefined;
    return c;
  }

  create(input: {
    ownerId: string;
    title: string;
    kind: CaseKind;
    payload: unknown;
    tags?: string[];
    notes?: string;
  }): SavedCase {
    const now = new Date().toISOString();
    const id = randomUUID();
    const c: SavedCase = {
      id,
      ownerId: input.ownerId,
      title: input.title,
      kind: input.kind,
      payload: input.payload,
      createdAt: now,
      updatedAt: now,
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    };
    this.state.cases[id] = c;
    this.persist();
    return c;
  }

  update(
    id: string,
    ownerId: string,
    patch: Partial<Pick<SavedCase, "title" | "payload" | "tags" | "notes">>,
  ): SavedCase | undefined {
    const prev = this.state.cases[id];
    if (!prev || prev.ownerId !== ownerId) return undefined;
    const next: SavedCase = {
      ...prev,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    this.state.cases[id] = next;
    this.persist();
    return next;
  }

  delete(id: string, ownerId: string): boolean {
    const c = this.state.cases[id];
    if (!c || c.ownerId !== ownerId) return false;
    delete this.state.cases[id];
    this.persist();
    return true;
  }

  // For tests.
  _dump(): StoreShape {
    return structuredClone(this.state);
  }

  private persist(): void {
    mkdirSync(dirname(this.path), { recursive: true });
    const tmp = `${this.path}.tmp`;
    writeFileSync(tmp, JSON.stringify(this.state, null, 2), "utf8");
    renameSync(tmp, this.path);
  }
}

function load(path: string): StoreShape {
  try {
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as { version: number; cases?: Record<string, SavedCase> };
    if (parsed?.version === 1 && parsed.cases) {
      // Migrate v1 → v2: stamp a `__legacy__` ownerId on existing cases.
      const cases: Record<string, SavedCase> = {};
      for (const [id, c] of Object.entries(parsed.cases)) {
        cases[id] = { ...(c as SavedCase), ownerId: (c as SavedCase).ownerId ?? "__legacy__" };
      }
      return { version: 2, cases };
    }
    if (parsed?.version !== 2 || typeof parsed.cases !== "object") {
      throw new Error("bad shape");
    }
    return parsed as StoreShape;
  } catch {
    return structuredClone(EMPTY);
  }
}
