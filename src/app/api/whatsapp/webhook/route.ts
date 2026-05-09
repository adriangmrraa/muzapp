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

  if (!secret) {
    console.error("[webhook:wa] YCLOUD_WEBHOOK_SECRET not set — rejecting");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  if (!verifyYCloudSignature(rawBody, signature, secret)) {
    console.error("[webhook:wa] Signature verification FAILED — check YCLOUD_WEBHOOK_SECRET matches YCloud dashboard");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Parse the payload
  const payload = JSON.parse(rawBody);

  // 2. Filter non-message events (status updates, etc.)
  if (payload.type !== "whatsapp.inbound_message.received") {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const message = payload.whatsappInboundMessage;

  // Accept: text, image, audio, document, video, location — drop everything else
  const SUPPORTED_TYPES = ["text", "image", "audio", "document", "video", "location"] as const;
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
      console.error("[webhook:wa] No active agent config found — is agent enabled in admin?");
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    console.log(`[webhook:wa] Config loaded — enabled:${config.enabled} phone:${config.phoneNumber || "N/A"}`);

    // 3b. Check if customer phone is in allowed IDs list
    const allowedIds = (config.allowedPhoneIds ?? []) as { name: string; phone: string }[];
    if (allowedIds.length > 0 && !allowedIds.some((entry) => entry.phone === customerPhone)) {
      console.log(`[webhook:wa] BLOCKED — phone ${customerPhone} not in allowedPhoneIds (${allowedIds.map(a => a.phone).join(",")})`);
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    console.log(`[webhook:wa] Message from ${customerPhone} (${customerName}) type=${msgType} id=${messageId}`);

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
      console.log(`[webhook:wa] Duplicate message ${messageId} — skipping`);
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

    if (msgType === "location") {
      // ── LOCATION (pin de Maps) ──────────────────────────────────────────
      const loc = message.location as {
        latitude?: number;
        longitude?: number;
        name?: string;
        address?: string;
      } | undefined;

      const address = loc?.address || loc?.name || "ubicación compartida";
      const coords = loc?.latitude && loc?.longitude
        ? ` (${loc.latitude}, ${loc.longitude})`
        : "";
      agentText = `[Ubicacion]: ${address}${coords}`;

      contentAttributes = [{
        type: "image" as const,
        url: "",
        caption: agentText,
        description: `Ubicación compartida: ${address}${coords}`,
      }];
      await insertMessage(conversationId, "user", agentText, contentAttributes, messageId);

    } else if (msgType === "text") {
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
          const transcription = await transcribeAudio(buffer, filename, mimeType);
          attachment.transcription = transcription;
          agentText = `[Audio]: ${transcription}`;

          contentAttributes = [attachment];
          await insertMessage(conversationId, "user", agentText, contentAttributes, messageId);

        } else if (msgType === "image" || (msgType === "document" && mimeType.startsWith("image/"))) {
          // Image or image-document → Vision analysis with race timeout
          const { processImageWithVision } = await import("@/lib/media/vision");

          contentAttributes = [attachment];
          const msgId = await insertMessage(conversationId, "user", "[Imagen recibida]", contentAttributes, messageId);

          // Get attachment ID from the auto-created record
          const { attachments: attachmentsTable } = await import("@/db/schema");
          const [att] = await db
            .select({ id: attachmentsTable.id })
            .from(attachmentsTable)
            .where(eq(attachmentsTable.messageId, msgId))
            .limit(1);

          const attachmentId = att?.id || 0;
          const captionCtx = mediaObj.caption ? `Caption del cliente: ${mediaObj.caption}` : undefined;

          const visionResult = await processImageWithVision(buffer, mimeType, attachmentId, msgId, captionCtx);
          agentText = visionResult.agentText;

          // Fire background persist if vision timed out
          if (visionResult.backgroundPersist) {
            visionResult.backgroundPersist();
          }

        } else if (msgType === "video") {
          agentText = `El cliente envió un video${mediaObj.caption ? `: "${mediaObj.caption}"` : ""}`;
          contentAttributes = [attachment];
          await insertMessage(conversationId, "user", agentText, contentAttributes, messageId);

        } else {
          // Document (non-image): PDF, etc
          agentText = `El cliente envió un documento: ${mediaObj.filename || filename}${mediaObj.caption ? ` — "${mediaObj.caption}"` : ""}`;
          contentAttributes = [attachment];
          await insertMessage(conversationId, "user", agentText, contentAttributes, messageId);
        }

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

    console.log(`[webhook:wa] Enqueueing to buffer for whatsapp:${customerPhone}`);
    await BufferManager.enqueue("whatsapp", customerPhone, {
      content: agentText,
      messageId,
      timestamp: Date.now(),
      contentAttributes: contentAttributes ?? undefined,
    });

    // Capture config values for the closure (config object may not be available later)
    const apiKey = process.env.YCLOUD_API_KEY || config.ycloudApiKey || "";
    const botNumber = process.env.WHATSAPP_PHONE_NUMBER || config.phoneNumber || "";
    const systemPrompt = config.systemPrompt || "";

    console.log(`[webhook:wa] Config for agent — apiKey:${apiKey ? "SET" : "EMPTY"} botNumber:${botNumber || "EMPTY"} prompt:${systemPrompt ? "SET" : "EMPTY"}`);

    // Fire-and-forget: webhook returns 200 immediately, processing happens in background
    scheduleBufferProcessing("whatsapp", customerPhone, async (bufferedMessages) => {
      console.log(`[webhook:wa] Buffer callback fired — ${bufferedMessages.length} msgs for ${customerPhone}`);

      // Concatenate all buffered messages into a single context for the agent
      const combinedText = bufferedMessages.map((m) => m.content).join("\n");

      // Get fresh conversation history for AI context (last 20 messages)
      const history = await getConversationMessages(conversationId, 20);
      const aiMessages = history
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
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

      console.log(`[webhook:wa] Running agent with ${aiMessages.length} history messages`);

      // Run agent with combined context
      const responseText = await runWhatsAppAgent({
        conversationId,
        customerPhone,
        messages: aiMessages,
        systemPrompt,
      });

      console.log(`[webhook:wa] Agent response: ${responseText.slice(0, 100)}...`);

      // Persist assistant response
      await insertMessage(conversationId, "assistant", responseText);

      // Send response via YCloud (split into bubbles for natural UX)
      await sendWhatsAppBubbles({
        to: customerPhone,
        text: responseText,
        apiKey,
        from: botNumber,
      });

      console.log(`[webhook:wa] Response sent to ${customerPhone}`);
    }).catch((err) => console.error("[webhook:wa] Buffer processing error:", err));

  } catch (error) {
    console.error("[webhook] Error processing message:", error);
    // Always return 200 after signature verification passes
    // to prevent YCloud from retrying
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
