// Small helper the agent can call from a shell step to compute a plan hash
import crypto from "crypto";
import fs from "fs";

const input = process.argv[2] || "";
const content = input && fs.existsSync(input) ? fs.readFileSync(input, "utf8") : input;
const hash = crypto.createHash("sha256").update(content || "no-diff", "utf8").digest("hex");
process.stdout.write(hash);