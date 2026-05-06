import { db } from "@/db";
import { conversations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

type ConversationStatus = "active" | "closed" | "archived";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function parseMessages(raw: Record<string, unknown>[] | null | undefined): Message[] {
  if (!raw || !Array.isArray(raw)) return [];

  return raw.reduce<Message[]>((acc, item) => {
    if (
      item &&
      typeof item === "object" &&
      (item.role === "user" || item.role === "assistant") &&
      typeof item.content === "string"
    ) {
      acc.push({
        role: item.role,
        content: item.content,
        timestamp: typeof item.timestamp === "string" ? item.timestamp : undefined,
      });
    }
    return acc;
  }, []);
}

function formatTime(timestamp: string | undefined): string | null {
  if (!timestamp) return null;
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return null;
  }
}

const statusConfig: Record<
  ConversationStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Activa",
    className: "bg-blue-500/15 text-blue-400 border-0",
  },
  closed: {
    label: "Cerrada",
    className: "bg-secondary text-secondary-foreground border-0",
  },
  archived: {
    label: "Archivada",
    className: "bg-yellow-500/15 text-yellow-400 border-0",
  },
};

// ─── Page ──────────────────────────────────────────────────────────────────────

type Params = Promise<{ id: string }>;

export default async function ConversationDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const numericId = parseInt(id, 10);

  if (isNaN(numericId)) notFound();

  const row = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, numericId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!row) notFound();

  const messages = parseMessages(row.messages);
  const status = row.status as ConversationStatus;
  const cfg = statusConfig[status] ?? statusConfig.closed;

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      {/* ─── Back link ─── */}
      <div>
        <Link
          href="/admin/conversations"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-1.5 -ml-2 text-muted-foreground hover:text-foreground transition-colors group"
          )}
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          Volver a conversaciones
        </Link>
      </div>

      {/* ─── Header ─── */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-gold-gradient">
            {row.customerName ?? "Sin nombre"}
          </h1>
          {row.customerPhone && (
            <p className="text-sm text-muted-foreground font-mono">
              {row.customerPhone}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            ID #{numericId} · {messages.length} mensajes
          </p>
        </div>
        <Badge className={cfg.className}>{cfg.label}</Badge>
      </div>

      {/* ─── Chat ─── */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm p-5 min-h-[300px] shadow-inner">
        {messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-16 text-sm text-muted-foreground">
            No hay mensajes en esta conversación.
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === "user";
            const time = formatTime(msg.timestamp);

            return (
              <div
                key={index}
                className={`flex flex-col gap-1 ${isUser ? "items-start" : "items-end"}`}
              >
                {/* Role label */}
                <span className="text-xs font-medium text-muted-foreground px-1 uppercase tracking-wide">
                  {isUser ? "Cliente" : "Agente"}
                </span>

                {/* Bubble */}
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-3 shadow-sm",
                    isUser
                      ? "bg-muted/80 text-foreground rounded-tl-sm border border-border/50"
                      : "bg-[#D4A017]/10 text-foreground rounded-tr-sm border border-[#D4A017]/20"
                  )}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                  {time && (
                    <p
                      className={cn(
                        "mt-1.5 text-[11px] text-muted-foreground",
                        isUser ? "text-left" : "text-right"
                      )}
                    >
                      {time}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── Metadata ─── */}
      <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground pb-1.5 border-b border-border">
          Metadata de la conversación
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium text-[#D4A017] uppercase tracking-wider">
              Estado
            </span>
            <span className="text-sm text-foreground">{cfg.label}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium text-[#D4A017] uppercase tracking-wider">
              Mensajes
            </span>
            <span className="text-sm text-foreground tabular-nums">{messages.length}</span>
          </div>
          {row.customerPhone && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-medium text-[#D4A017] uppercase tracking-wider">
                Teléfono
              </span>
              <span className="text-sm text-foreground font-mono">{row.customerPhone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
