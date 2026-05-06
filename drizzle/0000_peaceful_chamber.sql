CREATE TYPE "public"."conversation_status" AS ENUM('active', 'closed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'converted', 'lost');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'preparing', 'ready', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('hamburguesas', 'pan_mayorista');--> statement-breakpoint
CREATE TYPE "public"."product_category" AS ENUM('hamburguesa', 'acompanamiento', 'pan_mayorista');--> statement-breakpoint
CREATE TYPE "public"."product_line" AS ENUM('pollo', 'carne', 'clasica', 'pan');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'viewer');--> statement-breakpoint
CREATE TABLE "agent_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"system_prompt" text,
	"phone_number" varchar(50),
	"ycloud_api_key" text,
	"enabled" boolean DEFAULT false NOT NULL,
	"business_hours" jsonb,
	"whatsapp_bot_number" varchar(50),
	"allowed_phone_ids" jsonb DEFAULT '[]'::jsonb,
	"auto_reply_24h" boolean DEFAULT false NOT NULL,
	"auto_reply_24h_message" text,
	"train_bot_context" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"whatsapp_id" varchar(255) NOT NULL,
	"customer_name" varchar(255),
	"customer_phone" varchar(50),
	"messages" jsonb DEFAULT '[]'::jsonb,
	"status" "conversation_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "conversations_whatsapp_id_unique" UNIQUE("whatsapp_id")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"phone" varchar(50) NOT NULL,
	"email" varchar(255),
	"first_message" text,
	"ref_code" varchar(255),
	"utm_source" varchar(255),
	"utm_medium" varchar(255),
	"utm_campaign" varchar(255),
	"utm_content" varchar(255),
	"ad_id" varchar(255),
	"campaign_id" varchar(255),
	"adset_id" varchar(255),
	"platform" varchar(100),
	"notes" text,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"conversation_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone_number" text NOT NULL,
	"customer_name" text,
	"order_type" "order_type",
	"items" jsonb NOT NULL,
	"notes" text,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"price" numeric(10, 2),
	"image_url" text,
	"category" "product_category" NOT NULL,
	"line" "product_line" NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	"coming_soon" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"hashed_password" text NOT NULL,
	"name" varchar(255),
	"role" "user_role" DEFAULT 'viewer' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;