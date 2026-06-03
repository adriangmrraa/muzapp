import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  // Primero ver si existe
  const [existing] = await sql`SELECT id FROM leads WHERE phone = '5493704868421'`;
  
  let leadId;
  if (existing) {
    // Actualizar
    await sql`UPDATE leads SET name = 'Hector Adrian', status = 'new', type = 'b2c', conversation_id = 15 WHERE id = ${existing.id}`;
    leadId = existing.id;
    console.log('Lead actualizado ID:', leadId);
  } else {
    const [lead] = await sql`INSERT INTO leads (name, phone, status, type, conversation_id)
      VALUES ('Hector Adrian', '5493704868421', 'new', 'b2c', 15)
      RETURNING id`;
    leadId = lead.id;
    console.log('Lead creado ID:', leadId);
  }

  // Actualizar conversacion
  await sql`UPDATE conversations SET
    customer_name = 'Hector Adrian',
    customer_phone = '5493704868421',
    status = 'active',
    updated_at = NOW()
    WHERE id = 15`;
  console.log('Conversacion #15 actualizada');

  // Verificar
  const [conv] = await sql`SELECT id, customer_name, customer_phone, status FROM conversations WHERE id = 15`;
  console.log('\nCONV #15:', conv);

  const [lead] = await sql`SELECT id, name, phone, status, conversation_id FROM leads WHERE phone = '5493704868421'`;
  console.log('LEAD:', lead);

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
