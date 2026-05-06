"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

/**
 * Meta Pixel — componente que carga fbq dinámicamente y trackea page views.
 * Se renderiza UNA vez en el root layout y escucha cambios de ruta.
 */
export function MetaPixel({ pixelId }: { pixelId: string }) {
  const pathname = usePathname();

  useEffect(() => {
    // Cargar el script de fbq si no está ya cargado
    if (typeof window.fbq === "undefined") {
      // Inicializar _fbq queue
      window._fbq = window._fbq || [];
      window.fbq = function (...args: unknown[]) {
        (window._fbq as unknown[]).push(args);
      };

      // Cargar script
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(script);

      // Inicializar el pixel con el ID
      window.fbq("init", pixelId);
    }

    // Trackear page view en cada cambio de ruta
    window.fbq("track", "PageView");
  }, [pixelId, pathname]);

  // Este componente no renderiza nada visible
  return null;
}
