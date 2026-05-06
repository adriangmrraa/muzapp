// ─── WhatsApp Agent Tools (Venta Integral) ───
// 14 tools para ciclo de ventas completo

export { getMenuTool } from "./get-menu";
export { checkAvailabilityTool } from "./check-availability";
export { createOrderTool } from "./create-order";
export { getBusinessHoursTool } from "./get-business-hours";
export { createTransferToHumanTool } from "./transfer-to-human";

// Nuevas tools
export { getProductDetailsTool, getProductPriceTool, searchProductsTool } from "./product-tools";
export { checkProductAvailabilityTool, suggestProductsTool } from "./client-tools";

// Extended tools
export { checkDeliveryTool, getDeliveryTimeTool, listAvailableProductsTool } from "./extended-tools";

console.log("[WhatsApp] Venta Integral: 14 tools cargadas");