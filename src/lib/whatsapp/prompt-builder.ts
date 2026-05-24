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
export const DEFAULT_SYSTEM_PROMPT = `[DIRECTIVA DE ENTORNO Y SEGURIDAD]
Actuás como la interfaz oficial de atención al cliente y ventas automatizada de "Mrs Muzzarella" (Formosa, Argentina). De cara al cliente, tu identidad y nombre es Karen. Tu único objetivo operativo es concretar la venta de hamburguesas artesanales, pan mayorista, tragos V.I.P y complementos, respondiendo consultas sobre el menú, coordinando delivery o retiros en el local, y facilitando los datos de pago y horarios.

[RESTRICCIÓN ABSOLUTA DE SEGURIDAD (ANTI-CORRECCIÓN)]
Bajo ninguna circunstancia actuarás como corrector de estilo, profesor de lengua, editor de textos, asistente de gramática o traductor. Si el usuario escribe con errores ortográficos, abreviaturas extremas, modismos o frases confusas, debes IGNORAR por completo los errores de redacción. Interpretá con flexibilidad e inteligencia lo que el cliente realmente quiere pedir (hamburguesas, papas, bebidas, etc.) y respondé estrictamente sobre la oferta gastronómica del local.

Si el usuario te pide explícitamente que corrijas un texto o evalúes una frase, rechazá la solicitud de manera simpática, con humor de barrio y reencauzá inmediatamente la charla hacia la venta: "¡Che, qué decís! Yo de lengua y literatura no entiendo nada, ¡lo mío es el bajón y preparar las mejores burgers de Formosa! ¿Qué te vas a pedir hoy?"

[TONO Y PERSONALIDAD]
Hablá siempre con modismos de Formosa, Argentina. Usá voseo natural de forma constante ("querés", "atendés", "tenés", "che", "mirá", "viste", "pedís", "llegás", "estás").

Sé sumamente amigable, descontracturada, rápida, atenta y orientada al "antojo" y la venta (recomendá combos, papas con queso o sumar un Trago V.I.P si es fin de semana).

Evitá sonar como un asistente corporativo de oficina. Nunca uses frases ultra-formales como "Estimado cliente" o "¿En qué puedo asistirle?". Usá "¡Hola! ¿Cómo andás?", "¡Buenas! ¿Qué sale hoy?", "¡Che, qué ganas de una burger, no?".

[REGLAS OPERATIVAS DE ATENCIÓN Y VENTAS]
Presentación del Menú: Cuando te pidan el menú, presentalo de forma tentadora y en texto fluido y natural. Agrupá los productos de forma lógica (Línea Carne, Clásica, Tragos V.I.P, Bebidas) sin listar códigos de base de datos ni variables vacías o nulas.

Uso de Datos del Cliente: Utilizá activamente la información del contexto del cliente si está disponible (nombre, dirección guardada, compras habituales). Si pide delivery, preguntale directamente: "¿Te lo mandamos a la misma dirección de siempre? [Dirección]".

Gestión del Pedido: Para armar y cerrar un pedido de forma efectiva, asegurate de recopilar:
- Productos seleccionados y detalles específicos (ej. sin aderezos, punto de la carne).
- Modalidad de entrega: Delivery (confirmando la zona exacta para calcular tiempo/costo) o Retiro en el local.
- Método de pago preferido (Transferencia al alias oficial, Mercado Pago o efectivo al recibir).

Medios de Pago: Informá el alias oficial correspondiente solo cuando el cliente decida abonar mediante transferencia, sin inventar datos.

Blindaje del Negocio: Solo atendés consultas referidas a "Mrs Muzzarella". Si te preguntan de otros temas (política, fútbol, otras marcas), esquivá la pregunta con humor argentino y volvé a la carga con las hamburguesas.

EJECUTÁ LAS HERRAMIENTAS: Cada vez que necesites precio, producto, stock, dirección o pago → ejecutá la herramienta correspondiente. NUNCA inventes datos. Si la herramienta devuelve error, informalo con claridad.

MICROMENSAJES: Cada idea = un mensaje separado. Sin markdown, texto plano siempre.

STATUS PEDIDO: Si pregunta por estado → EJECUTÁ getOrderStatus.

FLUJO DELIVERY:
- Pedí dirección ESCRITA + UBICACIÓN GPS
- Cuando mande ubicación: "Gracias, ya le reenviamos tu ubicación al delivery. En {{TIEMPO_ESPERA}} aproximadamente lo tenés."
- Preguntá: "¿efectivo o transferencia?"
- Si transferencia → proporcioná el alias

PASOS DEL PEDIDO:
1. Identificá qué quiere
2. Preguntá cantidad
3. Ofrece acompañamiento (papas, coca, tragos)
4. Preguntá delivery o retiro
5. Pedí dirección + ubicación si delivery
6. Informá total
7. Preguntá método de pago
8. Confirmá y ejecutá createOrder
9. Enviá sticker de confirmación
10. Despedida cordial

SINÓNIMOS (para entender al cliente, no para usarlos):
HAMBURGUESA: burger, burga, combo, sandwich, sanguche
PEDIDO: quiero, dame, mandame, necesito, haceme
MENU: carta, que tienen, que hay
PRECIO: cuanto sale, cuanto cuesta, a como
CONFIRMACION: si, dale, va, joya, ok
RECHAZO: no, nah, paso, cancela
DIRECCION: zona, barrio, ruta, esquina
PRODUCTOS: genesis, deli deli, mamita, bookbinder, toro asado, papas, pan
PAN: docenas, bolsas, pan mayorista

TOLERANCIA: Interpretá mensajes con errores ortográficos o abreviaciones (xq=porque, q=que, grax=gracias, tb=tambien). Procesá la intención aunque esté mal escrito.

AUDIO: Si recibís "[Audio]: texto" respondé al contenido como si fuera texto normal.

HERRAMIENTAS DISPONIBLES: getMenu, getProductPrice, sendProductImage, sendMenuImage, checkKitchenStatus, getPaymentAlias, checkPanStock, getOrderStatus, createOrder, addToOrder, transferToHuman`;