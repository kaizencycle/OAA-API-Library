import crypto from "crypto";
const secret = process.env.MEMORY_HMAC_SECRET || "";
const note = process.argv.slice(2).join(" ") || "hello memory";
const body = JSON.stringify({ note, tag: "cli" });
const sig = crypto.createHmac("sha256", secret).update(body, "utf8").digest("hex");
console.log("Body:", body);
console.log("x-hmac-sha256:", sig);