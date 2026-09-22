CREATE TYPE "conversation_session_mode" AS ENUM ('commercial', 'personal_acknowledged', 'handed_off');
CREATE TYPE "conversation_session_intent" AS ENUM ('catalog', 'order', 'delivery', 'support', 'other');
CREATE TYPE "conversation_session_question" AS ENUM ('unit_or_dozen', 'delivery_time', 'address', 'payment', 'other');
CREATE TYPE "conversation_session_asset_kind" AS ENUM ('image', 'audio', 'document', 'video');
CREATE TYPE "conversation_session_event_type" AS ENUM ('commercial_detected', 'personal_acknowledged', 'ambiguous_clarified', 'handoff_requested');
CREATE TYPE "conversation_session_signal" AS ENUM ('commercial', 'personal', 'ambiguous');
CREATE TYPE "conversation_session_effect_kind" AS ENUM ('human_override', 'owner_notification', 'customer_reply');

CREATE TABLE "conversation_session_states" (
  "id" serial PRIMARY KEY NOT NULL,
  "conversation_id" integer NOT NULL REFERENCES "conversations"("id"),
  "version" integer DEFAULT 0 NOT NULL,
  "policy_version" integer DEFAULT 1 NOT NULL,
  "episode" integer DEFAULT 0 NOT NULL,
  "mode" "conversation_session_mode" DEFAULT 'commercial' NOT NULL,
  "ack_sent" boolean DEFAULT false NOT NULL,
  "clarification_sent" boolean DEFAULT false NOT NULL,
  "commercial_intent" "conversation_session_intent",
  "pending_question" "conversation_session_question",
  "recent_asset_kinds" "conversation_session_asset_kind"[] DEFAULT '{}' NOT NULL,
  "active_order_id" integer REFERENCES "orders"("id"),
  "has_active_cart" boolean DEFAULT false NOT NULL,
  "has_address_reference" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE ("conversation_id")
);
CREATE INDEX "conversation_session_states_conversation_version_idx" ON "conversation_session_states" ("conversation_id", "version");

CREATE TABLE "conversation_session_events" (
  "id" serial PRIMARY KEY NOT NULL,
  "conversation_id" integer NOT NULL REFERENCES "conversations"("id"),
  "episode" integer NOT NULL,
  "state_version" integer NOT NULL,
  "policy_version" integer NOT NULL,
  "event_type" "conversation_session_event_type" NOT NULL,
  "signal" "conversation_session_signal" NOT NULL,
  "inbound_message_id" varchar(255) NOT NULL,
  "inbound_hash" varchar(128),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE ("conversation_id", "inbound_message_id")
);
CREATE INDEX "conversation_session_events_conversation_created_idx" ON "conversation_session_events" ("conversation_id", "created_at");

CREATE TABLE "conversation_session_effect_claims" (
  "id" serial PRIMARY KEY NOT NULL,
  "conversation_id" integer NOT NULL REFERENCES "conversations"("id"),
  "episode" integer NOT NULL,
  "effect_kind" "conversation_session_effect_kind" NOT NULL,
  "inbound_message_id" varchar(255) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE ("conversation_id", "episode", "effect_kind"),
  UNIQUE ("conversation_id", "inbound_message_id", "effect_kind")
);
