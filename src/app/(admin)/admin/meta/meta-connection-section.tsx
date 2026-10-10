"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { MetaConnectButton } from "@/components/meta/meta-connect-button";
import { disconnectMeta } from "./actions";

interface Props {
  isConnected: boolean;
  businessName: string | null;
  expiresAt: Date | null;
}

export function MetaConnectionSection({ isConnected, businessName, expiresAt }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDisconnect() {
    startTransition(async () => {
      await disconnectMeta();
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl border border-border bg-muted/20 p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Conexión Meta Business</h2>
      <MetaConnectButton
        isConnected={isConnected}
        businessName={businessName}
        onDisconnect={isPending ? undefined : handleDisconnect}
      />
      {expiresAt && (
        <p className="text-xs text-muted-foreground mt-2">
          Token expira: {new Date(expiresAt).toLocaleDateString("es-AR")}
        </p>
      )}
    </section>
  );
}
