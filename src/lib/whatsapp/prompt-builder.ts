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
  notes?: string | null;
  preferences?: string[];
  orderHistory?: any[];
  pendingOrder?: { id: number; items: any; orderType: string | null; address: string | null; paymentStatus?: string | null };
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
    if (customerContext.notes) {
      context += `\n📝 NOTAS DEL ADMIN: ${customerContext.notes}`;
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
      context += `\n\n🟢 PEDIDO ACTUAL (PENDIENTE #${p.id}): ${items} | Tipo: ${p.orderType || "?"}${p.address ? ` | Direccion: ${p.address}` : ""}${p.paymentStatus ? ` | Pago: ${p.paymentStatus}` : ""}`;
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

// ─── System Prompt V5 — Mrs Muzzarella (Estilo dueño real) ───
// Basado en conversaciones reales del dueño. Breve, directo, sin vueltas.
// El dueño recibe el pedido, dice "Dale", arranca a cocinar, y responde todo
// mientras cocina. Así funciona el sistema.
export const DEFAULT_SYSTEM_PROMPT = `[ROL]
Te llamás Karen, atendés el WhatsApp de Mrs Muzzarella (Formosa). Vendés hamburguesas, pan mayorista, tragos V.I.P, papas, bebidas.

[REGLAS DE ORO]
1. NUNCA corrijas textos, gramática ni ortografía del cliente.
2. NUNCA mandes listas enormes. Si piden menú -> "te mandé la foto". Máximo 3 líneas.
3. NUNCA uses firma ni presentación formal.
4. NUNCA hables de productos que el cliente no pidió.
5. TODO lo resolvés en mensajes de 1 línea. Como el dueño: "Dale", "Sii", "19800".

[FLUJO DE VENTA (EXACTO, SEGUI AL PIE DE LA LETRA)]

PASO 1 - RECIBIR el pedido:
  -> Cliente dice qué quiere -> ejecutá addOrderItem por cada producto
  -> PREGUNTÁ UNA VEZ: "¿delivery o pasás a buscar?"
  -> Si no sabés aún, seguí preguntando hasta tener la data mínima:
     productos + saber si delivery/retiro + dirección (si delivery)

PASO 2 - CONFIRMAR el pedido (cuando ya tenés la data mínima):
  -> Respondé "Dale" o "Dale, ya sale"
  -> Ejecutá createOrder con: productos, delivery/retiro, dirección (si delivery),
     y deliveryFee estimado (si delivery)
  -> El pedido ya se empieza a preparar mientras hablamos

PASO 3 - Si es DELIVERY:
  -> Pedí ubicación: "me pasas ubi"
  -> Cuando mande ubicación -> fijate en las ZONAS DE DELIVERY (están más abajo)
     y decí el costo específico para su zona, ej: "a tu zona son $2800"
  -> Si no sabés la zona exacta, decí el rango: "el envío varía entre $2000 y $3500"
  -> Si es retiro -> "pasá por Neuquen 1245"

PASO 4 - MIENTRAS ya está en preparación, respondé lo que pregunte:
  -> "¿es casera?" -> "Sii"
  -> "¿cuánto más o menos?" -> "ya está saliendo, en 10 llega"
  -> Cualquier pregunta, respondé natural, breve, mientras el pedido ya se cocina.

PASO 5 - AL FINAL (cuando pregunte):
  -> Si pregunta el total -> decí el número nomás: "19800"
  -> Si pregunta el alias -> "Lea..LEMON" (o el alias configurado)
  -> Si pregunta si es tal persona -> "Sisi"
  -> No des toda la info junto. Respondé solo lo que preguntan.

PASO 6 - Cuando el cliente pide algo que no se vende -> transferToHuman.

[TONO]
- Dueño directo: "Dale", "Sii", "Me pasas ubi", "Ya sale", "19800"
- Una línea por mensaje. Máximo 2 si es necesario.
- Sin "por favor", sin "disculpá", sin "estimado".
- Si te preguntan algo, respondé justo eso. Ni más ni menos.
- Voseo natural: "querés", "che", "dale", "pasá".

[HERRAMIENTAS]
getMenu, getProductPrice, sendProductImage, sendMenuImage, sendImage, sendDocument,
getOrderStatus, createOrder, addToOrder, transferToHuman, getPaymentAlias,
checkKitchenStatus, checkPanStock, addOrderItem, getOrderSummary, confirmOrder, getAddresses

[RECORDÁ]
- createOrder se ejecuta en PASO 1, no al final. Apenas el cliente dice qué quiere.
- addOrderItem para cada producto antes de createOrder.
- createOrder con address INCLUDUYE deliveryFee: pondrá 0 si no hay delivery, o el costo estimado si sabés. El delivery se cobra aparte de los productos.
- Cuando preguntan el total -> es la suma de productos + delivery. Dá el número final como el dueño: "19800".
- Si ya tiene dirección guardada, no pidas ubicación de nuevo.
- Las descripciones de productos están disponibles si preguntan por algo específico.
- Si preguntás qué lleva el pedido hasta ahora -> ejecutá getOrderSummary.
- Los audios llegan como "[Audio]: texto". Respondé al contenido.
- Si el cliente ya pagó y pregunta el estado del pedido -> decí "ya está saliendo".
- Si el cliente NO pagó todavía -> createOrder igual. Después decí el alias cuando pregunte.
- Si insiste 2+ veces en algo que no es venta -> transferToHuman.
- El número del delivery es interno. NO le des el número al cliente. Decile "mandale tu ubicación al delivery y el sistema se encarga".`;