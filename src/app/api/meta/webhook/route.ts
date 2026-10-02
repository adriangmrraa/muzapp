import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { findOrCreateConversation, insertMessage } from "@/lib/channels/router";

// Meta signs webhook payloads with X-Hub-Signature-256: sha256=<hmac>
// computed over the raw body using the app secret.
async function verifyMetaSignature(rawBody: string, header: string | null): Promise<boolean> {
  const { getIntegrationSecrets } = await import("@/lib/integrations");
  const secret = (await getIntegrationSecrets()).metaAppSecret;
  if (!secret || !header?.startsWith("sha256=")) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(header);
  return a.length === b.length && timingSafeEqual(a, b);
}

// GET: Webhook verification
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");
  const { getIntegrationSecrets } = await import("@/lib/integrations");
  const expected = (await getIntegrationSecrets()).metaWebhookVerifyToken;

  // Fail closed when the verify token is unset or empty — an empty env would
  // otherwise match an empty query param and confirm subscriptions for anyone.
  if (mode === "subscribe" && expected && token === expected) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// POST: Incoming messages from Meta
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  if (!(await verifyMetaSignature(rawBody, req.headers.get("x-hub-signature-256")))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody);

    // Meta sends entries with changes
    const entries = body?.entry || [];
    for (const entry of entries) {
      const changes = entry?.changes || [];
      for (const change of changes) {
        if (change.field !== "messages") continue;

        const value = change.value;
        const messages = value?.messages || [];

        for (const msg of messages) {
          const from = msg.from; // phone number
          const text = msg.text?.body || msg.caption || "";

          if (!from || !text) continue;

          const { id: conversationId } = await findOrCreateConversation(
            "whatsapp",
            from,
            value?.contacts?.[0]?.profile?.name,
            from
          );

          await insertMessage(conversationId, "user", text, undefined, msg.id);

          // TODO: Process with agent and respond
        }
      }
    }
  } catch (error) {
    console.error("[meta/webhook] Error:", error);
  }

  return NextResponse.json({ status: "ok" });
}
