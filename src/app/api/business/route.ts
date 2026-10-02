import { NextResponse } from "next/server";
import { getBusinessInfo } from "@/lib/business";

export const dynamic = "force-dynamic";

/**
 * Public business identity for the storefront. Exposes only non-secret
 * fields — never API keys, tokens, or internal config.
 */
export async function GET() {
  const info = await getBusinessInfo();
  return NextResponse.json(info, {
    headers: { "Cache-Control": "public, max-age=60" },
  });
}
