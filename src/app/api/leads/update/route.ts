import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, phone, email, address, notes, type, tags } = body;

    // Buscar el lead por ID o por teléfono
    let leadId = id;
    if (!leadId && phone) {
      const [found] = await db
        .select({ id: leads.id })
        .from(leads)
        .where(eq(leads.phone, phone))
        .limit(1);
      if (found) leadId = found.id;
    }

    if (!leadId) {
      return NextResponse.json({ error: "ID o teléfono requerido" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (address !== undefined) updates.address = address;
    if (notes !== undefined) updates.notes = notes;
    if (type !== undefined) updates.type = type;
    if (tags !== undefined) updates.tags = tags;

    await db.update(leads).set(updates).where(eq(leads.id, leadId));

    // Revalidar TODAS las páginas que muestran datos del cliente
    revalidatePath("/admin/clients");
    revalidatePath("/admin/clients/[id]", "page");
    revalidatePath("/admin/leads");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/conversations");
    revalidatePath("/admin");

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[api/leads/update]", e);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}
