import type { ReactElement } from "react";

import { LessonIcon } from "@/shared/api/generated/model";

/** Stroke paths for each lesson glyph on a 24 × 24 grid; drawn in currentColor. */
const GLYPHS: Record<LessonIcon, ReactElement> = {
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5Z" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19C5 10 10 5 19 5c0 9-5 14-14 14Z" />
      <path d="M5 19 13 11" />
    </>
  ),
  padlock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  cloud: <path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18Z" />,
  paw: (
    <>
      <circle cx="7" cy="9" r="1.8" />
      <circle cx="10.5" cy="5.5" r="1.8" />
      <circle cx="14.5" cy="5.5" r="1.8" />
      <circle cx="18" cy="9" r="1.8" />
      <path d="M12 11c-3 0-5.5 3.5-5.5 6a2.5 2.5 0 0 0 3.5 2.3 5 5 0 0 1 4 0A2.5 2.5 0 0 0 17.5 17c0-2.5-2.5-6-5.5-6Z" />
    </>
  ),
  "first-aid": (
    <>
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M9 6V4h6v2M12 10v6M9 13h6" />
    </>
  ),
  mountain: <path d="M2 20 9 7l4 7 2-3 7 9Z" />,
  waves: <path d="M2 9c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0M2 15c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0" />,
  avalanche: (
    <>
      <path d="M2 20 10 6l10 14Z" />
      <circle cx="16" cy="8" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </>
  ),
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7Z" />,
};

export const LESSON_ICONS: readonly LessonIcon[] = Object.values(LessonIcon);

/** A 24 px lesson glyph. Decorative: callers give the surrounding control its label. */
export function LessonIconGlyph({ icon, className }: { icon: LessonIcon; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      data-icon={icon}
    >
      {GLYPHS[icon]}
    </svg>
  );
}
