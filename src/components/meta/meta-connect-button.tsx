"use client";

import { useState, useEffect } from "react";

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

  function handleConnect() {
    setConnecting(true);
    const redirectUri = `${window.location.origin}/api/meta/callback`;
    const state = Math.random().toString(36).slice(2);

    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_META_APP_ID || "",
      redirect_uri: redirectUri,
      scope: "whatsapp_business_management,whatsapp_business_messaging",
      response_type: "code",
      state,
    });

    const url = `https://www.facebook.com/v22.0/dialog/oauth?${params}`;
    window.open(url, "meta-oauth", "width=600,height=700,scrollbars=yes");
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
        <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
        <div className="flex-1">
          <p className="text-sm font-medium text-white">Conectado a Meta Business</p>
          {businessName && (
            <p className="text-xs text-gray-400">{businessName}</p>
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
      className="w-full rounded-xl bg-gradient-to-r from-[#D4A017] to-[#F5A623] px-6 py-3 text-sm font-semibold text-black transition-all hover:shadow-lg hover:shadow-[#D4A017]/20 disabled:opacity-50"
    >
      {connecting ? "Conectando..." : "Conectar con Meta Business"}
    </button>
  );
}
