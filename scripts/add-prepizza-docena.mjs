import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  // Agregar alias "Prepizza x Docena" como producto visible
  // para que el bot lo encuentre cuando el cliente pide "docenas de prepizza"
  
  // Primero ver si ya existe
  const [existing] = await sql`SELECT id FROM products WHERE name = 'Prepizza x Docena'`;
  
  if (existing) {
    console.log('Prepizza x Docena ya existe como #' + existing.id);
  } else {
    // Buscar la prepizza x 12 u para copiar datos
    const [ref] = await sql`SELECT price, description, category, line FROM products WHERE name = 'Prepizza x 12 u' LIMIT 1`;
    
    if (ref) {
      const [created] = await sql`INSERT INTO products (name, price, description, category, line, available, coming_soon, sort_order)
        VALUES ('Prepizza x Docena', ${ref.price}, ${ref.description}, ${ref.category}, ${ref.line}, true, false, 15)
        RETURNING id`;
      console.log('Prepizza x Docena creado como #' + created.id + ' a $' + ref.price);
    } else {
      console.log('ERROR: No se encontró Prepizza x 12 u como referencia');
    }
  }

  // Mostrar todos los productos de pan
  const pans = await sql`SELECT id, name, price FROM products WHERE category = 'pan_mayorista' ORDER BY sort_order`;
  console.log('\nProductos de pan_mayorista:');
  for (const p of pans) {
    console.log(`  #${p.id} ${p.name} - $${p.price}`);
  }
  
  process.exit(0);
}
main().catch(e => console.error(e));
