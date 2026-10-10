"use client";

import { useSyncExternalStore } from "react";

/**
 * Reactive matchMedia hook. SSR-safe: the server snapshot is always `false`,
 * so mobile-only affordances (e.g. bottom sheets) render as desktop markup
 * during SSR/hydration and upgrade on the client without a layout flash.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onStoreChange);
      return () => media.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
