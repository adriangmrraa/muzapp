import { NextRequest, NextResponse } from "next/server";
import { findOrCreateConversation, insertMessage } from "@/lib/channels/router";

// GET: Webhook verification
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// POST: Incoming messages from Meta
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

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
