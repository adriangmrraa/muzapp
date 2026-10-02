import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const t = readFileSync("C:/Users/Asus/Documents/estabilizacion/Mrs Muzzarella/muzapp/.env", "utf8");
const u = Object.fromEntries(
  t.split(/\r?\n/).filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; })
).DATABASE_URL;
const sql = neon(u);

const COLS: [string, string][] = [
  ["business_name", "varchar(160)"],
  ["business_tagline", "varchar(255)"],
  ["business_address", "varchar(255)"],
  ["business_phone_display", "varchar(50)"],
  ["instagram_handle", "varchar(100)"],
  ["business_website", "text"],
  ["business_description", "text"],
  ["ai_api_key", "text"],
  ["ai_base_url", "text"],
  ["ai_model", "varchar(120)"],
  ["ai_model_fast", "varchar(120)"],
  ["ai_model_vision", "varchar(120)"],
];

async function main() {
  for (const [name, type] of COLS) {
    await sql.query(`ALTER TABLE agent_config ADD COLUMN IF NOT EXISTS ${name} ${type}`);
    console.log(`✓ ${name}`);
  }
  const check = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'agent_config'
    AND (column_name LIKE 'ai_%' OR column_name LIKE 'business_%' OR column_name = 'instagram_handle')
    ORDER BY column_name`;
  console.log("present:", check.map(r => r.column_name).join(", "));
}

main().catch(e => { console.error(e); process.exit(1); });
