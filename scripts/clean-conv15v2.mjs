import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  // Obtener los últimos 14 IDs
  const msgs = await sql`SELECT id, role, LEFT(content, 80) as preview, created_at
    FROM chat_messages WHERE conversation_id = 15 
    ORDER BY created_at DESC LIMIT 14`;

  console.log('Últimos 14 mensajes de CONV #15:');
  const ids = [];
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i];
    const time = new Date(m.created_at).toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
    console.log(`  #${m.id} [${time}] ${m.role}: ${m.preview}`);
    ids.push(m.id);
  }

  // Borrar
  const del = await sql`DELETE FROM chat_messages WHERE id = ANY(${ids})`;
  console.log(`\n✅ Eliminados ${del.count} mensajes`);

  const remaining = await sql`SELECT COUNT(*)::int as c FROM chat_messages WHERE conversation_id = 15`;
  console.log(`Quedan ${remaining[0].c} mensajes`);
}
main().catch(e => console.error(e));
