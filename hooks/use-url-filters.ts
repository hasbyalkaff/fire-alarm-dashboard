"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Read/write shareable filter + pagination state in the URL query (WIG). */
export function useUrlFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const get = useCallback((key: string) => params.get(key) ?? "", [params]);

  const set = useCallback(
    (updates: Record<string, string | undefined>, opts?: { resetPage?: boolean }) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === undefined || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (opts?.resetPage !== false) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const clear = useCallback(() => router.replace(pathname, { scroll: false }), [pathname, router]);

  return { get, set, clear, toString: () => params.toString(), hasAny: params.size > 0 };
}
