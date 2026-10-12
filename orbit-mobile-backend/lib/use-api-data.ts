"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "./api-client";

/** Loads a GET endpoint with loading/error state and a reload() function. */
export function useApiData<T>(url: string | null) {
  const [s, setS] = useState<{ data: T | null; error: string; loading: boolean; total: number }>({ data: null, error: "", loading: !!url, total: 0 });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!url) return;
    let live = true;
    api<{ data: T; total?: number }>(url).then((r) => live && setS({ data: r.data, error: "", loading: false, total: r.total ?? 0 }))
      .catch((e) => live && setS({ data: null, error: e instanceof Error ? e.message : "Failed to load.", loading: false, total: 0 }));
    return () => { live = false; };
  }, [url, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...s, reload };
}
