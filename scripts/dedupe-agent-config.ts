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
  const rows = (await sql`
    SELECT id, enabled, telegram_enabled,
           (system_prompt IS NOT NULL) AS has_prompt,
           (ycloud_api_key IS NOT NULL) AS has_ycloud,
           updated_at
    FROM agent_config ORDER BY id`) as Record<string, unknown>[];
  console.log("agent_config rows:", JSON.stringify(rows, null, 2));

  const extras = rows.filter((r) => r.id !== 1);
  if (extras.length === 0) {
    console.log("No duplicate rows — nothing to delete.");
    return;
  }
  for (const r of extras) {
    const del = await sql`DELETE FROM agent_config WHERE id = ${r.id} RETURNING id`;
    console.log(`Deleted agent_config id=${del[0]?.id} (enabled=${r.enabled})`);
  }
  const after = (await sql`SELECT id FROM agent_config ORDER BY id`) as { id: number }[];
  console.log("Remaining ids:", after.map((r) => r.id));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
