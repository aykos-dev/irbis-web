"use client";

import { Toaster as Sonner, toast } from "sonner";

/** The only place sonner is imported. Feature code calls `toast` with translated copy. */
export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: "rounded-tile border-2 border-line bg-card text-small text-ink shadow-edge",
          description: "text-small text-muted",
          actionButton: "bg-teal-700 text-on-fill",
          cancelButton: "bg-soft text-ink",
        },
      }}
    />
  );
}

export { toast };
