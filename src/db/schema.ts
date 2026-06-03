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
  uniqueIndex,
} from "drizzle-orm/pg-core";


// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["admin", "viewer"]);

export const productCategoryEnum = pgEnum("product_category", [
  "hamburguesa",
  "acompanamiento",
  "pan_mayorista",
  "tragos_vip",
  "bebidas",
]);

export const productLineEnum = pgEnum("product_line", [
  "pollo",
  "carne",
  "clasica",
  "pan",
  "tragos",
  "bebidas",
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

export const clientTypeEnum = pgEnum("client_type", ["b2c", "b2b"]);

export const channelEnum = pgEnum("channel", ["whatsapp", "telegram"]);
export const messageRoleEnum = pgEnum("message_role", ["user", "assistant", "system", "human"]);

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
  stock: integer("stock"),
  sortOrder: integer("sort_order").notNull().default(0),
  isPromo: boolean("is_promo").notNull().default(false),
  promoPrice: numeric("promo_price", { precision: 10, scale: 2 }),
  variants: jsonb("variants").$type<{
    name: string;
    priceDelta: number;
    default?: boolean;
  }[]>().default([]),
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
  sellerPhoneIds: jsonb("seller_phone_ids").$type<{ name: string; phone: string }[]>().default([]),
  autoReply24h: boolean("auto_reply_24h").notNull().default(false),
  autoReply24hMessage: text("auto_reply_24h_message"),
  trainBotContext: text("train_bot_context"),
  // ─── Telegram Bot (CRUD) ────────────────────────────────────────────────
  telegramBotToken: text("telegram_bot_token"), // encrypted
  telegramChatId: varchar("telegram_chat_id", { length: 50 }),
  telegramWebhookToken: varchar("telegram_webhook_token", { length: 100 }),
  telegramEnabled: boolean("telegram_enabled").notNull().default(false),
  // ─── WhatsApp Agent (Editable desde UI) ────────────────────────
  whatsappSystemPrompt: text("whatsapp_system_prompt"),
  whatsappInstructions: text("whatsapp_instructions"),
  whatsappPromociones: text("whatsapp_promociones"),
  productionHours: text("production_hours"),
  deliveryEnabled: boolean("delivery_enabled").notNull().default(true),
  deliveryStartHour: varchar("delivery_start_hour", { length: 5 }),
  b2cStartHour: varchar("b2c_start_hour", { length: 5 }).default("20:00"),
  whatsappZonasDelivery: jsonb("whatsapp_zonas_delivery").$type<{
    zona: string;
    disponible: boolean;
    tiempo: string;
    costo: number;
  }[]>().default([
    { zona: "centro", disponible: true, tiempo: "20-30 min", costo: 0 },
    { zona: "norte", disponible: true, tiempo: "25-35 min", costo: 0 },
    { zona: "sur", disponible: true, tiempo: "30-40 min", costo: 0 },
  ]),
  // ───────────────────────────────────────────────────────────────────────────
  // ─── Identidad anti-bot / System Status ───────────────────────────────────
  isCooking: boolean("is_cooking").notNull().default(true),
  hamburguesasSinStock: boolean("hamburguesas_sin_stock").notNull().default(false),
  stockPanDocenas: integer("stock_pan_docenas").default(0),
  aliasB2c: varchar("alias_b2c", { length: 100 }),
  aliasB2b: varchar("alias_b2b", { length: 100 }),
  tiempoEspera: varchar("tiempo_espera", { length: 50 }),
  menuImageUrlHamburguesas: text("menu_image_url_hamburguesas"),
  menuImageUrlPan: text("menu_image_url_pan"),
  menuImageUrlsHamburguesas: jsonb("menu_image_urls_hamburguesas").$type<string[]>().default([]),
  menuImageUrlsPan: jsonb("menu_image_urls_pan").$type<string[]>().default([]),
  // ───────────────────────────────────────────────────────────────────────────
  // ─── Delivery ────────────────────────────────────────────────────────────
  deliveryPhoneNumber: varchar("delivery_phone_number", { length: 50 }),
  // ───────────────────────────────────────────────────────────────────────────
  // ─── Meta Business OAuth ───────────────────────────────────────────────────
  metaAccessToken: text("meta_access_token"),
  metaTokenExpiresAt: timestamp("meta_token_expires_at", { withTimezone: true }),
  metaBusinessName: varchar("meta_business_name", { length: 255 }),
  metaPhoneNumberId: varchar("meta_phone_number_id", { length: 50 }),
  metaConnected: boolean("meta_connected").notNull().default(false),
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
  channel: channelEnum("channel").notNull().default("whatsapp"),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  lastMessagePreview: varchar("last_message_preview", { length: 255 }),
  humanOverrideUntil: timestamp("human_override_until", { withTimezone: true }),
  externalUserId: varchar("external_user_id", { length: 255 }),
  conversationMetadata: jsonb("conversation_metadata").$type<{
    repromptCount: number;
    lastUserMessageType: "order" | "greeting" | "menu" | "info" | "complaint" | "other";
    lastSuggestedProducts: string[];
    lastTools: string[];
  }>().default({ repromptCount: 0, lastUserMessageType: "other", lastSuggestedProducts: [], lastTools: [] }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  contentAttributes: jsonb("content_attributes").$type<{
    type: "image" | "audio" | "document" | "video";
    url: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    caption?: string;
    transcription?: string;
  }[]>().default([]),
  platformMessageId: varchar("platform_message_id", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  platformMsgUq: uniqueIndex("idx_chat_messages_platform_id").on(table.platformMessageId),
}));

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  phone: varchar("phone", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }),
  address: text("address"),
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
  alias: varchar("alias", { length: 255 }),
  status: leadStatusEnum("status").notNull().default("new"),
  type: varchar("type", { length: 10 }),
  conversationId: integer("conversation_id").references(() => conversations.id),
  tags: jsonb("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id),
  conversationId: integer("conversation_id").references(() => conversations.id),
  messageId: integer("message_id").references(() => chatMessages.id),
  type: varchar("type", { length: 20 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  fileName: varchar("file_name", { length: 255 }),
  mimeType: varchar("mime_type", { length: 100 }),
  fileSize: integer("file_size"),
  caption: varchar("caption", { length: 500 }),
  description: text("description"),
  documentType: varchar("document_type", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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
  leadId: integer("lead_id").references(() => leads.id),
  phoneNumber: text("phone_number").notNull(),
  customerName: text("customer_name"),
  address: text("address"),
  orderType: orderTypeEnum("order_type"),
  items: jsonb("items").notNull(),
  notes: text("notes"),
  tags: jsonb("tags").$type<string[]>().default([]),
  status: orderStatusEnum("status").notNull().default("pending"),
  deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }).default("0"),
  paymentStatus: text("payment_status").default("pending"),
  paymentMethod: text("payment_method"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  followupSent: boolean("followup_sent").notNull().default(false),
});

// ─── Order Context (items temporales del pedido actual) ─────────────────────────

export const orderContextEnum = pgEnum("order_context_status", ["active", "ordered"]);

export const orderContextItems = pgTable("order_context_items", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  phone: text("phone").notNull(),
  productName: text("product_name").notNull(),
  productPrice: numeric("product_price", { precision: 10, scale: 2 }),
  quantity: integer("quantity").notNull().default(1),
  variant: text("variant"),
  notes: text("notes"),
  status: orderContextEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

// ─── Addresses (ubicaciones guardadas de clientes) ──────────────────────────────

export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  latitude: text("latitude"),
  longitude: text("longitude"),
  mapsLink: text("maps_link"),
  label: text("label"), // "Casa", "Trabajo", etc — lo puede poner el agente
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Promotions (promociones con productos reales) ──────────────────────────

export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  items: jsonb("items").$type<{ productId: number; productName: string; quantity: number }[]>().default([]),
  customPrice: numeric("custom_price", { precision: 10, scale: 2 }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
