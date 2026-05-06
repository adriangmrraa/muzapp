import type { ClientStats } from "./client";

export function calculateClientStats(orders: {
  id: number;
  items: unknown;
  status: string;
  createdAt: Date;
}[]): ClientStats {
  const completedOrders = orders.filter(
    (o) => o.status === "delivered" || o.status === "ready"
  );

  const totalOrders = completedOrders.length;
  
  // Items is already the calculated total from the DB
  const totalSpent = completedOrders.reduce((sum, order) => {
    const items = order.items as { total?: number; price?: number; quantity?: number }[] | null;
    if (!items) return sum;
    return sum + (items[0]?.total || 0);
  }, 0);

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const ordersThisMonth = completedOrders.filter((o) => {
    const d = new Date(o.createdAt);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  const lastOrder = orders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

  return {
    totalOrders,
    totalSpent,
    avgOrderValue: totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0,
    ordersThisMonth,
    lastOrderAt: lastOrder ? new Date(lastOrder.createdAt) : null,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(amount);
}

export function parseTags(notes: string | null): string[] {
  if (!notes) return [];
  try {
    const parsed = JSON.parse(notes);
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
}

export function stringifyTags(tags: string[]): string {
  return JSON.stringify(tags);
}