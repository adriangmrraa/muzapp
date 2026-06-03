import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, desc, asc, or } from "drizzle-orm";
import * as schema from "../src/db/schema";

const phone = "5492966685071";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  // 1. Buscar lead por teléfono
  console.log("===== LEAD =====");
  const [lead] = await db
    .select()
    .from(schema.leads)
    .where(eq(schema.leads.phone, phone))
    .limit(1);
  if (lead) {
    console.log(JSON.stringify(lead, null, 2));
  } else {
    console.log("No se encontró lead con ese teléfono");
  }

  // 2. Buscar conversaciones por whatsappId o customerPhone
  console.log("\n===== CONVERSATIONS =====");
  const conversations = await db
    .select()
    .from(schema.conversations)
    .where(
      or(
        eq(schema.conversations.whatsappId, phone),
        eq(schema.conversations.customerPhone, phone),
      ),
    )
    .orderBy(desc(schema.conversations.lastMessageAt));

  if (conversations.length === 0) {
    console.log("No se encontraron conversaciones con ese número");
    return;
  }

  for (const conv of conversations) {
    console.log(JSON.stringify(conv, null, 2));

    // 3. Traer todos los mensajes de la conversación
    console.log("\n===== CHAT MESSAGES =====");
    const messages = await db
      .select()
      .from(schema.chatMessages)
      .where(eq(schema.chatMessages.conversationId, conv.id))
      .orderBy(asc(schema.chatMessages.createdAt));

    console.log(`Total mensajes: ${messages.length}`);
    for (const msg of messages) {
      const time = msg.createdAt
        ? new Date(msg.createdAt).toLocaleString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            timeZone: "America/Argentina/Buenos_Aires",
          })
        : "N/A";
      console.log(`[${time}] [${msg.role.toUpperCase()}] ${msg.content}`);
      if (msg.contentAttributes && msg.contentAttributes.length > 0) {
        for (const attr of msg.contentAttributes) {
          console.log(`  📎 ${attr.type}: ${attr.url}`);
        }
      }
    }
  }
}

main().catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
