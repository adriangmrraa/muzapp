import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
async function main() {
  const items = await sql`SELECT * FROM order_context_items WHERE conversation_id = 15`;
  console.log('Order context items:', items.length);
  for (const i of items) {
    console.log(`  ${i.product_name} x ${i.quantity} status:${i.status} expires:${i.expires_at}`);
  }
  process.exit(0);
}
main().catch(e => console.error(e));
