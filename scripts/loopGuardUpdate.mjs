import fs from "fs";

const guardPath = "dev/loop_guard.json";
const cooldownPath = "dev/agent_cooldown.json";

function readJSON(p){ return JSON.parse(fs.readFileSync(p, "utf8")); }
function writeJSON(p,o){ fs.writeFileSync(p, JSON.stringify(o,null,2)); }

const cmd = process.argv[2]; // "noop", "hash:<hex>", "cooldown"
if (!fs.existsSync(guardPath) || !fs.existsSync(cooldownPath)) process.exit(0);

if (cmd?.startsWith("hash:")) {
  const g = readJSON(guardPath);
  g.lastHash = cmd.slice(5);
  g.noopCount = 0;
  writeJSON(guardPath, g);
  process.stdout.write("set-hash\n");
} else if (cmd === "noop") {
  const g = readJSON(guardPath);
  g.noopCount = (g.noopCount || 0) + 1;
  writeJSON(guardPath, g);
  process.stdout.write(`noop=${g.noopCount}\n`);
} else if (cmd === "cooldown") {
  const c = readJSON(cooldownPath);
  const now = Math.floor(Date.now()/1000);
  const cd = c.cooldownSec || 240;
  c.nextAllowedAt = now + cd;
  writeJSON(cooldownPath, c);
  process.stdout.write(`cooldown=${cd}\n`);
}