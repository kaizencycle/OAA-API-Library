import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("kv bridge client", () => {
  const envKeys = ["OAA_API_BASE_URL", "OAA_API_BASE", "KV_BRIDGE_SECRET"] as const;
  let saved: Record<string, string | undefined>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    saved = {};
    for (const key of envKeys) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    for (const key of envKeys) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  it("kvBridgeWrite returns false without base URL or secret", async () => {
    const { kvBridgeWrite } = await import("../lib/kv-bridge/client");
    expect(await kvBridgeWrite("GI_STATE", 1)).toBe(false);
  });

  it("kvBridgeWrite posts to bridge write endpoint", async () => {
    process.env.OAA_API_BASE_URL = "https://oaa.example/";
    process.env.KV_BRIDGE_SECRET = "bridge-secret";
    fetchMock.mockResolvedValue({ ok: true });

    const { kvBridgeWrite } = await import("../lib/kv-bridge/client");
    const ok = await kvBridgeWrite("GI_STATE", { x: 1 }, 60);

    expect(ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://oaa.example/api/kv-bridge/write",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer bridge-secret",
        }),
      })
    );
  });

  it("kvBridgeRead returns parsed payload on success", async () => {
    process.env.OAA_API_BASE = "https://oaa.example";
    const payload = {
      ok: true,
      key: "GI_STATE",
      value: 1,
      written_at: "now",
      source: "terminal",
    };
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => payload,
    });

    const { kvBridgeRead } = await import("../lib/kv-bridge/client");
    await expect(kvBridgeRead("GI_STATE")).resolves.toEqual(payload);
  });

  it("kvBridgeRead returns null on HTTP error", async () => {
    process.env.OAA_API_BASE_URL = "https://oaa.example";
    fetchMock.mockResolvedValue({ ok: false });

    const { kvBridgeRead } = await import("../lib/kv-bridge/client");
    expect(await kvBridgeRead("GI_STATE")).toBeNull();
  });
});
