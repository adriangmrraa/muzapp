import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { agentConfig } from "@/db/schema";

// Layer 1: Core prompt from DB or fallback
export async function getCorePrompt(): Promise<string> {
  try {
    const config = await db.query.agentConfig.findFirst({
      where: (config) => eq(config.id, 1),
    });
    
    if (config?.systemPrompt) {
      return config.systemPrompt;
    }
  } catch (err) {
    console.warn("[prompt-builder] agent_config table not available");
  }
  
  // Fallback to DEFAULT_SYSTEM_PROMPT from agent.ts
  return DEFAULT_SYSTEM_PROMPT;
}

// Layer 2: Data (menu, business hours, campaigns)
export async function getMenuData(): Promise<string> {
  try {
    const items = await db
      .select({
        name: products.name,
        price: products.price,
        description: products.description,
        line: products.line,
      })
      .from(products)
      .where(and(
        eq(products.available, true),
        eq(products.comingSoon, false)
      ))
      .orderBy(products.sortOrder);
    
    if (items.length === 0) {
      return "No hay productos disponibles en este momento.";
    }
    
    // Format as menu list
    const byLine: Record<string, string[]> = {};
    
    for (const item of items) {
      const line = item.line || "clasica";
      const price = item.price ? `$${Number(item.price).toLocaleString("es-AR")}` : "consultar";
      const entry = `• ${item.name} - ${price}${item.description ? ` — ${item.description}` : ""}`;
      
      if (!byLine[line]) byLine[line] = [];
      byLine[line].push(entry);
    }
    
    let menu = "📋 MENÚ ACTUAL:\n\n";
    
    for (const [line, itemsList] of Object.entries(byLine)) {
      menu += `[${line.toUpperCase()}]\n${itemsList.join("\n")}\n\n`;
    }
    
    return menu;
  } catch (err) {
    console.warn("[prompt-builder] menu fetch failed", err);
    return "Error al obtener el menú.";
  }
}

export async function getBusinessHours(): Promise<string> {
  // TODO: Get from agent_config.business_hours
  return `🕐 HORARIOS:
• Lunes a Viernes: 11:00 - 14:00 / 18:00 - 23:00
• Sábados y Domingos: 18:00 - 24:00`;
}

// Layer 3: Context is injected per conversation in agent.ts

// Build complete system prompt
export async function buildSystemPrompt(conversationId?: number, customerContext?: {
  name?: string;
  phone?: string;
  orderHistory?: any[];
}): Promise<string> {
  const layer1 = await getCorePrompt();
  const layer2 = await getMenuData();
  const layer3 = await getBusinessHours();
  
  // Build context layer
  let context = "";
  
  if (customerContext) {
    if (customerContext.name) {
      context += `\n👤 CLIENTE: ${customerContext.name}`;
    }
    if (customerContext.phone) {
      context += `\n📱 Tel: ${customerContext.phone}`;
    }
    if (customerContext.orderHistory && customerContext.orderHistory.length > 0) {
      context += `\n📦 PEDIDOS ANTERIORES:`;
      for (const order of customerContext.orderHistory.slice(-3)) {
        context += `\n• ${order.total}`;
      }
    }
  }
  
  // Combine layers
  return `${layer1}

${layer2}

${layer3}
${context ? `\n${context}` : ""}
---
Recordá usar SIEMPRE las herramientas para obtener información actualizada.`;
}

// Default fallback prompt
export const DEFAULT_SYSTEM_PROMPT = `Sos el asistente virtual de Mrs Muzzarella, una rotisería premium en Formosa, Argentina.

Tu personalidad:
- Amable, cordial y eficiente
- Respondés en español rioplatense informal (vos, dale, genial)
- Sos conciso — no escribís párrafos largos por WhatsApp
- Usás emojis con moderación (1-2 por mensaje máximo)

Tus capacidades:
- Podés mostrar el menú y precios actuales
- Podés verificar disponibilidad de productos
- Podés tomar pedidos (SIEMPRE confirmá los items antes de crear el pedido)
- Podés informar horarios de atención y delivery

Reglas:
- NUNCA inventés precios — usá siempre la herramienta getMenu
- SIEMPRE confirmá el pedido completo antes de usar createOrder
- Si el cliente pide algo que no está en el menú, sugerí alternativas disponibles
- Si te preguntan algo que no sea sobre comida/pedidos, respondé amablemente que solo podés ayudar con pedidos
- Ante la duda, derivás a un humano con "hablar con humano"`;