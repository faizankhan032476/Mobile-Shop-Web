"use client";
import { useState } from "react";
import { api, ApiClientError } from "@/lib/api-client";
import { useApiData } from "@/lib/use-api-data";
import { toast } from "@/lib/toast";

export default function Settings() {
  const { data, error, loading, reload } = useApiData<{ freeShippingThreshold: number; flatShipping: number }>("/api/admin/settings");
  const [t, setT] = useState<string | null>(null);
  const [f, setF] = useState<string | null>(null);
  if (loading) return <p className="text-muted">Loading settings…</p>;
  if (error || !data) return <p role="alert" className="text-sale">{error}</p>;
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api("/api/admin/settings", { method: "PATCH", json: { freeShippingThreshold: Number(t ?? data.freeShippingThreshold), flatShipping: Number(f ?? data.flatShipping) } }); toast("Settings saved"); reload(); }
    catch (ex) { toast(ex instanceof ApiClientError ? (ex.fields ? "Enter whole numbers, 0 or more." : ex.message) : "Couldn’t save", "error"); }
  };
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      <form onSubmit={save} className="card space-y-4 p-5">
        <h2 className="font-bold">Shipping (PKR)</h2>
        <div><label htmlFor="th" className="mb-1 block text-sm font-semibold">Free delivery from order subtotal</label><input id="th" type="number" min={0} className="input" value={t ?? data.freeShippingThreshold} onChange={(e) => setT(e.target.value)} /></div>
        <div><label htmlFor="fl" className="mb-1 block text-sm font-semibold">Flat delivery fee below that</label><input id="fl" type="number" min={0} className="input" value={f ?? data.flatShipping} onChange={(e) => setF(e.target.value)} /></div>
        <button className="btn btn-primary">Save settings</button>
        <p className="text-xs text-muted">Applied by the server to every new order.</p>
      </form>
    </div>
  );
}
