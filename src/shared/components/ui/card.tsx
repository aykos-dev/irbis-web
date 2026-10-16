import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

/** design.md › Cards: 2 px line border, 4 px bottom edge, radius 20. */
function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      data-slot="card"
      className={cn("flex flex-col gap-4 rounded-card border-2 border-b-4 border-line bg-card p-5", className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("flex flex-col gap-1", className)} {...props} />;
}

function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return <h2 data-slot="card-title" className={cn("text-h3 text-ink", className)} {...props} />;
}

function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return <p data-slot="card-description" className={cn("text-small text-muted", className)} {...props} />;
}

function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("flex flex-col gap-3", className)} {...props} />;
}

function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div data-slot="card-footer" className={cn("flex flex-wrap items-center gap-3", className)} {...props} />
  );
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
