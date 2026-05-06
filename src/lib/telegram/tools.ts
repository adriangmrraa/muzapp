// ─── Exporta todas las tools del Agente Interno Mrs Muzzarella ───
// Arquitectura de tools maestras con sub-tools

import { queryOrderTools } from "./toolsQuery";
import { manageClientTools } from "./toolsClient";
import { manageProductTools } from "./toolsProduct";
import { manageOrderTools } from "./toolsOrder";
import { managementTools } from "./toolsManagement";

// ─── Tools Maestras (Delegantes) ───────────────────────────────────────
// Cada Tool Maestra es un grupo de sub-tools relacionadas

// queryOrder: Consultas de pedidos
export const queryOrder = {
  name: "queryOrder",
  description:
    "Grupo de herramientas para consultar pedidos. Incluye búsqueda por ID, estado, historial, fecha, y pedidos pendientes.",
  tools: queryOrderTools,
};

// manageClient: Gestión de clientes
export const manageClient = {
  name: "manageClient",
  description:
    "Grupo de herramientas para gestionar clientes. Crear, buscar, actualizar clientes y ver historial de pedidos.",
  tools: manageClientTools,
};

// manageProduct: Gestión de productos
export const manageProduct = {
  name: "manageProduct",
  description:
    "Grupo de herramientas para consultar productos. Listar, buscar, filtrar por categoría y verificar disponibilidad.",
  tools: manageProductTools,
};

// manageOrder: Gestión de pedidos
export const manageOrder = {
  name: "manageOrder",
  description:
    "Grupo de herramientas para crear y gestionar pedidos. Crear, agregar items, cambiar estado, cancelar y confirmar.",
  tools: manageOrderTools,
};

// manageManagement: Gestión interna (clientes, analytics, horarios)
export const manageManagement = {
  name: "manageManagement",
  description:
    "Grupo de herramientas de gestión interna. Listar clientes, buscar por nombre/teléfono/email, ver detalle, actualizar estado de pedidos, analytics por período y horarios de atención.",
  tools: managementTools,
};

// ─── Export Completo: Todas las tools como un ToolSet ────────────────────

export const internalAgentTools = {
  // queryOrder (~6 tools)
  getOrderById: queryOrderTools.getOrderById,
  getOrderStatus: queryOrderTools.getOrderStatus,
  getOrderHistory: queryOrderTools.getOrderHistory,
  searchOrdersByDate: queryOrderTools.searchOrdersByDate,
  getPendingOrders: queryOrderTools.getPendingOrders,
  getTodaysOrders: queryOrderTools.getTodaysOrders,

  // manageClient (~5 tools)
  getClientByPhone: manageClientTools.getClientByPhone,
  createClient: manageClientTools.createClient,
  updateClient: manageClientTools.updateClient,
  getClientHistory: manageClientTools.getClientHistory,
  suggestProducts: manageClientTools.suggestProducts,

  // manageProduct (~5 tools)
  getAllProducts: manageProductTools.getAllProducts,
  getProductsByCategory: manageProductTools.getProductsByCategory,
  getProductById: manageProductTools.getProductById,
  searchProducts: manageProductTools.searchProducts,
  getProductAvailability: manageProductTools.getProductAvailability,

  // manageOrder (~7 tools)
  createOrder: manageOrderTools.createOrder,
  addItemToOrder: manageOrderTools.addItemToOrder,
  removeItemFromOrder: manageOrderTools.removeItemFromOrder,
  updateOrderStatus: manageOrderTools.updateOrderStatus,
  cancelOrder: manageOrderTools.cancelOrder,
  calculateTotal: manageOrderTools.calculateTotal,
  confirmOrder: manageOrderTools.confirmOrder,

  // manageManagement (6 tools)
  getClients: managementTools.getClients,
  getClientDetail: managementTools.getClientDetail,
  searchClient: managementTools.searchClient,
  updateOrderStatusNew: managementTools.updateOrderStatusNew,
  getAnalytics: managementTools.getAnalytics,
  getBusinessHours: managementTools.getBusinessHours,
};

// Total: 29 tools individuales organizadas en 5 grupos
export const toolGroups = {
  queryOrder,
  manageClient,
  manageProduct,
  manageOrder,
  manageManagement,
};

console.log(
  "[Mrs Muzzarella] Agente Interno cargado con",
  Object.keys(internalAgentTools).length,
  "tools"
);