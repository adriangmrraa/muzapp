import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
async function main() {
  // Ver pedidos 49, 50, 51
  for (const id of [49, 50, 51]) {
    const [o] = await sql`SELECT id, customer_name, items FROM orders WHERE id = ${id}`;
    if (o) console.log(`#${id}: ${o.customer_name} - ${JSON.stringify(o.items)}`);
    await sql`DELETE FROM orders WHERE id = ${id}`;
    console.log(`Pedido #${id} eliminado`);
  }
  process.exit(0);
}
main().catch(e => console.error(e));
