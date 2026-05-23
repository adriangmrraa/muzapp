import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./index";
import { users, agentConfig, products } from "./schema";
import { LINEA_POLLO } from "@/lib/constants";

// ─── Tipos helpers ──────────────────────────────────────────────────────────────
type Category = "hamburguesa" | "acompanamiento" | "pan_mayorista" | "tragos_vip" | "bebidas";
type Line = "pollo" | "carne" | "clasica" | "pan" | "tragos" | "bebidas";

const TRAGOS_VIP = [
  { name: "Frutilla", price: 6500, sort: 0 },
  { name: "Durazno", price: 6500, sort: 1 },
  { name: "Ananá", price: 6500, sort: 2 },
  { name: "Frutos Rojos", price: 6500, sort: 3 },
  { name: "Mixtos (Durazno y Frutilla)", price: 6500, sort: 4 },
];

async function main() {
  console.log("Seeding database...");

  // ── Admin user ──────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("changeme123", 12);

  await db
    .insert(users)
    .values({
      email: "admin@mrsmuzzarella.com",
      hashedPassword,
      name: "Admin",
      role: "admin",
    })
    .onConflictDoNothing({ target: users.email });

  console.log("✓ Admin user created");

  // ── Agent config ─────────────────────────────────────────────────────────────
  await db
    .insert(agentConfig)
    .values({
      systemPrompt:
        "Sos el asistente virtual de Mrs. Muzzarella. Ayudás a los clientes con información sobre nuestros productos y pedidos.",
      phoneNumber: "+54911XXXXXXXX",
      ycloudApiKey: "placeholder-api-key",
      enabled: false,
      businessHours: {
        monday: { open: "10:00", close: "22:00" },
        tuesday: { open: "10:00", close: "22:00" },
        wednesday: { open: "10:00", close: "22:00" },
        thursday: { open: "10:00", close: "22:00" },
        friday: { open: "10:00", close: "23:00" },
        saturday: { open: "11:00", close: "23:00" },
        sunday: { open: "11:00", close: "22:00" },
      },
    });

  console.log("✓ Agent config created");

  // ── Products (LINEA_POLLO) ───────────────────────────────────────────────────
  const polloRows = LINEA_POLLO.map((p, index) => ({
    name: p.name,
    description: p.ingredients,
    price: p.price !== null ? String(p.price) : null,
    category: (p.id === "papas-fritas" ? "acompanamiento" : "hamburguesa") as Category,
    line: "pollo" as Line,
    available: true,
    comingSoon: p.comingSoon ?? false,
    sortOrder: index,
  }));

  await db.insert(products).values(polloRows).onConflictDoNothing();
  console.log(`✓ ${polloRows.length} products seeded (LINEA_POLLO)`);

  // ── Coca-Cola (Bebidas) ────────────────────────────────────────────────────
  await db
    .insert(products)
    .values({
      name: "Coca-Cola",
      description: "Gaseosa Coca-Cola 500ml",
      price: "1500",
      category: "bebidas" as Category,
      line: "bebidas" as Line,
      available: true,
      sortOrder: 0,
    })
    .onConflictDoNothing();
  console.log("✓ Coca-Cola seeded");

  // ── Tragos V.I.P ───────────────────────────────────────────────────────────
  for (const t of TRAGOS_VIP) {
    await db
      .insert(products)
      .values({
        name: `Tragos V.I.P ${t.name}`,
        description: `Trago V.I.P de 1 Litro - ${t.name}. Con muchas gomitas y salsas de caramelo.`,
        price: String(t.price),
        category: "tragos_vip" as Category,
        line: "tragos" as Line,
        available: true,
        sortOrder: t.sort,
        variants: [
          { name: "Sin Crema", priceDelta: 0, default: true },
          { name: "Con Crema", priceDelta: 500 },
        ],
      })
      .onConflictDoNothing();
  }
  console.log(`✓ ${TRAGOS_VIP.length} Tragos V.I.P seeded`);

  console.log("Seeding complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
