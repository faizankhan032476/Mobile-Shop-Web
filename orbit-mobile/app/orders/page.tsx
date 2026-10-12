"use client";
import Link from "next/link";
import { useOrders } from "@/lib/hooks";
import { formatDate, formatPKR } from "@/lib/format";

export default function OrdersPage() {
  const { orders } = useOrders();
  return (
    <div className="container-x py-8">
      <h1 className="text-3xl font-bold sm:text-4xl">Your orders</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Demo orders stored in this browser. Includes sample orders for illustration.</p>
      {orders.length === 0 ? <div className="card px-6 py-16 text-center"><p className="text-muted">No orders yet.</p><Link href="/shop" className="btn btn-primary mt-4">Browse phones</Link></div> : (
        <ul className="space-y-3">{orders.map((o) => (
          <li key={o.id}><Link href={`/order/${o.id}`} className="card flex flex-wrap items-center justify-between gap-3 p-4 hover:border-ink">
            <div><p className="font-semibold">{o.number}</p><p className="text-sm text-muted">{formatDate(o.createdAt)} · {o.items.reduce((s, i) => s + i.qty, 0)} item(s)</p></div>
            <div className="flex items-center gap-4"><span className="rounded-full bg-paper px-3 py-1 text-xs font-bold">{o.status}</span><span className="font-bold">{formatPKR(o.total)}</span></div>
          </Link></li>))}</ul>)}
    </div>
  );
}
