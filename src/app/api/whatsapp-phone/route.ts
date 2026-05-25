import { NextResponse } from "next/server";
import { db } from "@/db";
import { agentConfig } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  let phone = process.env.WHATSAPP_PHONE_NUMBER?.replace(/[+\s]/g, "") || "";
  try {
    const [cfg] = await db
      .select({ phone: agentConfig.phoneNumber })
      .from(agentConfig)
      .where(eq(agentConfig.id, 1))
      .limit(1);
    if (cfg?.phone) phone = cfg.phone.replace(/[+\s]/g, "");
  } catch {}

  return NextResponse.json({ phone });
}
