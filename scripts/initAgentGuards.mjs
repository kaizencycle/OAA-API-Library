import fs from "fs";
import path from "path";

const DEV = process.env.DEV_MODE === "1";      // only act in dev/preview
const root = process.cwd();
const guardPath = path.join(root, "dev", "loop_guard.json");
const coolPath  = path.join(root, "dev", "agent_cooldown.json");

// Default payloads
const guardDefault = { enabled: true, lastHash: "", noopCount: 0, maxNoop: 3 };
const coolDefault  = { nextAllowedAt: 0, cooldownSec: 240 };

function ensureDir(p){ fs.mkdirSync(path.dirname(p), { recursive: true }); }
function readOr(p, d){ try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return d; } }
function write(p, o){ ensureDir(p); fs.writeFileSync(p, JSON.stringify(o, null, 2)); }

if (!DEV) {
  console.log("initAgentGuards: DEV_MODE!=1, skipping.");
  process.exit(0);
}

const guard = readOr(guardPath, guardDefault);
const cool  = readOr(coolPath, coolDefault);

// Reset to safe baseline on every run
guard.enabled  = true;
guard.lastHash = "";
guard.noopCount = 0;

const now = Math.floor(Date.now()/1000);
cool.nextAllowedAt = Math.min(cool.nextAllowedAt || 0, now); // make 'ready'
cool.cooldownSec = cool.cooldownSec || 240;

write(guardPath, guard);
write(coolPath, cool);

console.log("initAgentGuards: guard and cooldown reset for DEV.");