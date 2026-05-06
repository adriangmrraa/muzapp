"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Phone, MoreVertical, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChannelBadge } from "./channel-badge";
import { MessageBubble } from "./message-bubble";
import { ReplyInput } from "./reply-input";
import type { ChatMessage, ConversationSummary } from "@/types/chat";

interface ChatPanelProps {
  conversation: ConversationSummary;
  messages: ChatMessage[];
  onSend: (message: string) => void;
  onBack?: () => void;
  onHumanOverride?: () => void;
  className?: string;
}

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function formatDateSeparator(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(dateStr, today.toISOString())) return "Hoy";
  if (isSameDay(dateStr, yesterday.toISOString())) return "Ayer";
  return d.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-1 h-px bg-white/10" />
      <span className="text-[11px] text-neutral-500 font-medium px-2">
        {formatDateSeparator(date)}
      </span>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  );
}

export function ChatPanel({
  conversation,
  messages,
  onSend,
  onBack,
  onHumanOverride,
  className,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const displayName = conversation.customerName || conversation.customerPhone;
  const initial = (conversation.customerName?.[0] || conversation.customerPhone.slice(-2)).toUpperCase();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={cn("flex flex-col h-full bg-[#0a0a0a]", className)}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[rgba(0,0,0,0.6)] backdrop-blur-lg"
      >
        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 rounded-lg hover:bg-white/5 text-neutral-400 lg:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}

        {/* Avatar */}
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#D4A017]/30 to-[#D4A017]/10 flex items-center justify-center text-sm font-semibold text-[#D4A017]">
          {initial}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-100 truncate">
              {displayName}
            </span>
            <ChannelBadge channel={conversation.channel} size="sm" />
            {conversation.status === "active" && (
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            )}
          </div>
          <p className="text-[11px] text-neutral-500 truncate">
            {conversation.customerPhone}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {onHumanOverride && (
            <button
              onClick={onHumanOverride}
              className="p-2 rounded-lg hover:bg-white/5 text-neutral-400 transition-colors"
              title="Tomar control humano"
            >
              <UserCheck className="h-4 w-4" />
            </button>
          )}
          <button className="p-2 rounded-lg hover:bg-white/5 text-neutral-400 transition-colors">
            <Phone className="h-4 w-4" />
          </button>
          <button className="p-2 rounded-lg hover:bg-white/5 text-neutral-400 transition-colors">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(212,160,23,0.02) 0%, transparent 50%)",
        }}
      >
        <AnimatePresence mode="popLayout">
          {messages.map((msg, i) => {
            const showDate =
              i === 0 ||
              !isSameDay(messages[i - 1].createdAt, msg.createdAt);

            return (
              <div key={msg.id}>
                {showDate && <DateSeparator date={msg.createdAt} />}
                <div
                  className={cn(
                    "flex mb-2",
                    msg.role === "user" ? "justify-start" : "justify-end",
                    msg.role === "system" && "justify-center"
                  )}
                >
                  <MessageBubble message={msg} />
                </div>
              </div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Reply input */}
      <ReplyInput onSend={onSend} channel={conversation.channel} />
    </div>
  );
}
