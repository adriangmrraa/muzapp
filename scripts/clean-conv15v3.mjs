import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  // IDs hardcodeados de los ultimos mensajes basura
  // assistant con "Dale, qué bueno che" = #5593
  // assistant con "Dale, mandame la frase" = #5595, #5597
  // user messages posteriores al 31/5 03:10
  const ids = [5591, 5592, 5593, 5594, 5595, 5596, 5597, 5598, 5599, 5600, 5601, 5603, 5604, 5605, 5606, 5608, 5609, 5611, 5613, 5614, 5615];

  console.log('IDs a eliminar:', ids.join(', '));

  // Primero attachments que referencien estos mensajes
  await sql`DELETE FROM attachments WHERE message_id = ANY(${ids})`;
  console.log('Attachments eliminados');

  // Ahora los mensajes
  const del = await sql`DELETE FROM chat_messages WHERE id = ANY(${ids})`;
  console.log(`Eliminados ${del.count} mensajes`);

  const remaining = await sql`SELECT COUNT(*)::int as c FROM chat_messages WHERE conversation_id = 15`;
  console.log(`Quedan ${remaining[0].c} mensajes en CONV #15`);
}
main().catch(e => console.error(e));
