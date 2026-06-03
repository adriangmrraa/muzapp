import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
async function main() {
  // 1. Ver promos en DB
  const promos = await sql`SELECT id, name, description, image_url, custom_price, active FROM promotions ORDER BY id`;
  console.log('=== PROMOS EN DB ===');
  for (const p of promos) {
    console.log(`  #${p.id} ${p.name} | active:${p.active} | img:${p.image_url ? 'SI' : 'NO'} | $${p.custom_price || 0}`);
  }

  // 2. Ver ultimos mensajes de CONV 15
  const msgs = await sql`SELECT id, role, created_at, content 
    FROM chat_messages WHERE conversation_id = 15 
    ORDER BY created_at DESC LIMIT 15`;
  console.log('\n=== ULTIMOS 15 MENSAJES CONV 15 ===');
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i];
    const t = new Date(m.created_at).toLocaleString('es-AR', {hour:'2-digit',minute:'2-digit'});
    const preview = m.content ? m.content.slice(0, 250) : '(empty)';
    console.log(`[${t}] ${m.role.toUpperCase()}: ${preview}`);
  }
  process.exit(0);
}
main().catch(e => console.error(e));
