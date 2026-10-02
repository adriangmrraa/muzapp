import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";

function loadDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = resolve(
    "C:/Users/Asus/Documents/estabilizacion/Mrs Muzzarella/muzapp/.env",
  );
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^DATABASE_URL=(.+)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  throw new Error("DATABASE_URL not found");
}

async function main() {
  const sql = neon(loadDatabaseUrl());
  const rows = await sql`SELECT id, email, role, created_at FROM users ORDER BY id`;
  console.log(JSON.stringify(rows, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
