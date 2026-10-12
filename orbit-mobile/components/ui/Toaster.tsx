"use client";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { useToasts } from "@/lib/toast";

export function Toaster() {
  const toasts = useToasts();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div key={t.id} role="status" className="pointer-events-auto flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-lg">
          {t.tone === "success" ? <CheckCircle2 size={18} className="text-emerald-400" /> : t.tone === "error" ? <XCircle size={18} className="text-red-400" /> : <Info size={18} className="text-sky-300" />}
          {t.message}
        </div>
      ))}
    </div>
  );
}
