import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function main() {
  // 1. Agent config
  const config = await sql`SELECT * FROM agent_config WHERE id = 1 LIMIT 1`;
  console.log("=== AGENT CONFIG ===");
  console.log(JSON.stringify(config, null, 2));
}

main().catch(e => { console.error("💥", e.message); process.exit(1); });
