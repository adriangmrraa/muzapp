import { db } from "@/db";
import { leads } from "@/db/schema";
import { desc, eq, count } from "drizzle-orm";
import LeadsTable from "./leads-table";

export const metadata = {
  title: "Leads — Mrs Muzzarella Admin",
};

const PAGE_SIZE = 20;

type LeadStatus = "new" | "contacted" | "converted" | "lost";

interface LeadsPageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams;
  const statusParam = params.status as LeadStatus | undefined;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const validStatuses: LeadStatus[] = ["new", "contacted", "converted", "lost"];
  const statusFilter =
    statusParam && validStatuses.includes(statusParam) ? statusParam : undefined;

  const whereClause = statusFilter ? eq(leads.status, statusFilter) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(leads)
      .where(whereClause)
      .orderBy(desc(leads.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ total: count() })
      .from(leads)
      .where(whereClause),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gold-gradient">
          Leads
        </h1>
        <p className="text-sm text-muted-foreground">
          Contactos capturados desde campañas publicitarias
        </p>
      </div>
      <LeadsTable
        leads={rows}
        currentPage={page}
        totalPages={totalPages}
        currentStatus={statusFilter ?? ""}
      />
    </div>
  );
}
