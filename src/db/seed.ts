import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./index";
import { users, agentConfig, products } from "./schema";
import { LINEA_POLLO } from "@/lib/constants";

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
  const productRows = LINEA_POLLO.map((p, index) => ({
    name: p.name,
    description: p.ingredients,
    price: p.price !== null ? String(p.price) : null,
    category: (p.id === "papas-fritas" ? "acompanamiento" : "hamburguesa") as
      | "hamburguesa"
      | "acompanamiento"
      | "pan_mayorista",
    line: "pollo" as "pollo" | "carne" | "clasica" | "pan",
    available: true,
    comingSoon: p.comingSoon ?? false,
    sortOrder: index,
  }));

  await db.insert(products).values(productRows).onConflictDoNothing();

  console.log(`✓ ${productRows.length} products seeded (LINEA_POLLO)`);

  console.log("Seeding complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
