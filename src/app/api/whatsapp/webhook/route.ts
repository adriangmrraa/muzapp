import { NextRequest, NextResponse } from "next/server";
import { verifyYCloudSignature } from "@/lib/whatsapp/signature";
import { sendWhatsAppMessage } from "@/lib/whatsapp/ycloud-client";
import { sendWhatsAppBubbles } from "@/lib/buffer/response-sender";
import {
  findOrCreateConversation,
  insertMessage,
  isMessageDuplicate,
  getConversationMessages,
  type MediaAttachment,
} from "@/lib/channels/router";
import { captureLeadIfNew } from "@/lib/whatsapp/lead-capture";
import { runWhatsAppAgent } from "@/lib/whatsapp/agent";
import { db } from "@/db";
import { agentConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import { downloadYCloudMedia, saveMediaLocally } from "@/lib/media/downloader";
import { transcribeAudio } from "@/lib/media/transcription";
import { BufferManager } from "@/lib/buffer/manager";
import { scheduleBufferProcessing } from "@/lib/buffer/processor";

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

  // Accept: text, image, audio, document, video — drop everything else
  const SUPPORTED_TYPES = ["text", "image", "audio", "document", "video"] as const;
  type SupportedType = (typeof SUPPORTED_TYPES)[number];

  if (!message || !SUPPORTED_TYPES.includes(message.type as SupportedType)) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const msgType = message.type as SupportedType;
  const messageId = message.id as string;
  const customerPhone = message.from as string;
  const customerName = (message.customerProfile?.name as string) || null;

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
      customerPhone,
      customerName ?? undefined,
      customerPhone
    );

    // 5. Deduplication check
    if (await isMessageDuplicate(messageId)) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // 6. Capture lead if first contact
    const textForLead = msgType === "text" ? (message.text?.body as string) || "" : "";
    await captureLeadIfNew(customerPhone, customerName, textForLead);

    // 7. Auto-reply for new conversations
    if (autoReplyEnabled && autoReplyMessage && isNew) {
      await sendWhatsAppMessage({
        to: customerPhone,
        body: autoReplyMessage,
        apiKey: config.ycloudApiKey || "",
        from: config.phoneNumber || "",
      });
    }

    // -------------------------------------------------------------------------
    // 8. Persist inbound message + resolve text for agent
    // -------------------------------------------------------------------------
    let agentText: string;
    let contentAttributes: MediaAttachment[] | undefined;

    if (msgType === "text") {
      // ── TEXT ──────────────────────────────────────────────────────────────
      agentText = (message.text?.body as string) || "";
      await insertMessage(conversationId, "user", agentText, undefined, messageId);

    } else {
      // ── MEDIA (image | audio | document | video) ──────────────────────────
      // YCloud payload shape:
      //   message.image    = { id, caption? }
      //   message.audio    = { id, voice? }
      //   message.document = { id, filename?, caption? }
      //   message.video    = { id, caption? }
      const mediaObj = message[msgType] as {
        id?: string;
        caption?: string;
        filename?: string;
        voice?: boolean;
      } | undefined;

      if (!mediaObj?.id) {
        // Malformed payload — ack and move on
        return NextResponse.json({ ok: true }, { status: 200 });
      }

      try {
        const apiKey = config.ycloudApiKey || "";

        // Download from YCloud
        const { buffer, mimeType, filename } = await downloadYCloudMedia(mediaObj.id, apiKey);

        // Persist to disk, get public URL
        const mediaUrl = await saveMediaLocally(buffer, conversationId, filename, mimeType);

        // Build contentAttributes entry
        const attachment: MediaAttachment = {
          type: msgType as MediaAttachment["type"],
          url: mediaUrl,
          fileName: mediaObj.filename || filename,
          mimeType,
          caption: mediaObj.caption,
        };

        // Transcribe audio — enriches both the attachment and the agent context
        if (msgType === "audio") {
          const transcription = await transcribeAudio(buffer, filename);
          attachment.transcription = transcription;
          agentText = `[Audio]: ${transcription}`;
        } else {
          const typeLabel =
            msgType === "image" ? "una imagen"
            : msgType === "document" ? "un documento"
            : "un video";
          agentText = `El cliente envió ${typeLabel}${mediaObj.caption ? `: "${mediaObj.caption}"` : ""}`;
        }

        contentAttributes = [attachment];
        await insertMessage(conversationId, "user", agentText, contentAttributes, messageId);

      } catch (mediaError) {
        // Media processing failed — still run the agent with a degraded context
        console.error("[webhook] Media processing error:", mediaError);
        agentText = `[${msgType}]`;
        await insertMessage(conversationId, "user", agentText, undefined, messageId);
      }
    }

    // -------------------------------------------------------------------------
    // 9. Enqueue message into buffer and schedule deferred processing
    // -------------------------------------------------------------------------

    // Content-level dedup (Level 2) — catches exact resends within 5s
    const isDuplContent = await BufferManager.isContentDuplicate("whatsapp", customerPhone, agentText);
    if (isDuplContent) {
      console.log(`[buffer:enqueue] Content duplicate detected, skipping: ${agentText.slice(0, 50)}`);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    console.log(`[buffer:enqueue] Buffering message for whatsapp:${customerPhone}`);
    await BufferManager.enqueue("whatsapp", customerPhone, {
      content: agentText,
      messageId,
      timestamp: Date.now(),
      contentAttributes: contentAttributes ?? undefined,
    });

    // Capture config values for the closure (config object may not be available later)
    const apiKey = config.ycloudApiKey || "";
    const botNumber = config.phoneNumber || "";
    const systemPrompt = config.systemPrompt || "";

    // Fire-and-forget: webhook returns 200 immediately, processing happens in background
    scheduleBufferProcessing("whatsapp", customerPhone, async (bufferedMessages) => {
      // Concatenate all buffered messages into a single context for the agent
      const combinedText = bufferedMessages.map((m) => m.content).join("\n");

      // Get fresh conversation history for AI context (last 20 messages)
      const history = await getConversationMessages(conversationId, 20);
      const aiMessages = history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // If the buffer had multiple messages, add the combined view as the last user turn
      // so the agent sees all pending input in one shot
      if (bufferedMessages.length > 1) {
        // Replace the last user message with the combined text to avoid duplication
        const lastUserIdx = [...aiMessages].reverse().findIndex((m) => m.role === "user");
        if (lastUserIdx !== -1) {
          const realIdx = aiMessages.length - 1 - lastUserIdx;
          aiMessages[realIdx] = { role: "user", content: combinedText };
        }
      }

      // Run agent with combined context
      const responseText = await runWhatsAppAgent({
        conversationId,
        customerPhone,
        messages: aiMessages,
        systemPrompt,
      });

      // Persist assistant response
      await insertMessage(conversationId, "assistant", responseText);

      // Send response via YCloud (split into bubbles for natural UX)
      await sendWhatsAppBubbles({
        to: customerPhone,
        text: responseText,
        apiKey,
        from: botNumber,
      });
    }).catch((err) => console.error("[webhook] Buffer processing error:", err));

  } catch (error) {
    console.error("[webhook] Error processing message:", error);
    // Always return 200 after signature verification passes
    // to prevent YCloud from retrying
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
