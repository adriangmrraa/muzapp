import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  // Mostrar últimos 14 mensajes
  const msgs = await sql`SELECT id, role, created_at, LEFT(content, 80) as preview 
    FROM chat_messages WHERE conversation_id = 15 
    ORDER BY created_at DESC LIMIT 14`;

  console.log('Últimos 14 mensajes de CONV #15:');
  const ids = [];
  for (const m of msgs.toReversed()) {
    const time = new Date(m.created_at).toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
    console.log(`  #${m.id} [${time}] ${m.role}: ${m.preview}`);
    ids.push(m.id);
  }

  if (ids.length > 0) {
    const del = await sql`DELETE FROM chat_messages WHERE id = ANY(${ids})`;
    console.log(`\n✅ Eliminados ${del.count} mensajes`);

    const remaining = await sql`SELECT COUNT(*)::int as c FROM chat_messages WHERE conversation_id = 15`;
    console.log(`Quedan ${remaining[0].c} mensajes en CONV #15`);
  }
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
