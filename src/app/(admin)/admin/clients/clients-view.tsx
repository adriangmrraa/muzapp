"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { fadeUpSmall, staggerContainer } from "@/lib/animation-variants";
import type { ClientSummary } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function formatDate(d: Date | null): string {
  if (!d) return "—";
  const date = new Date(d);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;

  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function leadStatusBadge(status: string | null): { label: string; cls: string } | null {
  if (!status) return null;
  const map: Record<string, { label: string; cls: string }> = {
    new: { label: "Nuevo", cls: "bg-blue-500/10 text-blue-300 border border-blue-500/20" },
    contacted: { label: "Contactado", cls: "bg-amber-500/10 text-amber-300 border border-amber-500/20" },
    converted: { label: "Convertido", cls: "bg-green-500/10 text-green-300 border border-green-500/20" },
    lost: { label: "Perdido", cls: "bg-red-500/10 text-red-300/60 border border-red-500/20" },
  };
  return map[status] ?? null;
}

function orderTypeIcon(type: string | null): string {
  if (type === "hamburguesas") return "🍔";
  if (type === "pan_mayorista") return "🍞";
  return "📦";
}

export function ClientsView({
  clients,
  currentPage,
  totalPages,
  currentSearch,
}: {
  clients: ClientSummary[];
  currentPage: number;
  totalPages: number;
  currentSearch: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch);

  const navigate = useCallback(
    (params: Record<string, string>) => {
      const sp = new URLSearchParams();
      if (params.search) sp.set("search", params.search);
      if (params.page) sp.set("page", params.page);
      router.push(`/admin/clients?${sp.toString()}`);
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
      {/* Search */}
      <motion.div variants={fadeUpSmall} className="flex gap-2 max-w-sm">
        <Input
          placeholder="Buscar por teléfono o nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && navigate({ search, page: "" })}
          className="h-8 text-xs bg-white/[0.03] border-white/[0.08]"
        />
        <Button
          type="button"
          size="sm"
          onClick={() => navigate({ search, page: "" })}
          className="h-8 text-xs bg-white/[0.06] hover:bg-white/[0.1] text-white/60"
        >
          Buscar
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUpSmall} className="text-xs text-white/20">
        Total: {clients.length > 0 ? clients.length : "..."} clientes
      </motion.div>

      {/* Client Cards */}
      <motion.div variants={fadeUpSmall} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {clients.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-white/20">
            <span className="text-4xl mb-3 opacity-30">👥</span>
            <p className="text-sm">
              {currentSearch
                ? `No se encontraron clientes para "${currentSearch}"`
                : "Todavía no hay clientes registrados"}
            </p>
          </div>
        ) : (
          clients.map((client, i) => (
            <motion.div
              key={client.phone}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (i % 10) * 0.03 }}
              className="rounded-xl border border-white/[0.06] p-4 flex flex-col gap-3 bg-[#0a0a0a] hover:border-white/15 transition-all duration-200"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-medium text-white/90 truncate">
                    {client.name || "Sin nombre"}
                  </span>
                  <span className="text-xs text-white/40 font-mono">
                    {client.phone}
                  </span>
                </div>
                {leadStatusBadge(client.leadStatus) && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${leadStatusBadge(client.leadStatus)!.cls}`}>
                    {leadStatusBadge(client.leadStatus)!.label}
                  </span>
                )}
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="rounded-md bg-white/[0.03] p-2">
                  <div className="font-medium text-white/70">{client.totalOrders}</div>
                  <div className="text-white/30">Pedidos</div>
                </div>
                <div className="rounded-md bg-white/[0.03] p-2">
                  <div className="font-medium text-white/70">{client.totalConversations}</div>
                  <div className="text-white/30">Chats</div>
                </div>
                <div className="rounded-md bg-white/[0.03] p-2">
                  <div className="font-medium text-white/70">
                    {client.lastOrderType
                      ? orderTypeIcon(client.lastOrderType)
                      : "—"}
                  </div>
                  <div className="text-white/30">Tipo</div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-[10px] text-white/20 border-t border-white/[0.04] pt-2">
                <span>
                  {client.lastOrderDate
                    ? `Últ. pedido: ${formatDate(client.lastOrderDate)}`
                    : "Sin pedidos"}
                </span>
                <span>
                  {client.lastConversationDate
                    ? `Últ. chat: ${formatDate(client.lastConversationDate)}`
                    : ""}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            type="button"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => navigate({ search: currentSearch, page: String(currentPage - 1) })}
            variant="outline"
            className="h-8 text-xs border-white/[0.08]"
          >
            ← Anterior
          </Button>
          <span className="text-xs text-white/30">{currentPage} / {totalPages}</span>
          <Button
            type="button"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => navigate({ search: currentSearch, page: String(currentPage + 1) })}
            variant="outline"
            className="h-8 text-xs border-white/[0.08]"
          >
            Siguiente →
          </Button>
        </div>
      )}
    </motion.div>
  );
}
