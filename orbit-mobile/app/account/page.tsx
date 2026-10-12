"use client";
import Link from "next/link";
import { useLocalState } from "@/lib/local-store";
import { Prose } from "@/components/layout/Prose";

const NONE = { name: "" };
export default function Account() {
  const [profile, setProfile] = useLocalState("orbit.profile.v1", NONE);
  return (
    <Prose title="Account" intro="Demo only: there is no real sign-in. A display name is saved in this browser.">
      <div className="card space-y-4 p-5">
        <div><label htmlFor="dn" className="mb-1 block text-sm font-semibold">Display name</label><input id="dn" className="input" value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} placeholder="Your name" /></div>
        <p className="text-sm text-muted">{profile.name ? `Hello, ${profile.name}.` : "Add a name to personalise this demo."}</p>
        <div className="flex flex-wrap gap-3"><Link href="/orders" className="btn btn-outline">My orders</Link><Link href="/wishlist" className="btn btn-outline">Wishlist</Link></div>
      </div>
    </Prose>
  );
}
