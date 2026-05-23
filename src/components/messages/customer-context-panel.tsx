"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Phone, Mail, MapPin, BarChart3, ShoppingBag, StickyNote, Tags, Target } from "lucide-react";
import { useCustomerProfile, useMessages } from "@/lib/conversations/queries";
import { LeadStatusBadge } from "./lead-status-badge";
import { TagList } from "./tag-list";
import { OrderHistory } from "./order-history";
import { cn } from "@/lib/utils";

interface CustomerContextPanelProps {
  conversationId: number;
  className?: string;
}

function CollapsibleSection({
  icon: Icon,
  title,
  defaultOpen = false,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/5 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5" />
          {title}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[11px] text-neutral-500">{label}</span>
      <span className="text-xs text-neutral-300 truncate max-w-[180px] text-right">{value}</span>
    </div>
  );
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
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const messageCount = messages?.length ?? 0;
  const firstMsg = messages?.[0]?.createdAt;
  const lastMsg = messages?.[messages.length - 1]?.createdAt;

  function formatDate(iso: string | undefined) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className={cn("flex flex-col h-full overflow-y-auto bg-[#0a0a0a]", className)}>
      {/* Header — siempre visible */}
      <div className="flex flex-col items-center gap-2 px-4 py-6 border-b border-white/5">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#D4A017]/30 to-[#D4A017]/10 flex items-center justify-center text-lg font-bold text-[#D4A017]">
          {initials}
        </div>
        <div className="text-center">
          <h3 className="text-sm font-medium text-neutral-100">{profile.name ?? "Sin nombre"}</h3>
          <p className="text-[11px] text-neutral-500 mt-0.5">{profile.phone}</p>
        </div>
        <LeadStatusBadge status={profile.status} />
      </div>

      {/* Tags — siempre visible */}
      {profile.tags.length > 0 && (
        <div className="px-4 py-3 border-b border-white/5">
          <TagList tags={profile.tags} />
        </div>
      )}

      {/* Stats — siempre visible */}
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

      {/* Identity */}
      <CollapsibleSection icon={Phone} title="Contacto">
        <InfoRow label="Teléfono" value={profile.phone} />
        <InfoRow label="Email" value={profile.email} />
        <InfoRow label="Dirección" value={profile.address} />
      </CollapsibleSection>

      {/* Lead Status */}
      <CollapsibleSection icon={BarChart3} title="Estado del Lead">
        <InfoRow label="Estado" value={profile.status} />
        <InfoRow label="Origen" value={profile.platform} />
        <InfoRow label="Campaña" value={profile.utmCampaign} />
        <InfoRow label="UTM Source" value={profile.utmSource} />
        <InfoRow label="UTM Medium" value={profile.utmMedium} />
        <InfoRow label="UTM Content" value={profile.utmContent} />
      </CollapsibleSection>

      {/* Orders — lazy load */}
      <div className="border-b border-white/5">
        <button
          onClick={() => setOrdersOpen(!ordersOpen)}
          className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <span className="flex items-center gap-2">
            <ShoppingBag className="h-3.5 w-3.5" />
            Pedidos
          </span>
          <motion.div animate={{ rotate: ordersOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-3.5 w-3.5" />
          </motion.div>
        </button>
        <OrderHistory leadId={profile.id} expanded={ordersOpen} />
      </div>

      {/* Notes */}
      <CollapsibleSection icon={StickyNote} title="Notas">
        <p className="text-xs text-neutral-300 leading-relaxed">
          {profile.notes ?? "Sin notas"}
        </p>
      </CollapsibleSection>

      {/* Attribution */}
      <CollapsibleSection icon={Target} title="Atribución">
        <InfoRow label="Platform" value={profile.platform} />
        <InfoRow label="Ad ID" value={profile.adId} />
        <InfoRow label="Campaign ID" value={profile.campaignId} />
        <InfoRow label="Adset ID" value={null} />
      </CollapsibleSection>
    </div>
  );
}
