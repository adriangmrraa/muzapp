import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
async function main() {
  const convId = 112;
  
  const [before] = await sql`SELECT COUNT(*)::int as c FROM chat_messages WHERE conversation_id = ${convId}`;
  console.log('Mensajes antes:', before.c);
  
  await sql`DELETE FROM attachments WHERE conversation_id = ${convId}`;
  await sql`DELETE FROM chat_messages WHERE conversation_id = ${convId}`;
  
  await sql`UPDATE conversations SET
    customer_name = 'Tiago',
    customer_phone = NULL,
    messages = '[]',
    last_message_at = NULL,
    last_message_preview = NULL,
    human_override_until = NULL,
    updated_at = NOW()
    WHERE id = ${convId}`;
  
  const [after] = await sql`SELECT COUNT(*)::int as c FROM chat_messages WHERE conversation_id = ${convId}`;
  console.log('Mensajes después:', after.c);
  console.log('Chat de Telegram #112 (Tiago) reseteado');
  process.exit(0);
}
main().catch(e => console.error(e));
