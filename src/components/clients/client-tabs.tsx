"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { ClientTab } from "@/types/client";

interface ClientTabsProps {
  activeTab: ClientTab;
  onTabChange: (tab: ClientTab) => void;
  stats?: {
    totalOrders: number;
    totalSpent: number;
  };
}

const TABS: { id: ClientTab; label: string }[] = [
  { id: "datos", label: "Datos" },
  { id: "pedidos", label: "Pedidos" },
  { id: "stats", label: "Stats" },
  { id: "tags", label: "Tags" },
  { id: "chat", label: "Chat" },
  { id: "editar", label: "Editar" },
];

export function ClientTabs({ activeTab, onTabChange, stats }: ClientTabsProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Tab buttons */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "text-amber-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="client-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400"
              />
            )}
            {tab.id === "stats" && stats && (
              <span className="ml-1 text-xs text-amber-400/60">
                ({stats.totalOrders})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content indicator */}
      <div className="text-xs text-muted-foreground uppercase tracking-wide">
        {TABS.find((t) => t.id === activeTab)?.label}
      </div>
    </div>
  );
}

// Tab content components
export function ClientDatosTab({ client }: { client: { name: string; phone: string; email?: string | null } }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground uppercase">Nombre</label>
        <p className="text-lg font-medium">{client.name || "Sin nombre"}</p>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground uppercase">Teléfono</label>
        <p className="font-mono">{client.phone}</p>
      </div>
      {client.email && (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase">Email</label>
          <p>{client.email}</p>
        </div>
      )}
    </div>
  );
}

export function ClientPedidosTab({ orders }: { orders: { id: number; items: unknown; status: string; createdAt: Date }[] }) {
  if (orders.length === 0) {
    return <p className="text-muted-foreground">Sin pedidos</p>;
  }

  return (
    <div className="space-y-2">
      {orders.map((order) => (
        <div
          key={order.id}
          className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
        >
          <div>
            <p className="font-medium">Pedido #{order.id}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString("es-AR")}
            </p>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              order.status === "delivered"
                ? "bg-green-500/20 text-green-400"
                : order.status === "ready"
                ? "bg-amber-500/20 text-amber-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {order.status}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ClientStatsTab({
  stats,
}: {
  stats: { totalOrders: number; totalSpent: number; avgOrderValue: number; ordersThisMonth: number };
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 rounded-lg bg-muted/30">
        <p className="text-xs text-muted-foreground uppercase">Total pedidos</p>
        <p className="text-2xl font-bold text-amber-400">{stats.totalOrders}</p>
      </div>
      <div className="p-4 rounded-lg bg-muted/30">
        <p className="text-xs text-muted-foreground uppercase">Total gastado</p>
        <p className="text-2xl font-bold">
          ${stats.totalSpent.toLocaleString("es-AR")}
        </p>
      </div>
      <div className="p-4 rounded-lg bg-muted/30">
        <p className="text-xs text-muted-foreground uppercase">Pedidos este mes</p>
        <p className="text-2xl font-bold">{stats.ordersThisMonth}</p>
      </div>
      <div className="p-4 rounded-lg bg-muted/30">
        <p className="text-xs text-muted-foreground uppercase">Promedio</p>
        <p className="text-2xl font-bold">
          ${stats.avgOrderValue.toLocaleString("es-AR")}
        </p>
      </div>
    </div>
  );
}

export function ClientTagsTab({
  tags,
  onAddTag,
  onRemoveTag,
}: {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}) {
  const [newTag, setNewTag] = useState("");

  const handleAdd = () => {
    if (newTag.trim()) {
      onAddTag(newTag.trim());
      setNewTag("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Nueva etiqueta"
          className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-amber-500 text-amber-950 rounded-lg text-sm font-medium"
        >
          Agregar
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs"
          >
            {tag}
            <button
              onClick={() => onRemoveTag(tag)}
              className="hover:text-amber-200"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

export function ClientChatTab({
  messages,
}: {
  messages: { from: string; text: string; timestamp: Date }[];
}) {
  if (messages.length === 0) {
    return <p className="text-muted-foreground">Sin conversaciones</p>;
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`p-3 rounded-lg ${
            msg.from === "customer" ? "bg-muted/50" : "bg-amber-500/20"
          }`}
        >
          <p className="text-sm">{msg.text}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(msg.timestamp).toLocaleString("es-AR")}
          </p>
        </div>
      ))}
    </div>
  );
}

export function ClientEditarTab({
  client,
  onSave,
}: {
  client: { name: string; phone: string; email?: string | null };
  onSave: (data: { name: string; email: string }) => void;
}) {
  const [name, setName] = useState(client.name || "");
  const [email, setEmail] = useState(client.email || "");

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-muted-foreground uppercase">Nombre</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 bg-muted rounded-lg"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground uppercase">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 bg-muted rounded-lg"
        />
      </div>
      <button
        onClick={() => onSave({ name, email })}
        className="w-full py-2 bg-amber-500 text-amber-950 rounded-lg font-medium"
      >
        Guardar cambios
      </button>
    </div>
  );
}