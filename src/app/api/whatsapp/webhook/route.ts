import { NextRequest, NextResponse } from "next/server";
import { verifyYCloudSignature } from "@/lib/whatsapp/signature";
import { sendWhatsAppMessage } from "@/lib/whatsapp/ycloud-client";
import { findOrCreateConversation, appendMessage, isMessageProcessed, convertToAIMessages } from "@/lib/whatsapp/conversation";
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
  const whatsappId = customerPhone; // Use phone as conversation identifier

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
    let skipAiAgent = false;
    let autoReplySent = false;

    // 4. Find or create conversation
    const conversation = await findOrCreateConversation(whatsappId, customerPhone, customerName);

    // 5. Deduplication check
    const existingMessages = (conversation.messages || []) as Record<string, unknown>[];
    if (isMessageProcessed(existingMessages, messageId)) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // 6. Capture lead if first contact
    await captureLeadIfNew(customerPhone, customerName, text);

    // 7. Check 24h window — send auto-reply if enabled and no recent bot activity
    const lastAssistantMsg = [...existingMessages]
      .reverse()
      .find((m: Record<string, unknown>) => m.role === "assistant");

    if (autoReplyEnabled && autoReplyMessage && !lastAssistantMsg) {
      // New conversation (no previous assistant response) — send auto-reply
      await sendWhatsAppMessage({
        to: customerPhone,
        body: autoReplyMessage,
        apiKey: config.ycloudApiKey || "",
        from: config.phoneNumber || "",
      });
      autoReplySent = true;
    }

    // 8. Append inbound message
    await appendMessage(conversation.id, {
      id: messageId,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    });

    // 8. Build message history for AI
    const updatedMessages = [...existingMessages, { role: "user", content: text }];
    const aiMessages = convertToAIMessages(updatedMessages);

    // 9. Run AI agent
    const responseText = await runWhatsAppAgent({
      conversationId: conversation.id,
      customerPhone,
      messages: aiMessages,
      systemPrompt: config.systemPrompt || "",
    });

    // 10. Append assistant response
    await appendMessage(conversation.id, {
      role: "assistant",
      content: responseText,
      timestamp: new Date().toISOString(),
    });

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
