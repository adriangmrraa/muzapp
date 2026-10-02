import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

// Check which objects from migration 0004 already exist in the target DB.
const t = readFileSync("C:/Users/Asus/Documents/estabilizacion/Mrs Muzzarella/muzapp/.env", "utf8");
const u = Object.fromEntries(
  t.split(/\r?\n/).filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; })
).DATABASE_URL;
const sql = neon(u);

async function main() {
  const tables = await sql`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    AND tablename LIKE 'conversation_session%' ORDER BY tablename`;
  console.log("session tables:", tables.map(r => r.tablename));

  const cols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'agent_config'
    AND (column_name LIKE 'business%' OR column_name LIKE 'ai_%' OR column_name = 'instagram_handle')
    ORDER BY column_name`;
  console.log("new agent_config cols:", cols.map(r => r.column_name));

  const types = await sql`
    SELECT typname FROM pg_type WHERE typname LIKE 'conversation_session%' ORDER BY typname`;
  console.log("session types:", types.map(r => r.typname));
}

main().catch(e => { console.error(e); process.exit(1); });
