import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

/** Decorative placeholder; the surrounding region announces loading (aria-busy). */
function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-tile bg-soft", className)}
      {...props}
    />
  );
}

export { Skeleton };
