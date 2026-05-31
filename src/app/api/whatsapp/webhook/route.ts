import { NextRequest, NextResponse } from "next/server";
import { verifyYCloudSignature } from "@/lib/whatsapp/signature";
import { sendWhatsAppMessage } from "@/lib/whatsapp/ycloud-client";
import { sendWhatsAppBubbles } from "@/lib/buffer/response-sender";
import {
  findOrCreateConversation,
  insertMessage,
  isMessageDuplicate,
  getConversationMessages,
  notifyCustomerDeliveryArrived,
  forwardLocationToDelivery,
  sendPendingFollowups,
  type MediaAttachment,
} from "@/lib/channels/router";
import { captureLeadIfNew } from "@/lib/whatsapp/lead-capture";
import { runWhatsAppAgent } from "@/lib/whatsapp/agent";
import { db } from "@/db";
import { agentConfig, conversations, leads, addresses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { normalizePhone } from "@/lib/phone-utils";
import { downloadYCloudMedia, saveMediaLocally } from "@/lib/media/downloader";
import { transcribeAudio } from "@/lib/media/transcription";
import { analyzeVideo } from "@/lib/media/video";
import { extractDocumentText } from "@/lib/media/document";
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

// ─── Echo event types de YCloud ─────────────────────────────────────────────
const ECHO_EVENT_TYPES = [
  "whatsapp.message.echo",
  "whatsapp.smb.message.echoes",
];

// Keys candidatas donde puede venir el mensaje en el payload del echo
const ECHO_MESSAGE_KEYS = [
  "whatsappMessage",
  "whatsappSmbMessageEcho",
  "whatsappSmbMessageEchoes",
  "smbMessage",
  "message",
  "whatsappMessageEcho",
];

// ─── Echo handler ───────────────────────────────────────────────────────────
async function handleEcho(
  payload: Record<string, unknown>
): Promise<NextResponse> {
  try {
    // 1. Extraer el objeto mensaje del payload (búsqueda en múltiples keys)
    const event = payload as Record<string, unknown>;
    let msg: Record<string, unknown> | undefined;

    for (const key of ECHO_MESSAGE_KEYS) {
      const candidate = event[key];
      if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
        msg = candidate as Record<string, unknown>;
        break;
      }
    }

    // Fallback dinámico: buscar cualquier valor dict que tenga "to" o "from"
    if (!msg) {
      for (const [k, v] of Object.entries(event)) {
        if (["type", "id", "createTime", "sendTime", "apiVersion"].includes(k)) continue;
        if (v && typeof v === "object" && !Array.isArray(v)) {
          const obj = v as Record<string, unknown>;
          if (obj.to || obj.from) {
            msg = obj;
            break;
          }
        }
      }
    }

    if (!msg) {
      console.warn("[webhook:echo] Could not extract message from echo payload");
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // 2. Extraer teléfonos
    // En un echo: from = quien envió (bot/staff), to = quien recibe (customer)
    const customerPhone = (msg.to || event.to) as string | undefined;
    const botPhone = (msg.from || event.from) as string | undefined;

    if (!customerPhone || !botPhone) {
      console.warn("[webhook:echo] Missing phone numbers in echo payload");
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // Normalizar teléfono para operaciones DB (findOrCreateConversation normaliza internamente)
    const phone = normalizePhone(customerPhone);

    // 3. Extraer el contenido del mensaje
    const msgType = (msg.type as string) || "text";
    let displayText = "[Mensaje desde WhatsApp Business]";

    if (msgType === "text" && msg.text && typeof msg.text === "object") {
      displayText = (msg.text as Record<string, unknown>).body as string || displayText;
    } else if (["image", "audio", "document", "video"].includes(msgType)) {
      const mediaObj = msg[msgType] as Record<string, unknown> | undefined;
      const caption = mediaObj?.caption as string | undefined;
      displayText = caption || `[${msgType}]`;
    }

    const echoMsgId = (msg.id || event.id) as string | undefined;

    console.log(
      `[webhook:echo] Echo from ${botPhone} → ${customerPhone}: "${displayText.slice(0, 80)}"`
    );

    // 4. Buscar o crear conversación por el teléfono del customer
    //    findOrCreateConversation normaliza customerPhone internamente
    const { id: conversationId } = await findOrCreateConversation(
      "whatsapp",
      customerPhone,
      undefined,
      customerPhone
    );

    // 5. Dedup: si este echo ya tiene el mismo platformMessageId, skip
    if (echoMsgId) {
      const isDup = await isMessageDuplicate(echoMsgId);
      if (isDup) {
        console.log(`[webhook:echo] Duplicate echo ${echoMsgId} — skipping`);
        return NextResponse.json({ ok: true }, { status: 200 });
      }

      // Dedup adicional: si el contenido coincide con el ÚLTIMO mensaje
      // del assistant en los últimos 30s, es el eco de nuestra propia respuesta
      const recentMessages = await getConversationMessages(conversationId, 1);
      if (recentMessages.length > 0) {
        const last = recentMessages[0];
        const thirtySecAgo = Date.now() - 30_000;
        const msgTime = last.createdAt instanceof Date
          ? last.createdAt.getTime()
          : new Date(last.createdAt).getTime();

        if (
          last.role === "assistant" &&
          msgTime > thirtySecAgo &&
          last.content.trim() === displayText.trim()
        ) {
          console.log(`[webhook:echo] Skip — echo matches recent AI response (${echoMsgId})`);
          return NextResponse.json({ ok: true }, { status: 200 });
        }
      }
    }

    // 6. Determinar si este echo es del bot (AI) o de un humano
    //    Buscamos el mensaje original por platformMessageId.
    //    Si existe y era role="assistant" → es eco de nuestra propia respuesta → NO override.
    //    Si NO existe o era role="human" → un humano respondió desde WhatsApp Business App → override 24h.
    let isOwnEcho = false;
    if (echoMsgId) {
      try {
        const { chatMessages: cmTable } = await import("@/db/schema");
        const [original] = await db
          .select({ role: cmTable.role })
          .from(cmTable)
          .where(eq(cmTable.platformMessageId, echoMsgId))
          .limit(1);
        // Si encontramos el mensaje original y era assistant → es eco propio
        isOwnEcho = original?.role === "assistant";
      } catch {
        // Si falla la query, asumimos que NO es echo propio (más seguro para no perder override)
        isOwnEcho = false;
      }
    }

    if (isOwnEcho) {
      // Es eco de nuestra propia respuesta AI → solo dedup, NO setear override
      console.log(`[webhook:echo] Own AI echo ${echoMsgId} — no human override needed`);
    } else {
      // Un humano respondió desde WhatsApp Business App → override 24h
      const overrideUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await db
        .update(conversations)
        .set({ humanOverrideUntil: overrideUntil, updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));

      console.log(`[webhook:echo] Human override set for conversation ${conversationId} until ${overrideUntil.toISOString()}`);
    }

    // 7. Guardar el mensaje como assistant (para que se muestre en el chat)
    //    Solo guardar si NO es echo propio (los echos propios ya tienen su mensaje guardado)
    if (!isOwnEcho) {
      await insertMessage(
        conversationId,
        "assistant",
        displayText,
        undefined,
        echoMsgId
      );
      console.log(`[webhook:echo] Echo saved as assistant message in conversation ${conversationId}`);
    }

  } catch (error) {
    console.error("[webhook:echo] Error processing echo:", error);
    // Siempre devolver 200 para evitar retries de YCloud
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

// ─── Delivery handler ───────────────────────────────────────────────────────
async function handleDeliveryNotification(
  payload: Record<string, unknown>,
  config: typeof agentConfig.$inferSelect
): Promise<NextResponse> {
  try {
    const message = payload.whatsappInboundMessage as Record<string, unknown> | undefined;
    if (!message) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const msgType = message.type as string;
    const deliveryPhone = config.deliveryPhoneNumber;

    if (!deliveryPhone) {
      console.warn("[delivery] No delivery phone configured — ignoring message");
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    console.log(`[delivery] Message from delivery (${deliveryPhone}): type=${msgType}`);

    if (msgType === "text") {
      // Delivery confirms arrival → notify customer
      const text = (message.text as Record<string, unknown> | undefined)?.body as string || "";
      console.log(`[delivery] Delivery says: "${text.slice(0, 80)}"`);

      await notifyCustomerDeliveryArrived(deliveryPhone);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[delivery] Error handling delivery notification:", error);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

// ─── Check if AI is overridden by human ────────────────────────────────────
async function checkHumanOverride(conversationId: number): Promise<boolean> {
  try {
    const [conv] = await db
      .select({ humanOverrideUntil: conversations.humanOverrideUntil })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conv?.humanOverrideUntil) return false; // no override → AI can respond

    // humanOverrideUntil en el futuro → override activo → AI no responde
    return new Date(conv.humanOverrideUntil).getTime() > Date.now();
  } catch (error) {
    console.error("[webhook] Error checking human override:", error);
    return false; // fallback: permitir que AI responda
  }
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

  // 2. Handle ECHO events (outgoing messages from WhatsApp Business App)
  //    Esto va ANTES del filtro de inbound messages porque los echoes
  //    tienen type diferente
  if (ECHO_EVENT_TYPES.includes(payload.type)) {
    return handleEcho(payload);
  }

  // 3. Filter non-message events (status updates, etc.)
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

  // Normalizar teléfono para operaciones DB
  // customerPhone (raw) se usa para enviar mensajes a YCloud
  // phone (normalizado) se usa para buscar en DB
  const phone = normalizePhone(customerPhone);

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // 4. Load agent config — SIN filtro de enabled
    //    (siempre cargamos la config, aunque la AI esté apagada,
    //    para poder guardar el mensaje igual)
    // ─────────────────────────────────────────────────────────────────────────
    const [config] = await db
      .select()
      .from(agentConfig)
      .where(eq(agentConfig.id, 1))
      .limit(1);

    if (!config) {
      console.error("[webhook:wa] No agent config found — is DB initialized?");
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    console.log(`[webhook:wa] Config loaded — enabled:${config.enabled} phone:${config.phoneNumber || "N/A"}`);

    // 4b. DELIVERY DETECTION: si el mensaje es del número del delivery,
    //     tratar como notificación de delivery, no como mensaje de cliente.
    const deliveryPhone = config.deliveryPhoneNumber?.trim();
    if (deliveryPhone && customerPhone === deliveryPhone) {
      return handleDeliveryNotification(payload, config);
    }

    // 4c. Check if customer phone is in allowed IDs list
    const allowedIds = (config.allowedPhoneIds ?? []) as { name: string; phone: string }[];
    if (allowedIds.length > 0 && !allowedIds.some((entry) => entry.phone === customerPhone)) {
      console.log(`[webhook:wa] BLOCKED — phone ${customerPhone} not in allowedPhoneIds (${allowedIds.map(a => a.phone).join(",")})`);
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    console.log(`[webhook:wa] Message from ${customerPhone} (${customerName}) type=${msgType} id=${messageId}`);

    // 4c. Auto-reply when outside 24h window
    const autoReplyEnabled = config.autoReply24h === true;
    const autoReplyMessage = config.autoReply24hMessage?.trim();
    const isAiEnabled = config.enabled === true;

    // 5. Find or create conversation
    const { id: conversationId, isNew } = await findOrCreateConversation(
      "whatsapp",
      customerPhone,
      customerName ?? undefined,
      customerPhone
    );

    // 6. Deduplication check
    if (await isMessageDuplicate(messageId)) {
      console.log(`[webhook:wa] Duplicate message ${messageId} — skipping`);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // 7. Capture lead if first contact
    const textForLead = msgType === "text" ? (message.text?.body as string) || "" : "";
    await captureLeadIfNew(customerPhone, customerName, textForLead);

    // 8. Auto-reply for new conversations (solo si la AI está habilitada)
    if (isAiEnabled && autoReplyEnabled && autoReplyMessage && isNew) {
      await sendWhatsAppMessage({
        to: customerPhone,
        body: autoReplyMessage,
        apiKey: config.ycloudApiKey || "",
        from: config.phoneNumber || "",
      });
    }

    // -------------------------------------------------------------------------
    // 9. Persist inbound message + resolve text for agent
    //    ESTO SIEMPRE SE HACE, independientemente de si la AI está encendida
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

      // ── PERSISTIR dirección en leads.address + tabla addresses ──
      const addrToSave = loc?.address || loc?.name || "";
      if (addrToSave) {
        // Actualizar leads.address como dirección principal
        db.update(leads)
          .set({ address: addrToSave })
          .where(eq(leads.phone, phone))
          .then((r) => {
            if (r.rowCount && r.rowCount > 0)
              console.log(`[webhook:wa] Address saved to lead ${customerPhone}: ${addrToSave}`);
          })
          .catch((err) => console.warn("[webhook:wa] Failed to save address:", err));

        // Guardar en tabla addresses (histórico de ubicaciones)
        const mapsLink = loc?.latitude && loc?.longitude
          ? `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`
          : null;
        db.insert(addresses).values({
          phone: phone,
          address: addrToSave,
          latitude: loc?.latitude ? String(loc.latitude) : null,
          longitude: loc?.longitude ? String(loc.longitude) : null,
          mapsLink,
        }).catch((err) => console.warn("[webhook:wa] Failed to save address record:", err));
      }

      // NOTA: la ubicación NO se reenvía al delivery acá.
      // Se guarda y se envía junto con el pedido confirmado en createOrder.

    } else if (msgType === "text") {
      // ── TEXT ──────────────────────────────────────────────────────────────
      agentText = (message.text?.body as string) || "";
      await insertMessage(conversationId, "user", agentText, undefined, messageId);

    } else {
      // ── MEDIA (image | audio | document | video) ──────────────────────────
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
          // Video → transcribe audio track + description
          const clip = await analyzeVideo(buffer, filename, mimeType, mediaObj.caption);
          attachment.transcription = clip.transcription;
          contentAttributes = [attachment];
          agentText = clip.agentText;
          await insertMessage(conversationId, "user", agentText, contentAttributes, messageId);

        } else {
          // Document (non-image): PDF, text, etc — intentar extraer texto
          const extractedText = mimeType === "application/pdf" || mimeType === "text/plain"
            ? await extractDocumentText(buffer, filename, mimeType)
            : null;

          if (extractedText) {
            agentText = `El cliente envió un documento "${mediaObj.filename || filename}". Contenido extraído:\n\n${extractedText}`;
          } else {
            agentText = `El cliente envió un documento: ${mediaObj.filename || filename}${mediaObj.caption ? ` — "${mediaObj.caption}"` : ""}`;
          }

          contentAttributes = [attachment];
          if (extractedText) attachment.description = extractedText;
          await insertMessage(conversationId, "user", agentText, contentAttributes, messageId);
        }

      } catch (mediaError) {
        // Media processing failed — still run the agent with a degraded context
        console.error("[webhook] Media processing error:", mediaError);
        agentText = `[${msgType}]`;
        await insertMessage(conversationId, "user", agentText, undefined, messageId);
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 10. Verificar si la AI DEBE responder o no
    //     El mensaje YA FUE GUARDADO arriba. Ahora decidimos si ejecutamos AI.
    // ─────────────────────────────────────────────────────────────────────────

    // Check 1: ¿La AI está habilitada en el admin?
    if (!isAiEnabled) {
      console.log(`[webhook:wa] AI disabled — message ${messageId} saved, AI skipped`);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // Check 2: ¿Hay un human override activo?
    const isOverridden = await checkHumanOverride(conversationId);
    if (isOverridden) {
      console.log(`[webhook:wa] Human override active for conv ${conversationId} — AI skipped`);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // ───────────────────────────────────────────────────────────────────────
    // 11. AI está habilitada y no hay override — encolar en buffer
    // ───────────────────────────────────────────────────────────────────────

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

    // Capture config values for the closure
    const apiKey = process.env.YCLOUD_API_KEY || config.ycloudApiKey || "";
    const botNumber = process.env.WHATSAPP_PHONE_NUMBER || config.phoneNumber || "";
    const systemPrompt = config.systemPrompt || "";

    console.log(`[webhook:wa] Config for agent — apiKey:${apiKey ? "SET" : "EMPTY"} botNumber:${botNumber || "EMPTY"} prompt:${systemPrompt ? "SET" : "EMPTY"}`);

    // Fire-and-forget: webhook returns 200 immediately, processing happens in background
    scheduleBufferProcessing("whatsapp", customerPhone, async (bufferedMessages) => {
      console.log(`[webhook:wa] Buffer callback fired — ${bufferedMessages.length} msgs for ${customerPhone}`);

      // ANTES de ejecutar AI, verificar AGAIN si hay human override
      // (puede haber cambiado durante el debounce de 11s)
      const stillOverridden = await checkHumanOverride(conversationId);
      if (stillOverridden) {
        console.log(`[webhook:wa] Human override activated during debounce for ${customerPhone} — aborting AI`);
        return;
      }

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
      if (bufferedMessages.length > 1) {
        const lastUserIdx = [...aiMessages].reverse().findIndex((m) => m.role === "user");
        if (lastUserIdx !== -1) {
          const realIdx = aiMessages.length - 1 - lastUserIdx;
          aiMessages[realIdx] = { role: "user", content: combinedText };
        }
      }

      console.log(`[webhook:wa] Running agent with ${aiMessages.length} history messages`);

      // NOTA: el customer context (order history, address, notes, preferences)
      // ya se carga DENTRO de runWhatsAppAgent() → buildSystemPrompt().
      // NO inyectar nada como role:"user" — eso contamina la línea temporal.

      // Run agent with combined context
      const responseText = await runWhatsAppAgent({
        conversationId,
        customerPhone,
        messages: aiMessages,
      });

      console.log(`[webhook:wa] Agent response: ${responseText.slice(0, 100)}...`);

      // Persist assistant response
      const msgId = await insertMessage(conversationId, "assistant", responseText);

      // Send response via YCloud (split into bubbles for natural UX)
      const ycloudResult = await sendWhatsAppBubbles({
        to: customerPhone,
        text: responseText,
        apiKey,
        from: botNumber,
      });

      // ═══════════════════════════════════════════════════════════════════
      // CLINICFORGE PATTERN: Guardar el wamid (YCloud message ID) en el
      // registro de chatMessage para que el echo handler pueda deduplicar
      // ═══════════════════════════════════════════════════════════════════
      if (ycloudResult?.id) {
        try {
          // Actualizar el mensaje con el wamid que devolvió YCloud
          const { chatMessages } = await import("@/db/schema");
          await db
            .update(chatMessages)
            .set({ platformMessageId: ycloudResult.id })
            .where(eq(chatMessages.id, msgId));
          console.log(`[webhook:wa] Updated chatMessage ${msgId} with wamid ${ycloudResult.id}`);
        } catch (updateErr) {
          // Non-fatal
          console.warn("[webhook:wa] Failed to update wamid on chatMessage:", updateErr);
        }
      }

      console.log(`[webhook:wa] Response sent to ${customerPhone}`);
    }).catch((err) => console.error("[webhook:wa] Buffer processing error:", err));

  } catch (error) {
    console.error("[webhook] Error processing message:", error);
    // Always return 200 after signature verification passes
    // to prevent YCloud from retrying
  }

  // ─── Post-delivery followup check ──────────────────────────────────────
  // Fire-and-forget: busca pedidos entregados hace >30min sin followup
  sendPendingFollowups().then((n) => {
    if (n > 0) console.log(`[webhook] Followups sent: ${n}`);
  }).catch((err) => console.warn("[webhook] Followup check failed:", err));

  return NextResponse.json({ ok: true }, { status: 200 });
}
