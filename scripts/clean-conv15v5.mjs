import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  // Mostrar los ultimos mensajes post 03:00
  const msgs = await sql`SELECT id, role, created_at, LEFT(content, 60) as preview
    FROM chat_messages 
    WHERE conversation_id = 15 AND created_at >= '2026-05-31'
    ORDER BY created_at`;

  console.log('Mensajes del 31/5:');
  for (const m of msgs) {
    console.log(`  #${m.id} ${m.role}: ${m.preview}`);
  }

  if (msgs.length === 0) {
    console.log('No hay mensajes del 31/5. Probando con UTC...');
    const msgs2 = await sql`SELECT id, role, created_at, LEFT(content, 60) as preview
      FROM chat_messages 
      WHERE conversation_id = 15
      ORDER BY created_at DESC LIMIT 5`;
    for (const m of msgs2) {
      console.log(`  #${m.id} ${m.created_at} ${m.role}: ${m.preview}`);
    }
  }

  // DELETE por IDs exactos
  const idsAVerificar = [5591, 5592, 5593, 5594, 5595, 5596, 5597, 5598, 5599, 5600, 5601, 5603, 5604, 5605, 5606, 5608, 5609, 5611, 5613, 5614, 5615];
  const existentes = await sql`SELECT id FROM chat_messages WHERE id = ANY(${idsAVerificar})`;
  console.log('\nIDs existentes en DB:', existentes.map(e => e.id).join(', '));
}
main().catch(e => console.error(e));
