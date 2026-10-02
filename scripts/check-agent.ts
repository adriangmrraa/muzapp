import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const t = readFileSync("C:/Users/Asus/Documents/estabilizacion/Mrs Muzzarella/muzapp/.env", "utf8");
const u = Object.fromEntries(
  t.split(/\r?\n/).filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; })
).DATABASE_URL;
const sql = neon(u);

// Presence check only — never print values.
const COLS = [
  // negocio
  "business_name","business_tagline","business_address","business_phone_display",
  "instagram_handle","business_website","business_description",
  // whatsapp / ycloud
  "phone_number","whatsapp_bot_number","ycloud_api_key","ycloud_webhook_secret",
  // ai
  "ai_api_key","ai_base_url","ai_model","ai_model_fast","ai_model_vision",
  // integraciones nuevas
  "cloudinary_cloud_name","cloudinary_api_key","cloudinary_api_secret",
  "meta_app_id","meta_app_secret","meta_webhook_verify_token",
  "telegram_notify_chat_id","cron_secret","escalation_email",
  // telegram bot
  "telegram_bot_token","telegram_chat_id","telegram_webhook_token","telegram_enabled",
  "meta_access_token",
];

async function main() {
  const [row] = await sql`SELECT * FROM agent_config WHERE id = 1`;
  if (!row) { console.log("NO ROW id=1"); return; }
  for (const c of COLS) {
    const v = row[c];
    const set = v !== null && v !== undefined && String(v).trim() !== "";
    console.log(`${set ? "SET  " : "empty"}  ${c}`);
  }
}
main().catch(e => { console.error(e.message); process.exit(1); });
