import { UsersIcon, TrendingUpIcon, TargetIcon, PercentIcon } from "lucide-react";

export interface SummaryStats {
  totalLeads: number;
  leadsThisWeek: number;
  topCampaign: string | null;
  conversionRate: number;
}

interface SummaryCardsProps {
  data: SummaryStats;
}

export function SummaryCards({ data }: SummaryCardsProps) {
  const cards = [
    {
      title: "Total Leads",
      value: data.totalLeads.toString(),
      description: "Desde el inicio",
      icon: UsersIcon,
    },
    {
      title: "Esta Semana",
      value: data.leadsThisWeek.toString(),
      description: "Últimos 7 días",
      icon: TrendingUpIcon,
    },
    {
      title: "Top Campaña",
      value: data.topCampaign ?? "—",
      description: "Más leads generados",
      icon: TargetIcon,
      small: true,
    },
    {
      title: "Tasa de Conversión",
      value: `${data.conversionRate.toFixed(1)}%`,
      description: "Leads convertidos",
      icon: PercentIcon,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="rounded-xl bg-card p-5 shadow-sm border border-border/40 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {card.title}
              </span>
              <Icon className="size-4 text-primary" />
            </div>
            <div>
              <p
                className={
                  card.small
                    ? "text-lg font-bold text-foreground truncate"
                    : "text-3xl font-bold text-foreground"
                }
              >
                {card.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {card.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
