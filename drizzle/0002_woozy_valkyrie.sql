CREATE TYPE "public"."channel" AS ENUM('whatsapp', 'telegram');--> statement-breakpoint
CREATE TYPE "public"."client_type" AS ENUM('b2c', 'b2b');--> statement-breakpoint
CREATE TYPE "public"."message_role" AS ENUM('user', 'assistant', 'system', 'human');--> statement-breakpoint
CREATE TYPE "public"."order_context_status" AS ENUM('active', 'ordered');--> statement-breakpoint
ALTER TYPE "public"."product_category" ADD VALUE 'tragos_vip';--> statement-breakpoint
ALTER TYPE "public"."product_category" ADD VALUE 'bebidas';--> statement-breakpoint
ALTER TYPE "public"."product_line" ADD VALUE 'tragos';--> statement-breakpoint
ALTER TYPE "public"."product_line" ADD VALUE 'bebidas';--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"address" text NOT NULL,
	"latitude" text,
	"longitude" text,
	"maps_link" text,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer,
	"conversation_id" integer,
	"message_id" integer,
	"type" varchar(20) NOT NULL,
	"url" varchar(500) NOT NULL,
	"file_name" varchar(255),
	"mime_type" varchar(100),
	"file_size" integer,
	"caption" varchar(500),
	"description" text,
	"document_type" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" "message_role" NOT NULL,
	"content" text NOT NULL,
	"content_attributes" jsonb DEFAULT '[]'::jsonb,
	"platform_message_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_context_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"phone" text NOT NULL,
	"product_name" text NOT NULL,
	"product_price" numeric(10, 2),
	"quantity" integer DEFAULT 1 NOT NULL,
	"variant" text,
	"notes" text,
	"status" "order_context_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image_url" text,
	"items" jsonb DEFAULT '[]'::jsonb,
	"custom_price" numeric(10, 2),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN "seller_phone_ids" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN "production_hours" text;--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN "delivery_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN "delivery_start_hour" varchar(5);--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN "b2c_start_hour" varchar(5) DEFAULT '20:00';--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN "is_cooking" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN "hamburguesas_sin_stock" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN "stock_pan_docenas" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN "alias_b2c" varchar(100);--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN "alias_b2b" varchar(100);--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN "tiempo_espera" varchar(50);--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN "menu_image_url_hamburguesas" text;--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN "menu_image_url_pan" text;--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN "menu_image_urls_hamburguesas" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN "menu_image_urls_pan" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN "delivery_phone_number" varchar(50);--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN "meta_access_token" text;--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN "meta_token_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN "meta_business_name" varchar(255);--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN "meta_phone_number_id" varchar(50);--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN "meta_connected" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "channel" "channel" DEFAULT 'whatsapp' NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "last_message_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "last_message_preview" varchar(255);--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "human_override_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "external_user_id" varchar(255);--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "conversation_metadata" jsonb DEFAULT '{"repromptCount":0,"lastUserMessageType":"other","lastSuggestedProducts":[],"lastTools":[]}'::jsonb;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "alias" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "type" varchar(10);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "lead_id" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_fee" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_status" text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "followup_sent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stock" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_promo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "promo_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "variants" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_context_items" ADD CONSTRAINT "order_context_items_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_chat_messages_platform_id" ON "chat_messages" USING btree ("platform_message_id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_phone_unique" UNIQUE("phone");