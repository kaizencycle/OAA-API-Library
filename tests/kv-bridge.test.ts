import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { kvBridgeAuthOk, verifyKvBridgeHmac } from "../lib/kv-bridge/auth";
import { KV_BRIDGE_ALLOWED_KEYS } from "../lib/kv-bridge/constants";
import { loadKvBridgeStore, saveKvBridgeStore } from "../lib/kv-bridge/store";
import type { KvBridgeStore } from "../lib/kv-bridge/types";

describe("kvBridgeAuthOk", () => {
  const secret = "shared-secret";
  const body = '{"key":"GI_STATE","value":1}';

  it("accepts Bearer token", () => {
    expect(kvBridgeAuthOk(secret, `Bearer ${secret}`, undefined, body)).toBe(true);
    expect(kvBridgeAuthOk(secret, "Bearer wrong", undefined, body)).toBe(false);
  });

  it("accepts valid x-hmac-sha256 hex", () => {
    const hmac = crypto.createHmac("sha256", secret).update(body, "utf8").digest("hex");
    expect(kvBridgeAuthOk(secret, "", hmac, body)).toBe(true);
    expect(kvBridgeAuthOk(secret, "", "deadbeef", body)).toBe(false);
  });
});

describe("verifyKvBridgeHmac", () => {
  it("compares hex digests in constant time", () => {
    const secret = "s";
    const body = "{}";
    const good = crypto.createHmac("sha256", secret).update(body, "utf8").digest("hex");
    expect(verifyKvBridgeHmac(body, good, secret)).toBe(true);
    expect(verifyKvBridgeHmac(body, good.slice(0, -2) + "00", secret)).toBe(false);
  });
});

describe("KV_BRIDGE_ALLOWED_KEYS", () => {
  it("includes GI_STATE", () => {
    expect(KV_BRIDGE_ALLOWED_KEYS.has("GI_STATE")).toBe(true);
    expect(KV_BRIDGE_ALLOWED_KEYS.has("RANDOM_KEY")).toBe(false);
  });
});

describe("kv bridge store", () => {
  let tmp: string;
  let prev: string | undefined;

  beforeEach(() => {
    tmp = path.join(os.tmpdir(), `kv-bridge-test-${Date.now()}.json`);
    prev = process.env.KV_BRIDGE_PATH;
    process.env.KV_BRIDGE_PATH = tmp;
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.KV_BRIDGE_PATH;
    else process.env.KV_BRIDGE_PATH = prev;
    try {
      fs.unlinkSync(tmp);
    } catch {
      /* ignore */
    }
  });

  it("round-trips store", () => {
    const s: KvBridgeStore = {
      GI_STATE: { value: { x: 1 }, written_at: new Date().toISOString(), source: "t" }
    };
    saveKvBridgeStore(s);
    expect(loadKvBridgeStore()).toEqual(s);
  });
});
