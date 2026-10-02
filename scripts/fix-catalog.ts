import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const envText = readFileSync("C:/Users/Asus/Documents/estabilizacion/Mrs Muzzarella/muzapp/.env", "utf8");
const url = Object.fromEntries(
  envText.split(/\r?\n/).filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; })
).DATABASE_URL;
const sql = neon(url);

async function main() {
  console.log("=== line/category/sort_order per product ===");
  const rows = await sql`SELECT id, name, category, line, sort_order FROM products WHERE available ORDER BY sort_order`;
  for (const r of rows) console.log(`${r.id} | ${r.category} | line=${r.line} | so=${r.sort_order} | ${r.name}`);

  console.log("\n=== cleanup: dead /api/media image_url -> NULL ===");
  const dead = await sql`UPDATE products SET image_url = NULL WHERE image_url LIKE '/api/media/%' RETURNING id, name`;
  console.log("cleared:", dead.map(r => `${r.id}:${r.name}`));

  console.log("\n=== cleanup: trim product names ===");
  const trimmed = await sql`UPDATE products SET name = regexp_replace(btrim(name), '  +', ' ', 'g') WHERE name ~ '(^ )|(  )|( $)' RETURNING id, name`;
  console.log("normalized:", trimmed.map(r => `${r.id}:${r.name}`));
}
main().catch((e) => { console.error(e); process.exit(1); });
