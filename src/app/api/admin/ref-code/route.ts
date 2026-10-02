import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { signRefCode } from "@/lib/attribution/ref-code-sign";

const BodySchema = z.object({
  campaignId: z.string().min(1).max(120).regex(/^[A-Za-z0-9-]+$/, "Solo letras, números y guiones"),
  adsetId: z.string().max(120).regex(/^[A-Za-z0-9-]*$/).default("general"),
  adId: z.string().max(120).regex(/^[A-Za-z0-9-]*$/).default("general"),
});

/**
 * Mints an HMAC-signed attribution ref code. Signing happens server-side
 * because the secret must never reach the client bundle.
 */
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const code = signRefCode({
    campaignId: parsed.data.campaignId,
    adsetId: parsed.data.adsetId || "general",
    adId: parsed.data.adId || "general",
    timestamp: Date.now(),
  });

  return NextResponse.json({ code });
}
