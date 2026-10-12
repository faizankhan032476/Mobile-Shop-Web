"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiClientError } from "@/lib/api-client";
import { formatDate, formatPKR } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/labels";
import type { Order } from "@/types";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api<{ data: Order[] }>("/api/orders").then((r) => setOrders(r.data)).catch((e) => setError(e instanceof ApiClientError && e.status === 401 ? "signin" : "Couldn’t load your orders. Please try again."));
  }, []);
  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-3xl font-bold sm:text-4xl">Your orders</h1>
      {error === "signin" ? <div className="card px-6 py-16 text-center"><p className="text-muted">Sign in to see your orders.</p><Link href="/login?next=/orders" className="btn btn-primary mt-4">Sign in</Link></div>
        : error ? <p role="alert" className="card px-6 py-16 text-center text-sale">{error}</p>
        : orders === null ? <p className="text-muted" aria-live="polite">Loading orders…</p>
        : orders.length === 0 ? <div className="card px-6 py-16 text-center"><p className="text-muted">No orders yet.</p><Link href="/shop" className="btn btn-primary mt-4">Browse phones</Link></div>
        : <ul className="space-y-3">{orders.map((o) => (
          <li key={o.id}><Link href={`/order/${o.id}`} className="card flex flex-wrap items-center justify-between gap-3 p-4 hover:border-ink">
            <div><p className="font-semibold">{o.number}</p><p className="text-sm text-muted">{formatDate(o.createdAt)} · {o.items.reduce((s, i) => s + i.qty, 0)} item(s)</p></div>
            <div className="flex items-center gap-4"><span className="rounded-full bg-paper px-3 py-1 text-xs font-bold">{STATUS_LABEL[o.status]}</span><span className="font-bold">{formatPKR(o.total)}</span></div>
          </Link></li>))}</ul>}
    </div>
  );
}
