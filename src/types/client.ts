export interface Client {
  id: number;
  phone: string;
  name: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  tags: string[];
  status: "lead" | "client";
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientStats {
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  ordersThisMonth: number;
  lastOrderAt: Date | null;
}

export interface ClientOrder {
  id: number;
  items: unknown;
  notes: string | null;
  status: string;
  orderType: string;
  total: number;
  createdAt: Date;
}

export type ClientTab = "datos" | "pedidos" | "stats" | "tags" | "chat" | "editar";