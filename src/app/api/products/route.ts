import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";

// ─── GET /api/products ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category") as
      | "hamburguesa"
      | "acompanamiento"
      | "pan_mayorista"
      | null;
    const available = searchParams.get("available");

    const conditions = [];

    // Filter by available (default: true)
    if (available !== "false") {
      conditions.push(eq(products.available, true));
    }

    // Filter by category
    if (category && ["hamburguesa", "acompanamiento", "pan_mayorista"].includes(category)) {
      conditions.push(eq(products.category, category as "hamburguesa" | "acompanamiento" | "pan_mayorista"));
    }

    const items = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        category: products.category,
        line: products.line,
        imageUrl: products.imageUrl,
        available: products.available,
        comingSoon: products.comingSoon,
        sortOrder: products.sortOrder,
      })
      .from(products)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(products.sortOrder);

    // Format price as string with $ prefix
    const formatted = items.map((item) => ({
      ...item,
      price: item.price ? `$${Number(item.price).toLocaleString("es-AR")}` : null,
    }));

    return NextResponse.json(formatted, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    console.error("[GET /api/products]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}