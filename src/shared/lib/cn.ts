import { createCn } from "cn/config";

/**
 * Class merging (clsx + tailwind-merge semantics). Token utilities that share a
 * prefix with colour utilities (`text-h1` vs `text-ink`) are registered so they
 * are not treated as conflicts.
 */
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["stat", "h1", "h2", "h3", "copy", "small", "caption", "button", "chip", "nav-label"] },
      ],
    },
  },
});
