import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
async function main() {
  await sql`DELETE FROM attachments WHERE conversation_id = 15`;
  await sql`DELETE FROM chat_messages WHERE conversation_id = 15`;
  await sql`UPDATE conversations SET messages = '[]', last_message_at = NULL, last_message_preview = NULL, human_override_until = NULL, updated_at = NOW() WHERE id = 15`;
  const r = await sql`SELECT COUNT(*)::int as c FROM chat_messages WHERE conversation_id = 15`;
  console.log('Mensajes restantes CONV 15:', r[0].c);
  process.exit(0);
}
main().catch(e => console.error(e));
