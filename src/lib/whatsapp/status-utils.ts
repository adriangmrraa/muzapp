// ─── Shared Status Utilities ───────────────────────────────────────────────
// Usado por prompt-builder, agent, order-management-tools y create-order
// para mantener consistencia en cómo se interpretan los estados de pedido.

export const ORDER_STATUS_INFO = {
  pending:    { label: "Pendiente", description: "Pedido creado, esperando confirmación/procesamiento" },
  preparing:  { label: "Preparando", description: "Pedido en cola, no empezó a prepararse aún" },
  ready:      { label: "Listo", description: "Pedido listo para retirar/entregar" },
  delivered:  { label: "Entregado", description: "Pedido ya entregado" },
  cancelled:  { label: "Cancelado", description: "Pedido cancelado" },
} as const;

export type OrderStatus = keyof typeof ORDER_STATUS_INFO;

export interface BusinessContact {
  address: string;
  instagram: string;
}

/**
 * Reconstruye el mensaje de notificación EXACTO que se envió al cliente
 * cuando se actualizó el estado del pedido. Fuente única del texto —
 * orders/actions.ts delega acá para que ambos caminos generen lo mismo.
 * `biz` trae address/instagram del negocio (agent_config); si falta, las
 * líneas específicas se omiten en vez de inventar datos.
 */
export function getStatusNotificationMessage(
  status: string,
  orderId: number,
  orderType?: string | null,
  address?: string | null,
  biz?: BusinessContact,
): string | null {
  const isDelivery = !!address && address.trim().length > 0;
  const isPan = orderType === "pan_mayorista";
  const orderTag = `Pedido #${orderId}`;
  const pickup = biz?.address ? `retiralo por ${biz.address}` : "ya podés retirarlo";

  switch (status) {
    case "ready":
      if (isPan) {
        return `🍞 ${orderTag} — Ya esta tu pedido de pan, ${pickup}.`;
      }
      if (isDelivery) {
        return `🍔 ${orderTag} — Ya esta tu pedido, en breve el delivery te lo esta llevando.`;
      }
      return `🍔 ${orderTag} — Ya esta tu pedido, ${pickup}.`;

    case "delivered": {
      const emoji = isPan ? "🍞" : "🍔";
      const ig = biz?.instagram ? ` Nuestro IG es @${biz.instagram}.` : "";
      return `${emoji} ${orderTag} — Gracias por elegirnos! Si nos compartis en tus historias participas por hamburguesas todas las semanas.${ig}`;
    }

    default:
      return null;
  }
}

/**
 * Devuelve una descripción semántica del estado del pedido para inyectar
 * en el prompt del agente. Incluye el mensaje de notificación si aplica.
 */
export function getStatusSemantic(
  status: string,
  orderType?: string | null,
  address?: string | null,
  orderId?: number,
  biz?: BusinessContact,
): string {
  switch (status) {
    case "pending":
      return "🟢 Pedido activo en curso";

    case "preparing":
      return "⏳ Pedido en preparación — en cola, no arrancó aún";

    case "ready": {
      const notif = orderId
        ? getStatusNotificationMessage("ready", orderId, orderType, address, biz)
        : null;
      if (notif) {
        return `📦 Pedido LISTO — se notificó al cliente: '${notif}'. Si el cliente responde a esto, NO es un pedido nuevo.`;
      }
      return "📦 Pedido LISTO — listo para retirar/entregar";
    }

    case "delivered": {
      const notif = orderId
        ? getStatusNotificationMessage("delivered", orderId, orderType, address, biz)
        : null;
      if (notif) {
        return `✅ Pedido ENTREGADO — se notificó al cliente: '${notif}'. No es un pedido activo.`;
      }
      return "✅ Pedido ENTREGADO — no es un pedido activo";
    }

    case "cancelled":
      return "❌ Pedido cancelado";

    default:
      return `Estado: ${status}`;
  }
}

/**
 * Verifica si un estado representa un pedido activo (en curso, no terminal).
 * Terminales: delivered, cancelled
 */
export function isActiveStatus(status: string): boolean {
  return ["pending", "preparing", "ready"].includes(status);
}
