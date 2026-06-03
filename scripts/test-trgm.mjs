import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
async function main() {
  // Ver si pg_trgm está disponible
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;
    console.log('pg_trgm extension disponible');
    
    // Probar busqueda semantica de ejemplo
    const res = await sql`
      SELECT id, name, phone, 
        similarity(name, 'aanto pardo') as sim
      FROM leads 
      WHERE similarity(name, 'aanto pardo') > 0.2
      ORDER BY sim DESC LIMIT 5
    `;
    console.log('Resultados busqueda semantica "aanto pardo":');
    for (const r of res) console.log(`  #${r.id} ${r.name} (${r.phone}) sim:${r.sim}`);
    
  } catch(e) {
    console.error('Error:', e.message);
  }
  process.exit(0);
}
main().catch(e => console.error(e));
