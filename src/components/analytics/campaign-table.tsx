"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fadeUpSmall } from "@/lib/animation-variants";

export interface CampaignPerformance {
  campaign: string;
  leadCount: number;
  convertedCount: number;
  rate: number;
}

interface CampaignTableProps {
  data: CampaignPerformance[];
}

function rateColor(rate: number): string {
  if (rate >= 50) return "#4ade80"; // green-400
  if (rate >= 20) return "#fbbf24"; // amber-400
  return "rgba(255,255,255,0.4)";  // muted
}

function CampaignRow({ row, index }: { row: CampaignPerformance; index: number }) {
  return (
    <motion.tr
      variants={fadeUpSmall}
      initial="hidden"
      animate="visible"
      transition={{ delay: index * 0.06 }}
      whileHover={{
        backgroundColor: "rgba(212,160,23,0.04)",
        transition: { duration: 0.15 },
      }}
      className="border-border/40 transition-colors"
    >
      <TableCell className="px-6 font-medium text-foreground">
        {row.campaign}
      </TableCell>
      <TableCell className="px-4 text-right text-foreground">
        {row.leadCount}
      </TableCell>
      <TableCell className="px-4 text-right text-foreground">
        {row.convertedCount}
      </TableCell>
      <TableCell className="px-6 text-right">
        <span
          className="font-medium tabular-nums"
          style={{ color: rateColor(row.rate) }}
        >
          {row.rate.toFixed(1)}%
        </span>
      </TableCell>
    </motion.tr>
  );
}

export function CampaignTable({ data }: CampaignTableProps) {
  return (
    <motion.div
      className="glass-card card-gold-glow rounded-xl overflow-hidden"
      variants={fadeUpSmall}
      initial="hidden"
      animate="visible"
    >
      <div
        className="px-6 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <h2 className="text-base font-semibold text-foreground">
          Rendimiento por Campaña
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Leads y conversiones por cada campaña
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow
            className="border-border/40 hover:bg-transparent"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <TableHead className="px-6 text-muted-foreground font-medium">
              Campaña
            </TableHead>
            <TableHead className="px-4 text-muted-foreground font-medium text-right">
              Leads
            </TableHead>
            <TableHead className="px-4 text-muted-foreground font-medium text-right">
              Conversiones
            </TableHead>
            <TableHead className="px-6 text-muted-foreground font-medium text-right">
              Tasa
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="wait">
            {data.length === 0 ? (
              <motion.tr
                key="empty"
                variants={fadeUpSmall}
                initial="hidden"
                animate="visible"
                className="border-0 hover:bg-transparent"
              >
                <TableCell
                  colSpan={4}
                  className="px-6 py-8 text-center text-sm text-muted-foreground"
                >
                  No hay campañas con datos
                </TableCell>
              </motion.tr>
            ) : (
              data.map((row, idx) => (
                <CampaignRow key={idx} row={row} index={idx} />
              ))
            )}
          </AnimatePresence>
        </TableBody>
      </Table>
    </motion.div>
  );
}
