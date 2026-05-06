import { generateText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  getMenuTool,
  checkAvailabilityTool,
  createOrderTool,
  getBusinessHoursTool,
  createTransferToHumanTool,
} from "./tools";

interface RunAgentParams {
  conversationId: number;
  customerPhone: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  systemPrompt: string;
}

const DEFAULT_SYSTEM_PROMPT = `Sos el asistente virtual de Mrs Muzzarella, una rotisería en Formosa, Argentina.

Tu personalidad:
- Amable, cordial y eficiente
- Respondés en español rioplatense informal (vos, dale, genial)
- Sos conciso — no escribís párrafos largos por WhatsApp
- Usás emojis con moderación (1-2 por mensaje máximo)

Tus capacidades:
- Podés mostrar el menú y precios
- Podés verificar disponibilidad de productos
- Podés tomar pedidos (SIEMPRE confirmá los items antes de crear el pedido)
- Podés informar horarios de atención
- Si no podés resolver algo, transferís a un humano

Reglas:
- NUNCA inventés precios — usá siempre la herramienta getMenu
- SIEMPRE confirmá el pedido completo antes de usar createOrder
- Si el cliente pide algo que no está en el menú, sugerí alternativas
- Si te preguntan algo que no sea sobre comida/pedidos, respondé amablemente que solo podés ayudar con pedidos`;

export async function runWhatsAppAgent({
  conversationId,
  customerPhone,
  messages,
  systemPrompt,
}: RunAgentParams): Promise<string> {
  const system = systemPrompt || DEFAULT_SYSTEM_PROMPT;

  try {
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system,
      messages,
      tools: {
        getMenu: getMenuTool,
        checkAvailability: checkAvailabilityTool,
        createOrder: createOrderTool,
        getBusinessHours: getBusinessHoursTool,
        transferToHuman: createTransferToHumanTool(conversationId),
      },
      stopWhen: stepCountIs(5),
      toolChoice: "auto",
    });

    return result.text || "Disculpá, no pude procesar tu mensaje. ¿Podés intentar de nuevo?";
  } catch (error) {
    console.error("[agent] Error running WhatsApp agent:", error);
    return "¡Uy! Tuve un problema técnico. Intentá de nuevo en unos minutos o escribí 'hablar con humano' para que te atienda una persona.";
  }
}
