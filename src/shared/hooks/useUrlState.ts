"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export type UrlStateUpdate = Record<string, string | null | undefined>;

/**
 * List state lives in the URL (standards §3). `update` merges changes into the current query
 * string — null, undefined and "" remove a key — and replaces history so typing does not
 * fill the back stack. Reads are plain strings; features parse and validate them.
 */
export function useUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const params = useMemo(() => new URLSearchParams(queryString), [queryString]);

  const update = useCallback(
    (changes: UrlStateUpdate, options: { push?: boolean } = {}) => {
      const next = new URLSearchParams(queryString);
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === undefined || value === "") next.delete(key);
        else next.set(key, value);
      }
      const query = next.toString();
      const href = query ? `${pathname}?${query}` : pathname;
      if (options.push) router.push(href);
      else router.replace(href);
    },
    [pathname, queryString, router],
  );

  return { params, update };
}
