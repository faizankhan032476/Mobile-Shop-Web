import Link from "next/link";
import { HeroPhone } from "@/components/products/HeroPhone";
import { HomeSections } from "@/components/products/HomeSections";

export default function Home() {
  return (
    <>
      <section className="overflow-hidden bg-surface">
        <div className="container-x grid items-center gap-8 py-10 md:grid-cols-2 md:py-16">
          <div>
            <h1 className="text-4xl font-bold leading-[1.05] sm:text-6xl">The phone you want, delivered across Pakistan.</h1>
            <p className="mt-5 max-w-md text-lg text-muted">Compare flagships, mid-rangers and budget picks with clear PKR prices and honest stock levels.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn btn-primary">Shop smartphones</Link>
              <Link href="/shop?sale=1" className="btn btn-outline">See offers</Link>
            </div>
          </div>
          <HeroPhone />
        </div>
      </section>
      <HomeSections />
    </>
  );
}
