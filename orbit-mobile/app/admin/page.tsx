"use client";
import Link from "next/link";
import { useOrders, useProducts } from "@/lib/hooks";
import { formatDate, formatPKR } from "@/lib/format";

export default function Dashboard() {
  const { products } = useProducts();
  const { orders } = useOrders();
  const live = orders.filter((o) => o.status !== "Cancelled");
  const revenue = live.reduce((s, o) => s + o.total, 0);
  const low = products.filter((p) => p.stock <= 5);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.UTC(2026, 9, 11) - (6 - i) * 864e5).toISOString().slice(0, 10);
    const day = live.filter((o) => o.createdAt.slice(0, 10) === d);
    return { d: d.slice(5), n: day.length, rev: day.reduce((s, o) => s + o.total, 0) };
  });
  const maxRev = Math.max(...days.map((d) => d.rev), 1);
  const stats = [["Products", products.length], ["Orders (simulated)", orders.length], ["Revenue (simulated)", formatPKR(revenue)], ["Low stock (5 or fewer)", low.length]];

  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-bold">Dashboard</h1><p className="text-sm text-muted">All figures are simulated demo data, not real sales.</p></div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{stats.map(([k, v]) => <div key={k} className="card p-5"><p className="text-sm text-muted">{k}</p><p className="mt-1 text-2xl font-bold">{v}</p></div>)}</div>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-5" aria-labelledby="chart"><h2 id="chart" className="font-bold">Simulated revenue, last 7 days</h2>
          <div className="mt-4 flex h-44 items-end gap-3" role="img" aria-label="Bar chart of simulated daily revenue">
            {days.map((d) => <div key={d.d} className="flex flex-1 flex-col items-center gap-1"><div className="w-full rounded-t bg-brand" style={{ height: `${(d.rev / maxRev) * 100}%`, minHeight: d.rev ? 4 : 2, opacity: d.rev ? 1 : 0.25 }} title={`${formatPKR(d.rev)}, ${d.n} orders`} /><span className="text-[11px] text-muted">{d.d}</span></div>)}
          </div></section>
        <section className="card p-5" aria-labelledby="low"><h2 id="low" className="font-bold">Low stock</h2>
          {low.length === 0 ? <p className="mt-3 text-sm text-muted">Every product has healthy stock.</p> : <ul className="mt-3 divide-y divide-line text-sm">{low.map((p) => <li key={p.id} className="flex justify-between py-2"><span>{p.name}</span><span className={p.stock === 0 ? "font-bold text-sale" : "font-bold text-warn"}>{p.stock === 0 ? "Out of stock" : `${p.stock} left`}</span></li>)}</ul>}
          <Link href="/admin/products" className="mt-3 inline-block text-sm font-semibold text-brand">Manage inventory</Link></section>
      </div>
      <section className="card overflow-x-auto p-5" aria-labelledby="recent"><h2 id="recent" className="mb-3 font-bold">Recent orders</h2>
        <table className="w-full min-w-[520px] text-left text-sm"><thead className="text-muted"><tr><th className="py-2">Order</th><th>Customer</th><th>Date</th><th>Status</th><th className="text-right">Total</th></tr></thead>
          <tbody className="divide-y divide-line">{orders.slice(0, 5).map((o) => <tr key={o.id}><td className="py-2 font-semibold"><Link href="/admin/orders" className="hover:underline">{o.number}</Link></td><td>{o.customer.name}</td><td>{formatDate(o.createdAt)}</td><td>{o.status}</td><td className="text-right">{formatPKR(o.total)}</td></tr>)}</tbody></table></section>
    </div>
  );
}
