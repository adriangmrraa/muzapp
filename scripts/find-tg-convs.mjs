import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
async function main() {
  // Buscar conversacion de Telegram de Hector
  const convs = await sql`SELECT id, channel, external_user_id, customer_name FROM conversations 
    WHERE channel = 'telegram' AND external_user_id IS NOT NULL ORDER BY id`;
  console.log('Conversaciones de Telegram:');
  for (const c of convs) {
    console.log(`  #${c.id} ${c.customer_name || '(sin nom)'} - ${c.external_user_id}`);
  }
  process.exit(0);
}
main().catch(e => console.error(e));
