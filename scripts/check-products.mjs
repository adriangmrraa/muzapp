import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  // Ver productos actuales
  const prods = await sql`SELECT id, name, price, category, line, available, coming_soon, sort_order 
    FROM products ORDER BY sort_order`;

  console.log('=== PRODUCTOS ACTUALES ===');
  for (const p of prods) {
    console.log(`  #${p.id} ${p.name} | $${p.price} | ${p.category} | ${p.line} | disp:${p.available} | coming:${p.coming_soon} | orden:${p.sort_order}`);
  }
  process.exit(0);
}
main().catch(e => console.error(e));
