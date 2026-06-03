import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

async function main() {
  const url = process.env.DATABASE_URL || "";
  const sql = neon(url);
  const db = drizzle(sql);

  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_messages_platform_id ON chat_messages USING btree (platform_message_id)`;
  console.log("✅ Unique index created on chat_messages.platform_message_id");
}

main().catch((err) => console.error("Error:", err.message));
