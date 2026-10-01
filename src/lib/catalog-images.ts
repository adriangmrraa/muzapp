import { PRODUCT_IMAGE_BY_NAME, PRODUCT_IMAGE_MAP } from "@/lib/constants";

type CatalogProduct = {
  id: string | number;
  name: string;
  imageUrl?: string | null;
};

/**
 * Normaliza URLs históricas y actuales guardadas en la base.
 * Cloudinary devuelve URLs absolutas; instalaciones anteriores pueden tener
 * rutas relativas a /public, /uploads o /assets.
 */
export function resolveCatalogImageUrl(imageUrl?: string | null): string | null {
  const value = imageUrl?.trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      return url.username || url.password ? null : url.href;
    } catch { return null; }
  }
  // Protocol-relative URLs and non-image schemes are not local paths.
  if (value.startsWith("//") || value.includes("\\")) return null;

  const withoutPublicPrefix = value.replace(/^\.?\/?public\//i, "");
  if (withoutPublicPrefix.startsWith("uploads/") || withoutPublicPrefix.startsWith("assets/")) {
    return `/${withoutPublicPrefix}`;
  }

  if (value.startsWith("/public/")) return value.slice(7);
  if (value.startsWith("/")) return value;
  return null;
}

/** Preferimos siempre la imagen configurada desde admin/DB sobre el fallback del repo. */
export function getCatalogProductImage(product: CatalogProduct): string | null {
  return (
    resolveCatalogImageUrl(product.imageUrl) ??
    PRODUCT_IMAGE_MAP[String(product.id)] ??
    PRODUCT_IMAGE_BY_NAME[product.name.trim().toLowerCase()] ??
    null
  );
}
