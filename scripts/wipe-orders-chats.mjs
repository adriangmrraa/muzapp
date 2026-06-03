import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  const phone = '5493704868421';
  const convId = 15;

  console.log('=== LIMPIANDO PEDIDOS Y CHATS, MANTENIENDO LEAD ===\n');

  // 1. Borrar orders
  await sql`DELETE FROM orders WHERE phone_number = ${phone}`;
  console.log('Orders eliminadas');

  // 2. Borrar attachments de la conversacion
  await sql`DELETE FROM attachments WHERE conversation_id = ${convId}`;
  console.log('Attachments eliminados');

  // 3. Borrar chat_messages (todos menos el primero)
  // Primero obtenemos el ID del primer mensaje
  const [firstMsg] = await sql`SELECT id FROM chat_messages WHERE conversation_id = ${convId} ORDER BY created_at ASC LIMIT 1`;
  
  if (firstMsg) {
    // Borrar todos excepto el primero
    await sql`DELETE FROM chat_messages WHERE conversation_id = ${convId} AND id != ${firstMsg.id}`;
    console.log(`Chat messages eliminados (excepto el primero #${firstMsg.id})`);
  } else {
    // No hay mensajes, borrar todo igual
    await sql`DELETE FROM chat_messages WHERE conversation_id = ${convId}`;
    console.log('Chat messages eliminados (no habia primero)');
  }

  // 4. Resetear order_context_items
  await sql`DELETE FROM order_context_items WHERE conversation_id = ${convId}`;
  console.log('Order context items eliminados');

  // 5. Resetear la conversacion
  await sql`UPDATE conversations SET 
    last_message_at = NULL,
    last_message_preview = NULL,
    human_override_until = NULL,
    updated_at = NOW()
    WHERE id = ${convId}`;
  console.log('Conversacion #15 reseteada');

  // Verificacion
  console.log('\n=== VERIFICACION ===');
  const orders = await sql`SELECT COUNT(*)::int as c FROM orders WHERE phone_number = ${phone}`;
  console.log('Orders:', orders[0].c);
  const msgs = await sql`SELECT COUNT(*)::int as c FROM chat_messages WHERE conversation_id = ${convId}`;
  console.log('Mensajes:', msgs[0].c);
  const ctx = await sql`SELECT COUNT(*)::int as c FROM order_context_items WHERE conversation_id = ${convId}`;
  console.log('Order context:', ctx[0].c);
  const lead = await sql`SELECT id, name, phone FROM leads WHERE phone = ${phone}`;
  console.log('Lead:', lead[0] ? `#${lead[0].id} ${lead[0].name}` : 'NO ENCONTRADO');

  // Mostrar el unico mensaje que queda
  if (firstMsg) {
    const [msg] = await sql`SELECT content, created_at FROM chat_messages WHERE id = ${firstMsg.id}`;
    console.log('\nUnico mensaje que queda:');
    console.log(`  [${msg.created_at}] ${msg.content}`);
  }

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
