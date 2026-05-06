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
} from "./tools";
import { detectInjection } from "./tools/prompt-security";
import { buildSystemPrompt, DEFAULT_SYSTEM_PROMPT } from "./prompt-builder";
import { formatAsWhatsAppBubbles } from "./smart-split";

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

  // 🎯 DETECTAR FLUJO EMOCIONAL
  const emotionalTrigger = detectEmotionalTrigger(lastUserMessage);
  let emotionalResponse = null;
  
  if (emotionalTrigger) {
    emotionalResponse = getEmotionalResponse(emotionalTrigger);
    if (emotionalResponse) {
      // Responder con el flujo emocional primero, luego continue
      console.log("[agent] Emotional flow triggered:", emotionalTrigger);
    }
  }

  // 🔧 BUILD DYNAMIC PROMPT (3 layers: core + data + context)
  let system: string;
  try {
    system = customPrompt || await buildSystemPrompt(conversationId);
  } catch (err) {
    console.warn("[agent] buildSystemPrompt failed, using fallback", err);
    system = DEFAULT_SYSTEM_PROMPT;
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
        // Grupo F: Multimedia (1)
        sendProductImage: createSendProductImageTool(customerPhone),
      },
      stopWhen: stepCountIs(8),
      toolChoice: "auto",
    });

    let rawText = result.text || "Disculpá, no pude procesar tu mensaje. ¿Podés intentar de nuevo?";
    
    // 📨 SMART SPLIT — dividir respuestas largas en burbujas
    const bubbles = formatAsWhatsAppBubbles(rawText);
    const finalText = bubbles.length > 1 
      ? bubbles.join("\n\n---\n\n") 
      : rawText;
    
    return finalText;
  } catch (error) {
    console.error("[agent] Error running WhatsApp agent:", error);
    return "¡Uy! Tuve un problema técnico. Intentá de nuevo en unos minutos o escribí 'hablar con humano' para que te atienda una persona.";
  }
}
