import { pgTable, serial, text, varchar, boolean, jsonb, timestamp, numeric, integer, unique, foreignKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const conversationStatus = pgEnum("conversation_status", ['active', 'closed', 'archived'])
export const leadStatus = pgEnum("lead_status", ['new', 'contacted', 'converted', 'lost'])
export const orderStatus = pgEnum("order_status", ['pending', 'preparing', 'ready', 'delivered', 'cancelled'])
export const orderType = pgEnum("order_type", ['hamburguesas', 'pan_mayorista'])
export const productCategory = pgEnum("product_category", ['hamburguesa', 'acompanamiento', 'pan_mayorista'])
export const productLine = pgEnum("product_line", ['pollo', 'carne', 'clasica', 'pan'])
export const userRole = pgEnum("user_role", ['admin', 'viewer'])


export const agentConfig = pgTable("agent_config", {
	id: serial().primaryKey().notNull(),
	systemPrompt: text("system_prompt"),
	phoneNumber: varchar("phone_number", { length: 50 }),
	ycloudApiKey: text("ycloud_api_key"),
	enabled: boolean().default(false).notNull(),
	businessHours: jsonb("business_hours"),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	whatsappBotNumber: varchar("whatsapp_bot_number", { length: 50 }),
	allowedPhoneIds: jsonb("allowed_phone_ids").default([]),
	autoReply24H: boolean("auto_reply_24h").default(false).notNull(),
	autoReply24HMessage: text("auto_reply_24h_message"),
	trainBotContext: text("train_bot_context"),
});

export const products = pgTable("products", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	price: numeric({ precision: 10, scale:  2 }),
	imageUrl: text("image_url"),
	category: productCategory().notNull(),
	line: productLine().notNull(),
	available: boolean().default(true).notNull(),
	comingSoon: boolean("coming_soon").default(false).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	hashedPassword: text("hashed_password").notNull(),
	name: varchar({ length: 255 }),
	role: userRole().default('viewer').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const conversations = pgTable("conversations", {
	id: serial().primaryKey().notNull(),
	whatsappId: varchar("whatsapp_id", { length: 255 }).notNull(),
	customerName: varchar("customer_name", { length: 255 }),
	customerPhone: varchar("customer_phone", { length: 50 }),
	messages: jsonb().default([]),
	status: conversationStatus().default('active').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("conversations_whatsapp_id_unique").on(table.whatsappId),
]);

export const leads = pgTable("leads", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }),
	phone: varchar({ length: 50 }).notNull(),
	email: varchar({ length: 255 }),
	firstMessage: text("first_message"),
	refCode: varchar("ref_code", { length: 255 }),
	utmSource: varchar("utm_source", { length: 255 }),
	utmMedium: varchar("utm_medium", { length: 255 }),
	utmCampaign: varchar("utm_campaign", { length: 255 }),
	utmContent: varchar("utm_content", { length: 255 }),
	adId: varchar("ad_id", { length: 255 }),
	campaignId: varchar("campaign_id", { length: 255 }),
	adsetId: varchar("adset_id", { length: 255 }),
	platform: varchar({ length: 100 }),
	notes: text(),
	status: leadStatus().default('new').notNull(),
	conversationId: integer("conversation_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.conversationId],
			foreignColumns: [conversations.id],
			name: "leads_conversation_id_conversations_id_fk"
		}),
]);

export const orders = pgTable("orders", {
	id: serial().primaryKey().notNull(),
	phoneNumber: text("phone_number").notNull(),
	items: jsonb().notNull(),
	notes: text(),
	status: orderStatus().default('pending').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	customerName: text("customer_name"),
	orderType: orderType("order_type"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});
