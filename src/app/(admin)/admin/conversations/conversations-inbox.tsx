"use client";

import { useState, useEffect, useCallback } from "react";
import { ConversationSidebar } from "@/components/messages/conversation-sidebar";
import { ChatPanel } from "@/components/messages/chat-panel";
import {
  getConversations,
  getMessages,
  sendReply,
  toggleHumanOverride,
} from "./actions";
import type { ConversationSummary, ChatMessage } from "@/types/chat";

interface Props {
  initialConversations: ConversationSummary[];
}

export function ConversationsInbox({ initialConversations }: Props) {
  const [conversations, setConversations] =
    useState<ConversationSummary[]>(initialConversations);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showChat, setShowChat] = useState(false); // mobile: show chat panel

  // Poll conversations every 5s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const result = await getConversations({ page: 1 });
        setConversations(mapToSummary(result.conversations));
      } catch {
        // swallow polling errors silently
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Poll messages for selected conversation every 3s
  useEffect(() => {
    if (!selectedId) return;
    const interval = setInterval(async () => {
      try {
        const msgs = await getMessages(selectedId);
        setMessages(mapToMessages(msgs));
      } catch {
        // swallow polling errors silently
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedId]);

  // Select conversation
  const handleSelect = useCallback(async (id: number) => {
    setSelectedId(id);
    setShowChat(true);
    try {
      const msgs = await getMessages(id);
      setMessages(mapToMessages(msgs));
    } catch {
      setMessages([]);
    }
  }, []);

  // Send message
  const handleSend = useCallback(
    async (content: string) => {
      if (!selectedId) return;
      await sendReply(selectedId, content);
      // Refresh messages after send
      try {
        const msgs = await getMessages(selectedId);
        setMessages(mapToMessages(msgs));
      } catch {
        // ignore
      }
    },
    [selectedId]
  );

  // Human override — toggle: if humanOverrideUntil is active, disable; else enable
  const handleHumanOverride = useCallback(async () => {
    if (!selectedId) return;
    const conv = conversations.find((c) => c.id === selectedId);
    // We don't have humanOverrideUntil on ConversationSummary, so just enable override
    await toggleHumanOverride(selectedId, true);
    // Refresh conversation list to reflect change
    try {
      const result = await getConversations({ page: 1 });
      setConversations(mapToSummary(result.conversations));
    } catch {
      // ignore
    }
  }, [selectedId, conversations]);

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-xl border border-white/10 bg-[#0f0f0f]">
      {/* Sidebar — hidden on mobile when chat is open */}
      <div
        className={`w-full md:w-80 flex-shrink-0 ${showChat ? "hidden md:flex md:flex-col" : "flex flex-col"}`}
      >
        <ConversationSidebar
          conversations={conversations}
          activeId={selectedId}
          onSelect={handleSelect}
        />
      </div>

      {/* Chat panel */}
      <div
        className={`flex-1 flex flex-col border-l border-white/5 ${!showChat ? "hidden md:flex" : "flex"}`}
      >
        {selectedId && selectedConversation ? (
          <ChatPanel
            conversation={selectedConversation}
            messages={messages}
            onSend={handleSend}
            onBack={() => setShowChat(false)}
            onHumanOverride={handleHumanOverride}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-gray-500">
            <p>Seleccioná una conversación</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

type DbConversation = {
  id: number;
  channel: "whatsapp" | "telegram";
  customerName: string | null;
  customerPhone: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: Date | null;
  status: "active" | "closed" | "archived";
};

function mapToSummary(rows: DbConversation[]): ConversationSummary[] {
  return rows.map((r) => ({
    id: r.id,
    channel: r.channel ?? "whatsapp",
    customerName: r.customerName ?? null,
    customerPhone: r.customerPhone ?? "",
    lastMessagePreview: r.lastMessagePreview ?? null,
    lastMessageAt:
      r.lastMessageAt instanceof Date
        ? r.lastMessageAt.toISOString()
        : (r.lastMessageAt ?? null),
    status: r.status ?? "active",
  }));
}

type DbMessage = {
  id: number;
  conversationId: number;
  role: "user" | "assistant" | "system" | "human";
  content: string;
  contentAttributes:
    | {
        type: "image" | "audio" | "document" | "video";
        url: string;
        fileName?: string;
        fileSize?: number;
        mimeType?: string;
        caption?: string;
        transcription?: string;
      }[]
    | null;
  createdAt: Date;
};

function mapToMessages(rows: DbMessage[]): ChatMessage[] {
  return rows.map((r) => ({
    id: r.id,
    conversationId: r.conversationId,
    role: r.role,
    content: r.content,
    contentAttributes: r.contentAttributes ?? [],
    createdAt:
      r.createdAt instanceof Date
        ? r.createdAt.toISOString()
        : (r.createdAt ?? new Date().toISOString()),
  }));
}
