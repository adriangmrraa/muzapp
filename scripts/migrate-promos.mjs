import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
async function main() {
  // Agregar columnas is_promo y promo_price a products
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_promo boolean NOT NULL DEFAULT false`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS promo_price numeric(10,2)`;
  
  // Agregar image_url a promotions
  await sql`ALTER TABLE promotions ADD COLUMN IF NOT EXISTS image_url text`;
  
  // Crear tabla promotions si no existe (por si no se migró)
  await sql`CREATE TABLE IF NOT EXISTS promotions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    items JSONB DEFAULT '[]',
    custom_price NUMERIC(10,2),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  )`;
  
  console.log('Migración aplicada: is_promo, promo_price, image_url');
  
  // Agregar productos de bebidas
  const bebidas = [
    { name: 'Coca-Cola 500ml', price: 1500, line: 'bebidas', sort: 1 },
    { name: 'Coca-Cola 2L', price: 3000, line: 'bebidas', sort: 2 },
    { name: 'Sprite 500ml', price: 1500, line: 'bebidas', sort: 3 },
    { name: 'Agua 500ml', price: 1000, line: 'bebidas', sort: 4 },
  ];
  
  for (const b of bebidas) {
    // Verificar si ya existe
    const [existing] = await sql`SELECT id FROM products WHERE name = ${b.name} AND category = 'bebidas'`;
    if (!existing) {
      await sql`INSERT INTO products (name, price, category, line, available, sort_order) 
        VALUES (${b.name}, ${b.price}, 'bebidas', ${b.line}, true, ${b.sort})`;
      console.log(`Producto creado: ${b.name} - $${b.price}`);
    } else {
      console.log(`Ya existe: ${b.name}`);
    }
  }
  
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
