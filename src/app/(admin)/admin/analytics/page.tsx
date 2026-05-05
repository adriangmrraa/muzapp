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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Analytics de Campañas
        </h1>
        <p className="text-sm text-muted-foreground">
          Rendimiento de campañas y atribución de leads
        </p>
      </div>

      <SummaryCards data={summaryStats} />

      <LeadsChart data={leadsByDay} />

      <CampaignTable data={campaignPerformance} />
    </div>
  );
}
