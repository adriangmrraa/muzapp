import { generateText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
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
} from "./tools";
import { detectInjection } from "./tools/prompt-security";
import { buildSystemPrompt, DEFAULT_SYSTEM_PROMPT } from "./prompt-builder";
// smart-split unificado en response-sender.ts — ya no se usa acá

interface RunAgentParams {
  conversationId: number;
  customerPhone: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  systemPrompt?: string;
}

// 🎯 FLUJOS EMOCIONALES (adaptados de ClinicForge F1-F9)
// Detecta el tipo de situación emocional y retorna el handler apropiado

type EmotionalTrigger = "F1_MALA_EXPERIENCIA" | "F3_URGENCIA" | "F5_PRECIO" | "F6_PERDIDA_DIENTES" | "F7_MIEDO" | null;

function detectEmotionalTrigger(message: string): EmotionalTrigger {
  const m = message.toLowerCase();
  
  // F1: Mala experiencia previa en otro lado
  if (m.includes("otra parte") || m.includes("otro lado") || m.includes("otro restaurant") || 
      m.includes("antes no me gusto") || m.includes("otra vez") && m.includes("mal")) {
    return "F1_MALA_EXPERIENCIA";
  }
  
  // F3: Urgencia / hambre
  if (m.includes("tengo hambre") || m.includes("urgente") || m.includes("ya") || m.includes("ahora") ||
      m.includes("para ahora") || m.includes("rápido")) {
    return "F3_URGENCIA";
  }
  
  // F5: Precio directo
  if (m.includes("cuánto sale") || m.includes("cuánto cuesta") || m.includes("precio") || m.includes("cuánto")) {
    return "F5_PRECIO";
  }
  
  // F6: Pérdida de dientes / urgencia dental (gastronomy: comida)
  if (m.includes("sin comer") || m.includes("no puedo comer") || m.includes("hambre")) {
    return "F6_PERDIDA_DIENTES";
  }
  
  // F7: Miedo / ansiedad
  if (m.includes("no sé") || m.includes("duda") || m.includes("me da cosa") || m.includes("no entiendo")) {
    return "F7_MIEDO";
  }
  
  return null;
}

function getEmotionalResponse(trigger: EmotionalTrigger, customerName?: string): string | null {
  const name = customerName || "chico/a";
  
  switch (trigger) {
    case "F1_MALA_EXPERIENCIA":
      return `Entiendo tu preocupación ${name}. En Mrs Muzzarella somos distintos — preparamos todo fresco, con ingredientes de calidad y sin conservantes. Dale una chance, probá alguna de nuestras burgers y me decís! 🍔`;
    
    case "F3_URGENCIA":
      return `¡Te entiendo! La línea de pollo es la más rápida y están tope ricas.¿Querés que te tome el pedido ahora para que llegue lo antes posible? 🚀`;
    
    case "F5_PRECIO":
      // El agente usará getMenu - esto es solo fallback
      return null;
    
    case "F6_PERDIDA_DIENTES":
      return `¡No te quedes sin comer! Nuestras burgers son completas y rendidoras. Te paso el menú para que elijas lo que más te llame la atención 🍔`;
    
    case "F7_MIEDO":
      return `Tranqui ${name}, cualquier duda me preguntás y te asesoro. ¿Qué te llama la atención del menú?`;
    
    default:
      return null;
  }
}

export async function runWhatsAppAgent({
  conversationId,
  customerPhone,
  messages,
  systemPrompt: customPrompt,
}: RunAgentParams): Promise<string> {
  // 🛡️ PROMPT INJECTION DETECTION
  const lastUserMessage = messages[messages.length - 1]?.content || "";
  const injectionCheck = detectInjection(lastUserMessage);
  
  if (injectionCheck.detected) {
    console.warn("[agent] Prompt injection detected:", injectionCheck.pattern);
    return "No puedo procesar esa solicitud. ¿Querés hacer un pedido o ver el menú?";
  }

  // 🎯 DETECTAR FLUJO EMOCIONAL E INYECTARLO EN EL CONTEXTO
  const emotionalTrigger = detectEmotionalTrigger(lastUserMessage);
  let emotionalContext = "";
  
  if (emotionalTrigger) {
    const emotionalResponse = getEmotionalResponse(emotionalTrigger);
    if (emotionalResponse) {
      console.log("[agent] Emotional flow triggered:", emotionalTrigger);
      emotionalContext = `\n\nCONTEXTO EMOCIONAL DETECTADO: El cliente muestra ${emotionalTrigger.replace(/_/g, " ").toLowerCase()}. Respondé con empatía primero y luego avanza al flujo normal.\nRespuesta emocional sugerida: "${emotionalResponse}"\n---`;
    }
  }

  // 🔧 BUILD DYNAMIC PROMPT (V2 base + emotional context + user extras + menu + hours + context)
  // El prompt V2 siempre va como base. Lo del admin UI se agrega como seccion extra.
  // customPrompt del webhook ya NO se usa como override — buildSystemPrompt maneja todo.
  let system: string;
  let customerContext: { name?: string; phone?: string; orderHistory?: any[]; pendingOrder?: { id: number; items: any; orderType: string | null; address: string | null } } | undefined;
  
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
          orderHistory: recentOrders.map(o => ({ items: o.items, status: o.status, id: o.id })),
          pendingOrder: pendingOrder ? {
            id: pendingOrder.id,
            items: pendingOrder.items,
            orderType: pendingOrder.orderType,
            address: pendingOrder.address,
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

  // Inyectar contexto emocional si se detectó
  if (emotionalContext) {
    system = system + emotionalContext;
  }

  try {
    const result = await generateText({
      model: openai("gpt-5.4-mini"),
      system,
      messages,
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
        // Grupo G: Multimedia + Stickers (3)
        sendProductImage: createSendProductImageTool(customerPhone),
        sendSticker: createSendStickerTool(customerPhone),
        sendMenuImage: createSendMenuImageTool(customerPhone),
      },
      stopWhen: stepCountIs(10),
      toolChoice: "auto",
    });

    let rawText = result.text || "Disculpá, no pude procesar tu mensaje. ¿Podés intentar de nuevo?";

    // Limpiar markers internos que el LLM pueda haber incluido
    const finalText = rawText.replace(/\[INTERNAL_[^\]]*\]/g, "").trim();
    
    return finalText;
  } catch (error) {
    console.error("[agent] Error running WhatsApp agent:", error);
    return "¡Uy! Tuve un problema técnico. Intentá de nuevo en unos minutos o escribí 'hablar con humano' para que te atienda una persona.";
  }
}
