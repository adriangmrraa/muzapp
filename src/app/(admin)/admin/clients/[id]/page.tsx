import { db } from "@/db";
import { orders, leads, conversations } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { ClientTabs, ClientDatosTab, ClientPedidosTab, ClientStatsTab } from "@/components/clients/client-tabs";
import { calculateClientStats } from "@/lib/client-utils";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Ficha de Cliente — Mrs Muzzarella Admin",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: Props) {
  const { id: phone } = await params;

  // Get client data from leads
  const [lead] = await db
    .select()
    .from(leads)
    .where(eq(leads.phone, phone))
    .limit(1);

  // Get orders for this phone
  const clientOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.phoneNumber, phone))
    .orderBy(desc(orders.createdAt))
    .limit(50);

  // Calculate stats
  const stats = calculateClientStats(clientOrders);

  // If no lead and no orders, return 404
  if (!lead && clientOrders.length === 0) {
    notFound();
  }

  const client = {
    name: lead?.name || clientOrders[0]?.customerName || "Cliente",
    phone,
    email: lead?.email || null,
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <a
          href="/admin/clients"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver
        </a>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gold-gradient">
            {client.name}
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            {client.phone}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total gastado</p>
          <p className="text-2xl font-bold text-amber-400">
            ${stats.totalSpent.toLocaleString("es-AR")}
          </p>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-muted/30 text-center">
          <p className="text-2xl font-bold">{stats.totalOrders}</p>
          <p className="text-xs text-muted-foreground">Pedidos</p>
        </div>
        <div className="p-4 rounded-lg bg-muted/30 text-center">
          <p className="text-2xl font-bold">
            ${stats.avgOrderValue.toLocaleString("es-AR")}
          </p>
          <p className="text-xs text-muted-foreground">Promedio</p>
        </div>
        <div className="p-4 rounded-lg bg-muted/30 text-center">
          <p className="text-2xl font-bold">{stats.ordersThisMonth}</p>
          <p className="text-xs text-muted-foreground">Este mes</p>
        </div>
        <div className="p-4 rounded-lg bg-muted/30 text-center">
          <p className="text-2xl font-bold">
            {stats.lastOrderAt
              ? new Date(stats.lastOrderAt).toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "2-digit",
                })
              : "—"}
          </p>
          <p className="text-xs text-muted-foreground">Último</p>
        </div>
      </div>

      {/* Quick tabs - simplified for now */}
      <div className="flex gap-2 border-b border-border overflow-x-auto">
        <span className="px-4 py-2 text-sm font-medium text-amber-400 border-b-2 border-amber-400">
          Datos
        </span>
        <span className="px-4 py-2 text-sm font-medium text-muted-foreground">
          Pedidos ({clientOrders.length})
        </span>
        <span className="px-4 py-2 text-sm font-medium text-muted-foreground">
          Stats
        </span>
      </div>

      {/* Datos Tab - inline for now */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase">Nombre</label>
          <p className="font-medium">{client.name}</p>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase">Teléfono</label>
          <p className="font-mono">{client.phone}</p>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase">Email</label>
          <p className="font-mono">{client.email || "—"}</p>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase">Lead Status</label>
          <p className="font-medium">{lead?.status || "Sin lead"}</p>
        </div>
      </div>

      {/* Orders section */}
      <div className="space-y-2">
        <h2 className="text-lg font-bold">Últimos Pedidos</h2>
        {clientOrders.length === 0 ? (
          <p className="text-muted-foreground">Sin pedidos</p>
        ) : (
          <div className="space-y-2">
            {clientOrders.slice(0, 10).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              >
                <div>
                  <p className="font-medium">Pedido #{order.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString("es-AR")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {order.orderType || "hamburguesas"}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      order.status === "delivered"
                        ? "bg-green-500/20 text-green-400"
                        : order.status === "ready"
                        ? "bg-amber-500/20 text-amber-400"
                        : order.status === "cancelled"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}