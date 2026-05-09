"use client";

import { motion } from "framer-motion";
import { UsersIcon, TrendingUpIcon, TargetIcon, PercentIcon } from "lucide-react";
import { staggerContainer, cardEntrance } from "@/lib/animation-variants";

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
      small: false,
    },
    {
      title: "Esta Semana",
      value: data.leadsThisWeek.toString(),
      description: "Últimos 7 días",
      icon: TrendingUpIcon,
      small: false,
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
      small: false,
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            variants={cardEntrance}
            whileHover={{
              y: -2,
              boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
              transition: { duration: 0.2 },
            }}
            className="glass-card card-gold-glow rounded-xl p-5 flex flex-col gap-3 cursor-default"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {card.title}
              </span>
              <div
                className="size-8 rounded-lg flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(212,160,23,0.18), rgba(232,113,42,0.12))",
                  border: "1px solid rgba(212,160,23,0.25)",
                }}
              >
                <Icon className="size-4" style={{ color: "#D4A017" }} />
              </div>
            </div>

            <div>
              <motion.p
                className={
                  card.small
                    ? "text-lg font-bold text-foreground truncate"
                    : "text-3xl font-bold text-gold-gradient"
                }
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.45, ease: "easeOut", delay: 0.2 }}
              >
                {card.value}
              </motion.p>
              <p className="mt-1 text-xs text-muted-foreground">
                {card.description}
              </p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
