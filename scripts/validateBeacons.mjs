import fs from "fs";
import path from "path";

const root = process.cwd();
const schema = JSON.parse(fs.readFileSync(path.join(root, "ai-seo-engine", "schemas", "seo-item.schema.json"), "utf8"));

function isObject(x){ return x && typeof x === "object" && !Array.isArray(x); }

function validate(obj){
  const req = ["@context","@type","id","name","dateModified","oaa"];
  for (const k of req) if (!(k in obj)) throw new Error(`missing ${k}`);
  if (obj["@context"] !== "https://schema.org") throw new Error("bad @context");
  if (!["CreativeWork","Dataset","SoftwareSourceCode"].includes(obj["@type"])) throw new Error("bad @type");
  if (!isObject(obj.oaa)) throw new Error("missing oaa");
  const o = obj.oaa;
  for (const k of ["gicScore","accordsScore","freshnessScore","integrityScore","kind"])
    if (!(k in o)) throw new Error(`oaa.${k} missing`);
  return true;
}

function main(){
  const beaconsDir = path.join(root, "public", "ai-seo", "beacons");
  const files = fs.readdirSync(beaconsDir).filter(f => f.endsWith('.jsonld'));
  
  let valid = 0;
  let invalid = 0;
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(beaconsDir, file), "utf8");
      const obj = JSON.parse(content);
      validate(obj);
      console.log(`✓ ${file}`);
      valid++;
    } catch (e) {
      console.log(`✗ ${file}: ${e.message}`);
      invalid++;
    }
  }
  
  console.log(`\nValidation complete: ${valid} valid, ${invalid} invalid`);
  if (invalid > 0) process.exit(1);
}

main();
