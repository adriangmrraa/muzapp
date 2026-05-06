"use client";

import { cn } from "@/lib/utils";
import type { Channel } from "@/types/chat";

interface ChannelBadgeProps {
  channel: Channel;
  size?: "sm" | "md";
  className?: string;
}

const channelConfig: Record<Channel, { label: string; bg: string; text: string; icon: string }> = {
  whatsapp: {
    label: "WA",
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    icon: "M12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.44 1.28 4.9L2 22l5.19-1.36C8.67 21.53 10.28 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z",
  },
  telegram: {
    label: "TG",
    bg: "bg-sky-500/20",
    text: "text-sky-400",
    icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.74 3.99-1.74 6.65-2.89 7.99-3.44 3.8-1.58 4.59-1.86 5.11-1.87.11 0 .37.03.53.17.14.12.18.28.2.45-.01.06.01.24 0 .38z",
  },
};

export function ChannelBadge({ channel, size = "sm", className }: ChannelBadgeProps) {
  const config = channelConfig[channel];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        config.bg,
        config.text,
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={size === "sm" ? "h-2.5 w-2.5" : "h-3.5 w-3.5"}
      >
        <path d={config.icon} />
      </svg>
      {config.label}
    </span>
  );
}
