ALTER TABLE "agent_config" ADD COLUMN IF NOT EXISTS "ycloud_webhook_secret" text;--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN IF NOT EXISTS "cloudinary_cloud_name" varchar(120);--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN IF NOT EXISTS "cloudinary_api_key" varchar(120);--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN IF NOT EXISTS "cloudinary_api_secret" text;--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN IF NOT EXISTS "meta_app_id" varchar(80);--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN IF NOT EXISTS "meta_app_secret" text;--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN IF NOT EXISTS "meta_webhook_verify_token" varchar(200);--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN IF NOT EXISTS "telegram_notify_chat_id" varchar(50);--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN IF NOT EXISTS "cron_secret" varchar(200);--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN IF NOT EXISTS "escalation_email" varchar(200);