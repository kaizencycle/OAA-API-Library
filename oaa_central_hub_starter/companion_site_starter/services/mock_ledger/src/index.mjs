import Fastify from "fastify";
import cors from "@fastify/cors";
import crypto from "crypto";
import { Store } from "./store.mjs";

const PORT = Number(process.env.PORT || 4000);
const SECRET = process.env.LEDGER_SECRET || "dev-secret";
const SAVE_PATH = process.env.SAVE_PATH || null;

// Deterministic 0x-proof from (sha256 + secret)
function toProof(shaHex, secret) {
  const input = (shaHex || "").toLowerCase().replace(/^0x/, "") + "|" + secret;
  const h = crypto.createHash("sha256").update(input, "utf8").digest("hex");
  return "0x" + h; // 32-byte hex
}

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

const store = new Store(SAVE_PATH);

/**
 * POST /seal
 * body: { title, slug, companion, sha256 }
 * returns: { ok, proof, ts }
 */
app.post("/seal", async (req, reply) => {
  const { title, slug, companion, sha256 } = req.body || {};
  if (!companion || !sha256) return reply.code(400).send({ ok:false, error:"missing_params" });
  const proof = toProof(sha256, SECRET);
  const ts = Date.now();
  const entry = { title, slug, companion, sha256, proof, ts };
  store.add(entry);
  return { ok: true, proof, ts };
});

/**
 * GET /proofs?companion=...&sha256=...
 * returns: { ok, proof? }
 */
app.get("/proofs", async (req, reply) => {
  const companion = String(req.query.companion || "");
  const sha256 = String(req.query.sha256 || "");
  if (!companion || !sha256) return reply.code(400).send({ ok:false, error:"missing_params" });
  const hit = store.find({ companion, sha256 });
  return { ok: true, proof: hit?.proof || null };
});

/**
 * GET /recent?companion=... (dev helper)
 * returns: { ok, items }
 */
app.get("/recent", async (req, reply) => {
  const companion = req.query.companion ? String(req.query.companion) : undefined;
  return { ok: true, items: store.list({ companion }) };
});

/**
 * GET /health
 */
app.get("/health", async () => ({ ok: true }));

app.listen({ port: PORT, host: "0.0.0.0" });