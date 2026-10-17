import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type StatTileProps = {
  label: string;
  value: string;
  hint?: ReactNode;
  testId?: string;
  className?: string;
};

/** Dashboard tile (canvas W3): caption, big tabular number, optional one-line hint. */
export function StatTile({ label, value, hint, testId, className }: StatTileProps) {
  return (
    <div
      data-testid={testId}
      className={cn("flex flex-col gap-1 rounded-card border-2 border-b-4 border-line bg-card px-4 py-4", className)}
    >
      <p className="text-caption uppercase text-muted">{label}</p>
      <p className="text-h1 tabular-nums text-ink">{value}</p>
      {hint ? <p className="text-small text-muted">{hint}</p> : null}
    </div>
  );
}
