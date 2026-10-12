"use client";
import { useSyncExternalStore } from "react";

export interface Toast { id: number; message: string; tone: "success" | "error" | "info" }
let toasts: Toast[] = [];
const subs = new Set<() => void>();
const emit = () => subs.forEach((s) => s());

export function toast(message: string, tone: Toast["tone"] = "success") {
  const id = Date.now() + Math.random();
  toasts = [...toasts, { id, message, tone }].slice(-3);
  emit();
  setTimeout(() => { toasts = toasts.filter((t) => t.id !== id); emit(); }, 3200);
}
const EMPTY: Toast[] = [];
export const useToasts = () =>
  useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => toasts, () => EMPTY);
