import { getSummaryStats, getLeadsByDay, getCampaignPerformance } from "@/lib/analytics/queries";
import { SummaryCards } from "@/components/analytics/summary-cards";
import { LeadsChart } from "@/components/analytics/leads-chart";
import { CampaignTable } from "@/components/analytics/campaign-table";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [summaryStats, leadsByDay, campaignPerformance] = await Promise.all([
    getSummaryStats(),
    getLeadsByDay(30),
    getCampaignPerformance(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header — server-rendered, no animation needed */}
      <div className="flex flex-col gap-1">
        <h1
          className="text-2xl font-bold tracking-tight text-gold-gradient"
          style={{ display: "inline-block" }}
        >
          Analytics de Campañas
        </h1>
        <p className="text-sm text-muted-foreground">
          Rendimiento de campañas y atribución de leads
        </p>
        <div
          className="mt-2 h-px w-16 rounded-full"
          style={{
            background: "linear-gradient(135deg, #D4A017, #F5A623)",
            opacity: 0.6,
          }}
        />
      </div>

      <SummaryCards data={summaryStats} />

      <LeadsChart data={leadsByDay} />

      <CampaignTable data={campaignPerformance} />
    </div>
  );
}
