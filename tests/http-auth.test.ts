import type { NextApiRequest } from "next";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  extractReadToken,
  hasConfiguredReadToken,
  requireReadAuth,
  verifyReadToken,
} from "../lib/http/auth";

describe("http read auth", () => {
  const envKeys = [
    "OAA_READ_TOKEN",
    "OAA_SERVICE_TOKEN",
    "AGENT_SERVICE_TOKEN",
    "KV_HMAC_SECRET",
    "MEMORY_HMAC_SECRET",
    "OAA_HMAC_SECRET",
  ] as const;

  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = {};
    for (const key of envKeys) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of envKeys) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  it("detects configured read tokens", () => {
    expect(hasConfiguredReadToken()).toBe(false);
    process.env.OAA_READ_TOKEN = "secret";
    expect(hasConfiguredReadToken()).toBe(true);
  });

  it("verifies bearer and quoted tokens", () => {
    process.env.OAA_READ_TOKEN = "secret";
    expect(verifyReadToken("Bearer secret")).toBe(true);
    expect(verifyReadToken('"secret"')).toBe(true);
    expect(verifyReadToken("wrong")).toBe(false);
  });

  it("extracts tokens from request headers", () => {
    const req = {
      headers: {
        authorization: "Bearer header-token",
      },
    } as NextApiRequest;
    expect(extractReadToken(req)).toBe("header-token");

    const serviceReq = {
      headers: {
        "x-oaa-service-token": "service-token",
      },
    } as unknown as NextApiRequest;
    expect(extractReadToken(serviceReq)).toBe("service-token");
  });

  it("requireReadAuth returns structured errors", () => {
    const req = { headers: {} } as NextApiRequest;
    expect(requireReadAuth(req)).toEqual({
      ok: false,
      status: 503,
      code: "read_auth_not_configured",
    });

    process.env.OAA_READ_TOKEN = "secret";
    expect(requireReadAuth(req)).toEqual({
      ok: false,
      status: 401,
      code: "read_auth_required",
    });

    const authed = {
      headers: { authorization: "Bearer secret" },
    } as NextApiRequest;
    expect(requireReadAuth(authed)).toEqual({ ok: true });
  });
});
