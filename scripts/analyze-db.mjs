import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("FATAL: DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function main() {
  console.log("=== ANÁLISIS DE BASE DE DATOS MUZAPP ===");
  console.log("");

  // 1. Total conversaciones
  const [totalConvs] = await sql`SELECT COUNT(*)::int as count FROM conversations`;
  console.log(`TOTAL CONVERSACIONES: ${totalConvs.count}`);

  // 2. Por estado
  const byStatus = await sql`SELECT status, COUNT(*)::int as count FROM conversations GROUP BY status`;
  console.log("POR ESTADO:");
  for (const row of byStatus) {
    console.log(`  ${row.status}: ${row.count}`);
  }

  // 3. Human override activo
  const [overrideActive] = await sql`SELECT COUNT(*)::int as count FROM conversations WHERE human_override_until > NOW()`;
  console.log(`HUMAN OVERRIDE ACTIVO AHORA: ${overrideActive.count}`);

  // 4. Total chat messages
  const [totalMsgs] = await sql`SELECT COUNT(*)::int FROM chat_messages`;
  console.log(`TOTAL CHAT MESSAGES: ${totalMsgs.count}`);

  // 5. Por role
  const byRole = await sql`SELECT role, COUNT(*)::int FROM chat_messages GROUP BY role ORDER BY role`;
  console.log("POR ROLE:");
  for (const row of byRole) {
    console.log(`  ${row.role}: ${row.count}`);
  }

  // 6. Chats donde el dueño intervino
  const [humanMsgs] = await sql`SELECT COUNT(*)::int as count FROM chat_messages WHERE role = 'human'`;
  console.log(`\nINTERVENCIONES HUMANAS (role=human): ${humanMsgs.count}`);

  // 7. AI messages count
  const [aiMsgs] = await sql`SELECT COUNT(*)::int as count FROM chat_messages WHERE role = 'assistant'`;
  console.log(`AI ASSISTANT MESSAGES: ${aiMsgs.count}`);

  // 8. Chats de los últimos 3 días completos
  console.log("\n\n==================== CHATS ÚLTIMOS 3 DÍAS (COMPLETOS) ====================");
  const recentMessages = await sql`
    SELECT cm.id, cm.conversation_id, cm.role, cm.content, cm.created_at,
           c.customer_name, c.customer_phone
    FROM chat_messages cm
    JOIN conversations c ON c.id = cm.conversation_id
    WHERE cm.created_at > NOW() - INTERVAL '3 days'
    AND c.id IN (
      SELECT id FROM conversations 
      WHERE last_message_at > NOW() - INTERVAL '3 days'
    )
    ORDER BY cm.conversation_id, cm.created_at
  `;

  let currentConv = 0;
  for (const msg of recentMessages) {
    if (msg.conversation_id !== currentConv) {
      console.log(`\n--- CONV #${msg.conversation_id} (${msg.customer_name || "sin_nombre"} - ${msg.customer_phone || "sin_tel"}) ---`);
      currentConv = msg.conversation_id;
    }
    const time = new Date(msg.created_at).toLocaleString("es-AR", { 
      hour: '2-digit', minute: '2-digit', 
      day: '2-digit', month: '2-digit' 
    });
    const preview = msg.content;
    console.log(`\n  [${time}] ${msg.role.toUpperCase()}:`);
    console.log(`  ${preview}`);
  }

  // 9. También chats de la última semana (si hay pocos en 3 días)
  console.log("\n\n==================== CHATS ÚLTIMA SEMANA ====================");
  const weekMessages = await sql`
    SELECT cm.id, cm.conversation_id, cm.role, cm.content, cm.created_at,
           c.customer_name, c.customer_phone
    FROM chat_messages cm
    JOIN conversations c ON c.id = cm.conversation_id
    WHERE cm.created_at > NOW() - INTERVAL '7 days'
    AND c.last_message_at > NOW() - INTERVAL '7 days'
    ORDER BY cm.conversation_id, cm.created_at
  `;

  currentConv = 0;
  for (const msg of weekMessages) {
    if (msg.conversation_id !== currentConv) {
      console.log(`\n--- CONV #${msg.conversation_id} (${msg.customer_name || "sin_nombre"} - ${msg.customer_phone || "sin_tel"}) ---`);
      currentConv = msg.conversation_id;
    }
    const time = new Date(msg.created_at).toLocaleString("es-AR", { 
      hour: '2-digit', minute: '2-digit', 
      day: '2-digit', month: '2-digit' 
    });
    console.log(`\n  [${time}] ${msg.role.toUpperCase()}:`);
    console.log(`  ${msg.content}`);
  }
}

main().catch(e => console.error("ERROR:", e));
