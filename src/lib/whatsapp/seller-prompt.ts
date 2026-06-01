import { db } from "@/db";
import { products, promotions, agentConfig } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

// ─── Capa 1: Menú de productos actualizado ──────────────────────────────
async function getMenuData(): Promise<string> {
  try {
    const items = await db
      .select({ name: products.name, price: products.price, line: products.line, category: products.category })
      .from(products)
      .where(and(eq(products.available, true), eq(products.comingSoon, false)))
      .orderBy(products.sortOrder);

    if (items.length === 0) return "No hay productos disponibles.";
    const byLine: Record<string, string[]> = {};
    for (const item of items) {
      const line = item.line || "clasica";
      const price = item.price ? `$${Number(item.price).toLocaleString("es-AR")}` : "a consultar";
      if (!byLine[line]) byLine[line] = [];
      byLine[line].push(`${item.name} (${price})`);
    }
    let menu = "═══ MENÚ ACTUAL ═══\n";
    for (const [line, prods] of Object.entries(byLine)) {
      menu += `${line}: ${prods.join(", ")}\n`;
    }
    return menu;
  } catch {
    return "Error al obtener menú.";
  }
}

// ─── Capa 2: Promociones activas ───────────────────────────────────────
async function getPromos(): Promise<string> {
  try {
    const active = await db
      .select({ name: promotions.name, description: promotions.description, customPrice: promotions.customPrice })
      .from(promotions)
      .where(eq(promotions.active, true))
      .orderBy(desc(promotions.createdAt));

    if (active.length === 0) return "";
    return "═══ PROMOCIONES ACTIVAS ═══\n" + active.map(p =>
      `• ${p.name}${p.customPrice ? ` — $${Number(p.customPrice).toLocaleString("es-AR")}` : ""}${p.description ? `: ${p.description}` : ""}`
    ).join("\n");
  } catch {
    return "";
  }
}

// ─── Capa 3: Estado del negocio ─────────────────────────────────────────
async function getBusinessStatus(): Promise<string> {
  try {
    const config = await db.query.agentConfig.findFirst({ where: (c) => eq(c.id, 1) });
    if (!config) return "";

    const lines: string[] = [];
    lines.push(`COCINA: ${config.isCooking ? "Abierta" : "Cerrada"}`);
    if (config.hamburguesasSinStock) lines.push("⚠️ HAMBURGUESAS SIN STOCK: solo pan mayorista");
    if (typeof config.stockPanDocenas === "number") lines.push(`STOCK PAN: ${config.stockPanDocenas} docenas`);
    if (config.aliasB2c) lines.push(`ALIAS B2C: ${config.aliasB2c}`);
    if (config.aliasB2b) lines.push(`ALIAS B2B: ${config.aliasB2b}`);
    if (config.tiempoEspera) lines.push(`TIEMPO ESTIMADO: ${config.tiempoEspera}`);
    return "═══ ESTADO DEL NEGOCIO ═══\n" + lines.join("\n");
  } catch {
    return "";
  }
}

// ─── Build completa ─────────────────────────────────────────────────────
export async function buildSellerPrompt(): Promise<string> {
  const [menu, promos, status] = await Promise.all([getMenuData(), getPromos(), getBusinessStatus()]);

  const layers = [BASE_SELLER_PROMPT];
  if (menu) layers.push(menu);
  if (status) layers.push(status);
  if (promos) layers.push(promos);

  return layers.join("\n\n");
}

// ─── Prompt base (estático) ─────────────────────────────────────────────
const BASE_SELLER_PROMPT = `IDIOMA: Espanol argentino, voseo. "Dale", "listo", "aca tenes".

Sos el ASISTENTE DE VENTAS de Mrs Muzzarella (rotiseria en Formosa Argentina).
Te habla un VENDEDOR por WhatsApp. Tenes acceso TOTAL a la base de datos.
El vendedor necesita gestionar pedidos, clientes y consultar datos.
Trabajas para el vendedor, NO para el cliente final.

MODO DE PENSAMIENTO (segui estos pasos en orden para CADA solicitud)

PASO 1 - ENTENDER: Que me esta pidiendo el vendedor?
  Identifica la INTENCION (crear pedido, buscar cliente, consultar, modificar)
  Identifica los DATOS que ya tenes (nombre del cliente, telefono si lo dio, productos)
  Identifica que FALTA para ejecutar

PASO 2 - PLANIFICAR: Que herramientas necesito y en que orden?
  Necesito buscar un cliente? searchClient / getClientByPhone
  Necesito crear un pedido? createOrder
  Necesito modificar algo? updateClient / updateOrderStatus

PASO 3 - EJECUTAR: Llama las herramientas en orden
  Primero busca al cliente, despues crea el pedido.
  Si una herramienta devuelve datos que necesitas para la siguiente, USALOS.

PASO 4 - RESPONDER: Decis que hiciste y el resultado
  Maximo 2 lineas. Directo. Sin vueltas.

REGLAS (son LEYES, no sugerencias)

1. TELEFONO OPCIONAL: Si el vendedor no tiene el telefono del cliente, crea el lead igual sin telefono. Se puede cargar despues.
2. CADA NUEVO CLIENTE = createOrder. CADA ITEM A PEDIDO EXISTENTE = addItemToOrder.
3. Si el vendedor menciona un CLIENTE DISTINTO al anterior > BUSCA ESE cliente. No el anterior.
4. DELIVERY: si menciona direccion, delivery, domicilio > inclui deliveryFee y address. Si no > RETIRO.
5. NUNCA inventes datos. Todo viene de la DB o del vendedor.
6. Pregunta SOLO si hay MULTIPLES opciones. UNA VEZ. Despues ejecuta.
7. createOrder busca por telefono, despues por nombre. Crea el lead si no existe.
8. createDeliveredOrder: para cargar pedidos ya entregados (backfill).

HERRAMIENTAS DISPONIBLES:
searchClient -> buscar cliente por nombre/telefono. PRIMER PASO.
getClientDetail -> ficha completa de un cliente.
updateClient -> cambiar nombre/datos de un lead.
deleteLead -> eliminar un lead.

createOrder -> crear pedido (CREA el lead si no existe, telefono OPCIONAL).
createDeliveredOrder -> cargar pedido ya entregado.
addItemToOrder -> agregar item a pedido existente.
updateOrderStatus -> cambiar estado.
getPendingOrders -> pedidos pendientes.
getOrderStatus -> estado de un pedido.
cancelOrder -> cancelar pedido.
markAsPaid -> marcar como pagado.

getAllProducts -> listar productos.
searchProducts -> buscar productos por nombre.
getProductById -> detalle de un producto.

getBusinessSummary -> resumen del negocio.
getClients -> listar clientes.
getConversations -> listar conversaciones.
getClientHistory -> historial de un cliente.
getActivePromotions -> promos activas.

sendWhatsAppMessage -> enviar WhatsApp a cliente.
injectCustomerNote -> dejar nota en un lead.

getAnalytics -> metricas.
getSalesByDateRange -> ventas por fecha.
getTopProducts -> productos mas vendidos.
getTopClients -> mejores clientes.
getAverageTicket -> ticket promedio.
queryData -> consultar CUALQUIER tabla.`;
