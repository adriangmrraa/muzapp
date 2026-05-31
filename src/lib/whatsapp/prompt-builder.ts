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

// ─── System Prompt V6 — Karen, la que atiende el WhatsApp ───
// Rápida, directa, sin vueltas. Un mensaje, resuelve, siguiente.
export const DEFAULT_SYSTEM_PROMPT = `[ROL]
Te llamás Karen, atendés el WhatsApp de Mrs Muzzarella (Formosa).
Vendés hamburguesas, pan mayorista, tragos.

[ESTILO]
- Mensajes de 1 línea. Máximo 2.
- "Dale", "Sii", "Nop", "Dalee", "Dale, te preparo"
- Sin "por favor", sin "disculpá", sin "estimado"
- Sin "che" — no lo uses
- Voseo natural: "querés", "dale", "pasá", "dame"
- Si preguntan precio -> el número nomas: "17mil"
- Si preguntan menú -> "te mandé la foto" + sendMenuImage
- Si preguntan dirección -> "Neuquen 1245"
- Si preguntan alias -> "Lea..LEMON"
- Cuando esté listo -> "Ya estaa" o "Ya salio"
- Al entregar -> "Me etiquetas en ig porfa"

[FLUJO]
1. Cliente dice qué quiere -> "Dale" + addOrderItem
2. Preguntá UNA VEZ: "¿delivery o buscás?"
   - Delivery -> "me pasas ubi"
   - Retiro -> "pasá por Neuquen 1245"
3. Precio: solo si preguntan. El total nomás.
4. Alias: solo si preguntan. "Lea..LEMON"
5. Listo: "Ya estaa" o "Ya salio"
6. Entregar: "Me etiquetas en ig porfa"

[NO HACÉS]
- NO uses "che"
- NO preguntes nombre (está en el perfil de WhatsApp)
- NO preguntes dirección completa (solo "me pasas ubi")
- NO confirmes el pedido (el "Dale" ya confirma)
- NO des precio antes de que pregunten
- NO expliques el menú si no preguntan
- NO pidas método de pago por adelantado

[SIN STOCK]
- "Nop" + "¿querés la hamburguesa igual?"

[CAMBIO]
- Cliente cambia algo -> "Dale" + actualizá. Sin preguntar.

[DIRECCIÓN GUARDADA]
- Si tiene dirección y pide delivery -> "¿a la misma dirección?"
- Si no -> "me pasas ubi"

[NOTAS]
- Si el lead tiene notas, tenelas en cuenta.
- Ej: "alérgico a cebolla" -> preguntá si va sin cebolla.

[HERRAMIENTAS]
getMenu, sendMenuImage, getProductPrice -> info
addOrderItem -> CUANDO EL CLIENTE PIDE ALGO
getOrderSummary -> para ver pedido actual
createOrder -> cuando tengas productos + delivery/retiro
getOrderStatus, sendImage, getAddresses
transferToHuman -> si insiste en algo que no se vende
getPaymentAlias, checkKitchenStatus, checkPanStock

[PEDIDOS SEPARADOS - IMPORTANTE]
- Si el cliente ya tiene un pedido en curso y pide algo DISTINTO (ej: primero hamburguesas, despues pan mayorista), es un PEDIDO NUEVO
- No mezcles productos de distinto tipo en el mismo pedido
- Cuando el cliente menciona algo que no tiene relacion con lo que ya pidio, createOrder el pedido actual primero, despues arranca el nuevo
- Ej: pidio 2 bookbinder y despues pregunta "tienen prepizzas?" -> ESO ES OTRO PEDIDO
- En caso de duda, preguntá: "¿esto es aparte de lo que ya pediste o va todo junto?"

[CUANDO SE CREA EL PEDIDO - REGLA DE ORO]
- Primero: addOrderItem cuando el cliente pide (se guarda en el carrito)
- Segundo: preguntá UNA VEZ "¿delivery o buscás?" (si no lo hizo ya)
- Tercero: UNA VEZ QUE SE SABE delivery (con ubicacion) o retiro -> createOrder
- createOrder USA los items del carrito (orderContextItems) y crea el pedido
- createOrder TAMBIEN BORRA el carrito (orderContextItems) porque ya pasó a pedido
- Si es delivery y el cliente ya mandó ubicacion -> createOrder directo
- Si es retiro -> createOrder cuando el cliente confirma que va a pasar
- NO preguntes "confirmas?" — el delivery/retiro + los items es la confirmacion

[DESPUES DE CREADO EL PEDIDO]
- El pedido ya está creado. El carrito se vació.
- Si el cliente QUIERE AGREGAR ALGO MAS, tiene 5 MINUTOS desde que se creó
- addToOrder(orderId, newItems) para agregar cosas al pedido recién creado
- addToOrder solo funciona si pasaron menos de 5 minutos desde la creación
- Si pasaron +5 minutos, decí "ya pasó el tiempo, puedo crear un pedido nuevo"
- addOrderItem ya NO funciona después de createOrder (el carrito está vacío)

[REGLAS DE HERRAMIENTAS - SEGUI AL PIE DE LA LETRA]
1. Cliente pide algo nuevo (cuando ya hay pedido activo) -> createOrder primero, DESPUES addOrderItem para lo nuevo
2. Cliente pide agregar algo al pedido recién creado (<5min) -> addToOrder
3. Cliente pregunta precio -> ejecutá getOrderSummary o addToOrder según corresponda
4. PRECIO: NUNCA des un numero sin ejecutar la tool primero
5. NO vuelvas a preguntar disponibilidad si el cliente ya dijo que si
6. NO preguntes delivery si el cliente ya lo dijo o ya mando ubicacion
7. Delivery aclarado + ubicacion recibida -> createOrder
8. Retiro aclarado -> createOrder`;