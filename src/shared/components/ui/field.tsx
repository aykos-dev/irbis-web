import { cva } from "class-variance-authority";
import { useId, type ComponentProps, type ReactElement, type ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

/** design canvas `.in`: min-height 44, radius 12, 2 px line border; error state swaps the border. */
const controlClasses = cva(
  [
    "min-h-touch w-full rounded-tile border-2 bg-card px-3 py-2 text-copy text-ink",
    "placeholder:text-muted transition duration-150",
    "disabled:bg-disabled-bg disabled:text-disabled-fg",
  ],
  {
    variants: {
      invalid: { true: "border-red-700", false: "border-line" },
    },
    defaultVariants: { invalid: false },
  },
);

type ControlProps = { invalid?: boolean };

function Input({ className, invalid, ...props }: ComponentProps<"input"> & ControlProps) {
  return (
    <input
      data-slot="input"
      aria-invalid={invalid ? true : undefined}
      className={cn(controlClasses({ invalid }), className)}
      {...props}
    />
  );
}

function Textarea({ className, invalid, ...props }: ComponentProps<"textarea"> & ControlProps) {
  return (
    <textarea
      data-slot="textarea"
      aria-invalid={invalid ? true : undefined}
      className={cn(controlClasses({ invalid }), "resize-y", className)}
      {...props}
    />
  );
}

/** Native select: keyboard and screen-reader behaviour for free, styled like Input. */
function Select({ className, invalid, ...props }: ComponentProps<"select"> & ControlProps) {
  return (
    <select
      data-slot="select"
      aria-invalid={invalid ? true : undefined}
      className={cn(controlClasses({ invalid }), className)}
      {...props}
    />
  );
}

type FieldProps = {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  /** Receives the ids to wire onto the control. */
  children: (control: { id: string; "aria-describedby": string | undefined; invalid: boolean }) => ReactElement;
  trailing?: ReactNode;
};

/** Label + control + hint/error, wired with htmlFor / aria-describedby. */
function Field({ label, error, hint, className, children, trailing }: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div data-slot="field" className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-small font-black text-ink">
        {label}
      </label>
      <div className="relative">
        {children({ id, "aria-describedby": message ? messageId : undefined, invalid: Boolean(error) })}
        {trailing ? <span className="absolute inset-y-0 end-3 flex items-center">{trailing}</span> : null}
      </div>
      {message ? (
        <p id={messageId} className={cn("text-small", error ? "text-status-notnow-fg" : "text-muted")}>
          {message}
        </p>
      ) : null}
    </div>
  );
}

export { Field, Input, Select, Textarea };
