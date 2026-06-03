import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
async function main() {
  // Ver pedido #48
  const [order] = await sql`SELECT id, customer_name, phone_number, items FROM orders WHERE id = 48`;
  console.log('Pedido #48:', order);
  
  // Eliminarlo
  await sql`DELETE FROM orders WHERE id = 48`;
  console.log('Pedido #48 eliminado');
  process.exit(0);
}
main().catch(e => console.error(e));
