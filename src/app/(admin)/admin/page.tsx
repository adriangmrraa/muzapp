import { db } from "@/db";
import { products, conversations, leads, agentConfig, orders } from "@/db/schema";
import { sql, gte, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PackageIcon, MessageSquareIcon, UsersIcon, BotIcon } from "lucide-react";

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

type ActivityItem =
  | { type: "lead"; id: number; name: string | null; phone: string; createdAt: Date }
  | { type: "order"; id: number; name: string | null; phone: string; createdAt: Date };

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
  }));

  const ordersItems: ActivityItem[] = recentOrders.map((o) => ({
    type: "order",
    id: o.id,
    name: null,
    phone: o.phone,
    createdAt: o.createdAt,
  }));

  return [...leadsItems, ...ordersItems]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboard() {
  const [stats, activity] = await Promise.all([getStats(), getRecentActivity()]);

  const cards = [
    {
      title: "Total Productos",
      value: stats.totalProducts,
      icon: PackageIcon,
      description: "Productos en catálogo",
    },
    {
      title: "Conversaciones Hoy",
      value: stats.conversationsToday,
      icon: MessageSquareIcon,
      description: "Chats activos hoy",
    },
    {
      title: "Leads Esta Semana",
      value: stats.leadsThisWeek,
      icon: UsersIcon,
      description: "Últimos 7 días",
    },
    {
      title: "Estado Agente",
      value: null,
      icon: BotIcon,
      description: "Agente de WhatsApp",
      badge: stats.agentEnabled,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen general del negocio
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="glass-card border-0">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <Icon className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                {card.badge !== undefined ? (
                  <Badge variant={card.badge ? "success" : "secondary"}>
                    {card.badge ? "Activo" : "Inactivo"}
                  </Badge>
                ) : (
                  <div className="text-3xl font-bold text-foreground">{card.value}</div>
                )}
                <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Activity Feed */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">
            Actividad Reciente
          </CardTitle>
          <p className="text-xs text-muted-foreground">Últimos leads y pedidos</p>
        </CardHeader>
        <CardContent className="p-0">
          {activity.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">
              No hay actividad reciente.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {activity.map((item, idx) => (
                <li
                  key={`${item.type}-${item.id}-${idx}`}
                  className="flex items-center justify-between gap-3 px-6 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge
                      className={
                        item.type === "lead"
                          ? "shrink-0 bg-blue-500/15 text-blue-400 hover:bg-blue-500/20 border-0"
                          : "shrink-0 bg-orange-500/15 text-orange-400 hover:bg-orange-500/20 border-0"
                      }
                    >
                      {item.type === "lead" ? "Lead" : "Pedido"}
                    </Badge>
                    <div className="min-w-0">
                      {item.name ? (
                        <p className="truncate text-sm font-medium text-foreground">
                          {item.name}
                        </p>
                      ) : null}
                      <p className="truncate text-xs text-muted-foreground">
                        {item.phone}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {tiempoRelativo(item.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
