import { describe, expect, it } from "vitest";
import { buildServer } from "../src/mcp/server.js";

describe("Serveur MCP", () => {
  it("se construit avec la configuration attendue", () => {
    const s = buildServer();
    expect(s).toBeDefined();
    expect(s.server).toBeDefined();
    expect(s.isConnected()).toBe(false);
  });
});
