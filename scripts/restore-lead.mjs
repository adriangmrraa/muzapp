import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  // Crear lead de nuevo
  const [lead] = await sql`INSERT INTO leads (name, phone, status, type, created_at, updated_at)
    VALUES ('Hector Adrian', '5493704868421', 'new', 'b2c', NOW(), NOW())
    RETURNING id`;
  console.log('Lead creado ID:', lead.id);

  // Actualizar conversacion #15 con el nombre y telefono
  await sql`UPDATE conversations SET
    customer_name = 'Hector Adrian',
    customer_phone = '5493704868421',
    status = 'active',
    updated_at = NOW()
    WHERE id = 15`;
  console.log('Conversacion #15 actualizada con nombre y telefono');

  // Vincular lead a conversacion
  await sql`UPDATE leads SET conversation_id = 15 WHERE id = ${lead.id}`;
  console.log('Lead vinculado a conversacion #15');

  // Verificar
  const [conv] = await sql`SELECT id, customer_name, customer_phone, status FROM conversations WHERE id = 15`;
  console.log('\nEstado CONV #15:', conv);

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
