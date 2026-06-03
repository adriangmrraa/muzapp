import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
async function main() {
  const msgs = await sql`SELECT cm.id, cm.conversation_id, cm.role, cm.content, cm.created_at, c.customer_name 
    FROM chat_messages cm 
    JOIN conversations c ON c.id = cm.conversation_id 
    WHERE c.channel = 'telegram' 
    ORDER BY cm.created_at DESC LIMIT 40`;
  
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i];
    const t = new Date(m.created_at).toLocaleString('es-AR', {hour:'2-digit',minute:'2-digit', day:'2-digit', month:'2-digit'});
    const preview = m.content ? m.content.slice(0, 200) : '(empty)';
    console.log(`[${t}] [CONV ${m.conversation_id}] ${m.role.toUpperCase()}: ${preview}`);
  }
  process.exit(0);
}
main().catch(e => console.error(e));
