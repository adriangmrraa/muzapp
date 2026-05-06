"use server";

import { db } from "@/db";
import { orders, leads, conversations } from "@/db/schema";
import { desc, count, sql, and, or, ilike } from "drizzle-orm";
import { auth } from "@/auth";

const PAGE_SIZE = 30;

export interface ClientSummary {
  phone: string;
  name: string | null;
  totalOrders: number;
  lastOrderDate: Date | null;
  lastOrderType: string | null;
  lastOrderStatus: string | null;
  leadStatus: string | null;
  totalConversations: number;
  lastConversationDate: Date | null;
  tags: string[];
}

export interface ClientsResponse {
  clients: ClientSummary[];
  total: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Obtiene la lista unificada de clientes combinando orders + leads + conversations
 */
export async function fetchClients(params: {
  search?: string;
  page?: number;
}): Promise<ClientsResponse> {
  const session = await auth();
  if (!session) return { clients: [], total: 0, totalPages: 1, currentPage: 1 };

  const page = Math.max(1, params.page ?? 1);
  const offset = (page - 1) * PAGE_SIZE;

  // Get all unique phones from orders, leads, and conversations
  const orderPhones = await db
    .select({
      phone: orders.phoneNumber,
      name: orders.customerName,
      orderCount: count(),
      lastDate: sql<string>`MAX(${orders.createdAt})`,
      lastType: sql<string>`(SELECT ${orders.orderType} FROM ${orders} o2 WHERE o2.phone_number = ${orders.phoneNumber} ORDER BY o2.created_at DESC LIMIT 1)`,
      lastStatus: sql<string>`(SELECT ${orders.status} FROM ${orders} o3 WHERE o3.phone_number = ${orders.phoneNumber} ORDER BY o3.created_at DESC LIMIT 1)`,
    })
    .from(orders)
    .groupBy(orders.phoneNumber, orders.customerName)
    .orderBy(desc(sql`MAX(${orders.createdAt})`));

  const leadPhones = await db
    .select({
      phone: leads.phone,
      name: leads.name,
      status: leads.status,
      tags: leads.tags,
    })
    .from(leads)
    .groupBy(leads.phone, leads.name, leads.status, leads.tags);

  const convPhones = await db
    .select({
      phone: conversations.whatsappId,
      customerName: conversations.customerName,
      count: count(),
      lastDate: sql<string>`MAX(${conversations.updatedAt})`,
    })
    .from(conversations)
    .groupBy(conversations.whatsappId, conversations.customerName);

  // Merge by phone
  const phoneMap = new Map<string, ClientSummary>();

  for (const o of orderPhones) {
      phoneMap.set(o.phone, {
      phone: o.phone,
      name: o.name,
      totalOrders: o.orderCount,
      lastOrderDate: o.lastDate ? new Date(o.lastDate) : null,
      lastOrderType: o.lastType,
      lastOrderStatus: o.lastStatus,
      leadStatus: null,
      totalConversations: 0,
      lastConversationDate: null,
      tags: [],
    });
  }

  for (const l of leadPhones) {
    const existing = phoneMap.get(l.phone);
    if (existing) {
      existing.leadStatus = l.status;
      if (!existing.name && l.name) existing.name = l.name;
      if (l.tags) existing.tags = l.tags;
    } else {
      phoneMap.set(l.phone, {
        phone: l.phone,
        name: l.name,
        totalOrders: 0,
        lastOrderDate: null,
        lastOrderType: null,
        lastOrderStatus: null,
        leadStatus: l.status,
        totalConversations: 0,
        lastConversationDate: null,
        tags: l.tags ?? [],
      });
    }
  }

  for (const c of convPhones) {
    const existing = phoneMap.get(c.phone);
    if (existing) {
      existing.totalConversations = c.count;
      existing.lastConversationDate = c.lastDate ? new Date(c.lastDate) : null;
      if (!existing.name && c.customerName) existing.name = c.customerName;
    } else {
      phoneMap.set(c.phone, {
        phone: c.phone,
        name: c.customerName,
        totalOrders: 0,
        lastOrderDate: null,
        lastOrderType: null,
        lastOrderStatus: null,
        leadStatus: null,
        totalConversations: c.count,
        lastConversationDate: c.lastDate ? new Date(c.lastDate) : null,
        tags: [],
      });
    }
  }

  let clients = Array.from(phoneMap.values());

  // Search filter
  if (params.search) {
    const s = params.search.toLowerCase();
    clients = clients.filter(
      (c) =>
        c.phone.includes(s) ||
        (c.name && c.name.toLowerCase().includes(s)) ||
        (c.tags && c.tags.some((t) => t.includes(s)))
    );
  }

  // Sort by most recent activity
  clients.sort((a, b) => {
    const dateA = a.lastOrderDate ?? a.lastConversationDate ?? new Date(0);
    const dateB = b.lastOrderDate ?? b.lastConversationDate ?? new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  const total = clients.length;
  const paged = clients.slice(offset, offset + PAGE_SIZE);

  return {
    clients: paged,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    currentPage: page,
  };
}
