import { makeWorker } from "../lib/queue/bull";
import { updateGicRecord } from "../lib/civic/gic";
import { pingGatewayNewPost } from "../lib/civic/gateway";

/**
 * Job data shape:
 * { label: string, cid: string, integrityHex: string, sha256: string }
 */
const concurrency = Number(process.env.QUEUE_PUBLISH_CONCURRENCY || 5);

export const worker = makeWorker(
  "publishEvents",
  async (job) => {
    const { label, cid, integrityHex, sha256 } = job.data;
    console.log(`Processing publish job for label: ${label}, cid: ${cid}`);
    
    // 1) Update on-chain .gic record
    const txHash = await updateGicRecord({ label, cid, integrityHex });
    console.log(`Updated GIC record for ${label}: ${txHash}`);
    
    // 2) Ping gateway cache/index
    const gatewayResult = await pingGatewayNewPost({ label, cid, proof: integrityHex, sha256 });
    console.log(`Gateway cache warmed for ${label}:`, gatewayResult);
    
    return { ok: true, txHash, gatewayResult };
  },
  concurrency
);

// If launched directly (node workers/publishWorker.ts), keep alive
if (require.main === module) {
  console.log("publishWorker running with concurrency", concurrency);
  // Keep the process alive
  process.on('SIGINT', () => {
    console.log('Shutting down worker...');
    process.exit(0);
  });
}
