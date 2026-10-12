import Link from "next/link";

const COLS: [string, [string, string][]][] = [
  ["Shop", [["All phones", "/shop"], ["Flagship", "/shop?category=flagship"], ["Mid-range", "/shop?category=mid-range"], ["Budget", "/shop?category=budget"], ["Offers", "/shop?sale=1"]]],
  ["Help", [["FAQ", "/faq"], ["Contact", "/contact"], ["Track orders", "/orders"], ["Wishlist", "/wishlist"]]],
  ["Company", [["About", "/about"], ["Privacy", "/privacy"], ["Terms", "/terms"], ["Admin", "/admin"]]],
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="container-x grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <p className="font-display text-2xl font-bold">Orbit<span className="text-brand">.</span></p>
          <p className="mt-3 max-w-xs text-sm text-muted">A single-owner mobile phone shop. The catalog is sample demo data.</p>
        </div>
        {COLS.map(([title, links]) => (
          <nav key={title} aria-label={title}>
            <h2 className="text-sm font-bold">{title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {links.map(([l, h]) => <li key={l}><Link href={h} className="hover:text-ink">{l}</Link></li>)}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted">Orbit Mobile demo store. Cash on Delivery only; online payments are not available yet.</div>
    </footer>
  );
}
