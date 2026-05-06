"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { fadeUpSmall, staggerContainer } from "@/lib/animation-variants";
import { updateOrderStatus, type OrderRow } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatusConfig {
  label: string;
  color: string;
  dot: string;
}

const STATUSES: Record<string, StatusConfig> = {
  pending: { label: "Pendiente", color: "text-amber-400 border-amber-500/30", dot: "bg-amber-400" },
  preparing: { label: "Preparando", color: "text-blue-400 border-blue-500/30", dot: "bg-blue-400" },
  ready: { label: "Listo", color: "text-green-400 border-green-500/30", dot: "bg-green-400" },
  delivered: { label: "Entregado", color: "text-white/40 border-white/[0.08]", dot: "bg-white/20" },
  cancelled: { label: "Cancelado", color: "text-red-400/60 border-red-500/20", dot: "bg-red-400/50" },
};

const NEXT_STATUS: Record<string, string> = {
  pending: "preparing",
  preparing: "ready",
  ready: "delivered",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(d: Date): string {
  const date = new Date(d);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins} min`;
  if (mins < 120) return "Hace 1 hora";

  return date.toLocaleString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function orderTypeBadge(type: string | null): { label: string; cls: string } {
  if (type === "hamburguesas") return { label: "🍔 Hamburguesas", cls: "bg-amber-500/10 text-amber-300 border border-amber-500/20" };
  if (type === "pan_mayorista") return { label: "🍞 Pan Mayorista", cls: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" };
  return { label: "📦 Gral", cls: "bg-white/[0.04] text-white/50 border border-white/[0.08]" };
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({
  order,
  onStatusChange,
}: {
  order: OrderRow;
  onStatusChange: (id: number, status: string) => void;
}) {
  const [changing, setChanging] = useState(false);
  const statusCfg = STATUSES[order.status] ?? STATUSES.pending;
  const typeBadge = orderTypeBadge(order.orderType);
  const items: Array<{ name?: string; quantity?: number; productName?: string }> =
    Array.isArray(order.items) ? order.items : [];

  const handleNext = useCallback(async () => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setChanging(true);
    await updateOrderStatus(order.id, next as any);
    setChanging(false);
  }, [order.id, order.status]);

  const handleCancel = useCallback(async () => {
    setChanging(true);
    await updateOrderStatus(order.id, "cancelled");
    setChanging(false);
  }, [order.id]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border p-4 flex flex-col gap-3 bg-[#0a0a0a] transition-all duration-200 hover:border-white/20"
      style={{ borderColor: order.status === "pending" ? "rgba(212,160,23,0.3)" : "rgba(255,255,255,0.06)" }}
    >
      {/* Header: ID + Order Type */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-white/30">#{order.id}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${typeBadge.cls}`}>
          {typeBadge.label}
        </span>
      </div>

      {/* Customer */}
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-white/90">
          {order.customerName || "Sin nombre"}
        </span>
        <span className="text-xs text-white/40">{order.phoneNumber}</span>
      </div>

      {/* Items */}
      <div className="text-xs text-white/60 leading-relaxed">
        {items.length === 0 ? (
          <span className="italic text-white/30">Sin items</span>
        ) : (
          items.map((item, i) => (
            <span key={i} className="block">
              {item.quantity ?? 1}x {item.name ?? item.productName ?? "Producto"}
            </span>
          ))
        )}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="text-[11px] text-white/40 italic border-t border-white/[0.04] pt-2">
          {order.notes}
        </div>
      )}

      {/* Tags */}
      {Array.isArray(order.tags) && order.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {order.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer: Status + Time + Actions */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          <span className={`inline-flex h-2 w-2 rounded-full ${statusCfg.dot}`} />
          <span className={`text-[11px] font-medium ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
          <span className="text-[10px] text-white/20">
            {formatTime(order.createdAt)}
          </span>
        </div>

        <div className="flex gap-1.5">
          {NEXT_STATUS[order.status] && (
            <Button
              type="button"
              size="sm"
              disabled={changing}
              onClick={handleNext}
              className="h-7 text-[11px] px-3 bg-white/[0.06] hover:bg-white/[0.1] text-white/70"
            >
              → {STATUSES[NEXT_STATUS[order.status]]?.label}
            </Button>
          )}
          {order.status === "pending" && (
            <Button
              type="button"
              size="sm"
              disabled={changing}
              onClick={handleCancel}
              variant="ghost"
              className="h-7 text-[11px] px-2 text-red-400/50 hover:text-red-400"
            >
              ✕
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-white/20">
      <span className="text-4xl mb-3 opacity-30">📋</span>
      <p className="text-sm">{label}</p>
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function OrdersView({
  orders,
  counts,
  currentPage,
  totalPages,
  currentStatus,
  currentType,
  currentSearch,
}: {
  orders: OrderRow[];
  counts: Record<string, number>;
  currentPage: number;
  totalPages: number;
  currentStatus: string;
  currentType: string;
  currentSearch: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch);

  const allStatuses = ["", "pending", "preparing", "ready", "delivered", "cancelled"];

  const navigate = useCallback(
    (params: Record<string, string>) => {
      const sp = new URLSearchParams();
      if (params.status) sp.set("status", params.status);
      if (params.type) sp.set("type", params.type);
      if (params.search) sp.set("search", params.search);
      if (params.page) sp.set("page", params.page);
      router.push(`/admin/orders?${sp.toString()}`);
    },
    [router]
  );

  const handleSearch = useCallback(() => {
    navigate({ status: currentStatus, type: currentType, search, page: "" });
  }, [navigate, currentStatus, currentType, search]);

  const onStatusChange = useCallback(
    async (id: number, _newStatus: string) => {
      // The action updates and revalidates; router.refresh() ensures fresh data
      router.refresh();
    },
    [router]
  );

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-5"
    >
      {/* Status Filter Tabs */}
      <motion.div variants={fadeUpSmall} className="flex flex-wrap gap-1.5">
        {allStatuses.map((s) => {
          const label = s === "" ? "Todos" : STATUSES[s]?.label ?? s;
          const active = s === currentStatus;
          const count = counts[s] ?? 0;

          return (
            <button
              key={s || "all"}
              type="button"
              onClick={() => navigate({ status: s, type: currentType, search: currentSearch, page: "" })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                active
                  ? "bg-[#D4A017]/15 text-[#F5A623] border border-[#D4A017]/30"
                  : "text-white/40 hover:text-white/70 border border-transparent"
              }`}
            >
              {label}{" "}
              <span className={active ? "text-[#D4A017]/60" : "text-white/20"}>
                ({count})
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* Type Filter + Search */}
      <motion.div variants={fadeUpSmall} className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1.5">
          {["", "hamburguesas", "pan_mayorista"].map((t) => {
            const label = t === "" ? "Todos" : t === "hamburguesas" ? "🍔 Hamburguesas" : "🍞 Pan Mayorista";
            const active = t === currentType;
            return (
              <button
                key={t || "all"}
                type="button"
                onClick={() => navigate({ status: currentStatus, type: t, search: currentSearch, page: "" })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? "bg-white/[0.08] text-white"
                    : "text-white/30 hover:text-white/60"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 flex-1 sm:max-w-xs">
          <Input
            placeholder="Buscar por teléfono, nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="h-8 text-xs bg-white/[0.03] border-white/[0.08]"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleSearch}
            className="h-8 text-xs bg-white/[0.06] hover:bg-white/[0.1] text-white/60"
          >
            Buscar
          </Button>
        </div>
      </motion.div>

      {/* Stats Bar */}
      <motion.div variants={fadeUpSmall} className="flex gap-4 text-xs text-white/20">
        <span>Total: {counts.total ?? 0}</span>
        <span>Pendientes: {counts.pending ?? 0}</span>
        <span>Preparando: {counts.preparing ?? 0}</span>
        <span>Listos: {counts.ready ?? 0}</span>
      </motion.div>

      {/* Order Cards Grid */}
      <motion.div
        variants={fadeUpSmall}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      >
        {orders.length === 0 ? (
          <EmptyState
            label={
              currentStatus
                ? `No hay pedidos con estado "${STATUSES[currentStatus]?.label ?? currentStatus}"`
                : "No hay pedidos todavía. Los pedidos aparecen cuando el agente de WhatsApp los registra."
            }
          />
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div variants={fadeUpSmall} className="flex items-center justify-center gap-2 pt-2">
          <Button
            type="button"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() =>
              navigate({
                status: currentStatus,
                type: currentType,
                search: currentSearch,
                page: String(currentPage - 1),
              })
            }
            variant="outline"
            className="h-8 text-xs border-white/[0.08]"
          >
            ← Anterior
          </Button>
          <span className="text-xs text-white/30">
            {currentPage} / {totalPages}
          </span>
          <Button
            type="button"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() =>
              navigate({
                status: currentStatus,
                type: currentType,
                search: currentSearch,
                page: String(currentPage + 1),
              })
            }
            variant="outline"
            className="h-8 text-xs border-white/[0.08]"
          >
            Siguiente →
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
