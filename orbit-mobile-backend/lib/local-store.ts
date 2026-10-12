"use client";
import { useCallback, useSyncExternalStore } from "react";

/**
 * Tiny localStorage-backed store built on useSyncExternalStore.
 * The server snapshot is always `initial`, so hydration never mismatches.
 * To move to a real backend later, replace readKey/writeKey with API calls.
 */
const listeners = new Map<string, Set<() => void>>();
const cache = new Map<string, { raw: string | null; value: unknown }>();

export function readKey<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  let raw: string | null = null;
  try { raw = window.localStorage.getItem(key); } catch { return fallback; }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value: T = fallback;
  if (raw !== null) { try { value = JSON.parse(raw) as T; } catch { /* keep fallback */ } }
  cache.set(key, { raw, value });
  return value;
}

export function writeKey<T>(key: string, value: T) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full or blocked */ }
  listeners.get(key)?.forEach((l) => l());
}

function subscribe(key: string, cb: () => void) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(cb);
  const onStorage = (e: StorageEvent) => { if (e.key === key) cb(); };
  window.addEventListener("storage", onStorage);
  return () => { listeners.get(key)!.delete(cb); window.removeEventListener("storage", onStorage); };
}

/** `initial` must be a stable reference (module constant). */
export function useLocalState<T>(key: string, initial: T) {
  const value = useSyncExternalStore(
    useCallback((cb) => subscribe(key, cb), [key]),
    () => readKey(key, initial),
    () => initial,
  );
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = readKey(key, initial);
      writeKey(key, typeof next === "function" ? (next as (p: T) => T)(prev) : next);
    },
    [key, initial],
  );
  return [value, set] as const;
}

/** True only after hydration; use to gate UI that depends on stored data. */
export function useHydrated() {
  return useSyncExternalStore(() => () => {}, () => true, () => false);
}
