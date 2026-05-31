import { generateText, stepCountIs } from "ai";
import { openai, type OpenAILanguageModelChatOptions } from "@ai-sdk/openai";
import {
  getMenuTool,
  checkAvailabilityTool,
  createOrderTool,
  getBusinessHoursTool,
  createTransferToHumanTool,
  getProductDetailsTool,
  getProductPriceTool,
  searchProductsTool,
  checkProductAvailabilityTool,
  suggestProductsTool,
  getClientHistoryTool,
  checkDeliveryTool,
  getDeliveryTimeTool,
  listAvailableProductsTool,
  getOrderStatusTool,
  addToOrderTool,
  updateOrderTool,
  cancelOrderTool,
  createSendProductImageTool,
  checkKitchenStatusTool,
  checkPanStockTool,
  getPaymentAliasTool,
  createSendStickerTool,
  createSendMenuImageTool,
  createSendImageTool,
  createSendDocumentTool,
  createAddOrderItemTool,
  createGetOrderSummaryTool,
  createConfirmOrderTool,
  createGetAddressesTool,
} from "./tools";
import { detectInjection } from "./tools/prompt-security";
import { buildSystemPrompt, DEFAULT_SYSTEM_PROMPT } from "./prompt-builder";
interface RunAgentParams {
  conversationId: number;
  customerPhone: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}

export async function runWhatsAppAgent({
  conversationId,
  customerPhone,
  messages,
}: RunAgentParams): Promise<string> {
  // 🛡️ PROMPT INJECTION DETECTION
  const lastUserMessage = messages[messages.length - 1]?.content || "";
  const injectionCheck = detectInjection(lastUserMessage);
  
  if (injectionCheck.detected) {
    console.warn("[agent] Prompt injection detected:", injectionCheck.pattern);
    return "No puedo procesar esa solicitud. ¿Querés hacer un pedido o ver el menú?";
  }

  // 🔧 BUILD DYNAMIC PROMPT (V6 + customer context)
  let system: string;
  let customerContext: { name?: string; phone?: string; address?: string | null; notes?: string | null; preferences?: string[]; orderHistory?: any[]; pendingOrder?: { id: number; items: any; orderType: string | null; address: string | null; paymentStatus?: string | null } } | undefined;
  
  try {
    // Cargar contexto del cliente (nombre, historial de pedidos)
    const { db } = await import("@/db");
    const { conversations: convTable, orders } = await import("@/db/schema");
    const { eq, desc, and } = await import("drizzle-orm");
    
    if (conversationId > 0) {
      const [conv] = await db
        .select({ name: convTable.customerName, phone: convTable.customerPhone })
        .from(convTable)
        .where(eq(convTable.id, conversationId))
        .limit(1);
      
      if (conv?.phone) {
        // Datos del lead (dirección, notas, tags)
        const { leads } = await import("@/db/schema");
        const [lead] = await db
          .select({ address: leads.address, tags: leads.tags, notes: leads.notes })
          .from(leads)
          .where(eq(leads.phone, conv.phone))
          .limit(1);

        // Productos que más repite (preferencias)
        const allOrders = await db
          .select({ items: orders.items })
          .from(orders)
          .where(eq(orders.phoneNumber, conv.phone))
          .orderBy(desc(orders.createdAt))
          .limit(20);
        const prefCounter = new Map<string, number>();
        for (const o of allOrders) {
          const items = o.items as { name?: string }[] | null;
          if (!items) continue;
          for (const item of items) {
            if (item.name) prefCounter.set(item.name, (prefCounter.get(item.name) ?? 0) + 1);
          }
        }
        const preferences = [...prefCounter.entries()]
          .sort((a, b) => b[1] - a[1])
          .filter(([, count]) => count >= 2)
          .slice(0, 5)
          .map(([name]) => name);

        // Órdenes anteriores (historial)
        const recentOrders = await db
          .select({ items: orders.items, status: orders.status, id: orders.id, orderType: orders.orderType, address: orders.address })
          .from(orders)
          .where(eq(orders.phoneNumber, conv.phone))
          .orderBy(desc(orders.createdAt))
          .limit(3);
        
        // Buscar pedido RECIENTE (pending o preparing - no entregado ni cancelado)
        // Incluye "preparing" porque el admin puede avanzar el estado desde el panel
        const [pendingOrder] = await db
          .select({
            id: orders.id,
            items: orders.items,
            orderType: orders.orderType,
            status: orders.status,
            address: orders.address,
            customerName: orders.customerName,
            paymentStatus: orders.paymentStatus,
          })
          .from(orders)
          .where(and(
            eq(orders.phoneNumber, conv.phone),
            eq(orders.status, "pending"),
          ))
          .orderBy(desc(orders.createdAt))
          .limit(1);
        
        customerContext = {
          name: conv.name || undefined,
          phone: conv.phone,
          address: lead?.address || null,
          notes: lead?.notes || null,
          preferences: preferences.length > 0 ? preferences : undefined,
          orderHistory: recentOrders.map(o => ({ items: o.items, status: o.status, id: o.id })),
          pendingOrder: pendingOrder ? {
            id: pendingOrder.id,
            items: pendingOrder.items,
            orderType: pendingOrder.orderType,
            address: pendingOrder.address,
            paymentStatus: pendingOrder.paymentStatus,
          } : undefined,
        };
      }
    }
  } catch (err) {
    console.warn("[agent] Customer context load failed, continuing without it", err);
  }
  
  try {
    system = await buildSystemPrompt(conversationId, customerContext);
  } catch (err) {
    console.warn("[agent] buildSystemPrompt failed, using fallback", err);
    system = DEFAULT_SYSTEM_PROMPT;
  }

  try {
    const result = await generateText({
      model: openai.chat("gpt-5-mini"),
      system,
      messages,
      providerOptions: {
        openai: {
          systemMessageMode: "developer",
        } satisfies OpenAILanguageModelChatOptions,
      },
      tools: {
        // Grupo A: Menú y productos
        getMenu: getMenuTool,
        getProductDetails: getProductDetailsTool,
        getProductPrice: getProductPriceTool,
        searchProducts: searchProductsTool,
        // Grupo B: Disponibilidad y delivery
        checkAvailability: checkAvailabilityTool,
        checkProductAvailability: checkProductAvailabilityTool,
        checkDelivery: checkDeliveryTool,
        getDeliveryTime: getDeliveryTimeTool,
        listAvailableProducts: listAvailableProductsTool,
        // Grupo C: Pedidos (5)
        createOrder: createOrderTool,
        getOrderStatus: getOrderStatusTool,
        addToOrder: addToOrderTool,
        updateOrder: updateOrderTool,
        cancelOrder: cancelOrderTool,
        // Grupo D: Cliente y venta consultiva (2)
        suggestProducts: suggestProductsTool,
        getClientHistory: getClientHistoryTool,
        // Grupo E: Operaciones (2)
        getBusinessHours: getBusinessHoursTool,
        transferToHuman: createTransferToHumanTool(conversationId),
        // Grupo F: Cocina + Stock + Alias (3)
        checkKitchenStatus: checkKitchenStatusTool,
        checkPanStock: checkPanStockTool,
        getPaymentAlias: getPaymentAliasTool,
        // Grupo G: Multimedia + Stickers (5)
        sendProductImage: createSendProductImageTool(customerPhone),
        sendSticker: createSendStickerTool(customerPhone),
        sendMenuImage: createSendMenuImageTool(customerPhone),
        sendImage: createSendImageTool(customerPhone),
        sendDocument: createSendDocumentTool(customerPhone),
        // Grupo H: Order Context (memoria del pedido)
        addOrderItem: createAddOrderItemTool(conversationId, customerPhone),
        getOrderSummary: createGetOrderSummaryTool(conversationId),
        confirmOrder: createConfirmOrderTool(conversationId, customerPhone),
        getAddresses: createGetAddressesTool(customerPhone),
      },
      stopWhen: stepCountIs(10),
      toolChoice: "auto",
    });

    const rawText = result.text || "";
    const finalText = rawText.replace(/\[INTERNAL_[^\]]*\]/g, "").trim();
    
    return finalText || "Disculpá, no pude procesar tu mensaje. ¿Podés intentar de nuevo?";
  } catch (error) {
    console.error("[agent] Error running WhatsApp agent:", error);
    return "Disculpá, tuve un problema técnico. Escribí 'hablar con humano' si querés que te atienda Leandro personalmente.";
  }
}
