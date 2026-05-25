import { db } from "@/db";
import { orders, leads } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { calculateClientStats, formatCurrency } from "@/lib/client-utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, MapPin, ShoppingBag, MessageSquare, Star, Tag, Plus, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreateOrderModalWrapperClient } from "../create-order-modal-wrapper-client";
import { ClientEditForm } from "./client-edit-form";

export const metadata = { title: "Ficha de Cliente — Mrs Muzzarella Admin" };

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "warning" | "success" | "destructive" }> = {
  new: { label: "Nuevo", variant: "default" },
  contacted: { label: "Contactado", variant: "warning" },
  converted: { label: "Convertido", variant: "success" },
  lost: { label: "Perdido", variant: "destructive" },
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente", preparing: "Preparando", ready: "Listo",
  delivered: "Entregado", cancelled: "Cancelado",
};

function extractRepeatProducts(ordersList: typeof orders.$inferSelect[]): { name: string; count: number }[] {
  const counter = new Map<string, number>();
  for (const o of ordersList) {
    const items = o.items as { name?: string; quantity?: number }[] | null;
    if (!items) continue;
    for (const item of items) {
      if (item.name) counter.set(item.name, (counter.get(item.name) ?? 0) + (item.quantity ?? 1));
    }
  }
  return [...counter.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

export default async function ClientDetailPage({ params }: Props) {
  const { id: phone } = await params;

  const [lead] = await db.select().from(leads).where(eq(leads.phone, phone)).limit(1);
  const clientOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.phoneNumber, phone))
    .orderBy(desc(orders.createdAt))
    .limit(50);

  if (!lead && clientOrders.length === 0) notFound();

  const stats = calculateClientStats(clientOrders);
  const repeatProducts = extractRepeatProducts(clientOrders);
  const name = lead?.name || clientOrders[0]?.customerName || "Cliente";
  const statusCfg = STATUS_LABELS[lead?.status ?? ""];
  const currentOrder = clientOrders.find((o) => o.status === "pending" || o.status === "preparing");

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6 max-w-4xl">
      {/* ── Back ──────────────────────────────────────────────────────── */}
      <Link href="/admin/clients" className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors w-fit">
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver a clientes
      </Link>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-100">{name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-neutral-500 font-mono">{phone}</span>
            {statusCfg && <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ClientEditForm lead={lead} />
          <div className="text-right">
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Total gastado</p>
            <p className="text-2xl font-bold text-amber-400">${stats.totalSpent.toLocaleString("es-AR")}</p>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Pedidos", value: stats.totalOrders },
          { label: "Promedio", value: `$${stats.avgOrderValue.toLocaleString("es-AR")}` },
          { label: "Este mes", value: stats.ordersThisMonth },
          { label: "Último pedido", value: stats.lastOrderAt ? new Date(stats.lastOrderAt).toLocaleDateString("es-AR") : "—" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-white/[0.06] bg-[#0a0a0a] px-4 py-3 text-center">
            <p className="text-lg font-semibold text-neutral-100">{s.value}</p>
            <p className="text-[10px] text-neutral-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Actions Row ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <CreateOrderModalWrapperClient clientName={name} clientPhone={phone} />
        {currentOrder && (
          <Link href="/admin/orders" className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3.5 py-2 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors">
            <ShoppingBag className="h-3.5 w-3.5" />
            Pedido activo #{currentOrder.id}
          </Link>
        )}
        {lead?.conversationId && (
          <Link href={`/admin/conversations`} className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] border border-white/10 px-3.5 py-2 text-xs font-medium text-neutral-300 hover:bg-white/[0.07] transition-colors">
            <MessageSquare className="h-3.5 w-3.5" />
            Ir al chat
          </Link>
        )}
        <Link href={`/admin/orders?search=${encodeURIComponent(phone)}`} className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] border border-white/10 px-3.5 py-2 text-xs font-medium text-neutral-300 hover:bg-white/[0.07] transition-colors">
          <ShoppingBag className="h-3.5 w-3.5" />
          Ver pedidos
        </Link>
      </div>

      {/* ── Two columns layout ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* ── LEFT COL ──────────────────────────────────────────────────── */}

        {/* Address card */}
        <div className="rounded-xl border border-white/[0.06] p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            <MapPin className="h-3.5 w-3.5" />
            Dirección guardada
          </div>
          {lead?.address ? (
            <div className="flex items-center gap-2.5 rounded-lg bg-white/[0.03] border border-white/5 px-3.5 py-3">
              <MapPin className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <p className="text-sm text-neutral-200">{lead.address}</p>
            </div>
          ) : (
            <p className="text-xs text-neutral-500 italic">Sin dirección registrada. El cliente no ha compartido ubicación aún.</p>
          )}
        </div>

        {/* Contact / Detalles */}
        <div className="rounded-xl border border-white/[0.06] p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            <Phone className="h-3.5 w-3.5" />
            Contacto
          </div>
          <div className="space-y-2">
            <InfoRow label="Teléfono" value={phone} />
            <InfoRow label="Email" value={lead?.email ?? null} />
            <InfoRow label="Notas" value={lead?.notes ?? null} />
            <InfoRow label="Creado" value={lead?.createdAt ? new Date(lead.createdAt).toLocaleDateString("es-AR") : null} />
            <InfoRow label="Origen" value={lead?.platform ?? null} />
          </div>
          {Array.isArray(lead?.tags) && lead.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {lead.tags.map((tag: string) => (
                <span key={tag} className="inline-flex items-center rounded-full bg-neutral-500/20 text-neutral-300 px-2 py-0.5 text-[10px] font-medium">
                  <Tag className="h-2.5 w-2.5 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT COL ─────────────────────────────────────────────────── */}

        {/* Productos favoritos / repetidos */}
        {repeatProducts.length > 0 && (
          <div className="rounded-xl border border-white/[0.06] p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              <Star className="h-3.5 w-3.5 text-amber-400" />
              Siempre pide
            </div>
            <div className="space-y-1.5">
              {repeatProducts.map((p) => (
                <div key={p.name} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2">
                  <span className="text-sm text-neutral-200">{p.name}</span>
                  <span className="text-[10px] text-neutral-500 bg-white/[0.05] rounded-full px-2 py-0.5">
                    {p.count}x
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attribution (UTM) */}
        {lead?.utmCampaign && (
          <div className="rounded-xl border border-white/[0.06] p-4 space-y-2">
            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Atribución</p>
            <InfoRow label="Campaña" value={lead.utmCampaign} />
            <InfoRow label="Source" value={lead.utmSource ? `${lead.utmSource}${lead.utmMedium ? ` / ${lead.utmMedium}` : ""}` : null} />
          </div>
        )}

      </div>

      {/* ── Orders Section ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/[0.06] p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          <ShoppingBag className="h-3.5 w-3.5" />
          Historial de pedidos ({clientOrders.length})
        </div>

        {clientOrders.length === 0 ? (
          <p className="text-xs text-neutral-500 italic py-4 text-center">Sin historial de pedidos (contacto sin compras)</p>
        ) : (
          <div className="space-y-1.5">
            {clientOrders.slice(0, 15).map((order) => {
              const items = order.items as { name?: string; quantity?: number }[] | null;
              const itemSummary = items?.slice(0, 2).map((i) => `${i.quantity ?? 1}x ${i.name ?? ""}`).join(", ") || "";
              return (
                <div key={order.id} className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.015] px-3.5 py-2.5 hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-medium text-neutral-400">#{order.id}</span>
                    <div className="min-w-0">
                      <p className="text-xs text-neutral-200 truncate max-w-[200px]">{itemSummary || (order.orderType?.replace("_", " ") ?? "Pedido")}</p>
                      <p className="text-[10px] text-neutral-500">{new Date(order.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}</p>
                    </div>
                  </div>
                  <Badge variant={
                    order.status === "delivered" ? "success" :
                    order.status === "cancelled" ? "destructive" :
                    order.status === "ready" ? "warning" : "default"
                  } className="text-[10px] px-1.5 py-0">
                    {ORDER_STATUS_LABELS[order.status] ?? order.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[11px] text-neutral-500">{label}</span>
      <span className="text-xs text-neutral-300 truncate max-w-[200px] text-right">{value}</span>
    </div>
  );
}
