import { createHmac, timingSafeEqual } from "crypto";

export function verifyKvBridgeHmac(bodyStr: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(bodyStr, "utf8").digest("hex");
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(signature, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function kvBridgeAuthOk(
  secret: string,
  authHeader: string | undefined,
  hmacHeader: string | undefined,
  bodyStr: string
): boolean {
  const bearerOk = authHeader === `Bearer ${secret}`;
  const hmacOk = Boolean(hmacHeader && verifyKvBridgeHmac(bodyStr, hmacHeader, secret));
  return bearerOk || hmacOk;
}
