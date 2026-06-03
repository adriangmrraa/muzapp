import { neon } from "@neondatabase/serverless";
import "dotenv/config";
const sql = neon(process.env.DATABASE_URL);

// Ver los últimos mensajes de mi conversación (conv 15)
const msgs = await sql`SELECT id, role, substring(content, 1, 300) as content, created_at FROM chat_messages WHERE conversation_id = 15 ORDER BY created_at DESC LIMIT 20`;
console.log("ULTIMOS 20 MENSAJES CONV 15:");
for (const m of msgs) {
  console.log(`\n[${m.role}] ${m.created_at?.slice?.(11, 19) || "?"}: ${m.content?.slice?.(0, 200)}`);
}

// Ver si hay mensajes sin transcripción
const audioMsgs = await sql`SELECT id, role, content, content_attributes FROM chat_messages WHERE conversation_id = 15 AND content LIKE '%Audio%' ORDER BY created_at DESC LIMIT 5`;
console.log("\n\nAUDIOS ENCONTRADOS:");
for (const m of audioMsgs) {
  console.log(`[${m.role}]: ${m.content?.slice?.(0, 200)}`);
  console.log("  attributes:", JSON.stringify(m.content_attributes));
}
