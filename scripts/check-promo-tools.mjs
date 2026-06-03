import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

// Check getActivePromos result
const promos = await sql`SELECT id, name, description, custom_price, active, image_url FROM promotions WHERE active = true`;
console.log("Active promos:");
for (const p of promos) {
  console.log(`- ${p.name}: $${p.custom_price} | "${p.description}" | active: ${p.active}`);
}

// Check if there's a sendPromoImage function
const funcs = await sql`
  SELECT routine_name FROM information_schema.routines 
  WHERE routine_schema = 'public' AND routine_name LIKE '%promo%'
`;
console.log("\nPromo functions:", funcs.map(f => f.routine_name));
