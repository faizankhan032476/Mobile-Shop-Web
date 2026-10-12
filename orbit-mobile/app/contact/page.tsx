"use client";
import { useState } from "react";
import { Prose } from "@/components/layout/Prose";
import { toast } from "@/lib/toast";

export default function Contact() {
  const [f, setF] = useState({ name: "", email: "", message: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const x: Record<string, string> = {};
    if (f.name.trim().length < 2) x.name = "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) x.email = "Enter a valid email address.";
    if (f.message.trim().length < 10) x.message = "Write at least 10 characters so we can help.";
    setErr(x);
    if (!Object.keys(x).length) { setF({ name: "", email: "", message: "" }); toast("Message noted (demo: nothing was sent)."); }
  };
  const bind = (k: "name" | "email" | "message") => ({ id: k, value: f[k], onChange: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value }), "aria-invalid": !!err[k], className: "input" });
  return (
    <Prose title="Contact us" intro="This form is a demo and does not send email.">
      <form onSubmit={submit} noValidate className="card space-y-4 p-5">
        {(["name", "email"] as const).map((k) => <div key={k}><label htmlFor={k} className="mb-1 block text-sm font-semibold">{k === "name" ? "Your name" : "Email"}</label><input {...bind(k)} type={k === "email" ? "email" : "text"} />{err[k] && <p className="field-error">{err[k]}</p>}</div>)}
        <div><label htmlFor="message" className="mb-1 block text-sm font-semibold">Message</label><textarea {...bind("message")} />{err.message && <p className="field-error">{err.message}</p>}</div>
        <button className="btn btn-primary">Send message</button>
      </form>
    </Prose>
  );
}
