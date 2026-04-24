import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CaseStore } from "../src/server/storage.js";

function makeStore() {
  const dir = mkdtempSync(join(tmpdir(), "eurlex-"));
  const path = join(dir, "cases.json");
  return { store: new CaseStore(path), dir, path };
}

afterEach(() => {
  /* no global cleanup — each test cleans its own tmp dir */
});

const OWNER = "u1";

describe("CaseStore", () => {
  it("crée, liste, récupère, met à jour, supprime un cas", () => {
    const { store, dir } = makeStore();
    try {
      const c = store.create({
        ownerId: OWNER,
        title: "Test",
        kind: "succession",
        payload: { foo: 1 },
        tags: ["fr"],
      });
      expect(c.id).toBeTruthy();
      expect(store.list({ ownerId: OWNER })).toHaveLength(1);
      expect(store.get(c.id, OWNER)?.title).toBe("Test");

      const updated = store.update(c.id, OWNER, { title: "Test v2" });
      expect(updated?.title).toBe("Test v2");
      expect(updated?.updatedAt).not.toBe(c.updatedAt);

      expect(store.delete(c.id, OWNER)).toBe(true);
      expect(store.list({ ownerId: OWNER })).toHaveLength(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("filtre par kind et par requête", () => {
    const { store, dir } = makeStore();
    try {
      store.create({ ownerId: OWNER, title: "Succession alpha", kind: "succession", payload: {} });
      store.create({ ownerId: OWNER, title: "Divorce bêta", kind: "divorce", payload: {}, notes: "Rome III" });
      expect(store.list({ ownerId: OWNER, kind: "succession" })).toHaveLength(1);
      expect(store.list({ ownerId: OWNER, query: "alpha" })).toHaveLength(1);
      expect(store.list({ ownerId: OWNER, query: "rome" })).toHaveLength(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("isole les cas par ownerId", () => {
    const { store, dir } = makeStore();
    try {
      const a = store.create({ ownerId: "alice", title: "Alice", kind: "succession", payload: {} });
      store.create({ ownerId: "bob", title: "Bob", kind: "succession", payload: {} });
      expect(store.list({ ownerId: "alice" })).toHaveLength(1);
      expect(store.list({ ownerId: "bob" })).toHaveLength(1);
      expect(store.get(a.id, "bob")).toBeUndefined();
      expect(store.delete(a.id, "bob")).toBe(false);
      expect(store.list({ ownerId: "alice" })).toHaveLength(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("persiste le contenu entre deux instances (fichier JSON)", () => {
    const { store, dir, path } = makeStore();
    try {
      store.create({ ownerId: OWNER, title: "Persist", kind: "matrimonial", payload: { a: 1 } });
      const reloaded = new CaseStore(path);
      expect(reloaded.list({ ownerId: OWNER })).toHaveLength(1);
      expect(reloaded.list({ ownerId: OWNER })[0]!.title).toBe("Persist");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
