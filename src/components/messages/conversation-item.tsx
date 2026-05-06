"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChannelBadge } from "./channel-badge";
import type { ConversationSummary } from "@/types/chat";

interface ConversationItemProps {
  conversation: ConversationSummary;
  isActive: boolean;
  onClick: (id: number) => void;
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

function truncate(text: string | null, max: number): string {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "..." : text;
}

export function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  const displayName = conversation.customerName || conversation.customerPhone;
  const initial = (conversation.customerName?.[0] || conversation.customerPhone.slice(-2)).toUpperCase();

  return (
    <motion.button
      layout
      onClick={() => onClick(conversation.id)}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
        "hover:bg-[rgba(212,160,23,0.03)]",
        isActive
          ? "border-l-2 border-[#D4A017] bg-[rgba(212,160,23,0.05)]"
          : "border-l-2 border-transparent"
      )}
      whileTap={{ scale: 0.98 }}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#D4A017]/30 to-[#D4A017]/10 flex items-center justify-center text-sm font-semibold text-[#D4A017]">
          {initial}
        </div>
        {/* Status dot */}
        {conversation.status === "active" && (
          <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0f0f0f] bg-emerald-400" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-medium text-neutral-100 truncate">
              {displayName}
            </span>
            <ChannelBadge channel={conversation.channel} size="sm" />
          </div>
          <span className="text-[10px] text-neutral-500 flex-shrink-0">
            {formatRelativeTime(conversation.lastMessageAt)}
          </span>
        </div>
        <p className="text-xs text-neutral-400 truncate mt-0.5">
          {truncate(conversation.lastMessagePreview, 60)}
        </p>
      </div>
    </motion.button>
  );
}
