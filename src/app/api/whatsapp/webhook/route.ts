import { NextRequest, NextResponse } from "next/server";
import { verifyYCloudSignature } from "@/lib/whatsapp/signature";
import { sendWhatsAppMessage } from "@/lib/whatsapp/ycloud-client";
import {
  findOrCreateConversation,
  insertMessage,
  isMessageDuplicate,
  getConversationMessages,
} from "@/lib/channels/router";
import { captureLeadIfNew } from "@/lib/whatsapp/lead-capture";
import { runWhatsAppAgent } from "@/lib/whatsapp/agent";
import { db } from "@/db";
import { agentConfig } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET — Webhook verification (YCloud sends a challenge token)
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }
  return new NextResponse(token, { status: 200 });
}

/**
 * POST — Incoming WhatsApp messages from YCloud
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  // 1. Verify webhook signature (header: ycloud-signature)
  const signature = request.headers.get("ycloud-signature") || "";
  const secret = process.env.YCLOUD_WEBHOOK_SECRET;

  if (!secret || !verifyYCloudSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Parse the payload
  const payload = JSON.parse(rawBody);

  // 2. Filter non-message events (status updates, etc.)
  if (payload.type !== "whatsapp.inbound_message.received") {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const message = payload.whatsappInboundMessage;
  if (!message || message.type !== "text") {
    // Only handle text messages for now
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const messageId = message.id;
  const customerPhone = message.from;
  const customerName = message.customerProfile?.name || null;
  const text = message.text?.body || "";

  try {
    // 3. Load agent config
    const [config] = await db
      .select()
      .from(agentConfig)
      .where(eq(agentConfig.enabled, true))
      .limit(1);

    if (!config) {
      console.error("[webhook] No active agent config found");
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // 3b. Check if customer phone is in allowed IDs list
    const allowedIds = (config.allowedPhoneIds ?? []) as { name: string; phone: string }[];
    if (allowedIds.length > 0 && !allowedIds.some((entry) => entry.phone === customerPhone)) {
      console.log(`[webhook] Ignoring message from non-allowed phone: ${customerPhone}`);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // 3c. Auto-reply when outside 24h window
    const autoReplyEnabled = config.autoReply24h === true;
    const autoReplyMessage = config.autoReply24hMessage?.trim();

    // 4. Find or create conversation
    const { id: conversationId, isNew } = await findOrCreateConversation(
      "whatsapp",
      customerPhone, // externalUserId for WhatsApp is the phone
      customerName ?? undefined,
      customerPhone
    );

    // 5. Deduplication check
    if (await isMessageDuplicate(messageId)) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // 6. Capture lead if first contact
    await captureLeadIfNew(customerPhone, customerName, text);

    // 7. Check 24h window — send auto-reply if enabled and no recent bot activity
    if (autoReplyEnabled && autoReplyMessage && isNew) {
      // New conversation — send auto-reply
      await sendWhatsAppMessage({
        to: customerPhone,
        body: autoReplyMessage,
        apiKey: config.ycloudApiKey || "",
        from: config.phoneNumber || "",
      });
    }

    // 8. Persist inbound message
    await insertMessage(conversationId, "user", text, undefined, messageId);

    // 8b. Build message history for AI (last 20 messages)
    const existingMessages = await getConversationMessages(conversationId, 20);
    const aiMessages = existingMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // 9. Run AI agent
    const responseText = await runWhatsAppAgent({
      conversationId,
      customerPhone,
      messages: aiMessages,
      systemPrompt: config.systemPrompt || "",
    });

    // 10. Persist assistant response
    await insertMessage(conversationId, "assistant", responseText);

    // 11. Send response via YCloud
    await sendWhatsAppMessage({
      to: customerPhone,
      body: responseText,
      apiKey: config.ycloudApiKey || "",
      from: config.phoneNumber || "",
    });

  } catch (error) {
    console.error("[webhook] Error processing message:", error);
    // Always return 200 after signature verification passes
    // to prevent YCloud from retrying
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
