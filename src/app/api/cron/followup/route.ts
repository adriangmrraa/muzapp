import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, conversations } from "@/db/schema";
import { eq, and, lte, or, isNull, lt } from "drizzle-orm";

/**
 * Endpoint para procesar follow-ups de pedidos entregados.
 * 
 * Busca pedidos con:
 * - status = "delivered"
 * - followupSent = false
 * - deliveredAt <= hace 30 minutos
 * 
 * Envía el mensaje y marca followupSent = true.
 * 
 * Llamar desde un cron job en Render cada 15 minutos:
 * GET https://muzapp.onrender.com/api/cron/followup?key=CRON_SECRET
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  // A missing secret must never authorize the endpoint in production.
  if (process.env.NODE_ENV === "production" && (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const now = new Date();
  const hora = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", hourCycle: "h23" }).format(now));

  // No enviar follow-ups fuera de horario hábil (9-22hs)
  if (hora < 9 || hora >= 22) {
    return NextResponse.json({ message: "Fuera de horario hábil", processed: 0 });
  }

  try {
    // Buscar pedidos entregados hace >= 30 min que no tengan followup
    const cutoff = new Date(now.getTime() - 30 * 60 * 1000);

    const pendingFollowups = await db
      .select({
        id: orders.id,
        phoneNumber: orders.phoneNumber,
        customerName: orders.customerName,
      })
      .from(orders)
      .where(
        and(
          eq(orders.status, "delivered"),
          eq(orders.followupSent, false),
          or(isNull(orders.followupClaimedAt), lt(orders.followupClaimedAt, new Date(now.getTime() - 5 * 60 * 1000))),
          lte(orders.deliveredAt, cutoff),
        )
      )
      .limit(20);

    let processed = 0;

    for (const order of pendingFollowups) {
      if (!order.phoneNumber) continue;

      const followupText = `Holaa, ¿todo bien con el pedido? No te olvides de etiquetarnos en ig porfa 🙌`;

      // Atomic compare-and-set: only one cron worker owns this send. A stale claim
      // becomes eligible after five minutes. A crash between send and commit still
      // needs provider idempotency for exactly-once delivery (YCloud has no key here).
      const [claimed] = await db.update(orders)
        .set({ followupClaimedAt: now })
        .where(and(eq(orders.id, order.id), eq(orders.followupSent, false),
          or(isNull(orders.followupClaimedAt), lt(orders.followupClaimedAt, new Date(now.getTime() - 5 * 60 * 1000)))))
        .returning({ id: orders.id });
      if (!claimed) continue;
      try {
        const { sendText } = await import("@/lib/ycloud");
        const result = await sendText(order.phoneNumber, followupText);

        if (result.ok) {
          await db
            .update(orders)
            .set({ followupSent: true, followupClaimedAt: null, updatedAt: new Date() })
            .where(eq(orders.id, order.id));
          processed++;
          console.log(`[followup] Sent for order #${order.id} to ${order.phoneNumber}`);

          // Save follow-up in conversation history so AI has context (role "system")
          const { insertMessage } = await import("@/lib/channels/router");
          const phone = order.phoneNumber.startsWith("+") ? order.phoneNumber : `+${order.phoneNumber}`;
          const conv = await db
            .select({ id: conversations.id })
            .from(conversations)
            .where(eq(conversations.whatsappId, phone))
            .limit(1);
          if (conv[0]) {
            await insertMessage(conv[0].id, "system", followupText, undefined, result.wamid);
            console.log(`[followup] Follow-up saved to conversation #${conv[0].id} (role=system, wamid=${result.wamid})`);
          }
        }
      } catch (e) {
        console.warn(`[followup] Failed for order #${order.id}:`, e);
      }
    }

    return NextResponse.json({
      message: `Procesados ${processed} de ${pendingFollowups.length} follow-ups`,
      processed,
      total: pendingFollowups.length,
    });
  } catch (e) {
    console.error("[followup] Error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
