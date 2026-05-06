"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConversationItem } from "./conversation-item";
import type { ConversationSummary, ConversationFilter } from "@/types/chat";

interface ConversationSidebarProps {
  conversations: ConversationSummary[];
  activeId: number | null;
  onSelect: (id: number) => void;
  className?: string;
}

const filters: { value: ConversationFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "whatsapp", label: "WA" },
  { value: "telegram", label: "TG" },
  { value: "active", label: "Activos" },
  { value: "closed", label: "Cerrados" },
];

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  className,
}: ConversationSidebarProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ConversationFilter>("all");

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        c.customerName?.toLowerCase().includes(q) ||
        c.customerPhone.includes(q) ||
        c.lastMessagePreview?.toLowerCase().includes(q);

      const matchesFilter =
        filter === "all" ||
        (filter === "active" ? c.status === "active" : false) ||
        (filter === "closed" ? c.status === "closed" : false) ||
        (filter === "whatsapp" ? c.channel === "whatsapp" : false) ||
        (filter === "telegram" ? c.channel === "telegram" : false);

      return matchesSearch && matchesFilter;
    });
  }, [conversations, search, filter]);

  return (
    <div
      className={cn(
        "flex flex-col h-full",
        "bg-[#0f0f0f] border-r border-[rgba(212,160,23,0.1)]",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 space-y-3 border-b border-white/5">
        <h2 className="text-lg font-semibold text-neutral-100">Mensajes</h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar conversación..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-[#D4A017]/40 transition-colors"
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-neutral-500 mr-1" />
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                filter === f.value
                  ? "bg-[#D4A017]/20 text-[#D4A017] border border-[#D4A017]/30"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
            filtered.map((conversation, i) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15, delay: i * 0.02 }}
              >
                <ConversationItem
                  conversation={conversation}
                  isActive={conversation.id === activeId}
                  onClick={onSelect}
                />
              </motion.div>
            ))
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm text-neutral-500 py-8"
            >
              No se encontraron conversaciones
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Footer count */}
      <div className="px-4 py-2 border-t border-white/5">
        <p className="text-[11px] text-neutral-500">
          {filtered.length} conversación{filtered.length !== 1 ? "es" : ""}
        </p>
      </div>
    </div>
  );
}
