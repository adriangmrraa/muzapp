import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
async function main() {
  await sql`DELETE FROM products WHERE name = 'Prepizza x Docena'`;
  const r = await sql`SELECT COUNT(*)::int as c FROM products WHERE name ILIKE '%prepizza%'`;
  console.log('Prepizzas restantes:', r[0].c);
  const all = await sql`SELECT id, name, price FROM products WHERE name ILIKE '%prepizza%'`;
  for (const p of all) console.log(`  #${p.id} ${p.name} - $${p.price}`);
  process.exit(0);
}
main().catch(e => console.error(e));
