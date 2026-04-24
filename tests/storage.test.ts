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

describe("CaseStore", () => {
  it("crée, liste, récupère, met à jour, supprime un cas", () => {
    const { store, dir } = makeStore();
    try {
      const c = store.create({
        title: "Test",
        kind: "succession",
        payload: { foo: 1 },
        tags: ["fr"],
      });
      expect(c.id).toBeTruthy();
      expect(store.list()).toHaveLength(1);
      expect(store.get(c.id)?.title).toBe("Test");

      const updated = store.update(c.id, { title: "Test v2" });
      expect(updated?.title).toBe("Test v2");
      expect(updated?.updatedAt).not.toBe(c.updatedAt);

      expect(store.delete(c.id)).toBe(true);
      expect(store.list()).toHaveLength(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("filtre par kind et par requête", () => {
    const { store, dir } = makeStore();
    try {
      store.create({ title: "Succession alpha", kind: "succession", payload: {} });
      store.create({ title: "Divorce bêta", kind: "divorce", payload: {}, notes: "Rome III" });
      expect(store.list({ kind: "succession" })).toHaveLength(1);
      expect(store.list({ query: "alpha" })).toHaveLength(1);
      expect(store.list({ query: "rome" })).toHaveLength(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("persiste le contenu entre deux instances (fichier JSON)", () => {
    const { store, dir, path } = makeStore();
    try {
      store.create({ title: "Persist", kind: "matrimonial", payload: { a: 1 } });
      const reloaded = new CaseStore(path);
      expect(reloaded.list()).toHaveLength(1);
      expect(reloaded.list()[0]!.title).toBe("Persist");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
