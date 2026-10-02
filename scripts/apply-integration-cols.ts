import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const t = readFileSync("C:/Users/Asus/Documents/estabilizacion/Mrs Muzzarella/muzapp/.env", "utf8");
const u = Object.fromEntries(
  t.split(/\r?\n/).filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; })
).DATABASE_URL;
const sql = neon(u);

const COLS: [string, string][] = [
  ["ycloud_webhook_secret", "text"],
  ["cloudinary_cloud_name", "varchar(120)"],
  ["cloudinary_api_key", "varchar(120)"],
  ["cloudinary_api_secret", "text"],
  ["meta_app_id", "varchar(80)"],
  ["meta_app_secret", "text"],
  ["meta_webhook_verify_token", "varchar(200)"],
  ["telegram_notify_chat_id", "varchar(50)"],
  ["cron_secret", "varchar(200)"],
  ["escalation_email", "varchar(200)"],
];

async function main() {
  for (const [name, type] of COLS) {
    await sql.query(`ALTER TABLE agent_config ADD COLUMN IF NOT EXISTS ${name} ${type}`);
    console.log(`✓ ${name}`);
  }
  const check = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'agent_config'
    AND column_name = ANY(${["ycloud_webhook_secret","cloudinary_cloud_name","cloudinary_api_key","cloudinary_api_secret","meta_app_id","meta_app_secret","meta_webhook_verify_token","telegram_notify_chat_id","cron_secret","escalation_email"]})
    ORDER BY column_name`;
  console.log("present:", check.map(r => r.column_name).join(", "));
}

main().catch(e => { console.error(e); process.exit(1); });
