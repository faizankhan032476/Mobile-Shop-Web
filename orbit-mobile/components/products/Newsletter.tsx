"use client";
import { useState } from "react";
import { toast } from "@/lib/toast";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return setError("Enter a valid email address, like name@example.com.");
    setError(""); setEmail(""); toast("Thanks! (Demo only: nothing was sent or stored.)");
  };
  return (
    <form onSubmit={submit} noValidate className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
      <div className="flex-1">
        <label htmlFor="nl-email" className="sr-only">Email address</label>
        <input id="nl-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" aria-invalid={!!error} aria-describedby={error ? "nl-err" : undefined} className="input" />
        {error && <p id="nl-err" className="field-error !text-red-200">{error}</p>}
      </div>
      <button className="btn btn-primary">Subscribe</button>
    </form>
  );
}
