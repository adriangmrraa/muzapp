-- Fix: add missing columns to agent_config
ALTER TABLE agent_config ADD COLUMN IF NOT EXISTS whatsapp_bot_number varchar(50);
ALTER TABLE agent_config ADD COLUMN IF NOT EXISTS allowed_phone_ids jsonb DEFAULT '[]';
ALTER TABLE agent_config ADD COLUMN IF NOT EXISTS auto_reply_24h boolean DEFAULT false;
ALTER TABLE agent_config ADD COLUMN IF NOT EXISTS auto_reply_24h_message text;
ALTER TABLE agent_config ADD COLUMN IF NOT EXISTS train_bot_context text;