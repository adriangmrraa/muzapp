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
import { getArgentinaHour } from "@/lib/argentina-time";
interface RunAgentParams {
  conversationId: number;
  customerPhone: string;
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
}

export interface PendingMedia {
  type: "image" | "document" | "sticker";
  url: string;
  caption: string;
  dbContent: string;
}

export async function runWhatsAppAgent({
  conversationId,
  customerPhone,
  messages,
}: RunAgentParams): Promise<{ text: string; pendingMedia: PendingMedia[] }> {
  // 🛡️ PROMPT INJECTION DETECTION
  const lastUserMessage = messages[messages.length - 1]?.content || "";
  const injectionCheck = detectInjection(lastUserMessage);
  
  if (injectionCheck.detected) {
    console.warn("[agent] Prompt injection detected:", injectionCheck.pattern);
    return { text: "No puedo procesar esa solicitud. ¿Querés hacer un pedido o ver el menú?", pendingMedia: [] };
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

  // 🚫 DETECCIÓN NO-COMERCIAL: detectar si el cliente no está interesado en comprar
  let nonCommercialDirective = "";
  try {
    const { classifyMessageType } = await import("./anti-loop");
    const currentType = classifyMessageType(lastUserMessage);
    
    if (currentType === "non_commercial") {
      // Buscar el mensaje ANTERIOR del usuario en el array messages
      const prevUserMessage = messages
        .slice(0, -1) // todo excepto el actual
        .reverse()
        .find((m) => m.role === "user");
      
      const wasPrevNonCommercial = prevUserMessage
        ? classifyMessageType(prevUserMessage.content) === "non_commercial"
        : false;

      if (wasPrevNonCommercial) {
        // 2+ mensajes no-comerciales consecutivos → transferir a humano
        nonCommercialDirective = "🚫 NO COMERCIAL: El cliente NO está haciendo un pedido ni consulta del negocio. Respondé: 'Ahí te paso con Leandro, yo estoy para cosas del negocio' y ejecutá transferToHuman.";
      } else {
        // Primer mensaje no-comercial → responder amable sin vender
        nonCommercialDirective = "🚫 NO COMERCIAL: Este mensaje no parece ser sobre el negocio. Respondé amable 'Holaa ¿todo bien?' SIN ofrecer menú, SIN arrancar flujo de venta, SIN preguntar qué quiere.";
      }
    }
  } catch {
    // non-fatal
  }

  // 🔧 BUILD DYNAMIC PROMPT (V6 + customer context)
  let system: string;
  let customerContext: { name?: string; phone?: string; address?: string | null; savedAddresses?: string[]; detectedLine?: "b2c" | "b2b"; notes?: string | null; preferences?: string[]; orderHistory?: any[]; pendingOrder?: { id: number; items: any; orderType: string | null; address: string | null; paymentStatus?: string | null }; lastOrder?: { id: number; status: string | null; paymentStatus: string | null; orderType: string | null; items: any }; currentCart?: { productName: string; quantity: number; variant?: string | null; notes?: string | null }[]; currentHour?: number; previousContext?: string } | undefined;
  
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

        // 📍 Direcciones guardadas (pueden ser múltiples)
        let savedAddresses: string[] = [];
        try {
          const { getCustomerAddresses } = await import("@/lib/addresses");
          const addrs = await getCustomerAddresses(conv.phone);
          if (addrs.length > 0) {
            savedAddresses = addrs.map(a => a.address);
          }
        } catch {
          // non-fatal
        }

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
        
        const { getArgentinaHour } = await import("@/lib/argentina-time");
        const currentHour = getArgentinaHour();

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

        // 🔍 Detectar línea del cliente (B2C hamburguesas vs B2B pan mayorista)
        let detectedLine: "b2c" | "b2b" | undefined;
        if (lastOrder?.orderType === "hamburguesas") {
          detectedLine = "b2c";
        } else if (lastOrder?.orderType === "pan_mayorista") {
          detectedLine = "b2b";
        } else if (preferences.length > 0) {
          // Clasificar por productos favoritos
          const b2bKwd = ["prepizza", "pan de lomito", "pan de hamburguesa", "pancho", "pan ", "lomito"];
          const b2cKwd = ["bookbinder", "deli deli", "mamita", "crispy", "toro", "papas", "hamburguesa", "genesis"];
          const b2bScore = preferences.filter(p => b2bKwd.some(k => p.toLowerCase().includes(k))).length;
          const b2cScore = preferences.filter(p => b2cKwd.some(k => p.toLowerCase().includes(k))).length;
          if (b2bScore > b2cScore) detectedLine = "b2b";
          else if (b2cScore > b2bScore) detectedLine = "b2c";
        }

        customerContext = {
          name: conv.name || undefined,
          phone: conv.phone,
          address: lead?.address || null,
          savedAddresses: savedAddresses.length > 0 ? savedAddresses : undefined,
          detectedLine,
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
    system = await buildSystemPrompt(conversationId, customerContext, antiLoopDirective, nonCommercialDirective);
  } catch (err) {
    console.warn("[agent] buildSystemPrompt failed, using fallback", err);
    system = DEFAULT_SYSTEM_PROMPT;
  }

  const MODEL_NAME = "gpt-5.4-mini";
  const MAX_HALLUCINATION_RETRIES = 1;
  let attempt = 0;

  console.log(`[agent] Using model: ${MODEL_NAME} — parallelToolCalls:false (sequential tools) to avoid reasoning=none restriction`);
  
  while (attempt <= MAX_HALLUCINATION_RETRIES) {
    attempt++;
    if (attempt > 1) {
      console.log(`[agent] 🔄 Hallucination retry #${attempt - 1} — injecting force directive`);
    }

    // On retry, inject a force directive into the LAST user message
    let retryMessages = messages;
    if (attempt > 1) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === "user") {
        retryMessages = [
          ...messages.slice(0, -1),
          {
            role: "user" as const,
            content: `${lastMsg.content}\n\n⚠️ IMPORTANTE: El asistente anterior respondió diciendo que envió imágenes pero NO llamó a ninguna herramienta multimedia. El nuevo asistente DEBE llamar primero a sendPromoImage, sendMenuImage o sendProductImage antes de decir que las envió.`,
          },
        ];
      }
    }

    try {
      const result = await generateText({
        model: openai.chat(MODEL_NAME),
        system,
        messages: retryMessages,
        providerOptions: {
          openai: {
            systemMessageMode: "developer",
            parallelToolCalls: false,
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
        sendProductImage: createSendProductImageTool(conversationId, customerPhone),
        sendSticker: createSendStickerTool(conversationId, customerPhone),
        sendMenuImage: createSendMenuImageTool(conversationId, customerPhone),
        sendImage: createSendImageTool(conversationId, customerPhone),
        sendDocument: createSendDocumentTool(conversationId, customerPhone),
        // Grupo H: Order Context (memoria del pedido)
        addOrderItem: createAddOrderItemTool(conversationId, customerPhone),
        getOrderSummary: createGetOrderSummaryTool(conversationId),
        confirmOrder: createConfirmOrderTool(conversationId, customerPhone),
        getAddresses: createGetAddressesTool(customerPhone),
        // Grupo I: Promos (2)
        getActivePromos: getActivePromosTool,
        sendPromoImage: createSendPromoImageTool(conversationId, customerPhone),
      },
      stopWhen: stepCountIs(10),
      toolChoice: "auto",
    });

    // Log modelo real usado por la API (cross-check)
    console.log(`[agent] ✅ generateText success — API model: ${JSON.stringify((result as any).response?.model || "unknown")}, tools called: ${(result.toolResults || []).length}`);

    const rawText = result.text || "";
    const finalText = rawText.replace(/\[INTERNAL_[^\]]*\]/g, "").trim();

    // 🔍 Extraer media pendiente de los tool results
    const pendingMedia: PendingMedia[] = [];
    const mediaToolNames = ["sendMenuImage", "sendProductImage", "sendImage", "sendSticker", "sendDocument", "sendPromoImage"];
    
    for (const tr of result.toolResults || []) {
      if (mediaToolNames.includes(tr.toolName)) {
        try {
          const parsed = typeof tr.output === "string" ? JSON.parse(tr.output) : null;
          if (parsed?._batch && Array.isArray(parsed._media)) {
            for (const m of parsed._media) {
              pendingMedia.push({
                type: m.type || "image",
                url: m.url,
                caption: m.caption || "",
                dbContent: m.dbContent || "",
              });
            }
          } else if (parsed?._media) {
            pendingMedia.push({
              type: parsed.type || "image",
              url: parsed.url,
              caption: parsed.caption || "",
              dbContent: parsed.dbContent || "",
            });
          }
        } catch {
          // Si no es JSON (tool falló o devolvió texto normal), ignorar
        }
      }
    }
    
    // 🛡️ POST-PROCESSING GUARD: detectar hallucination y retry
    const lastUserMsg = messages.filter(m => m.role === "user").pop()?.content.toLowerCase() || "";
    const userWantsMedia = /menú|menu|foto|imagen|ver\s*(las\s*)?promo|mostr|qué\s*tienen|carta|bookbinder|combo|promo|oferta|descuento|qué\s*me\s*recomend|la\s*de\s*\d+|qué\s*me\s*convién/i.test(lastUserMsg);
    const assistantClaimsMedia = /acá\s*ten[eé]s\s*(el\s*menú|la\s*foto|las\s*promos|el\s*men[uú])|te\s*mand[éeui]|ahí\s*van/i.test(finalText);
    
    const isHallucination = userWantsMedia && assistantClaimsMedia && pendingMedia.length === 0;
    
    if (isHallucination && attempt <= MAX_HALLUCINATION_RETRIES) {
      console.warn(`[agent] 🚨 MODEL HALLUCINATION detected (attempt ${attempt}/${MAX_HALLUCINATION_RETRIES+1}) — retrying with force directive`);
      continue; // retry with force directive injected at top of while loop
    }
    
    if (isHallucination) {
      console.error(`[agent] 💀 MODEL HALLUCINATION survived after ${MAX_HALLUCINATION_RETRIES+1} attempts — returning fallback response`);
      return {
        text: "Te consulto con Leandro sobre las promos y te paso las imágenes en un toque.",
        pendingMedia: [],
      };
    }
    
    // ✅ No hallucination — return normal response
    return { text: finalText || "Disculpá, no pude procesar tu mensaje. ¿Podés intentar de nuevo?", pendingMedia };
    
    } catch (error) {
      console.error("[agent] Error running WhatsApp agent:", error);
      return { text: "Disculpá, tuve un problema técnico. Escribí 'hablar con humano' si querés que te atienda Leandro personalmente.", pendingMedia: [] };
    }
  }

  // Safety guard — should never reach here (all paths return or continue inside loop)
  return { text: "Disculpá, no pude procesar tu mensaje. ¿Podés intentar de nuevo?", pendingMedia: [] };
}
