// ─── WhatsApp Agent Tools (Venta Integral) ───

// Grupo A: Menú y productos (4)
export { getMenuTool } from "./get-menu";
export { getProductDetailsTool, getProductPriceTool, searchProductsTool, createSendProductImageTool } from "./product-tools";

// Grupo B: Disponibilidad y delivery (4)
export { checkAvailabilityTool } from "./check-availability";
export { checkProductAvailabilityTool } from "./client-tools";
export { checkDeliveryTool, getDeliveryTimeTool, listAvailableProductsTool, getWaitTimeTool } from "./extended-tools";

// Grupo C: Pedidos (5)
export { createOrderTool } from "./create-order";
export { getOrderStatusTool, addToOrderTool, updateOrderTool, cancelOrderTool } from "./order-management-tools";

// Grupo D: Cliente y venta consultiva (3)
export { suggestProductsTool, getClientHistoryTool } from "./client-tools";

// Grupo E: Operaciones (2)
export { getBusinessHoursTool } from "./get-business-hours";
export { createTransferToHumanTool } from "./transfer-to-human";

// Grupo F: Cocina + Stock + Alias (3)
export { checkKitchenStatusTool, checkPanStockTool, checkHamburguesasStockTool, getPaymentAliasTool, saveAddressTool } from "./kitchen-tools";

// Grupo G: Multimedia (5) — factory functions, se crean con número del cliente
export { createSendStickerTool, createSendMenuImageTool, createSendPromoImageTool } from "./sticker-tools";
export { createSendImageTool, createSendDocumentTool } from "./send-media-tools";

// Grupo I: Promos
export { getActivePromosTool } from "./product-tools";

// Grupo H: Order Context (memoria del pedido actual)
export { createAddOrderItemTool, createGetOrderSummaryTool, createConfirmOrderTool, createGetAddressesTool } from "./order-context-tools";
