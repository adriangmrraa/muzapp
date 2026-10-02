-- Business identity + AI provider configuration for agent_config, plus the
-- conversation-session tables that previously only shipped via `db:push`.
-- Every statement is idempotent: safe on databases that already have the
-- session objects (created via push) and on fresh databases alike.

DO $$ BEGIN
	CREATE TYPE "public"."conversation_session_asset_kind" AS ENUM('image', 'audio', 'document', 'video');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "public"."conversation_session_effect_kind" AS ENUM('human_override', 'owner_notification', 'customer_reply');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "public"."conversation_session_event_type" AS ENUM('commercial_detected', 'personal_acknowledged', 'ambiguous_clarified', 'handoff_requested');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "public"."conversation_session_intent" AS ENUM('catalog', 'order', 'delivery', 'support', 'other');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "public"."conversation_session_mode" AS ENUM('commercial', 'personal_acknowledged', 'handed_off');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "public"."conversation_session_question" AS ENUM('unit_or_dozen', 'delivery_time', 'address', 'payment', 'other');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "public"."conversation_session_signal" AS ENUM('commercial', 'personal', 'ambiguous');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversation_session_effect_claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"episode" integer NOT NULL,
	"effect_kind" "conversation_session_effect_kind" NOT NULL,
	"inbound_message_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversation_session_effect_claims_episode_effect_unique" UNIQUE("conversation_id","episode","effect_kind"),
	CONSTRAINT "conversation_session_effect_claims_inbound_effect_unique" UNIQUE("conversation_id","inbound_message_id","effect_kind")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversation_session_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"episode" integer NOT NULL,
	"state_version" integer NOT NULL,
	"policy_version" integer NOT NULL,
	"event_type" "conversation_session_event_type" NOT NULL,
	"signal" "conversation_session_signal" NOT NULL,
	"inbound_message_id" varchar(255) NOT NULL,
	"inbound_hash" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversation_session_events_inbound_unique" UNIQUE("conversation_id","inbound_message_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversation_session_states" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"policy_version" integer DEFAULT 1 NOT NULL,
	"episode" integer DEFAULT 0 NOT NULL,
	"mode" "conversation_session_mode" DEFAULT 'commercial' NOT NULL,
	"ack_sent" boolean DEFAULT false NOT NULL,
	"clarification_sent" boolean DEFAULT false NOT NULL,
	"commercial_intent" "conversation_session_intent",
	"pending_question" "conversation_session_question",
	"recent_asset_kinds" "conversation_session_asset_kind"[] DEFAULT '{}' NOT NULL,
	"active_order_id" integer,
	"has_active_cart" boolean DEFAULT false NOT NULL,
	"has_address_reference" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversation_session_states_conversation_unique" UNIQUE("conversation_id")
);
--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN IF NOT EXISTS "business_name" varchar(160);--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN IF NOT EXISTS "business_tagline" varchar(255);--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN IF NOT EXISTS "business_address" varchar(255);--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN IF NOT EXISTS "business_phone_display" varchar(50);--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN IF NOT EXISTS "instagram_handle" varchar(100);--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN IF NOT EXISTS "business_website" text;--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN IF NOT EXISTS "business_description" text;--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN IF NOT EXISTS "ai_api_key" text;--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN IF NOT EXISTS "ai_base_url" text;--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN IF NOT EXISTS "ai_model" varchar(120);--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN IF NOT EXISTS "ai_model_fast" varchar(120);--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN IF NOT EXISTS "ai_model_vision" varchar(120);--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "conversation_session_effect_claims" ADD CONSTRAINT "conversation_session_effect_claims_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "conversation_session_events" ADD CONSTRAINT "conversation_session_events_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "conversation_session_states" ADD CONSTRAINT "conversation_session_states_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "conversation_session_states" ADD CONSTRAINT "conversation_session_states_active_order_id_orders_id_fk" FOREIGN KEY ("active_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversation_session_events_conversation_created_idx" ON "conversation_session_events" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversation_session_states_conversation_version_idx" ON "conversation_session_states" USING btree ("conversation_id","version");