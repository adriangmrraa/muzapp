import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  const phone = '5493704868421';
  const convId = 15;

  console.log('=== VACIANDO TODOS LOS DATOS DE HECTOR ADRIAN ===\n');

  // 1. Buscar lead
  const [lead] = await sql`SELECT id FROM leads WHERE phone = ${phone}`;
  const leadId = lead?.id;
  console.log('Lead ID:', leadId || 'no encontrado');

  // 2. Eliminar orders
  if (leadId) {
    await sql`DELETE FROM orders WHERE lead_id = ${leadId}`;
    console.log('Orders eliminadas (por lead_id)');
  }
  // Tambien por si alguna order tiene el telefono pero no lead
  await sql`DELETE FROM orders WHERE phone_number = ${phone}`;
  console.log('Orders eliminadas (por phone_number)');

  // 3. Eliminar order_context_items
  await sql`DELETE FROM order_context_items WHERE conversation_id = ${convId}`;
  console.log('Order context items eliminados');

  // 4. Eliminar attachments de la conversacion
  await sql`DELETE FROM attachments WHERE conversation_id = ${convId}`;
  console.log('Attachments eliminados');

  // 5. Eliminar chat_messages
  await sql`DELETE FROM chat_messages WHERE conversation_id = ${convId}`;
  console.log('Chat messages eliminados');

  // 6. Eliminar el lead
  if (leadId) {
    await sql`DELETE FROM leads WHERE id = ${leadId}`;
    console.log('Lead eliminado');
  }

  // 7. Resetear la conversacion
  await sql`UPDATE conversations SET 
    customer_name = NULL,
    customer_phone = NULL,
    messages = '[]',
    last_message_at = NULL,
    last_message_preview = NULL,
    human_override_until = NULL,
    updated_at = NOW(),
    status = 'active'
    WHERE id = ${convId}`;
  console.log('Conversacion #15 reseteada');

  // Verificacion final
  console.log('\n=== VERIFICACION ===');
  const orders = await sql`SELECT COUNT(*)::int as c FROM orders WHERE phone_number = ${phone}`;
  console.log('Orders restantes:', orders[0].c);
  const msgs = await sql`SELECT COUNT(*)::int as c FROM chat_messages WHERE conversation_id = ${convId}`;
  console.log('Mensajes restantes:', msgs[0].c);
  const leads = await sql`SELECT COUNT(*)::int as c FROM leads WHERE phone = ${phone}`;
  console.log('Leads restantes:', leads[0].c);
  const items = await sql`SELECT COUNT(*)::int as c FROM order_context_items WHERE conversation_id = ${convId}`;
  console.log('Order context items restantes:', items[0].c);

  console.log('\n✅ TODO VACIADO. Arrancá fresco.');
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
