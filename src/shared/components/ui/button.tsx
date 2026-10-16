import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * design.md › Buttons: min-height 54, padding 8 × 20, radius 16, 4 px bottom edge in the
 * edge colour; pressed = no edge + 4 px press-down. Labels wrap, never truncate.
 */
const buttonVariants = cva(
  [
    "inline-flex min-h-button items-center justify-center gap-2 rounded-tile px-5 py-2",
    "text-center text-button whitespace-normal uppercase select-none",
    "shadow-edge transition duration-150 ease-out",
    "hover:brightness-105 active:translate-y-1 active:shadow-none",
    "disabled:pointer-events-none disabled:bg-disabled-bg disabled:text-disabled-fg disabled:shadow-none",
    "aria-disabled:pointer-events-none aria-disabled:bg-disabled-bg aria-disabled:text-disabled-fg aria-disabled:shadow-none",
  ],
  {
    variants: {
      variant: {
        primary: "bg-teal-700 text-on-fill shadow-teal-700-edge",
        secondary: "bg-orange text-on-orange shadow-orange-edge",
        white: "border-2 border-line bg-card text-teal-700 shadow-line",
        danger: "bg-red-700 text-on-fill shadow-red-700-edge",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the single child (e.g. a Link) with button styling. */
    asChild?: boolean;
  };

function Button({ className, variant, asChild = false, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      data-variant={variant ?? "primary"}
      type={asChild ? undefined : (type ?? "button")}
      className={cn(buttonVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
