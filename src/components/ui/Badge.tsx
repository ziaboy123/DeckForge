import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-bg-elevated border border-border text-secondary",
        gold: "bg-brand-gold/20 border border-brand-gold/40 text-brand-gold",
        blue: "bg-blue-500/20 border border-blue-500/40 text-blue-400",
        green: "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400",
        red: "bg-red-500/20 border border-red-500/40 text-red-400",
        yellow: "bg-yellow-500/20 border border-yellow-500/40 text-yellow-400",
        purple: "bg-violet-500/20 border border-violet-500/40 text-violet-400",
        // ban statuses
        banned: "bg-red-900/30 border border-red-500/50 text-red-400",
        limited: "bg-orange-900/30 border border-orange-500/50 text-orange-400",
        "semi-limited": "bg-yellow-900/30 border border-yellow-500/50 text-yellow-400",
        unlimited: "bg-emerald-900/30 border border-emerald-500/50 text-emerald-400",
        // card types
        monster: "bg-orange-900/30 border border-orange-500/40 text-orange-300",
        spell: "bg-emerald-900/30 border border-emerald-500/40 text-emerald-300",
        trap: "bg-pink-900/30 border border-pink-500/40 text-pink-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
