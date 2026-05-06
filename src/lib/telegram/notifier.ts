import { getTelegramConfigFromEnv, sendTelegramMessage } from "./bot";

interface OrderNotification {
  id: number;
  customerName: string | null;
  orderType: string | null;
  items: unknown;
  total?: number;
  status: string;
}

export async function notifyNewOrder(order: OrderNotification): Promise<void> {
  const config = getTelegramConfigFromEnv();
  if (!config.enabled || config.allowedChatIds.length === 0) return;

  const items = Array.isArray(order.items) 
    ? order.items.map((i: any) => `${i.quantity || 1}x ${i.name || "Item"}`).join(", ")
    : "Ver detalle";

  const typeIcon = order.orderType === "pan_mayorista" ? "🍞" : "🍔";
  const message = `${typeIcon} *Nuevo Pedido #${order.id}*\n👤 Cliente: ${order.customerName || "Desconocido"}\n📦 Items: ${items}\n💰 Total: $${(order.total || 0).toLocaleString("es-AR")}\n📋 Estado: ${order.status}\n${order.orderType === "pan_mayorista" ? "\n🔔 Pedido al por mayor — revisar con urgencia" : ""}`;

  for (const chatId of config.allowedChatIds) {
    await sendTelegramMessage(config.botToken, chatId, message, "Markdown");
  }
}
