"use client";

import { useState, useEffect } from "react";
import { generateMetaOAuthState } from "@/app/(admin)/admin/meta/actions";

interface Props {
  isConnected: boolean;
  businessName?: string | null;
  onDisconnect?: () => void;
}

export function MetaConnectButton({ isConnected, businessName, onDisconnect }: Props) {
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "META_OAUTH_SUCCESS") {
        setConnecting(false);
        window.location.reload();
      } else if (event.data?.type === "META_OAUTH_ERROR") {
        setConnecting(false);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  async function handleConnect() {
    setConnecting(true);
    // The server builds the OAuth URL from the configured Meta App ID
    // (DB via /admin/agent or env) — the client never sees app credentials.
    const oauth = await generateMetaOAuthState();
    if (!oauth?.authUrl) {
      setConnecting(false);
      return;
    }
    window.open(oauth.authUrl, "meta-oauth", "width=600,height=700,scrollbars=yes");
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
        <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
        <div className="flex-1">
          <p className="text-sm font-medium text-white">Conectado a Meta Business</p>
          {businessName && (
            <p className="text-xs text-muted-foreground">{businessName}</p>
          )}
        </div>
        {onDisconnect && (
          <button
            onClick={onDisconnect}
            className="rounded-lg px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Desconectar
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={connecting}
      className="w-full rounded-xl bg-gradient-to-r from-gold to-gold-bright px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50"
    >
      {connecting ? "Conectando..." : "Conectar con Meta Business"}
    </button>
  );
}
