import * as React from "react";
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & { variant?: "default" | "shimmer" }) {
  return (
    <div
      data-slot="skeleton"
      data-variant={variant}
      className={cn(
        "rounded-md",
        variant === "shimmer" ? "gold-shimmer" : "animate-pulse bg-muted",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
