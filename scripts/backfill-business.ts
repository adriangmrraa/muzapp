import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const t = readFileSync("C:/Users/Asus/Documents/estabilizacion/Mrs Muzzarella/muzapp/.env", "utf8");
const u = Object.fromEntries(
  t.split(/\r?\n/).filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; })
).DATABASE_URL;
const sql = neon(u);

async function main() {
  // Backfill only where the new columns are still NULL — preserves any
  // values already entered through the admin UI.
  await sql`
    UPDATE agent_config SET
      business_name          = COALESCE(business_name, 'Mrs Muzzarella'),
      business_tagline       = COALESCE(business_tagline, 'Rotisería premium · Formosa Capital'),
      business_address       = COALESCE(business_address, 'Neuquen 1245'),
      instagram_handle       = COALESCE(instagram_handle, 'mrs_mozzarella'),
      business_description   = COALESCE(business_description, 'Hamburguesas artesanales premium y pan mayorista de calidad. Hechos con amor y los mejores ingredientes en Formosa, Argentina.')
    WHERE id = 1`;
  const row = await sql`SELECT business_name, business_tagline, business_address, instagram_handle FROM agent_config WHERE id = 1`;
  console.log(JSON.stringify(row, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
