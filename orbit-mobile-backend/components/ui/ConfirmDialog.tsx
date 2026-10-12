"use client";
import { useEffect, useRef } from "react";

export function ConfirmDialog({ open, title, body, confirmLabel, onConfirm, onCancel }: { open: boolean; title: string; body: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} onClose={onCancel} className="m-auto w-[min(92vw,26rem)] rounded-2xl p-6 backdrop:bg-ink/50">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted">{body}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button className="btn btn-outline" onClick={onCancel}>Keep it</button>
        <button className="btn btn-danger" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </dialog>
  );
}
