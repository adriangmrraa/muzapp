import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  // Borrar los 2 ultimos mensajes del loop corrector
  await sql`DELETE FROM chat_messages WHERE id = 5643`;
  await sql`DELETE FROM chat_messages WHERE id = 5644`;

  const r = await sql`SELECT COUNT(*)::int as c FROM chat_messages WHERE conversation_id = 15`;
  console.log('Quedan', r[0].c, 'mensajes en CONV #15');
  console.log('Listo para probar de nuevo!');
  process.exit(0);
}
main().catch(e => console.error(e));
