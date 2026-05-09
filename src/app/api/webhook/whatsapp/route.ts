import { NextRequest, NextResponse } from "next/server";
import { addToBuffer } from "@/lib/agent/buffer";
import { runWhatsAppAgent } from "@/lib/whatsapp/agent";
import { loadConversation, saveConversation } from "@/lib/agent/conversation";
import { smartSplit } from "@/lib/agent/smart-split";
import { sendText } from "@/lib/ycloud";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/infra/rate-limit";
import { db } from "@/db";
import { conversations } from "@/db/schema";
import { eq } from "drizzle-orm";

// ─── HMAC-SHA256 verification ──────────────────────────────────────────────────

async function verifySignature(
  rawBody: string,
  signatureHeader: string | null
): Promise<boolean> {
  const secret = process.env.YCLOUD_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  // Format: t=<timestamp>,s=<hmac>
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => p.split("=") as [string, string])
  );

  const t = parts["t"];
  const s = parts["s"];

  if (!t || !s) return false;

  // Check timestamp tolerance: 300s
  const timestamp = parseInt(t, 10);
  if (isNaN(timestamp)) return false;
  const age = Math.abs(Date.now() / 1000 - timestamp);
  if (age > 300) return false;

  // Signed payload: `${t}.${rawBody}`
  const signedPayload = `${t}.${rawBody}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(signedPayload);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const computed = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computed === s;
}

// ─── Sleep helper ──────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Flush handler ─────────────────────────────────────────────────────────────

async function handleFlush(phone: string, combinedText: string): Promise<void> {
  try {
    const history = await loadConversation(phone);

    // Map old history format to new agent format
    const aiMessages = history.map((m) => ({
      role: (m.role === "user" || m.role === "assistant" ? m.role : "user") as "user" | "assistant",
      content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
    }));
    
    // Add current user message
    aiMessages.push({ role: "user" as const, content: combinedText });

    // Get or create conversation ID for the new agent
    let conversationId = 0;
    try {
      const rows = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(eq(conversations.whatsappId, phone))
        .limit(1);
      if (rows.length > 0) conversationId = rows[0].id;
    } catch {
      // Fallback: no conversation ID needed
    }

    // Use the NEW V2 agent (14 tools, emotional flows, dynamic prompt)
    const responseText = await runWhatsAppAgent({
      conversationId,
      customerPhone: phone,
      messages: aiMessages,
    });

    const bubbles = smartSplit(responseText);

    for (let i = 0; i < bubbles.length; i++) {
      const result = await sendText(phone, bubbles[i]);
      if (!result.ok) {
        console.error(`[webhook] Failed to send bubble ${i + 1}:`, result.error);
      }
      if (i < bubbles.length - 1) {
        await sleep(1500);
      }
    }

    // Save updated conversation (history + user msg + assistant response)
    const updatedHistory = [
      ...history,
      { role: "user" as const, content: combinedText },
      { role: "assistant" as const, content: responseText },
    ];
    await saveConversation(phone, updatedHistory);
  } catch (error) {
    console.error("[webhook] Error in flush handler:", error);
  }
}

// ─── Route handlers ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  // YCloud may send a GET to verify the webhook endpoint
  return NextResponse.json({ status: "ok" }, { status: 200 });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Rate limiting by IP (profesional)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const rateCheck = await checkRateLimit(`whatsapp:${ip}`);
  if (!rateCheck.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: getRateLimitHeaders(false, 0, rateCheck.limit) }
    );
  }

  // Read raw body for signature verification
  const rawBody = await req.text();

  const signatureHeader = req.headers.get("ycloud-signature");
  const valid = await verifySignature(rawBody, signatureHeader);

  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Return 200 immediately — process async
  const responsePromise = (async () => {
    try {
      const payload = JSON.parse(rawBody);

      // YCloud event type for inbound messages
      if (payload?.type !== "whatsapp.inbound_message.received") return;

      // Según doc oficial YCloud: payload.whatsappInboundMessage
      const ycloudMsg = payload?.whatsappInboundMessage;
      if (!ycloudMsg) return;

      // Solo texto por ahora
      if (ycloudMsg.type !== "text") return;

      const from: string | undefined = ycloudMsg.from;
      const text: string | undefined = ycloudMsg.text?.body;
      const customerName: string | undefined = ycloudMsg.customerProfile?.name;

      if (!from || !text) return;

      console.log(`[webhook] Mensaje de ${customerName ?? from}: ${text.slice(0, 80)}`);

      addToBuffer(from, text, handleFlush);
    } catch (error) {
      console.error("[webhook] Error processing payload:", error);
    }
  })();

  // Fire and forget — don't await
  void responsePromise;

  return NextResponse.json({ received: true }, { status: 200 });
}
