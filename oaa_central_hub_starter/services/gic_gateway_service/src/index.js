const Fastify = require('fastify');
const { ethers } = require('ethers');
const { makeResolveCache, registerNewPostRoute } = require('./events.js');

const PORT = process.env.PORT || 8787;
const REGISTRY_ADDR = process.env.REGISTRY_ADDR;
const RPC_URL = process.env.RPC_URL;
const IPFS_GATEWAY = process.env.IPFS_HTTP_GATEWAY || 'https://ipfs.io/ipfs/';
const NAME = process.env.GATEWAY_NAME || 'gic-gateway';

if (!REGISTRY_ADDR || !RPC_URL) { 
  console.error('Missing REGISTRY_ADDR or RPC_URL'); 
  process.exit(1); 
}

const REG_ABI = [
  "function getDomain(string name) view returns (tuple(address owner,string ipfsHash,bytes32 integrityProof,uint256 expiresAt))"
];

const app = Fastify({ logger: true });
const provider = new ethers.JsonRpcProvider(RPC_URL);
const registry = new ethers.Contract(REGISTRY_ADDR, REG_ABI, provider);

// Lightweight in-mem cache
const cache = makeResolveCache();

app.get('/', async (_req, reply) => reply.type('application/json').send({ ok: true, name: NAME }));

app.get('/resolve/:label', async (req, reply) => {
  const label = (req.params.label || '').toLowerCase();
  if (!label) return reply.code(400).send({ ok:false, error:'bad_label' });

  const warm = cache.get(label);
  if (warm) return reply.header('x-gic-ledger-proof', warm.proof).send({ 
    ok:true, 
    label, 
    cid: warm.cid, 
    proof: warm.proof, 
    warmed: true 
  });

  const dom = await registry.getDomain(label);
  if (!dom.owner) return reply.code(404).send({ ok:false, error:'not_found' });
  cache.set(label, { cid: dom.ipfsHash, proof: dom.integrityProof, ts: Date.now() });
  reply.header('x-gic-ledger-proof', dom.integrityProof).send({ 
    ok:true, 
    label, 
    cid: dom.ipfsHash, 
    proof: dom.integrityProof 
  });
});

app.get('/:label', async (req, reply) => {
  const label = (req.params.label || '').toLowerCase();
  const warm = cache.get(label);
  if (warm) return reply.header('x-gic-ledger-proof', warm.proof).redirect(302, IPFS_GATEWAY + warm.cid);

  const dom = await registry.getDomain(label);
  if (!dom.owner) return reply.code(404).send('not found');
  cache.set(label, { cid: dom.ipfsHash, proof: dom.integrityProof, ts: Date.now() });
  reply.header('x-gic-ledger-proof', dom.integrityProof).redirect(302, IPFS_GATEWAY + dom.ipfsHash);
});

// Register event route
registerNewPostRoute(app, registry, cache);

app.listen({ port: Number(PORT), host: '0.0.0.0' });
