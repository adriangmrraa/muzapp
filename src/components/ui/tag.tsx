import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const tagVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors",
  {
    variants: {
      color: {
        default: "bg-neutral-500/20 text-neutral-300",
        purple: "bg-purple-500/20 text-purple-400",
        blue: "bg-blue-500/20 text-blue-400",
        amber: "bg-amber-500/20 text-amber-400",
        orange: "bg-orange-500/20 text-orange-400",
        red: "bg-red-500/20 text-red-400",
        green: "bg-emerald-500/20 text-emerald-400",
      },
    },
    defaultVariants: {
      color: "default",
    },
  }
);

export type TagColor = NonNullable<VariantProps<typeof tagVariants>["color"]>;

export interface TagProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color">,
    VariantProps<typeof tagVariants> {}

export function Tag({ className, color, children, ...props }: TagProps) {
  return (
    <span className={cn(tagVariants({ color }), className)} {...props}>
      {children}
    </span>
  );
}

// Mapa de tag label → color
const TAG_COLOR_MAP: Record<string, TagColor> = {
  vip: "purple",
  recurrente: "blue",
  "alto-valor": "amber",
  pendiente: "orange",
  urgente: "red",
  resuelto: "green",
  nuevo: "default",
  whatsapp: "default",
  telegram: "default",
};

export function getTagColor(label: string): TagColor {
  return TAG_COLOR_MAP[label.toLowerCase()] ?? "default";
}
