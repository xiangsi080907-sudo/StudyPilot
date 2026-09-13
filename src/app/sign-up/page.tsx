"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    if (password !== confirmPassword) { setError("Passwords need to match."); setLoading(false); return; }
    try {
      const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
      const body = await response.json() as { error?: string };
      if (!response.ok) { setError(body.error ?? "We couldn’t create your account."); setLoading(false); return; }
      const result = await signIn("credentials", { redirect: false, email, password });
      if (result?.error) { router.push("/sign-in?created=1"); return; }
      router.push("/"); router.refresh();
    } catch { setError("We couldn’t create your account right now. Please try again."); setLoading(false); }
  };
  return <main className="sign-in-page"><section className="sign-in-card"><Link className="brand" href="/"><span className="brand-mark"><Icon name="lightning" size={19} /></span><span>StudyPilot</span></Link><div><div className="eyebrow">START YOUR PLAN</div><h1>Build a calmer study week.</h1><p>Create an account to save your courses, goals, and custom study plan.</p></div><form onSubmit={submit}><label>Your name<input name="name" required minLength={2} maxLength={80} autoComplete="name" placeholder="Maya Chen" /></label><label>Email<input name="email" type="email" required autoComplete="email" placeholder="you@university.edu" /></label><label>Password<input name="password" type="password" required minLength={10} autoComplete="new-password" placeholder="At least 10 characters" /></label><label>Confirm password<input name="confirmPassword" type="password" required minLength={10} autoComplete="new-password" placeholder="Repeat your password" /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={loading}>{loading ? "Creating account…" : "Create account"} <Icon name="arrow" size={16} /></button></form><div className="auth-links"><span>Already have an account?</span><Link href="/sign-in">Sign in</Link></div><Link className="demo-account" href="/demo"><Icon name="sparkle" size={13} /> Want a preview first? Try the demo.</Link></section></main>;
}
