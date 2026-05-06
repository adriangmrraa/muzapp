"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  PackageIcon,
  MessageSquareIcon,
  UsersIcon,
  BotIcon,
  ShoppingCartIcon,
  DollarSignIcon,
  UserPlusIcon,
  TrendingUpIcon,
} from "lucide-react";
import {
  staggerContainer,
  cardEntrance,
  fadeUpSmall,
} from "@/lib/animation-variants";
import type { DashboardCard, ActivityItem, RecentOrder } from "./page";

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP = {
  package: PackageIcon,
  message: MessageSquareIcon,
  users: UsersIcon,
  bot: BotIcon,
  cart: ShoppingCartIcon,
  dollar: DollarSignIcon,
  userplus: UserPlusIcon,
  trending: TrendingUpIcon,
} as const;

// ─── Status color map for orders table ────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-amber-500/15", text: "text-amber-400", label: "Pendiente" },
  preparing: { bg: "bg-blue-500/15", text: "text-blue-400", label: "Preparando" },
  ready: { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "Listo" },
  delivered: { bg: "bg-green-500/15", text: "text-green-400", label: "Entregado" },
  cancelled: { bg: "bg-red-500/15", text: "text-red-400", label: "Cancelado" },
};

// ─── Stats Card ───────────────────────────────────────────────────────────────

function StatsCard({ card, index }: { card: DashboardCard; index: number }) {
  const Icon = ICON_MAP[card.iconName];

  return (
    <motion.div
      variants={cardEntrance}
      initial="hidden"
      animate="visible"
      transition={{ delay: index * 0.08 }}
      whileHover={{
        y: -2,
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        transition: { duration: 0.2 },
      }}
      className="glass-card rounded-xl p-5 flex flex-col gap-3 cursor-default"
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
        {card.badge !== undefined ? (
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Badge variant={card.badge ? "success" : "secondary"}>
              {card.badge ? "Activo" : "Inactivo"}
            </Badge>
          </motion.div>
        ) : (
          <motion.div
            className="text-3xl font-bold text-gold-gradient"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            {card.value}
          </motion.div>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
      </div>
    </motion.div>
  );
}

// ─── Activity Row ─────────────────────────────────────────────────────────────

function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <motion.li
      variants={fadeUpSmall}
      className="flex items-center justify-between gap-3 px-6 py-3"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Badge
          className={
            item.type === "lead"
              ? "shrink-0 bg-blue-500/15 text-blue-400 hover:bg-blue-500/20 border-0"
              : "shrink-0 bg-orange-500/15 text-orange-400 hover:bg-orange-500/20 border-0"
          }
        >
          {item.type === "lead" ? "Lead" : "Pedido"}
        </Badge>
        <div className="min-w-0">
          {item.name ? (
            <p className="truncate text-sm font-medium text-foreground">
              {item.name}
            </p>
          ) : null}
          <p className="truncate text-xs text-muted-foreground">{item.phone}</p>
        </div>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">
        {item.timeLabel}
      </span>
    </motion.li>
  );
}

// ─── Recent Orders Table ──────────────────────────────────────────────────────

function OrdersTable({ orders }: { orders: RecentOrder[] }) {
  return (
    <motion.div
      className="glass-card rounded-xl overflow-hidden"
      variants={cardEntrance}
      initial="hidden"
      animate="visible"
      transition={{ delay: 0.45 }}
    >
      <div className="px-6 pt-5 pb-3">
        <h2 className="text-base font-semibold" style={{ color: "#D4A017" }}>
          Pedidos Recientes
        </h2>
      </div>

      {orders.length === 0 ? (
        <p className="px-6 pb-6 text-sm text-muted-foreground">
          No hay pedidos aún.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left text-xs text-muted-foreground uppercase tracking-wider"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Teléfono</th>
                <th className="px-6 py-3 font-medium">Tipo</th>
                <th className="px-6 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, idx) => {
                const st = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;
                const typeLabel =
                  order.orderType === "pan_mayorista"
                    ? "Pan Mayorista"
                    : order.orderType === "hamburguesas"
                      ? "Hamburguesas"
                      : "—";
                return (
                  <motion.tr
                    key={order.id}
                    variants={fadeUpSmall}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.03 }}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-3 text-foreground">
                      {order.customerName ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {order.phoneNumber}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {typeLabel}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${st.bg} ${st.text}`}
                      >
                        {st.label}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}

// ─── Dashboard Client ─────────────────────────────────────────────────────────

interface DashboardClientProps {
  cards: DashboardCard[];
  activity: ActivityItem[];
  recentOrders: RecentOrder[];
}

export function DashboardClient({ cards, activity, recentOrders }: DashboardClientProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <motion.div
        variants={fadeUpSmall}
        initial="hidden"
        animate="visible"
      >
        <h1
          className="text-2xl font-bold tracking-tight text-gold-gradient"
          style={{ display: "inline-block" }}
        >
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Resumen general del negocio
        </p>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {cards.map((card, idx) => (
          <StatsCard key={card.title} card={card} index={idx} />
        ))}
      </motion.div>

      {/* Two-column layout for activity + orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Feed */}
        <motion.div
          className="glass-card rounded-xl overflow-hidden"
          variants={cardEntrance}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.35 }}
        >
          <div className="px-6 pt-5 pb-3">
            <h2
              className="text-base font-semibold"
              style={{ color: "#D4A017" }}
            >
              Actividad Reciente
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Últimos leads y pedidos
            </p>
          </div>

          <AnimatePresence mode="wait">
            {activity.length === 0 ? (
              <motion.p
                key="empty"
                variants={fadeUpSmall}
                initial="hidden"
                animate="visible"
                className="px-6 pb-6 text-sm text-muted-foreground"
              >
                No hay actividad reciente.
              </motion.p>
            ) : (
              <motion.ul
                key="list"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {activity.map((item, idx) => (
                  <ActivityRow key={`${item.type}-${item.id}-${idx}`} item={item} />
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Recent Orders Table */}
        <OrdersTable orders={recentOrders} />
      </div>
    </div>
  );
}
