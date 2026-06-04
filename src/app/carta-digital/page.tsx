import { db } from "@/db";
import { products, promotions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { MenuDigitalClient } from "./menu-digital-client";

export const metadata = {
  title: "Carta Digital — Mrs Muzzarella",
  description: "Explorá nuestro menú, armá tu pedido y pedilo por WhatsApp",
};

// Forzar que siempre cargue datos frescos de la DB, sin caché
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CartaDigitalPage() {
  const items = await db
    .select()
    .from(products)
    .where(eq(products.available, true))
    .orderBy(products.sortOrder);

  const activePromos = await db
    .select()
    .from(promotions)
    .where(eq(promotions.active, true));

  const whatsappPhone = process.env.WHATSAPP_PHONE_NUMBER
    ? process.env.WHATSAPP_PHONE_NUMBER.replace(/[+\s]/g, "")
    : "5493705241065";

  return (
    <MenuDigitalClient
      products={items}
      promos={activePromos}
      whatsappPhone={whatsappPhone}
    />
  );
}
