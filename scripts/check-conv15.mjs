import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  const msgs = await sql`SELECT id, role, created_at, content 
    FROM chat_messages WHERE conversation_id = 15 
    ORDER BY created_at DESC LIMIT 6`;

  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i];
    const t = new Date(m.created_at).toLocaleString('es-AR', {hour:'2-digit',minute:'2-digit', day:'2-digit', month:'2-digit'});
    console.log(`[${t}] ${m.role.toUpperCase()}:`);
    console.log(m.content);
    console.log('');
  }
  process.exit(0);
}
main().catch(e => console.error(e));
