import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const t = readFileSync("C:/Users/Asus/Documents/estabilizacion/Mrs Muzzarella/muzapp/.env", "utf8");
const u = Object.fromEntries(
  t.split(/\r?\n/).filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; })
).DATABASE_URL;
const sql = neon(u);

async function main() {
  const cfg = await sql`SELECT id, enabled, telegram_enabled, delivery_enabled,
    phone_number IS NOT NULL AS has_phone,
    system_prompt IS NOT NULL AND btrim(system_prompt) <> '' AS has_prompt,
    whatsapp_system_prompt IS NOT NULL AND btrim(whatsapp_system_prompt) <> '' AS has_wa_prompt,
    whatsapp_instructions IS NOT NULL AND btrim(whatsapp_instructions) <> '' AS has_wa_instructions
    FROM agent_config`;
  console.log("agent_config:", JSON.stringify(cfg, null, 2));

  try {
    const tg = await sql`SELECT enabled,
      webhook_token IS NOT NULL AND btrim(webhook_token) <> '' AS has_token,
      bot_token IS NOT NULL AND btrim(bot_token) <> '' AS has_bot_token,
      allowed_chat_ids
      FROM telegram_config`;
    console.log("telegram_config:", JSON.stringify(tg, null, 2));
  } catch (e) {
    console.log("telegram_config: table missing or error —", (e as Error).message);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
