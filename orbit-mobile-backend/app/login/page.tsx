import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
export const metadata = { title: "Sign in" };
export default function Page() { return <Suspense fallback={null}><AuthForm mode="login" /></Suspense>; }
