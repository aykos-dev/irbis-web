import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
};

/** No-data and filtered-empty surfaces: icon, one line, optional primary action. */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-pill bg-soft text-muted">
        <Icon aria-hidden="true" className="size-7" strokeWidth={2.5} />
      </span>
      <p className="text-h3 text-ink">{title}</p>
      {description ? <p className="max-w-md text-copy text-muted">{description}</p> : null}
      {action}
    </div>
  );
}
