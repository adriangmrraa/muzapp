import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  // Crear lead sin updated_at
  const [lead] = await sql`INSERT INTO leads (name, phone, status, type, conversation_id)
    VALUES ('Hector Adrian', '5493704868421', 'new', 'b2c', 15)
    RETURNING id`;
  console.log('Lead creado ID:', lead.id);

  // Actualizar conversacion
  await sql`UPDATE conversations SET
    customer_name = 'Hector Adrian',
    customer_phone = '5493704868421',
    status = 'active',
    updated_at = NOW()
    WHERE id = 15`;
  console.log('Conversacion #15 actualizada');

  // Verificar
  const [conv] = await sql`SELECT id, customer_name, customer_phone, status, updated_at FROM conversations WHERE id = 15`;
  console.log('\nEstado CONV #15:', conv);

  const [leadCheck] = await sql`SELECT id, name, phone, status, conversation_id FROM leads WHERE phone = '5493704868421'`;
  console.log('Lead:', leadCheck);

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
