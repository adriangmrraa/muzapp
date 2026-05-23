"use client";

import { useState, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConversationSidebar } from "@/components/messages/conversation-sidebar";
import { ChatPanel } from "@/components/messages/chat-panel";
import { CustomerContextPanel } from "@/components/messages/customer-context-panel";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { UserRound, SidebarIcon } from "lucide-react";
import {
  useConversations,
  useMessages,
  useSendReply,
} from "@/lib/conversations/queries";
import type { ConversationSummary } from "@/types/chat";

// ─── Query Client (stable reference) ─────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

// ─── Inbox Component ─────────────────────────────────────────────────────────

interface Props {
  initialConversations: ConversationSummary[];
}

function ConversationsInboxInner({ initialConversations }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);

  // TanStack Query hooks (reemplazan polling manual)
  const { data: convData } = useConversations({ page: 1 });
  const { data: messages = [] } = useMessages(selectedId);
  const sendMutation = useSendReply(selectedId);

  const conversations: ConversationSummary[] =
    convData?.conversations ?? initialConversations;

  // Select conversation
  const handleSelect = useCallback((id: number) => {
    setSelectedId(id);
    setShowChat(true);
    setSidebarOpen(false);
  }, []);

  // Send message
  const handleSend = useCallback(
    (content: string) => {
      sendMutation.mutate(content);
    },
    [sendMutation]
  );

  const selectedConversation = conversations.find((c) => c.id === selectedId);
  const showEmptyState = !selectedId || !selectedConversation;

  // ── Context panel content (used both inline on desktop + inside Sheet on mobile) ──
  const contextPanel = selectedId ? (
    <CustomerContextPanel conversationId={selectedId} />
  ) : null;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-xl border border-white/10 bg-[#0f0f0f]">
      {/* ── Sidebar (desktop) ───────────────────────────────────────────── */}
      <div
        className={`w-full md:w-80 flex-shrink-0 border-r border-white/5 ${
          showChat ? "hidden md:flex md:flex-col" : "flex flex-col"
        }`}
      >
        <ConversationSidebar
          conversations={conversations}
          activeId={selectedId}
          onSelect={handleSelect}
        />
      </div>

      {/* ── Chat Panel ──────────────────────────────────────────────────── */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${
          !showChat ? "hidden md:flex" : "flex"
        }`}
      >
        {showEmptyState ? (
          <div className="flex flex-1 items-center justify-center text-gray-500">
            <p>Seleccioná una conversación</p>
          </div>
        ) : (
          <ChatPanel
            conversation={selectedConversation}
            messages={messages}
            onSend={handleSend}
            onBack={() => setShowChat(false)}
            onShowContext={() => setContextOpen(true)}
          />
        )}
      </div>

      {/* ── Context Panel (desktop xl+) ─────────────────────────────────── */}
      {selectedId && (
        <div className="hidden xl:flex xl:w-[380px] flex-shrink-0 border-l border-white/5">
          {contextPanel}
        </div>
      )}
    </div>
  );
}

// ─── Wrapper with QueryClientProvider ────────────────────────────────────────

export function ConversationsInbox(props: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <ConversationsInboxInner {...props} />
    </QueryClientProvider>
  );
}
