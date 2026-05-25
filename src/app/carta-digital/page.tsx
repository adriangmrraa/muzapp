import { db } from "@/db";
import { products, agentConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import { MenuDigitalClient } from "./menu-digital-client";

export const metadata = {
  title: "Carta Digital — Mrs Muzzarella",
  description: "Explorá nuestro menú, armá tu pedido y pedilo por WhatsApp",
};

export default async function CartaDigitalPage() {
  const items = await db
    .select()
    .from(products)
    .where(eq(products.available, true))
    .orderBy(products.sortOrder);

  // Obtener número de WhatsApp desde la config o env
  let whatsappPhone = process.env.WHATSAPP_PHONE_NUMBER || "5493705241065";
  try {
    const [cfg] = await db
      .select({ phone: agentConfig.phoneNumber })
      .from(agentConfig)
      .where(eq(agentConfig.id, 1))
      .limit(1);
    if (cfg?.phone) whatsappPhone = cfg.phone.replace(/[+\s]/g, "");
  } catch {}

  return <MenuDigitalClient products={items} whatsappPhone={whatsappPhone} />;
}
