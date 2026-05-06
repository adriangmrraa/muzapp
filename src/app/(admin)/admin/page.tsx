import { db } from "@/db";
import { products, conversations, leads, agentConfig, orders } from "@/db/schema";
import { sql, gte, desc, count, eq } from "drizzle-orm";

import { DashboardClient } from "./dashboard-client";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function tiempoRelativo(fecha: Date): string {
  const ahora = new Date();
  const diffMs = ahora.getTime() - fecha.getTime();
  const diffMin = Math.floor(diffMs / 1000 / 60);
  const diffHoras = Math.floor(diffMin / 60);
  const diffDias = Math.floor(diffHoras / 24);

  if (diffMin < 1) return "hace un momento";
  if (diffMin < 60) return `hace ${diffMin} min`;
  if (diffHoras < 24) return `hace ${diffHoras} ${diffHoras === 1 ? "hora" : "horas"}`;
  return `hace ${diffDias} ${diffDias === 1 ? "día" : "días"}`;
}

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function getStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

  const [totalProducts] = await db
    .select({ count: sql<number>`count(*)` })
    .from(products);

  const [totalOrders] = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders);

  const [ordersToday] = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(gte(orders.createdAt, todayStart));

  const [newLeads] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leads)
    .where(gte(leads.createdAt, weekStart));

  const [newClients] = await db
    .select({ count: sql<number>`count(distinct ${leads.phone})` })
    .from(leads)
    .where(gte(leads.createdAt, weekStart));

  const [totalLeads] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leads);

  return {
    totalProducts: Number(totalProducts?.count ?? 0),
    totalOrders: Number(totalOrders?.count ?? 0),
    ordersToday: Number(ordersToday?.count ?? 0),
    newLeads: Number(newLeads?.count ?? 0),
    newClients: Number(newClients?.count ?? 0),
    totalLeads: Number(totalLeads?.count ?? 0),
  };
}

export type ActivityItem =
  | { type: "lead"; id: number; name: string | null; phone: string; createdAt: Date; timeLabel: string }
  | { type: "order"; id: number; name: string | null; phone: string; createdAt: Date; timeLabel: string };

async function getRecentActivity(): Promise<ActivityItem[]> {
  const [recentLeads, recentOrders] = await Promise.all([
    db
      .select({
        id: leads.id,
        name: leads.name,
        phone: leads.phone,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .orderBy(desc(leads.createdAt))
      .limit(5),
    db
      .select({
        id: orders.id,
        phone: orders.phoneNumber,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(5),
  ]);

  const leadsItems: ActivityItem[] = recentLeads.map((l) => ({
    type: "lead",
    id: l.id,
    name: l.name,
    phone: l.phone,
    createdAt: l.createdAt,
    timeLabel: tiempoRelativo(l.createdAt),
  }));

  const ordersItems: ActivityItem[] = recentOrders.map((o) => ({
    type: "order",
    id: o.id,
    name: null,
    phone: o.phone,
    createdAt: o.createdAt,
    timeLabel: tiempoRelativo(o.createdAt),
  }));

  return [...leadsItems, ...ordersItems]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);
}

async function getRecentOrders() {
  return await db
    .select({
      id: orders.id,
      customerName: orders.customerName,
      phoneNumber: orders.phoneNumber,
      orderType: orders.orderType,
      status: orders.status,
      items: orders.items,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(8);
}

export type DashboardCard = {
  title: string;
  value: number | null;
  iconName: "package" | "message" | "users" | "bot" | "cart" | "dollar" | "userplus" | "trending";
  description: string;
  badge?: boolean;
};

export type RecentOrder = {
  id: number;
  customerName: string | null;
  phoneNumber: string;
  orderType: string | null;
  status: string;
  items: unknown;
  createdAt: Date;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboard() {
  const [stats, activity, recentOrders] = await Promise.all([
    getStats(),
    getRecentActivity(),
    getRecentOrders(),
  ]);

  const cards: DashboardCard[] = [
    {
      title: "Total Pedidos",
      value: stats.totalOrders,
      iconName: "cart",
      description: "Pedidos registrados",
    },
    {
      title: "Ingresos Hoy",
      value: stats.ordersToday,
      iconName: "dollar",
      description: "Pedidos recibidos hoy",
    },
    {
      title: "Clientes Nuevos",
      value: stats.newClients,
      iconName: "userplus",
      description: "Últimos 7 días",
    },
    {
      title: "Leads Totales",
      value: stats.totalLeads,
      iconName: "trending",
      description: "Leads en la base",
    },
  ];

  return <DashboardClient cards={cards} activity={activity} recentOrders={recentOrders} />;
}
