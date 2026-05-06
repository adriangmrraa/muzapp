import { getMetaStatus, getWebhookConfig } from "./actions";
import { MetaConfigClient } from "./meta-config-client";

export const metadata = {
  title: "Meta Ads — Mrs Muzzarella Admin",
};

export default async function MetaPage() {
  const [status, webhook] = await Promise.all([
    getMetaStatus(),
    getWebhookConfig(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gold-gradient">
          Meta Ads
        </h1>
        <p className="text-sm text-muted-foreground">
          Configuración y estado de la conexión con Meta Ads (Pixel +
          Conversion API)
        </p>
      </div>

      <MetaConfigClient initialStatus={status} webhookConfig={webhook} />
    </div>
  );
}
