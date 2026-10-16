import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * design.md › Chips: height 28, padding 0 × 10, radius 999, 13 / 800.
 * Condition statuses are always colour + icon + label — pass the icon as a child.
 */
const badgeVariants = cva(
  "inline-flex min-h-chip items-center gap-1.5 rounded-pill px-2.5 text-chip [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        go: "bg-status-go-bg text-status-go-fg",
        caution: "bg-status-caution-bg text-status-caution-fg",
        notnow: "bg-status-notnow-bg text-status-notnow-fg",
        locked: "bg-status-locked-bg text-status-locked-fg",
        neutral: "bg-soft text-body",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

function Badge({ className, tone, ...props }: BadgeProps) {
  return <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { Badge, badgeVariants };
export type { BadgeProps };
