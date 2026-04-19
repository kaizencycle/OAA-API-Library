import { describe, expect, it } from "vitest";
import { canonicalJson } from "../lib/crypto/canonicalJson";
import { signHmac, verifyHmac } from "../lib/crypto/hmac";

describe("canonicalJson", () => {
  it("sorts object keys and matches across key order", () => {
    const a = { z: 1, a: { m: 2, b: 1 } };
    const b = { a: { b: 1, m: 2 }, z: 1 };
    expect(canonicalJson(a)).toBe(canonicalJson(b));
  });

  it("serializes null for undefined nested values via explicit null in API payloads", () => {
    expect(canonicalJson({ a: null })).toBe('{"a":null}');
  });
});

describe("HMAC helpers", () => {
  it("verifies signed canonical payload", () => {
    const secret = "test-secret";
    const signable = canonicalJson({
      key: "k",
      value: { x: 1 },
      agent: "A",
      cycle: "C-1",
      intent: null,
      previousHash: null
    });
    const sig = signHmac(signable, secret);
    expect(verifyHmac(signable, sig, secret)).toBe(true);
    expect(verifyHmac(signable + "x", sig, secret)).toBe(false);
  });
});
