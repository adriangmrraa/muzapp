import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { promotions } from "@/db/schema";

// ─── GET /api/promotions ────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const activeOnly = searchParams.get("active") === "true";

    const rows = await db
      .select({
        id: promotions.id,
        name: promotions.name,
        description: promotions.description,
        imageUrl: promotions.imageUrl,
        customPrice: promotions.customPrice,
        items: promotions.items,
        active: promotions.active,
      })
      .from(promotions)
      .where(activeOnly ? eq(promotions.active, true) : undefined)
      .orderBy(desc(promotions.createdAt));

    return NextResponse.json(rows);
  } catch (err) {
    console.error("[GET /api/promotions]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
