import {
  pgTable,
  pgEnum,
  serial,
  text,
  varchar,
  numeric,
  boolean,
  integer,
  jsonb,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";


// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["admin", "viewer"]);

export const productCategoryEnum = pgEnum("product_category", [
  "hamburguesa",
  "acompanamiento",
  "pan_mayorista",
]);

export const productLineEnum = pgEnum("product_line", [
  "pollo",
  "carne",
  "clasica",
  "pan",
]);

export const conversationStatusEnum = pgEnum("conversation_status", [
  "active",
  "closed",
  "archived",
]);

export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "converted",
  "lost",
]);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  hashedPassword: text("hashed_password").notNull(),
  name: varchar("name", { length: 255 }),
  role: userRoleEnum("role").notNull().default("viewer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }),
  imageUrl: text("image_url"),
  category: productCategoryEnum("category").notNull(),
  line: productLineEnum("line").notNull(),
  available: boolean("available").notNull().default(true),
  comingSoon: boolean("coming_soon").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const agentConfig = pgTable("agent_config", {
  id: serial("id").primaryKey(),
  systemPrompt: text("system_prompt"),
  phoneNumber: varchar("phone_number", { length: 50 }),
  ycloudApiKey: text("ycloud_api_key"),
  enabled: boolean("enabled").notNull().default(false),
  businessHours: jsonb("business_hours"),
  // ─── Nuevos campos Agente Interno ──────────────────────────────────────────
  whatsappBotNumber: varchar("whatsapp_bot_number", { length: 50 }),
  allowedPhoneIds: jsonb("allowed_phone_ids").$type<{ name: string; phone: string }[]>().default([]),
  autoReply24h: boolean("auto_reply_24h").notNull().default(false),
  autoReply24hMessage: text("auto_reply_24h_message"),
  trainBotContext: text("train_bot_context"),
  // ─── Telegram Bot (CRUD) ────────────────────────────────────────────────
  telegramBotToken: text("telegram_bot_token"), // encrypted
  telegramChatId: varchar("telegram_chat_id", { length: 50 }),
  telegramWebhookToken: varchar("telegram_webhook_token", { length: 100 }),
  telegramEnabled: boolean("telegram_enabled").notNull().default(false),
  // ───────────────────────────────────────────────────────────────────────────
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  whatsappId: varchar("whatsapp_id", { length: 255 }).notNull().unique(),
  customerName: varchar("customer_name", { length: 255 }),
  customerPhone: varchar("customer_phone", { length: 50 }),
  messages: jsonb("messages").$type<Record<string, unknown>[]>().default([]),
  status: conversationStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  phone: varchar("phone", { length: 50 }).notNull(),
  email: varchar("email", { length: 255 }),
  firstMessage: text("first_message"),
  refCode: varchar("ref_code", { length: 255 }),
  utmSource: varchar("utm_source", { length: 255 }),
  utmMedium: varchar("utm_medium", { length: 255 }),
  utmCampaign: varchar("utm_campaign", { length: 255 }),
  utmContent: varchar("utm_content", { length: 255 }),
  adId: varchar("ad_id", { length: 255 }),
  campaignId: varchar("campaign_id", { length: 255 }),
  adsetId: varchar("adset_id", { length: 255 }),
  platform: varchar("platform", { length: 100 }),
  notes: text("notes"),
  status: leadStatusEnum("status").notNull().default("new"),
  conversationId: integer("conversation_id").references(() => conversations.id),
  tags: jsonb("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Orders / Kitchen ──────────────────────────────────────────────────────────

export const orderTypeEnum = pgEnum("order_type", [
  "hamburguesas",
  "pan_mayorista",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
]);

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull(),
  customerName: text("customer_name"),
  orderType: orderTypeEnum("order_type"),
  items: jsonb("items").notNull(),
  notes: text("notes"),
  tags: jsonb("tags").$type<string[]>().default([]),
  status: orderStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
