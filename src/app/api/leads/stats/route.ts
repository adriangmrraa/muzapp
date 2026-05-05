import { NextResponse } from "next/server";
import { sql, count } from "drizzle-orm";
import { db } from "@/db";
import { leads } from "@/db/schema";

// ─── GET /api/leads/stats ─────────────────────────────────────────────────────

export async function GET() {
  try {
    // Total count
    const [totalRow] = await db.select({ total: count() }).from(leads);

    // By campaign (utmCampaign)
    const byCampaignRows = await db
      .select({
        campaign: leads.utmCampaign,
        count: count(),
      })
      .from(leads)
      .groupBy(leads.utmCampaign);

    // By source (utmSource)
    const bySourceRows = await db
      .select({
        source: leads.utmSource,
        count: count(),
      })
      .from(leads)
      .groupBy(leads.utmSource);

    // By status
    const byStatusRows = await db
      .select({
        status: leads.status,
        count: count(),
      })
      .from(leads)
      .groupBy(leads.status);

    // Over time — daily counts (last 30 days)
    const overTimeRows = await db
      .select({
        date: sql<string>`DATE(${leads.createdAt})`,
        count: count(),
      })
      .from(leads)
      .where(sql`${leads.createdAt} >= NOW() - INTERVAL '30 days'`)
      .groupBy(sql`DATE(${leads.createdAt})`)
      .orderBy(sql`DATE(${leads.createdAt})`);

    return NextResponse.json({
      total: totalRow.total,
      byCampaign: byCampaignRows,
      bySource: bySourceRows,
      byStatus: byStatusRows,
      overTime: overTimeRows,
    });
  } catch (err) {
    console.error("[GET /api/leads/stats]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
