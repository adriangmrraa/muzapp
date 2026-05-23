"use client";

import { useState } from "react";
import { Phone, Mail, MapPin, ShoppingBag, Calendar, UserPlus, Bot, Shield, ChevronDown } from "lucide-react";
import { useCustomerProfile, useMessages } from "@/lib/conversations/queries";
import { LeadStatusBadge } from "./lead-status-badge";
import { TagList } from "./tag-list";
import { OrderHistory } from "./order-history";
import { cn } from "@/lib/utils";

interface CustomerContextPanelProps {
  conversationId: number;
  className?: string;
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[11px] text-neutral-400">{label}</span>
      <span className="text-xs text-neutral-200 truncate max-w-[200px] text-right">{value}</span>
    </div>
  );
}

function formatDate(iso: string | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

export function CustomerContextPanel({ conversationId, className }: CustomerContextPanelProps) {
  const { data: profile, isLoading } = useCustomerProfile(conversationId);
  const { data: messages } = useMessages(conversationId);
  const [ordersOpen, setOrdersOpen] = useState(false);

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center h-full text-xs text-neutral-500", className)}>
        Cargando...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={cn("flex items-center justify-center h-full text-xs text-neutral-500", className)}>
        Sin datos de cliente
      </div>
    );
  }

  const initials = (profile.name ?? "?")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const messageCount = messages?.length ?? 0;
  const firstMsg = messages?.[0]?.createdAt;
  const lastMsg = messages?.[messages.length - 1]?.createdAt;

  return (
    <div className={cn("flex flex-col h-full overflow-y-auto bg-[#0a0a0a]", className)}>
      {/* ── Header: Avatar + Nombre + Status ───────────────────────────── */}
      <div className="flex flex-col items-center gap-2 px-4 py-6 border-b border-white/5">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#D4A017]/30 to-[#D4A017]/10 flex items-center justify-center text-lg font-bold text-[#D4A017]">
          {initials}
        </div>
        <div className="text-center">
          <h3 className="text-sm font-medium text-neutral-100">{profile.name ?? "Sin nombre"}</h3>
          <div className="flex items-center justify-center gap-2 mt-1">
            <LeadStatusBadge status={profile.status} />
            {profile.tags.length > 0 && <TagList tags={profile.tags} />}
          </div>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-4 text-center">
          <div className="flex-1">
            <p className="text-sm font-semibold text-neutral-100">{messageCount}</p>
            <p className="text-[10px] text-neutral-500">Mensajes</p>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-neutral-100">{formatDate(firstMsg)}</p>
            <p className="text-[10px] text-neutral-500">Primer contacto</p>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-neutral-100">{formatDate(lastMsg)}</p>
            <p className="text-[10px] text-neutral-500">Último</p>
          </div>
        </div>
      </div>

      {/* ── Card: Estado del Bot ────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="rounded-lg bg-white/[0.03] border border-white/5 px-3.5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <Bot className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-neutral-200">IA Activa</p>
              <p className="text-[10px] text-neutral-500">Atención automática</p>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
        </div>
      </div>

      {/* ── Card: CONTACTO / DETALLES ──────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-white/5">
        <p className="text-[10px] font-semibold text-neutral-500 tracking-wider mb-2.5">CONTACTO / DETALLES</p>
        <div className="rounded-lg bg-white/[0.03] border border-white/5 divide-y divide-white/5">
          <div className="flex items-center gap-3 px-3.5 py-2.5">
            <UserPlus className="h-3.5 w-3.5 text-neutral-500 flex-shrink-0" />
            <span className="text-xs text-neutral-200">{profile.name ?? "Sin nombre"}</span>
          </div>
          <div className="flex items-center gap-3 px-3.5 py-2.5">
            <Phone className="h-3.5 w-3.5 text-neutral-500 flex-shrink-0" />
            <span className="text-xs text-neutral-200">{profile.phone}</span>
          </div>
          {profile.email && (
            <div className="flex items-center gap-3 px-3.5 py-2.5">
              <Mail className="h-3.5 w-3.5 text-neutral-500 flex-shrink-0" />
              <span className="text-xs text-neutral-200">{profile.email}</span>
            </div>
          )}
          {profile.address && (
            <div className="flex items-center gap-3 px-3.5 py-2.5">
              <MapPin className="h-3.5 w-3.5 text-neutral-500 flex-shrink-0" />
              <span className="text-xs text-neutral-200 truncate">{profile.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Acciones Rápidas ────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-white/5 space-y-2">
        <p className="text-[10px] font-semibold text-neutral-500 tracking-wider mb-2.5">ACCIONES</p>
        <a
          href="/admin/orders"
          className="flex items-center justify-center gap-2 w-full rounded-lg bg-white/[0.04] hover:bg-white/[0.07] border border-white/5 px-4 py-2.5 text-xs font-medium text-neutral-200 transition-colors"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          Crear pedido
        </a>
        <a
          href="/admin/orders"
          className="flex items-center justify-center gap-2 w-full rounded-lg bg-white/[0.04] hover:bg-white/[0.07] border border-white/5 px-4 py-2.5 text-xs font-medium text-neutral-200 transition-colors"
        >
          <Calendar className="h-3.5 w-3.5" />
          Agendar entrega
        </a>
        <a
          href={`/admin/clients?search=${encodeURIComponent(profile.phone)}`}
          className="flex items-center justify-center gap-2 w-full rounded-lg bg-white/[0.04] hover:bg-white/[0.07] border border-white/5 px-4 py-2.5 text-xs font-medium text-neutral-200 transition-colors"
        >
          <Shield className="h-3.5 w-3.5" />
          Ver ficha completa
        </a>
      </div>

      {/* ── Historial de Pedidos ────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-white/5">
        <button
          onClick={() => setOrdersOpen(!ordersOpen)}
          className="flex w-full items-center justify-between text-[10px] font-semibold text-neutral-500 tracking-wider mb-2.5"
        >
          <span>HISTORIAL DE PEDIDOS</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${ordersOpen ? "rotate-180" : ""}`} />
        </button>
        <OrderHistory leadId={profile.id} expanded={ordersOpen} />
      </div>

      {/* ── Notes + Attribution (compactas) ────────────────────────────── */}
      {profile.notes && (
        <div className="px-4 py-3 border-b border-white/5">
          <p className="text-[10px] font-semibold text-neutral-500 tracking-wider mb-1.5">NOTAS</p>
          <p className="text-xs text-neutral-400 leading-relaxed">{profile.notes}</p>
        </div>
      )}

      {profile.platform && (
        <div className="px-4 py-3 border-b border-white/5">
          <p className="text-[10px] font-semibold text-neutral-500 tracking-wider mb-1.5">ATRIBUCIÓN</p>
          <InfoRow label="Origen" value={profile.platform} />
          <InfoRow label="Campaña" value={profile.utmCampaign} />
          <InfoRow label="UTM" value={profile.utmSource ? `${profile.utmSource} / ${profile.utmMedium}` : null} />
        </div>
      )}
    </div>
  );
}
