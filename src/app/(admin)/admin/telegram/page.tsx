import { getTelegramStatus } from "./actions";
import { TelegramConfigClient } from "./telegram-config";

export const metadata = {
  title: "Telegram Bot — Mrs Muzzarella Admin",
};

export default async function TelegramPage() {
  const status = await getTelegramStatus();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gold-gradient">
          Telegram Bot
        </h1>
        <p className="text-sm text-muted-foreground">
          Bot interno de gestión para consultar pedidos, ventas y entregas desde
          Telegram
        </p>
      </div>

      <TelegramConfigClient initialStatus={status} />
    </div>
  );
}
