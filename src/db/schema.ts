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
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  utmSource: varchar("utm_source", { length: 255 }),
  utmMedium: varchar("utm_medium", { length: 255 }),
  utmCampaign: varchar("utm_campaign", { length: 255 }),
  utmContent: varchar("utm_content", { length: 255 }),
  adId: varchar("ad_id", { length: 255 }),
  campaignId: varchar("campaign_id", { length: 255 }),
  adsetId: varchar("adset_id", { length: 255 }),
  platform: varchar("platform", { length: 100 }),
  status: leadStatusEnum("status").notNull().default("new"),
  conversationId: integer("conversation_id").references(() => conversations.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
