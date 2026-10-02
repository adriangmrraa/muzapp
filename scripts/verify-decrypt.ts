import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { createDecipheriv, scryptSync } from "node:crypto";

const t = readFileSync("C:/Users/Asus/Documents/estabilizacion/Mrs Muzzarella/muzapp/.env", "utf8");
const env = Object.fromEntries(
  t.split(/\r?\n/).filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; })
);
const sql = neon(env.DATABASE_URL);

async function main() {
  const [row] = await sql`SELECT ycloud_api_key FROM agent_config WHERE id = 1`;
  const [s, iv, tag, enc] = String(row.ycloud_api_key).split(":");
  const key = scryptSync(env.AUTH_SECRET, Buffer.from(s, "hex"), 32);
  const d = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "hex"));
  d.setAuthTag(Buffer.from(tag, "hex"));
  const plain = d.update(enc, "hex", "utf8") + d.final("utf8");
  console.log("roundtrip ok — decrypted length:", plain.length, "| starts alnum:", /^[a-zA-Z0-9]/.test(plain));
}
main().catch(e => { console.error(e.message); process.exit(1); });
