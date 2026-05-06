import { db } from "@/db";
import { conversations } from "@/db/schema";
import { desc, eq, count } from "drizzle-orm";
import ConversationsTable from "./conversations-table";

export const metadata = {
  title: "Conversaciones — Mrs Muzzarella Admin",
};

const PAGE_SIZE = 20;

type SearchParams = Promise<{ status?: string; page?: string }>;

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { status, page } = await searchParams;

  const currentPage = Math.max(1, parseInt(page ?? "1", 10));
  const offset = (currentPage - 1) * PAGE_SIZE;

  const validStatuses = ["active", "closed", "archived"] as const;
  type Status = (typeof validStatuses)[number];
  const statusFilter =
    status && (validStatuses as readonly string[]).includes(status)
      ? (status as Status)
      : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: conversations.id,
        customerName: conversations.customerName,
        customerPhone: conversations.customerPhone,
        status: conversations.status,
        messages: conversations.messages,
        createdAt: conversations.createdAt,
      })
      .from(conversations)
      .where(statusFilter ? eq(conversations.status, statusFilter) : undefined)
      .orderBy(desc(conversations.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),

    db
      .select({ total: count() })
      .from(conversations)
      .where(statusFilter ? eq(conversations.status, statusFilter) : undefined),
  ]);

  const data = rows.map((row) => ({
    ...row,
    messageCount: Array.isArray(row.messages) ? row.messages.length : 0,
  }));

  const totalPages = Math.max(1, Math.ceil(Number(total) / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gold-gradient">
          Conversaciones
        </h1>
        <p className="text-sm text-muted-foreground">
          Historial de chats de WhatsApp
        </p>
      </div>
      <ConversationsTable
        conversations={data}
        currentPage={currentPage}
        totalPages={totalPages}
        statusFilter={statusFilter ?? ""}
      />
    </div>
  );
}
