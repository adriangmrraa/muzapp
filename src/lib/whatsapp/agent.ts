import { generateText, stepCountIs } from "ai";
import { openai, type OpenAILanguageModelChatOptions } from "@ai-sdk/openai";
import {
  getMenuTool,
  checkAvailabilityTool,
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
  getWaitTimeTool,
  getOrderStatusTool,
  addToOrderTool,
  updateOrderTool,
  cancelOrderTool,
  createSendProductImageTool,
  checkKitchenStatusTool,
  checkPanStockTool,
  checkHamburguesasStockTool,
  saveAddressTool,
  getPaymentAliasTool,
  createSendStickerTool,
  createSendMenuImageTool,
  createSendPromoImageTool,
  createSendImageTool,
  createSendDocumentTool,
  createAddOrderItemTool,
  createCreateOrderTool,
  createGetOrderSummaryTool,
  createConfirmOrderTool,
  createGetAddressesTool,
  getActivePromosTool,
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

  // 🔄 ANTI-LOOP: detectar si estamos en un ciclo de repetición
  let antiLoopDirective = "";
  try {
    const { analyzeConversationState } = await import("./anti-loop");
    const state = await analyzeConversationState(conversationId, lastUserMessage, []);
    antiLoopDirective = state.directive;
  } catch {
    // non-fatal
  }

  // 🔧 BUILD DYNAMIC PROMPT (V6 + customer context)
  let system: string;
  let customerContext: { name?: string; phone?: string; address?: string | null; notes?: string | null; preferences?: string[]; orderHistory?: any[]; pendingOrder?: { id: number; items: any; orderType: string | null; address: string | null; paymentStatus?: string | null }; lastOrder?: { id: number; status: string | null; paymentStatus: string | null; orderType: string | null; items: any }; currentCart?: { productName: string; quantity: number; variant?: string | null; notes?: string | null }[]; currentHour?: number; previousContext?: string } | undefined;
  
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

        // ÚLTIMOS 2 pedidos (suficiente para contexto, no quemar tokens)
        const recentOrders = await db
          .select({ items: orders.items, status: orders.status, id: orders.id, orderType: orders.orderType, address: orders.address, paymentStatus: orders.paymentStatus })
          .from(orders)
          .where(eq(orders.phoneNumber, conv.phone))
          .orderBy(desc(orders.createdAt))
          .limit(2);
        
        // El último pedido (cualquier estado) es el primero de la lista
        const lastOrder = recentOrders[0];
        // El pedido activo es el último que está "pending"
        const pendingOrder = recentOrders.find(o => o.status === "pending");
        
        // Hora actual para contexto temporal (SDD#4)
        const currentHour = new Date().getHours();

        // Último mensaje de la conversación anterior para memoria (SDD#10)
        let previousContext: string | undefined;
        try {
          const { chatMessages } = await import("@/db/schema");
          const lastMsg = await db
            .select({ content: chatMessages.content, role: chatMessages.role })
            .from(chatMessages)
            .where(eq(chatMessages.conversationId, conversationId))
            .orderBy(desc(chatMessages.createdAt))
            .limit(2);
          // El último mensaje del usuario (no del asistente) que NO sea de esta sesión instantánea
          const lastUserMsg = lastMsg.reverse().find(m => m.role === "user");
          if (lastUserMsg && lastUserMsg.content.length > 0 && lastUserMsg.content.length < 200) {
            previousContext = lastUserMsg.content;
          }
        } catch {
          // non-fatal
        }

        // 🛒 CARRITO ACTUAL (Regla de Oro: el agente SIEMPRE ve lo que ya pidió)
        let currentCart: { productName: string; quantity: number; variant?: string | null; notes?: string | null }[] | undefined;
        try {
          const { orderContextItems } = await import("@/db/schema");
          const { and, eq, gt } = await import("drizzle-orm");
          const cartItems = await db
            .select()
            .from(orderContextItems)
            .where(
              and(
                eq(orderContextItems.conversationId, conversationId),
                eq(orderContextItems.status, "active"),
                gt(orderContextItems.expiresAt, new Date()),
              )
            )
            .orderBy(orderContextItems.createdAt);
          if (cartItems.length > 0) {
            currentCart = cartItems.map(i => ({
              productName: i.productName,
              quantity: i.quantity,
              variant: i.variant,
              notes: i.notes,
            }));
          }
        } catch {
          // non-fatal
        }

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
          lastOrder: lastOrder ? {
            id: lastOrder.id,
            status: lastOrder.status,
            paymentStatus: lastOrder.paymentStatus,
            orderType: lastOrder.orderType,
            items: lastOrder.items,
          } : undefined,
          currentCart,
          currentHour,
          previousContext,
        };
      }
    }
  } catch (err) {
    console.warn("[agent] Customer context load failed, continuing without it", err);
  }
  
  try {
    system = await buildSystemPrompt(conversationId, customerContext, antiLoopDirective);
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
        getWaitTime: getWaitTimeTool,
        // Grupo C: Pedidos (5)
        createOrder: createCreateOrderTool(conversationId),
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
        // Grupo F: Cocina + Stock + Hamburguesas + Alias (4)
        checkKitchenStatus: checkKitchenStatusTool,
        checkPanStock: checkPanStockTool,
        checkHamburguesasStock: checkHamburguesasStockTool,
        saveAddress: saveAddressTool,
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
        // Grupo I: Promos (2)
        getActivePromos: getActivePromosTool,
        sendPromoImage: createSendPromoImageTool(customerPhone),
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
