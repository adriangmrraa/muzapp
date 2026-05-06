import { getMetaStatus, getWebhookConfig, getMetaConnectionStatus } from "./actions";
import { MetaConfigClient } from "./meta-config-client";
import { MetaConnectionSection } from "./meta-connection-section";

export const metadata = {
  title: "Meta Ads — Mrs Muzzarella Admin",
};

export default async function MetaPage() {
  const [status, webhook, metaConnection] = await Promise.all([
    getMetaStatus(),
    getWebhookConfig(),
    getMetaConnectionStatus(),
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

      <MetaConnectionSection
        isConnected={metaConnection.connected}
        businessName={metaConnection.businessName}
        expiresAt={metaConnection.expiresAt}
      />

      <MetaConfigClient initialStatus={status} webhookConfig={webhook} />
    </div>
  );
}
