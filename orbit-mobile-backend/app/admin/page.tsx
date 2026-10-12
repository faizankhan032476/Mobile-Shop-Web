"use client";
import Link from "next/link";
import { useApiData } from "@/lib/use-api-data";
import { formatDate, formatPKR } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/labels";
import type { OrderStatus } from "@/types";

interface Stats {
  products: number; orders: number; revenue_paid: number; revenue_pending: number;
  low_stock: { id: string; name: string; stock: number }[];
  daily: { day: string; orders: number; total: number }[];
  recent: { id: string; order_number: string; customer_name: string; status: OrderStatus; total: number; created_at: string }[];
}

export default function Dashboard() {
  const { data: s, error, loading } = useApiData<Stats>("/api/admin/stats");
  if (loading) return <p className="text-muted" aria-live="polite">Loading dashboard…</p>;
  if (error || !s) return <p role="alert" className="text-sale">{error || "Couldn’t load the dashboard."}</p>;

  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() - (6 - i)); const key = d.toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" }); const hit = s.daily.find((x) => x.day === key); return { key: key.slice(5), total: Number(hit?.total ?? 0), orders: hit?.orders ?? 0 }; });
  const max = Math.max(...days.map((d) => d.total), 1);
  const stats: [string, string | number][] = [["Products", s.products], ["Orders", s.orders], ["Revenue (paid)", formatPKR(s.revenue_paid)], ["Awaiting payment (COD)", formatPKR(s.revenue_pending)]];

  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-bold">Dashboard</h1><p className="text-sm text-muted">Revenue counts orders marked Paid and not cancelled. Cash on Delivery orders count as “awaiting payment” until you mark them Paid.</p></div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{stats.map(([k, v]) => <div key={k} className="card p-5"><p className="text-sm text-muted">{k}</p><p className="mt-1 text-2xl font-bold">{v}</p></div>)}</div>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-5" aria-labelledby="chart"><h2 id="chart" className="font-bold">Order value, last 7 days</h2>
          <div className="mt-4 flex h-44 items-end gap-3" role="img" aria-label="Bar chart of order value per day">
            {days.map((d) => <div key={d.key} className="flex flex-1 flex-col items-center gap-1"><div className="w-full rounded-t bg-brand" style={{ height: `${(d.total / max) * 100}%`, minHeight: d.total ? 4 : 2, opacity: d.total ? 1 : 0.25 }} title={`${formatPKR(d.total)}, ${d.orders} orders`} /><span className="text-[11px] text-muted">{d.key}</span></div>)}
          </div></section>
        <section className="card p-5" aria-labelledby="low"><h2 id="low" className="font-bold">Low stock (5 or fewer)</h2>
          {s.low_stock.length === 0 ? <p className="mt-3 text-sm text-muted">Every product has healthy stock.</p> : <ul className="mt-3 divide-y divide-line text-sm">{s.low_stock.map((p) => <li key={p.id} className="flex justify-between py-2"><span>{p.name}</span><span className={p.stock === 0 ? "font-bold text-sale" : "font-bold text-warn"}>{p.stock === 0 ? "Out of stock" : `${p.stock} left`}</span></li>)}</ul>}
          <Link href="/admin/products" className="mt-3 inline-block text-sm font-semibold text-brand">Manage inventory</Link></section>
      </div>
      <section className="card overflow-x-auto p-5" aria-labelledby="recent"><h2 id="recent" className="mb-3 font-bold">Recent orders</h2>
        {s.recent.length === 0 ? <p className="text-sm text-muted">No orders yet.</p> :
          <table className="w-full min-w-[520px] text-left text-sm"><thead className="text-muted"><tr><th className="py-2">Order</th><th>Customer</th><th>Date</th><th>Status</th><th className="text-right">Total</th></tr></thead>
            <tbody className="divide-y divide-line">{s.recent.map((o) => <tr key={o.id}><td className="py-2 font-semibold"><Link href="/admin/orders" className="hover:underline">{o.order_number}</Link></td><td>{o.customer_name}</td><td>{formatDate(o.created_at)}</td><td>{STATUS_LABEL[o.status]}</td><td className="text-right">{formatPKR(o.total)}</td></tr>)}</tbody></table>}</section>
    </div>
  );
}
