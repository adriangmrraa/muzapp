import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
async function main() {
  // Todos los mensajes de conversaciones activas de hoy (WhatsApp)
  const msgs = await sql`SELECT cm.id, cm.conversation_id, cm.role, cm.content, cm.created_at, c.customer_name 
    FROM chat_messages cm 
    JOIN conversations c ON c.id = cm.conversation_id 
    WHERE c.channel = 'whatsapp' 
    AND cm.created_at > '2026-05-31'
    AND c.customer_name IS NOT NULL
    ORDER BY cm.conversation_id, cm.created_at`;
  
  let currentConv = 0;
  for (const m of msgs) {
    if (m.conversation_id !== currentConv) {
      console.log(`\n========== CONV #${m.conversation_id} (${m.customer_name || '?'}) ==========`);
      currentConv = m.conversation_id;
    }
    const t = new Date(m.created_at).toLocaleString('es-AR', {hour:'2-digit',minute:'2-digit'});
    const preview = m.content ? m.content.slice(0, 300) : '(empty)';
    console.log(`[${t}] ${m.role.toUpperCase()}: ${preview}`);
  }
  process.exit(0);
}
main().catch(e => console.error(e));
