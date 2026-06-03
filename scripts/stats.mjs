import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  const stats = {};
  const [total] = await sql`SELECT COUNT(*)::int as count FROM chat_messages`;
  stats.total = total.count;

  const byRole = await sql`SELECT role, COUNT(*)::int as c FROM chat_messages GROUP BY role`;
  for (const r of byRole) stats[r.role] = r.c;

  const [human] = await sql`SELECT COUNT(*)::int as count FROM chat_messages WHERE role = 'human'`;
  stats.human_messages = human.count;

  const named = await sql`SELECT COUNT(*)::int as c FROM conversations WHERE customer_name IS NOT NULL AND customer_name != ''`;
  stats.named_conversations = named.c;

  const perDay = await sql`
    SELECT DATE(last_message_at) as day, COUNT(*)::int as c
    FROM conversations
    WHERE last_message_at > NOW() - INTERVAL '7 days'
    GROUP BY DATE(last_message_at)
    ORDER BY day DESC
  `;

  console.log('=== STATS ===');
  console.log(JSON.stringify(stats, null, 2));
  console.log('\n=== CONVERSACIONES POR DÍA (7 DÍAS) ===');
  for (const d of perDay) console.log(`  ${d.day}: ${d.c} conversaciones`);

  const [recentMsgs] = await sql`SELECT COUNT(*)::int as count FROM chat_messages WHERE created_at > NOW() - INTERVAL '3 days'`;
  console.log(`\nMENSAJES ÚLTIMOS 3 DÍAS: ${recentMsgs.count}`);

  const recentByRole = await sql`
    SELECT role, COUNT(*)::int as c 
    FROM chat_messages WHERE created_at > NOW() - INTERVAL '3 days'
    GROUP BY role
  `;
  console.log('POR ROLE (3 DÍAS):');
  for (const r of recentByRole) console.log(`  ${r.role}: ${r.c}`);

  const [uniqueCust] = await sql`
    SELECT COUNT(DISTINCT customer_phone)::int as c
    FROM conversations WHERE last_message_at > NOW() - INTERVAL '3 days'
      AND customer_phone IS NOT NULL
  `;
  console.log(`CLIENTES ÚNICOS (3 DÍAS): ${uniqueCust.c}`);

  // IA vs Owner en últimos 7 días
  const weekByRole = await sql`
    SELECT role, COUNT(*)::int as c
    FROM chat_messages WHERE created_at > NOW() - INTERVAL '7 days'
    GROUP BY role ORDER BY role
  `;
  console.log('\nPOR ROLE (7 DÍAS):');
  for (const r of weekByRole) console.log(`  ${r.role}: ${r.c}`);

  // TOP 10 customer names
  const topCustomers = await sql`
    SELECT customer_name, customer_phone, COUNT(*)::int as msg_count
    FROM conversations c
    JOIN chat_messages cm ON cm.conversation_id = c.id
    WHERE c.customer_name IS NOT NULL AND c.customer_name != ''
      AND cm.created_at > NOW() - INTERVAL '7 days'
    GROUP BY c.id, c.customer_name, c.customer_phone
    ORDER BY msg_count DESC
    LIMIT 20
  `;
  console.log('\nTOP CLIENTES (7 DÍAS):');
  for (const ct of topCustomers) {
    console.log(`  ${ct.customer_name} (${ct.customer_phone}): ${ct.msg_count} mensajes`);
  }

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
