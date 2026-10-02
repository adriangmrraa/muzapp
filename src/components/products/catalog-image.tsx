"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import { resolveCatalogImageUrl } from "@/lib/catalog-images";
import { PRODUCT_IMAGE_BY_NAME } from "@/lib/constants";

interface CatalogImageProps {
  src?: string | null;
  alt: string;
  sizes?: string;
  contain?: boolean;
  eager?: boolean;
}

/** Keeps the frame stable during loading and after a broken database URL. */
export function CatalogImage(props: CatalogImageProps) {
  const src = resolveCatalogImageUrl(props.src);
  return <ImageFrame key={src ?? "empty"} {...props} src={src} />;
}

function ImageFrame({ src, alt, contain = false, eager = false, sizes = "(max-width: 640px) 40vw, (max-width: 1024px) 50vw, 33vw" }: CatalogImageProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [effectiveSrc, setEffectiveSrc] = useState(src);
  const failed = !effectiveSrc || status === "error";

  // A DB URL that 404s at runtime (e.g. ephemeral /api/media uploads lost on
  // redeploy) falls back to the bundled asset for that product before giving up.
  function handleError() {
    const fallback = PRODUCT_IMAGE_BY_NAME[alt.trim().toLowerCase()];
    if (fallback && fallback !== effectiveSrc) {
      setEffectiveSrc(fallback);
      setStatus("loading");
      return;
    }
    setStatus("error");
  }
  return (
    <span className="catalog-image" data-state={failed ? "error" : status} data-fit={contain ? "contain" : "cover"}>
      {failed ? (
        <span className="catalog-image-fallback" role="img" aria-label={`Foto no disponible: ${alt}`}>
          <ImageOff size={24} strokeWidth={1} aria-hidden="true" />
          <span>Foto no disponible</span>
        </span>
      ) : (
        <Image src={effectiveSrc!} alt={alt} fill sizes={sizes} loading={eager ? "eager" : "lazy"}
          unoptimized={/^https?:/i.test(effectiveSrc!) || /\.svg(?:\?|$)/i.test(effectiveSrc!)}
          onLoad={() => setStatus("ready")} onError={handleError} />
      )}
    </span>
  );
}
