"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import { resolveCatalogImageUrl } from "@/lib/catalog-images";

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
  const failed = !src || status === "error";
  return (
    <span className="catalog-image" data-state={failed ? "error" : status} data-fit={contain ? "contain" : "cover"}>
      {failed ? (
        <span className="catalog-image-fallback" role="img" aria-label={`Foto no disponible: ${alt}`}>
          <ImageOff size={24} strokeWidth={1} aria-hidden="true" />
          <span>Foto no disponible</span>
        </span>
      ) : (
        <Image src={src!} alt={alt} fill sizes={sizes} loading={eager ? "eager" : "lazy"}
          unoptimized={/^https?:/i.test(src!) || /\.svg(?:\?|$)/i.test(src!)}
          onLoad={() => setStatus("ready")} onError={() => setStatus("error")} />
      )}
    </span>
  );
}
