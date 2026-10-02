import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { createCipheriv, randomBytes, scryptSync } from "node:crypto";

const t = readFileSync("C:/Users/Asus/Documents/estabilizacion/Mrs Muzzarella/muzapp/.env", "utf8");
const env = Object.fromEntries(
  t.split(/\r?\n/).filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; })
);
const sql = neon(env.DATABASE_URL);
const AUTH_SECRET = env.AUTH_SECRET;
if (!AUTH_SECRET) { console.error("AUTH_SECRET missing"); process.exit(1); }

const ENCRYPTED_PATTERN = /^[0-9a-f]{32}:[0-9a-f]{24}:[0-9a-f]{32}:[0-9a-f]+$/i;
const isEncrypted = (v: unknown) => typeof v === "string" && ENCRYPTED_PATTERN.test(v);

function encrypt(text: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(AUTH_SECRET, salt, 32);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  let enc = cipher.update(text, "utf8", "hex");
  enc += cipher.final("hex");
  return `${salt.toString("hex")}:${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${enc}`;
}

const SECRET_COLS = [
  "ycloud_api_key",
  "ai_api_key",
  "ycloud_webhook_secret",
  "cloudinary_api_secret",
  "meta_app_secret",
  "meta_webhook_verify_token",
  "cron_secret",
];

async function main() {
  const rows = await sql.query(
    `SELECT id, ${SECRET_COLS.map(c => `"${c}"`).join(", ")} FROM agent_config WHERE id = 1`
  );
  const row = rows[0];
  if (!row) { console.log("no row id=1"); return; }
  for (const c of SECRET_COLS) {
    const v = row[c];
    if (typeof v === "string" && v.trim() && !isEncrypted(v)) {
      await sql.query(`UPDATE agent_config SET ${c} = $1 WHERE id = 1`, [encrypt(v)]);
      console.log(`encrypted ${c}`);
    } else {
      console.log(`skip ${c} (${v == null || v === "" ? "empty" : "already encrypted"})`);
    }
  }
}
main().catch(e => { console.error(e); process.exit(1); });
