"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", { redirect: false, email: form.get("email"), password: form.get("password") });
    if (result?.error) { setError("That email and password combination didn’t match."); setLoading(false); return; }
    router.push("/"); router.refresh();
  };
  return <main className="sign-in-page"><section className="sign-in-card"><button className="brand"><span className="brand-mark"><Icon name="lightning" size={19} /></span><span>StudyPilot</span></button><div><div className="eyebrow">WELCOME BACK</div><h1>Make space for what matters.</h1><p>Sign in to keep your study plan, progress, and deadlines in sync.</p></div><form onSubmit={submit}><label>Email<input name="email" type="email" required placeholder="you@university.edu" defaultValue="demo@studypilot.app" /></label><label>Password<input name="password" type="password" required minLength={8} defaultValue="DemoPass123!" /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={loading}>{loading ? "Signing in…" : "Sign in"} <Icon name="arrow" size={16} /></button></form><p className="demo-account">Demo account is available after running the database seed.</p></section></main>;
}
