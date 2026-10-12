"use client";
import Link from "next/link";
import { useProducts } from "@/lib/hooks";
import { BRANDS, CATEGORIES, DEMO_REVIEWS } from "@/data/products";
import { Rail } from "./Rail";
import { Stars } from "@/components/ui/Stars";
import { Newsletter } from "./Newsletter";
import { formatPKR } from "@/lib/format";

export function HomeSections() {
  const { products } = useProducts();
  const featured = products.filter((p) => p.featured);
  const latest = [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const best = [...products].sort((a, b) => b.popularity - a.popularity);
  const deals = products.filter((p) => p.onSale && p.originalPrice && p.originalPrice > p.price);
  const biggest = [...deals].sort((a, b) => (b.originalPrice! - b.price) - (a.originalPrice! - a.price))[0];

  return (
    <>
      <section className="container-x mt-12" aria-labelledby="cats">
        <h2 id="cats" className="mb-5 text-2xl font-bold sm:text-3xl">Shop by category</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link key={c.name} href={`/shop?category=${c.name}`} className="card p-5 transition-colors hover:border-ink">
              <p className="font-display text-xl font-bold">{c.name}</p>
              <p className="mt-1 text-sm text-muted">{c.blurb}</p>
              <p className="mt-4 text-sm font-semibold text-brand">{products.filter((p) => p.category === c.name).length} phones</p>
            </Link>
          ))}
        </div>
      </section>

      <Rail title="Featured smartphones" href="/shop" items={featured} />
      <Rail title="Latest arrivals" href="/shop?sort=newest" items={latest} />

      {biggest && (
        <section className="container-x mt-16">
          <div className="grid items-center gap-6 rounded-3xl bg-brand p-8 text-white md:grid-cols-[1.5fr_1fr] md:p-12">
            <div>
              <h2 className="text-3xl font-bold sm:text-4xl">Save {formatPKR(biggest.originalPrice! - biggest.price)} on the {biggest.name}</h2>
              <p className="mt-3 max-w-lg text-white/85">Plus free delivery above Rs 150,000 and 5% off with code ORBIT5 at checkout (demo offer).</p>
            </div>
            <div className="flex md:justify-end"><Link href={`/product/${biggest.id}`} className="btn bg-white text-ink hover:bg-paper">See this deal</Link></div>
          </div>
        </section>
      )}

      <Rail title="Best sellers" href="/shop?sort=popular" items={best} />
      <Rail title="Special offers" href="/shop?sale=1" items={deals} />

      <section className="container-x mt-16" aria-labelledby="brands">
        <h2 id="brands" className="mb-5 text-2xl font-bold sm:text-3xl">Popular brands</h2>
        <div className="flex flex-wrap gap-3">
          {BRANDS.map((b) => <Link key={b} href={`/shop?brand=${b}`} className="btn btn-outline">{b}</Link>)}
        </div>
      </section>

      <section className="container-x mt-16" aria-labelledby="rev">
        <h2 id="rev" className="text-2xl font-bold sm:text-3xl">What customers say</h2>
        <p className="mb-5 mt-1 text-sm text-muted">Sample reviews for demonstration. These are not from real customers.</p>
        <div className="grid gap-4 md:grid-cols-3">
          {DEMO_REVIEWS.map((r) => (
            <figure key={r.name} className="card p-5">
              <Stars value={r.rating} />
              <blockquote className="mt-3 text-sm leading-relaxed">{r.text}</blockquote>
              <figcaption className="mt-4 text-xs font-semibold text-muted">{r.name}, {r.city}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="container-x mt-16">
        <div className="flex flex-col gap-6 rounded-3xl bg-ink p-8 text-white md:flex-row md:items-center md:justify-between md:p-12">
          <div><h2 className="text-2xl font-bold sm:text-3xl">Get new arrivals first</h2><p className="mt-2 text-white/75">One email when new phones land. Unsubscribe any time.</p></div>
          <Newsletter />
        </div>
      </section>
    </>
  );
}
