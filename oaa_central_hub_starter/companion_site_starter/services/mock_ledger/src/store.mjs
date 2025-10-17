import fs from "fs";
import path from "path";

export class Store {
  constructor(savePath = null) {
    this.savePath = savePath || null;
    this.items = []; // {companion, sha256, proof, ts, title?, slug?}
    if (this.savePath && fs.existsSync(this.savePath)) {
      const lines = fs.readFileSync(this.savePath, "utf8").split("\n").filter(Boolean);
      for (const line of lines) {
        try { this.items.push(JSON.parse(line)); } catch {}
      }
    }
  }
  add(entry) {
    this.items.push(entry);
    if (this.savePath) {
      fs.mkdirSync(path.dirname(this.savePath), { recursive: true });
      fs.appendFileSync(this.savePath, JSON.stringify(entry) + "\n");
    }
  }
  find({ companion, sha256 }) {
    return this.items.find(e => e.companion === companion && e.sha256?.toLowerCase() === sha256?.toLowerCase()) || null;
  }
  list({ companion } = {}) {
    return this.items.filter(e => !companion || e.companion === companion).slice(-200).reverse();
  }
}