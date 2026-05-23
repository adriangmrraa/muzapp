"use client";

import { useState, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConversationSidebar } from "@/components/messages/conversation-sidebar";
import { ChatPanel } from "@/components/messages/chat-panel";
import { CustomerContextPanel } from "@/components/messages/customer-context-panel";
import { ChevronLeft } from "lucide-react";
import {
  useConversations,
  useMessages,
  useSendReply,
} from "@/lib/conversations/queries";
import { toggleHumanOverride } from "./actions";
import type { ConversationSummary } from "@/types/chat";

// ─── Query Client ────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: true },
  },
});

// ─── Inbox Component ─────────────────────────────────────────────────────────

interface Props {
  initialConversations: ConversationSummary[];
}

function ConversationsInboxInner({ initialConversations }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [currentView, setCurrentView] = useState<"list" | "chat" | "context">("list");

  // TanStack Query hooks
  const { data: convData } = useConversations({ page: 1 });
  const { data: messages = [] } = useMessages(selectedId);
  const sendMutation = useSendReply(selectedId);

  const conversations: ConversationSummary[] =
    convData?.conversations ?? initialConversations;

  const handleSelect = useCallback((id: number) => {
    setSelectedId(id);
    setCurrentView("chat");
  }, []);

  const handleSend = useCallback(
    (content: string) => sendMutation.mutate(content),
    [sendMutation]
  );

  const handleOpenContext = useCallback(() => setCurrentView("context"), []);
  const handleBackToList = useCallback(() => setCurrentView("list"), []);
  const handleBackToChat = useCallback(() => setCurrentView("chat"), []);

  const selectedConversation = conversations.find((c) => c.id === selectedId);
  const isHumanOverride = selectedConversation?.humanOverrideUntil
    ? new Date(selectedConversation.humanOverrideUntil) > new Date()
    : false;

  const handleHumanOverride = useCallback(async () => {
    if (!selectedId) return;
    await toggleHumanOverride(selectedId, !isHumanOverride);
  }, [selectedId, isHumanOverride]);

  // ── Context panel (shared between inline desktop + fullscreen mobile) ──
  const contextPanel = selectedId ? (
    <div className="flex flex-col h-full">
      {/* Mobile back button */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 xl:hidden">
        <button
          onClick={handleBackToChat}
          className="p-1.5 -ml-1.5 rounded-lg hover:bg-white/5 text-neutral-400"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium text-neutral-200">Perfil del Cliente</span>
      </div>
      <CustomerContextPanel conversationId={selectedId} />
    </div>
  ) : null;

  return (
    <div className="flex flex-1 overflow-hidden bg-[#0f0f0f]">
      {/* ── Col 1: Listado de Chats ─────────────────────────────────────── */}
      <div
        className={`flex-shrink-0 border-r border-white/5 ${
          currentView === "list" ? "flex flex-col w-full md:w-80" : "hidden md:flex md:flex-col md:w-80"
        }`}
      >
        <ConversationSidebar
          conversations={conversations}
          activeId={selectedId}
          onSelect={handleSelect}
        />
      </div>

      {/* ── Col 2: Chat Activo ──────────────────────────────────────────── */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${
          currentView === "chat" ? "flex" : "hidden md:flex"
        }`}
      >
        {!selectedId || !selectedConversation ? (
          <div className="flex flex-1 items-center justify-center text-gray-500">
            <p>Seleccioná una conversación</p>
          </div>
        ) : (
          <ChatPanel
            conversation={selectedConversation}
            messages={messages}
            onSend={handleSend}
            onBack={handleBackToList}
            onShowContext={handleOpenContext}
            onHumanOverride={handleHumanOverride}
            humanOverrideActive={isHumanOverride}
          />
        )}
      </div>

      {/* ── Col 3: Contexto/Perfil del Cliente ──────────────────────────── */}
      {/* Desktop: siempre visible xl+ como tercera columna */}
      {selectedId && (
        <div className="hidden xl:flex xl:w-[380px] flex-shrink-0 border-l border-white/5">
          {contextPanel}
        </div>
      )}

      {/* Mobile: fullscreen overlay cuando currentView === 'context' */}
      {selectedId && (
        <div
          className={`absolute inset-0 z-40 bg-[#0f0f0f] xl:hidden ${
            currentView === "context" ? "flex flex-col" : "hidden"
          }`}
        >
          {contextPanel}
        </div>
      )}
    </div>
  );
}

// ─── Wrapper ─────────────────────────────────────────────────────────────────

export function ConversationsInbox(props: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <ConversationsInboxInner {...props} />
    </QueryClientProvider>
  );
}
