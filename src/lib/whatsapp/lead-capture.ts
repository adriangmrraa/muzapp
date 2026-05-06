import { db } from "@/db";
import { leads } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Extract ref code from message text (format: ref:CODE123)
 */
export function extractRefCode(text: string): string | null {
  const match = text.match(/ref:([A-Za-z0-9_-]+)/i);
  return match ? match[1] : null;
}

/**
 * Auto-capture lead on first contact — no duplicates by phone
 */
export async function captureLeadIfNew(
  phone: string,
  name: string | null,
  firstMessage: string
): Promise<{ isNew: boolean; leadId?: number }> {
  // Check if lead already exists
  const existing = await db
    .select({ id: leads.id })
    .from(leads)
    .where(eq(leads.phone, phone))
    .limit(1);

  if (existing.length > 0) {
    return { isNew: false };
  }

  const refCode = extractRefCode(firstMessage);

  const [created] = await db
    .insert(leads)
    .values({
      phone,
      name,
      firstMessage,
      refCode,
      status: "new",
      platform: "whatsapp",
      tags: ["nuevo", "whatsapp"],
    })
    .returning({ id: leads.id });

  return { isNew: true, leadId: created.id };
}
