// // "use client";
// // import { useCallback, useEffect, useSyncExternalStore } from "react";
// // import { api } from "./api-client";

// // export type Status = "idle" | "loading" | "ready" | "error";
// // interface Snap<T> { data: T; status: Status; error: string }

// // /** A tiny shared, cached GET resource. All components using it see the same data; refresh() re-fetches. */
// // export function createResource<T>(load: () => Promise<T>, initial: T) {
// //   let snap: Snap<T> = { data: initial, status: "idle", error: "" };
// //   const subs = new Set<() => void>();
// //   const set = (s: Snap<T>) => { snap = s; subs.forEach((f) => f()); };
// //   let inflight: Promise<void> | null = null;
// //   const refresh = () => (inflight ??= (async () => {
// //     if (snap.status !== "ready") set({ ...snap, status: "loading" });
// //     try { set({ data: await load(), status: "ready", error: "" }); }
// //     catch (e) { set({ data: snap.data, status: "error", error: e instanceof Error ? e.message : "Failed to load." }); }
// //     finally { inflight = null; }
// //   })());
// //   function useResource() {
// //     const s = useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => snap, () => ({ data: initial, status: "idle", error: "" }) as Snap<T>);
// //     useEffect(() => { if (snap.status === "idle") void refresh(); }, []);
// //     const reload = useCallback(() => refresh(), []);
// //     return { ...s, reload };
// //   }
// //   return { useResource, refresh };
// // }

// // export async function fetchAllPages<T>(base: string): Promise<T[]> {
// //   const out: T[] = [];
// //   for (let page = 1; page <= 5; page++) {
// //     const r = await api<{ data: T[]; total: number }>(`${base}${base.includes("?") ? "&" : "?"}pageSize=100&page=${page}`);
// //     out.push(...r.data);
// //     if (out.length >= r.total) break;
// //   }
// //   return out;
// // }








// "use client";
// import { useCallback, useEffect, useSyncExternalStore } from "react";
// import { api } from "./api-client";

// export type Status = "idle" | "loading" | "ready" | "error";
// interface Snap<T> { data: T; status: Status; error: string }

// /** A tiny shared, cached GET resource. All components using it see the same data; refresh() re-fetches. */
// export function createResource<T>(load: () => Promise<T>, initial: T) {
//   let snap: Snap<T> = { data: initial, status: "idle", error: "" };
//   const subs = new Set<() => void>();
//   const set = (s: Snap<T>) => { snap = s; subs.forEach((f) => f()); };
//   let inflight: Promise<void> | null = null;
//   const refresh = () => (inflight ??= (async () => {
//     if (snap.status !== "ready") set({ ...snap, status: "loading" });
//     try { set({ data: await load(), status: "ready", error: "" }); }
//     catch (e) { set({ data: snap.data, status: "error", error: e instanceof Error ? e.message : "Failed to load." }); }
//     finally { inflight = null; }
//   })());
//   function useResource() {
//     const s = useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => snap, () => ({ data: initial, status: "idle", error: "" }) as Snap<T>);
//     useEffect(() => { if (snap.status === "idle") void refresh(); }, []);
//     const reload = useCallback(() => refresh(), []);
//     return { ...s, reload };
//   }
//   return { useResource, refresh };
// }

// export async function fetchAllPages<T>(base: string): Promise<T[]> {
//   const out: T[] = [];
//   for (let page = 1; page <= 5; page++) {
//     const r = await api<{ data: T[]; total: number }>(`${base}${base.includes("?") ? "&" : "?"}pageSize=100&page=${page}`);
//     out.push(...r.data);
//     if (out.length >= r.total) break;
//   }
//   return out;
// }












"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { api } from "./api-client";

export type Status = "idle" | "loading" | "ready" | "error";

interface Snap<T> {
  data: T;
  status: Status;
  error: string;
}

export function createResource<T>(
  load: () => Promise<T>,
  initial: T
) {
  let snap: Snap<T> = {
    data: initial,
    status: "idle",
    error: "",
  };

  // Stable server snapshot: same object on every call
  const serverSnap: Snap<T> = {
    data: initial,
    status: "idle",
    error: "",
  };

  const subs = new Set<() => void>();

  const set = (s: Snap<T>) => {
    snap = s;
    subs.forEach((fn) => fn());
  };

  let inflight: Promise<void> | null = null;

  const refresh = (): Promise<void> => {
    if (inflight) return inflight;

    inflight = (async () => {
      if (snap.status !== "ready") {
        set({ ...snap, status: "loading" });
      }

      try {
        const data = await load();
        set({ data, status: "ready", error: "" });
      } catch (e) {
        set({
          data: snap.data,
          status: "error",
          error: e instanceof Error ? e.message : "Failed to load.",
        });
      } finally {
        inflight = null;
      }
    })();

    return inflight;
  };

  function useResource() {
    const subscribe = useCallback((callback: () => void) => {
      subs.add(callback);
      return () => {
        subs.delete(callback);
      };
    }, []);

    const getSnapshot = useCallback(() => snap, []);
    const getServerSnapshot = useCallback(() => serverSnap, []);

    const state = useSyncExternalStore(
      subscribe,
      getSnapshot,
      getServerSnapshot
    );

    useEffect(() => {
      if (snap.status === "idle") {
        void refresh();
      }
    }, []);

    const reload = useCallback(() => refresh(), []);

    return { ...state, reload };
  }

  return { useResource, refresh };
}

export async function fetchAllPages<T>(base: string): Promise<T[]> {
  const result: T[] = [];

  for (let page = 1; page <= 5; page++) {
    const response = await api<{ data: T[]; total: number }>(
      `${ base }${ base.includes("?") ? "&" : "?" } pageSize = 100 & page=${ page } `
    );

    result.push(...response.data);

    if (result.length >= response.total) break;
  }

  return result;
}
