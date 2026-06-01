"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { promotions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/auth";

export type PromoRow = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  items: { productId: number; productName: string; quantity: number }[];
  customPrice: string | null;
  active: boolean;
  createdAt: Date;
};

export async function getPromos(): Promise<PromoRow[]> {
  const session = await auth();
  if (!session) return [];

  const rows = await db
    .select()
    .from(promotions)
    .orderBy(desc(promotions.createdAt));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    imageUrl: r.imageUrl,
    items: (r.items || []) as { productId: number; productName: string; quantity: number }[],
    customPrice: r.customPrice,
    active: r.active,
    createdAt: r.createdAt,
  }));
}

export async function createPromo(data: {
  name: string;
  description?: string;
  imageUrl?: string;
  items?: { productId: number; productName: string; quantity: number }[];
  customPrice?: number;
}): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session) return { success: false, error: "No autorizado" };

  try {
    await db.insert(promotions).values({
      name: data.name,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      items: data.items || [],
      customPrice: data.customPrice ? String(data.customPrice) : null,
      active: true,
    });
    revalidatePath("/admin/promos");
    return { success: true };
  } catch {
    return { success: false, error: "Error al crear promo" };
  }
}

export async function updatePromo(
  id: number,
  data: {
    name?: string;
    description?: string;
    imageUrl?: string;
    items?: { productId: number; productName: string; quantity: number }[];
    customPrice?: number;
    active?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session) return { success: false, error: "No autorizado" };

  try {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.imageUrl !== undefined) updates.imageUrl = data.imageUrl;
    if (data.items !== undefined) updates.items = data.items;
    if (data.customPrice !== undefined) updates.customPrice = String(data.customPrice);
    if (data.active !== undefined) updates.active = data.active;

    await db.update(promotions).set(updates).where(eq(promotions.id, id));
    revalidatePath("/admin/promos");
    return { success: true };
  } catch {
    return { success: false, error: "Error al actualizar" };
  }
}

export async function deletePromo(
  id: number
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session) return { success: false, error: "No autorizado" };

  try {
    await db.delete(promotions).where(eq(promotions.id, id));
    revalidatePath("/admin/promos");
    return { success: true };
  } catch {
    return { success: false, error: "Error al eliminar" };
  }
}
