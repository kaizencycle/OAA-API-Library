const crypto = require("crypto");
const LRU = require("lru-cache");

/**
 * Simple memory cache for resolved labels to avoid hammering chain.
 * In prod, swap for Redis/memcached co-located with gateway.
 */
function makeResolveCache() {
  return new LRU({
    max: 1000,
    ttl: 60 * 1000 // 60s
  });
}

function verifyHmac(body, sig, secret) {
  if (!sig) return false;
  const raw = JSON.stringify(body || {});
  const h = crypto.createHmac("sha256", secret).update(raw, "utf8").digest("hex");
  try { 
    return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(sig)); 
  } catch { 
    return false; 
  }
}

/**
 * Register POST /events/new-post
 * Body: { label, cid, proof, sha256, ts }
 * Behavior: verify HMAC → record event (no-op placeholder) → warm cache.
 */
function registerNewPostRoute(app, registry, cache) {
  app.post("/events/new-post", async (req, reply) => {
    const body = req.body || {};
    const sig = req.headers["x-citizen-sig"];
    const ok = verifyHmac(body, sig, process.env.GATEWAY_HMAC_SECRET || "x");
    if (!ok) return reply.code(401).send({ ok:false, error:"invalid_signature" });

    const { label, cid, proof } = body;
    if (!label || !cid || !proof) return reply.code(400).send({ ok:false, error:"missing_params" });

    // Record event (placeholder: log or append to a small JSONL file)
    app.log.info({ event: "new-post", label, cid, proof });

    // Warm cache entries used by /:label and /resolve/:label
    cache.set(label.toLowerCase(), { cid, proof, ts: Date.now() });

    return reply.send({ ok: true });
  });
}

module.exports = { makeResolveCache, registerNewPostRoute };
