import { db } from "@/db";
import { addresses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export type CustomerAddress = {
  id: number;
  address: string;
  mapsLink: string | null;
  label: string | null;
  lastUsedAt: Date;
};

export async function getCustomerAddresses(phone: string): Promise<CustomerAddress[]> {
  const rows = await db
    .select()
    .from(addresses)
    .where(eq(addresses.phone, phone))
    .orderBy(desc(addresses.lastUsedAt))
    .limit(10);

  return rows.map((r) => ({
    id: r.id,
    address: r.address,
    mapsLink: r.mapsLink,
    label: r.label,
    lastUsedAt: r.lastUsedAt,
  }));
}

export function formatAddressesForPrompt(addresses: CustomerAddress[]): string {
  if (addresses.length === 0) return "";

  const lines = addresses.map((a, i) => {
    const label = a.label ? ` (${a.label})` : "";
    const maps = a.mapsLink ? ` — ${a.mapsLink}` : "";
    return `  ${i + 1}. ${a.address}${label}${maps}`;
  });

  return `\n📍 DIRECCIONES GUARDADAS DEL CLIENTE:\n${lines.join("\n")}\n⚠️ Si pide delivery, preguntale: "¿a cuál dirección te lo mandamos?" y mostrale las opciones.`;
}
