"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { products } from "@/db/schema";
import { productSchema } from "@/lib/validations/product";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";

export async function createProduct(formData: FormData) {
  const session = await auth();
  if (!session) {
    return { error: "No autorizado" };
  }

  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    price: formData.get("price") ? Number(formData.get("price")) : undefined,
    category: formData.get("category"),
    line: formData.get("line"),
    imageUrl: formData.get("imageUrl") || undefined,
    available: formData.get("available") === "true",
    comingSoon: formData.get("comingSoon") === "true",
    sortOrder: formData.get("sortOrder") ? Number(formData.get("sortOrder")) : 0,
  };

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { price, imageUrl, ...rest } = parsed.data;

  await db.insert(products).values({
    ...rest,
    price: price?.toString(),
    imageUrl: imageUrl || null,
  });

  revalidatePath("/admin/products");
  return { success: true };
}

export async function updateProduct(id: number, formData: FormData) {
  const session = await auth();
  if (!session) {
    return { error: "No autorizado" };
  }

  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    price: formData.get("price") ? Number(formData.get("price")) : undefined,
    category: formData.get("category"),
    line: formData.get("line"),
    imageUrl: formData.get("imageUrl") || undefined,
    available: formData.get("available") === "true",
    comingSoon: formData.get("comingSoon") === "true",
    sortOrder: formData.get("sortOrder") ? Number(formData.get("sortOrder")) : 0,
  };

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { price, imageUrl, ...rest } = parsed.data;

  await db
    .update(products)
    .set({
      ...rest,
      price: price?.toString(),
      imageUrl: imageUrl || null,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));

  revalidatePath("/admin/products");
  return { success: true };
}

export async function deleteProduct(id: number) {
  const session = await auth();
  if (!session) {
    return { error: "No autorizado" };
  }

  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/admin/products");
  return { success: true };
}

export async function toggleProductAvailability(id: number, available: boolean) {
  const session = await auth();
  if (!session) {
    return { error: "No autorizado" };
  }

  await db
    .update(products)
    .set({ available, updatedAt: new Date() })
    .where(eq(products.id, id));

  revalidatePath("/admin/products");
  return { success: true };
}
