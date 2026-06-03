import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  const convs = await sql`SELECT id, customer_name, customer_phone, human_override_until 
    FROM conversations 
    WHERE customer_name ILIKE '%hector%' OR customer_name ILIKE '%adrian%' 
       OR customer_phone LIKE '%5493704868421%'
    ORDER BY last_message_at DESC LIMIT 5`;

  for (const c of convs) {
    console.log('=== CONV #' + c.id + ' ===');
    console.log('Name:', c.customer_name);
    console.log('Phone:', c.customer_phone);
    console.log('Override:', c.human_override_until);

    const msgs = await sql`SELECT role, content, created_at 
      FROM chat_messages 
      WHERE conversation_id = ${c.id} 
      ORDER BY created_at DESC LIMIT 30`;

    for (const m of msgs.reverse()) {
      const time = new Date(m.created_at).toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit' });
      const preview = m.content ? m.content.slice(0, 300) : '(empty)';
      console.log(`  [${time}] ${m.role.toUpperCase()}: ${preview}`);
    }
    console.log('');
  }

  if (convs.length === 0) {
    console.log('No se encontraron conversaciones.');
    // Buscar por cualquier telefono cercano
    const all = await sql`SELECT id, customer_name, customer_phone FROM conversations 
      WHERE customer_phone IS NOT NULL ORDER BY last_message_at DESC LIMIT 10`;
    console.log('\nUltimas 10 conversaciones:');
    for (const c of all) {
      console.log(`  #${c.id}: ${c.customer_name || '(sin nom)'} - ${c.customer_phone}`);
    }
  }
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
