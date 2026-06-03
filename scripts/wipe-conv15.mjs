import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log('Eliminando TODOS los mensajes de CONV #15 (Hector Adrian)...');
  
  // Primero attachments vinculados a mensajes de esta conversacion
  await sql`DELETE FROM attachments WHERE conversation_id = 15`;
  console.log('Attachments eliminados');
  
  // Despues los mensajes
  await sql`DELETE FROM chat_messages WHERE conversation_id = 15`;
  console.log('Chat messages eliminados');
  
  // Verificar
  const r = await sql`SELECT COUNT(*)::int as c FROM chat_messages WHERE conversation_id = 15`;
  console.log('Mensajes restantes en CONV #15:', r[0].c);
  
  // Actualizar la conversacion para que arranque limpia
  await sql`UPDATE conversations SET 
    last_message_at = NULL,
    last_message_preview = NULL,
    human_override_until = NULL,
    updated_at = NOW()
    WHERE id = 15`;
  console.log('Conversacion #15 reseteada');
  
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
