import Image from "next/image";

import { cn } from "@/shared/lib/cn";

type BrandMarkProps = {
  /** Pixel size (square). Canvas: 52 on log-in, 40 in the sidebar. */
  size: 40 | 52;
  className?: string;
};

/** The final Irbis app icon (canvas asset 68fc129c…); the API-less SVG is served as-is. */
export function BrandMark({ size, className }: BrandMarkProps) {
  return (
    <Image
      src="/irbis-icon.svg"
      alt=""
      width={size}
      height={size}
      unoptimized
      className={cn(size === 52 ? "rounded-tile shadow-edge shadow-teal-icon-edge" : "rounded-tile", className)}
    />
  );
}
