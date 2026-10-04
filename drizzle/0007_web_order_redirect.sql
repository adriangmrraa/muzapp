ALTER TABLE "agent_config" ADD COLUMN IF NOT EXISTS "web_order_redirect_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN IF NOT EXISTS "web_order_redirect_message" text;
