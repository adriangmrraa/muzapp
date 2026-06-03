import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
async function main() {
  const leads = await sql`SELECT id, name, phone, status FROM leads 
    WHERE name ILIKE '%anto%' OR name ILIKE '%pardo%' OR name ILIKE '%yuli%' OR name ILIKE '%glover%'
    ORDER BY name`;
  console.log('LEADS ENCONTRADOS:');
  for (const l of leads) {
    console.log(`  #${l.id} ${l.name} - ${l.phone} (${l.status})`);
  }
  if (leads.length === 0) {
    console.log('No se encontraron leads con esos nombres');
    const allLeads = await sql`SELECT id, name, phone FROM leads ORDER BY name LIMIT 20`;
    console.log('\nPrimeros 20 leads:');
    for (const l of allLeads) console.log(`  #${l.id} ${l.name} - ${l.phone}`);
  }
  process.exit(0);
}
main().catch(e => console.error(e));
