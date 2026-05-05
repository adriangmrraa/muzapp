import { NextRequest, NextResponse } from "next/server";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { extractRefCode } from "@/lib/attribution";
import { decodeRefCode } from "@/lib/attribution/ref-code";
import { z } from "zod";

// ─── POST /api/leads ──────────────────────────────────────────────────────────

const CreateLeadSchema = z.object({
  phone: z.string().min(1, "phone is required"),
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  firstMessage: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  platform: z.string().optional(),
  adId: z.string().optional(),
  campaignId: z.string().optional(),
  adsetId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateLeadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const refCode = data.firstMessage ? extractRefCode(data.firstMessage) : null;

    // Attribution resolution — fail-open: errors must never block lead creation
    let resolvedCampaignId: string | null = data.campaignId ?? null;
    let resolvedAdsetId: string | null = data.adsetId ?? null;
    let resolvedAdId: string | null = data.adId ?? null;
    let resolvedPlatform: string | null = data.platform ?? null;
    let resolvedUtmSource: string | null = data.utmSource ?? null;

    if (refCode) {
      try {
        const decoded = decodeRefCode(refCode);
        if (decoded) {
          resolvedCampaignId = decoded.campaignId;
          resolvedAdsetId = decoded.adsetId;
          resolvedAdId = decoded.adId;
          resolvedPlatform = "meta";
          if (!resolvedUtmSource) resolvedUtmSource = "meta";
        } else {
          console.warn("[POST /api/leads] refCode present but decodeRefCode returned null", { refCode });
          resolvedPlatform = resolvedPlatform ?? "unknown";
        }
      } catch (attributionErr) {
        console.warn("[POST /api/leads] decodeRefCode threw — skipping attribution", attributionErr);
        resolvedPlatform = resolvedPlatform ?? "unknown";
      }
    } else {
      resolvedPlatform = resolvedPlatform ?? "organic";
    }

    const [lead] = await db
      .insert(leads)
      .values({
        phone: data.phone,
        name: data.name ?? null,
        email: data.email || null,
        firstMessage: data.firstMessage ?? null,
        refCode: refCode ?? null,
        utmSource: resolvedUtmSource,
        utmMedium: data.utmMedium ?? null,
        utmCampaign: data.utmCampaign ?? null,
        utmContent: data.utmContent ?? null,
        platform: resolvedPlatform,
        campaignId: resolvedCampaignId,
        adsetId: resolvedAdsetId,
        adId: resolvedAdId,
      })
      .returning();

    return NextResponse.json(lead, { status: 201 });
  } catch (err) {
    console.error("[POST /api/leads]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── GET /api/leads ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const campaign = searchParams.get("campaign");
    const status = searchParams.get("status") as
      | "new"
      | "contacted"
      | "converted"
      | "lost"
      | null;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const conditions = [];

    if (campaign) {
      conditions.push(eq(leads.utmCampaign, campaign));
    }
    if (status) {
      conditions.push(eq(leads.status, status));
    }
    if (from) {
      conditions.push(gte(leads.createdAt, new Date(from)));
    }
    if (to) {
      conditions.push(lte(leads.createdAt, new Date(to)));
    }

    const rows = await db
      .select()
      .from(leads)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(leads.createdAt))
      .limit(100);

    return NextResponse.json(rows);
  } catch (err) {
    console.error("[GET /api/leads]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
