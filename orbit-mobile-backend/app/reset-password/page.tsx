import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
export const metadata = { title: "New password" };
export default function Page() { return <Suspense fallback={null}><AuthForm mode="reset" /></Suspense>; }
