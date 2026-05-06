// ─── WhatsApp Agent Tools (Venta Integral) ───

// Grupo A: Menú y productos (4)
export { getMenuTool } from "./get-menu";
export { getProductDetailsTool, getProductPriceTool, searchProductsTool } from "./product-tools";

// Grupo B: Disponibilidad y delivery (4)
export { checkAvailabilityTool } from "./check-availability";
export { checkProductAvailabilityTool } from "./client-tools";
export { checkDeliveryTool, getDeliveryTimeTool, listAvailableProductsTool } from "./extended-tools";

// Grupo C: Pedidos (5)
export { createOrderTool } from "./create-order";
export { getOrderStatusTool, addToOrderTool, updateOrderTool, cancelOrderTool } from "./order-management-tools";

// Grupo D: Cliente y venta consultiva (3)
export { suggestProductsTool, getClientHistoryTool } from "./client-tools";

// Grupo E: Operaciones (2)
export { getBusinessHoursTool } from "./get-business-hours";
export { createTransferToHumanTool } from "./transfer-to-human";
