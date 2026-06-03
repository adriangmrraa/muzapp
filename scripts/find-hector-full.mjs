import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  const convs = await sql`SELECT id, customer_name, customer_phone, human_override_until 
    FROM conversations 
    WHERE customer_name ILIKE '%hector%' OR customer_name ILIKE '%adrian%' 
       OR customer_phone LIKE '%5493704868421%'
    ORDER BY last_message_at DESC LIMIT 5`;

  for (const c of convs) {
    console.log('========== CONV #' + c.id + ' ==========');
    console.log('Name:', c.customer_name);
    console.log('Phone:', c.customer_phone);
    console.log('Override:', c.human_override_until);
    console.log('');

    const msgs = await sql`SELECT role, content, created_at 
      FROM chat_messages 
      WHERE conversation_id = ${c.id} 
      ORDER BY created_at ASC`; // ASC para orden cronologico

    for (const m of msgs) {
      const time = new Date(m.created_at).toLocaleString('es-AR', { 
        hour: '2-digit', minute: '2-digit', 
        day: '2-digit', month: '2-digit' 
      });
      const content = m.content || '(empty)';
      console.log(`[${time}] ${m.role.toUpperCase()}:`);
      console.log(`  ${content}`);
      console.log('');
    }
  }
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
