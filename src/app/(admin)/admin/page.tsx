import { db } from "@/db";
import { products, conversations, leads, agentConfig, orders } from "@/db/schema";
import { sql, gte, desc } from "drizzle-orm";
import { PackageIcon, MessageSquareIcon, UsersIcon, BotIcon } from "lucide-react";
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

  const [conversationsToday] = await db
    .select({ count: sql<number>`count(*)` })
    .from(conversations)
    .where(gte(conversations.createdAt, todayStart));

  const [leadsThisWeek] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leads)
    .where(gte(leads.createdAt, weekStart));

  const [config] = await db.select().from(agentConfig).limit(1);

  return {
    totalProducts: Number(totalProducts?.count ?? 0),
    conversationsToday: Number(conversationsToday?.count ?? 0),
    leadsThisWeek: Number(leadsThisWeek?.count ?? 0),
    agentEnabled: config?.enabled ?? false,
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

export type DashboardCard = {
  title: string;
  value: number | null;
  iconName: "package" | "message" | "users" | "bot";
  description: string;
  badge?: boolean;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboard() {
  const [stats, activity] = await Promise.all([getStats(), getRecentActivity()]);

  const cards: DashboardCard[] = [
    {
      title: "Total Productos",
      value: stats.totalProducts,
      iconName: "package",
      description: "Productos en catálogo",
    },
    {
      title: "Conversaciones Hoy",
      value: stats.conversationsToday,
      iconName: "message",
      description: "Chats activos hoy",
    },
    {
      title: "Leads Esta Semana",
      value: stats.leadsThisWeek,
      iconName: "users",
      description: "Últimos 7 días",
    },
    {
      title: "Estado Agente",
      value: null,
      iconName: "bot",
      description: "Agente de WhatsApp",
      badge: stats.agentEnabled,
    },
  ];

  return <DashboardClient cards={cards} activity={activity} />;
}
