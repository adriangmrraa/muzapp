/**
 * Meta Pixel Provider
 *
 * Se renderiza en el root layout. Solo carga fbq si
 * NEXT_PUBLIC_META_PIXEL_ID está configurado.
 *
 * Es un Server Component wrapper que delega al client component
 * solo cuando hay pixel ID, así no mandamos JS al cliente al pedo.
 */

import { MetaPixel } from "./meta-pixel";

export function MetaPixelProvider() {
  const pixelId =
    typeof process.env.NEXT_PUBLIC_META_PIXEL_ID === "string" &&
    process.env.NEXT_PUBLIC_META_PIXEL_ID.length > 0
      ? process.env.NEXT_PUBLIC_META_PIXEL_ID
      : null;

  if (!pixelId) return null;

  return <MetaPixel pixelId={pixelId} />;
}
