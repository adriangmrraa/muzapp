import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { agentConfig } from "@/db/schema";

// Layer 1: Core prompt (V2 SIEMPRE como base) + extras del usuario desde la UI
export async function getCorePrompt(): Promise<string> {
  let userExtras = "";
  let instruccionesExtra = "";
  let promosActivas = "";
  let trainContext = "";
  let customSystemPrompt = "";

  try {
    const config = await db.query.agentConfig.findFirst({
      where: (config) => eq(config.id, 1),
    });

    if (config?.systemPrompt && config.systemPrompt.trim().length > 0) {
      userExtras = config.systemPrompt.trim();
    }

    if (config?.whatsappInstructions && config.whatsappInstructions.trim().length > 0) {
      instruccionesExtra = config.whatsappInstructions.trim();
    }

    if (config?.whatsappPromociones && config.whatsappPromociones.trim().length > 0) {
      promosActivas = config.whatsappPromociones.trim();
    }

    if (config?.trainBotContext && config.trainBotContext.trim().length > 0) {
      trainContext = config.trainBotContext.trim();
    }

    if (config?.whatsappSystemPrompt && config.whatsappSystemPrompt.trim().length > 0) {
      customSystemPrompt = config.whatsappSystemPrompt.trim();
    }
  } catch (err) {
    console.warn("[prompt-builder] agent_config table not available");
  }

  // Build extra sections
  const extraSections: string[] = [];

  if (userExtras) {
    extraSections.push(`INSTRUCCIONES ADICIONALES DEL ADMINISTRADOR:\n\n${userExtras}`);
  }

  if (instruccionesExtra) {
    extraSections.push(`INSTRUCCIONES ESPECIFICAS:\n\n${instruccionesExtra}`);
  }

  if (promosActivas) {
      extraSections.push(`PROMOCIONES ACTIVAS:\n\n${promosActivas}\n\nInformá estas promos cuando el cliente pida recomendaciones o pregunte por descuentos.`);
    }

    if (trainContext) {
      extraSections.push(`CONTEXTO DEL NEGOCIO:\n\n${trainContext}`);
    }

    const basePrompt = customSystemPrompt || DEFAULT_SYSTEM_PROMPT;

    if (extraSections.length > 0) {
      return `${basePrompt}

---

${extraSections.join("\n\n---\n\n")}

---
Fin de instrucciones adicionales. Las reglas base siguen vigentes.`;
    }

    return basePrompt;
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
    
    // Format as plain text reference for the agent
    const byLine: Record<string, string[]> = {};

    for (const item of items) {
      const line = item.line || "clasica";
      const price = item.price ? `$${Number(item.price).toLocaleString("es-AR")}` : "a consultar";
      const entry = `${item.name} (${price})${item.description ? ` — ${item.description}` : ""}`;

      if (!byLine[line]) byLine[line] = [];
      byLine[line].push(entry);
    }

    let menu = "PRODUCTOS DISPONIBLES (usá esta info al mostrar el menú, en texto natural, sin listas):\n\n";

    for (const [line, itemsList] of Object.entries(byLine)) {
      menu += `Línea ${line}: ${itemsList.join(", ")}\n`;
    }

    return menu;
  } catch (err) {
    console.warn("[prompt-builder] menu fetch failed", err);
    return "Error al obtener el menú.";
  }
}

export async function getBusinessHours(): Promise<string> {
  let horas = `HORARIOS: Usa getBusinessHours para consultar los horarios actualizados.`;
  let zonas = "";

  try {
    const config = await db.query.agentConfig.findFirst({
      where: (config) => eq(config.id, 1),
    });

    if (config?.businessHours && Array.isArray(config.businessHours)) {
      const days = config.businessHours as { day: string; open: boolean; openTime: string; closeTime: string }[];
      const openDays = days.filter(d => d.open);
      if (openDays.length > 0) {
        horas = `HORARIOS:\n${openDays.map(d => `- ${d.day}: ${d.openTime} a ${d.closeTime}`).join("\n")}`;
      }
    }

    if (config?.whatsappZonasDelivery && Array.isArray(config.whatsappZonasDelivery)) {
      const zonasData = config.whatsappZonasDelivery as { zona: string; disponible: boolean; tiempo: string; costo: number }[];
      const disponibles = zonasData.filter(z => z.disponible);
      if (disponibles.length > 0) {
        zonas = `ZONAS DE DELIVERY:\n${disponibles.map(z => `- ${z.zona}: ${z.tiempo}${z.costo > 0 ? ` ($${z.costo})` : " (gratis)"}`).join("\n")}`;
      }
    }
  } catch {
    // fallback a valores hardcodeados
  }

  if (zonas) {
    return `${horas}\n\n${zonas}`;
  }

  return horas;
}

// Layer 3: Operational data (cocina, stock, alias, menu images)
export async function getOperationalData(): Promise<string> {
  const sections: string[] = [];

  try {
    const config = await db.query.agentConfig.findFirst({
      where: (c) => eq(c.id, 1),
    });

    if (!config) return "";

    // Cocina operativa
    if (config.isCooking === true) {
      sections.push("ESTADO COCINA: La cocina está operativa");
    } else {
      sections.push("ESTADO COCINA: La cocina está apagada en este momento");
    }

    // Stock pan mayorista
    if (typeof config.stockPanDocenas === "number") {
      sections.push(`STOCK PAN MAYORISTA: ${config.stockPanDocenas} docenas disponibles actualmente`);
    }

    // Delivery
    if (config.deliveryPhoneNumber) {
      sections.push(`DELIVERY WHATSAPP: El número del delivery es ${config.deliveryPhoneNumber}. No le des este número al cliente — decile "mandale tu ubicación al delivery" y el sistema se encarga.`);
    }

    // Alias de pago
    const aliasParts: string[] = [];
    if (config.aliasB2c) {
      aliasParts.push(`B2C (hamburguesas): ${config.aliasB2c}`);
    }
    if (config.aliasB2b) {
      aliasParts.push(`B2B (pan mayorista): ${config.aliasB2b}`);
    }
    if (aliasParts.length > 0) {
      sections.push(`ALIAS DE PAGO: ${aliasParts.join(" | ")}`);
    }

    // Menú imagen disponible
    if (config.menuImageUrlHamburguesas) {
      sections.push("MENU IMAGEN: Hay foto del menú de hamburguesas disponible. Usá sendMenuImage('hamburguesas') cuando pidan el menú.");
    }
    if (config.menuImageUrlPan) {
      sections.push("MENU IMAGEN PAN: Hay foto del menú de pan disponible. Usá sendMenuImage('pan') cuando pidan el menú de pan.");
    }

    // Identidad
    if (config.aliasB2c) {
      sections.push(`ALIAS MP: ${config.aliasB2c}`);
    }

  } catch (err) {
    console.warn("[prompt-builder] operational data fetch failed", err);
  }

  return sections.length > 0 ? sections.join("\n") : "";
}

// Layer 4: Context is injected per conversation in agent.ts

// Build complete system prompt
export async function buildSystemPrompt(conversationId?: number, customerContext?: {
  name?: string;
  phone?: string;
  address?: string | null;
  preferences?: string[];
  orderHistory?: any[];
  pendingOrder?: { id: number; items: any; orderType: string | null; address: string | null };
}): Promise<string> {
  const layer1 = await getCorePrompt();
  const layer2 = await getMenuData();
  const layer3 = await getBusinessHours();
  const layer4 = await getOperationalData();
  
  // Build context layer
  let context = "";
  
  if (customerContext) {
    if (customerContext.name) {
      context += `\n👤 CLIENTE: ${customerContext.name}`;
    }
    if (customerContext.phone) {
      context += `\n📱 Tel: ${customerContext.phone}`;
    }
    if (customerContext.address) {
      context += `\n📍 DIRECCIÓN GUARDADA: ${customerContext.address}`;
      context += `\n⚠️ IMPORTANTE: si el cliente pide delivery, preguntale: "¿a la misma dirección de siempre? (${customerContext.address})"`;
    }
    if (customerContext.preferences && customerContext.preferences.length > 0) {
      context += `\n⭐ PREFERENCIAS DEL CLIENTE (productos que suele pedir): ${customerContext.preferences.join(", ")}`;
      context += `\n💡 Si el cliente no sabe qué pedir, podés sugerirle estos productos.`;
    }
    if (customerContext.orderHistory && customerContext.orderHistory.length > 0) {
      context += `\n📦 PEDIDOS ANTERIORES:`;
      for (const order of customerContext.orderHistory.slice(-3)) {
        const items = Array.isArray(order.items) ? order.items.map((i: any) => `${i.quantity || 1}x ${i.name || "?"}`).join(", ") : "ver detalle";
        context += `\n• #${order.id} (${order.status || "?"}): ${items}`;
      }
    }
    // 🟢 PEDIDO ACTUAL: inyectado en CADA turno para que el agente NO lo olvide
    if (customerContext.pendingOrder) {
      const p = customerContext.pendingOrder;
      const items = Array.isArray(p.items) ? p.items.map((i: any) => `${i.quantity || 1}x ${i.name || "?"}`).join(", ") : "ver detalle";
      context += `\n\n🟢 PEDIDO ACTUAL (PENDIENTE #${p.id}): ${items} | Tipo: ${p.orderType || "?"}${p.address ? ` | Direccion: ${p.address}` : ""}`;
      context += `\nNota: El cliente tiene un pedido pendiente, PERO si pide algo nuevo o diferente, procesalo como un pedido nuevo. No ignores lo que te pide.`;
    }
  }
  
  // Read tiempoEspera from DB
  let tiempoEspera = "30-40 min";
  try {
    const config = await db.query.agentConfig.findFirst({
      where: (c) => eq(c.id, 1),
    });
    if (config?.tiempoEspera && config.tiempoEspera.trim().length > 0) {
      tiempoEspera = config.tiempoEspera.trim();
    }
  } catch {
    // fallback to default
  }

  // Combine layers + replace dynamic placeholders
  const combined = `${layer1}

${layer2}

${layer3}
${layer4 ? `\n${layer4}` : ""}
${context ? `\n${context}` : ""}
---
Recordá usar SIEMPRE las herramientas para obtener información actualizada.`;

  return combined.replace(/\{\{TIEMPO_ESPERA\}\}/g, tiempoEspera);
}

// ─── System Prompt V4 — Mrs Muzzarella (Professional Service) ───
// Tono profesional y sobrio, inspirado en ClinicForge.
// Tono profesional y sobrio, inspirado en ClinicForge.
// Orientado al servicio: claro, eficiente, sin confianza innecesaria.
// Este prompt se usa SIEMPRE como base. Lo del admin UI se agrega como extras.
export const DEFAULT_SYSTEM_PROMPT = `[ROL]
Te llamás Karen, atendés el WhatsApp de Mrs Muzzarella (Formosa). Vendés hamburguesas, pan mayorista, tragos V.I.P, papas, bebidas.

[REGLAS DE ORO]
1. NUNCA corrijas textos, gramática ni ortografía del cliente — ignorá los errores y vendé.
2. NUNCA mandes listas enormes. Si piden menú → "te mandé la foto". Máximo 3 líneas por mensaje.
3. NUNCA uses firma ("Karen - Mrs Muzzarella", "Te espero, Karen", etc.). Los mensajes son conversación, no carta.
4. NUNCA hables de productos que el cliente no pidió. Si dice "una génesis", hablá solo de génesis.
5. NUNCA preguntes todo junto. Una cosa por vez: primero qué quiere, después cantidad, después delivery o retiro.

[FLUJO DE VENTA (OBLIGATORIO)]
1. ESCUCHÁ qué producto pide → ejecutá getProductPrice para confirmar precio
2. PREGUNTÁ cantidad
3. PREGUNTÁ delivery o retiro
4. Si delivery → pedí dirección + ubicación GPS
5. PREGUNTÁ método de pago
6. CUANDO EL CLIENTE CONFIRME → EJECUTÁ createOrder INMEDIATAMENTE. Sin preguntar de nuevo.
7. Enviá sticker de confirmación

[TONO]
- Voseo natural: "querés", "che", "dale", "mirá"
- Descontracturado pero resolutivo: "¿cuántas querés?", "¿delivery o pasás a buscar?"
- Sin vueltas. Directo al grano.
- Sin marcas formales: nada de "estimado", "cordialmente", "quedo atenta", ni firma.

[HERRAMIENTAS]
getMenu, getProductPrice, sendProductImage, sendMenuImage, sendImage, sendDocument, getOrderStatus, createOrder, addToOrder, transferToHuman, getPaymentAlias, checkKitchenStatus, checkPanStock

[RECORDÁ]
- Si el cliente ya compartió ubicación, usá la dirección guardada.
- Si ya confirmó el pedido → createOrder YA. No preguntes más.
- Si insiste 2+ veces en algo que no es venta → transferToHuman.
- Los mensajes de audio llegan como "[Audio]: texto". Respondé al contenido.
- Las descripciones de productos están disponibles. Usalas si preguntan.`;