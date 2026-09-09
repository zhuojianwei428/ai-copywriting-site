"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "../../lib/supabase/client";

/**
 * 认证落地页，负责两类回跳：
 * 1. 邮箱密码重置邮件里的链接（带 ?code= 或 hash#access_token）
 *    → 这里换取会话并显示「设置新密码」表单。
 * 2. Google / 邮箱验证后的回跳
 *    → 显示成功提示，再自动回首页。
 */
export default function AuthPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [phase, setPhase] = useState<"checking" | "reset" | "done">("checking");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      setPhase("done");
      return;
    }
    const code = new URLSearchParams(window.location.search).get("code");
    const hash = window.location.hash;

    async function handle() {
      // 密码重置：优先用 code query
      if (code) {
        try {
          const { error: e } = await supabase.auth.exchangeCodeForSession(code);
          if (e) throw e;
          window.history.replaceState({}, "", window.location.pathname);
          setPhase("reset");
          return;
        } catch (err: any) {
          setError(err?.message || "Invalid or expired reset link.");
          setPhase("done");
          return;
        }
      }
      // Google/验证回跳：已有 session 则成功回首页
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);
      if (hash) {
        setMessage("Sign-in successful. Redirecting…");
        setPhase("done");
        setTimeout(() => router.replace("/"), 1200);
        return;
      }
      setPhase("done");
    }
    handle();
  }, [router]);

  // 密码重置成功后，用户 session 已建立
  async function submitNewPassword(e: FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: e } = await supabase.auth.updateUser({ password });
      if (e) throw e;
      setMessage("Password updated. Redirecting…");
      setPhase("done");
      setTimeout(() => router.replace("/"), 1200);
    } catch (err: any) {
      setError(err?.message || "Could not update password.");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full px-3.5 py-2.5 border border-border-strong rounded text-text-primary bg-surface-card focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container";

  return (
    <main className="min-h-screen bg-surface-canvas flex items-center justify-center px-4">
      <div className="bg-surface-card border border-border-subtle rounded-xl shadow-modal w-full max-w-md p-lg">
        {phase === "checking" && (
          <div>
            <h1 className="font-title-md text-title-md text-text-primary mb-sm">
              AI Review Writer
            </h1>
            <p className="font-body-sm text-body-sm text-text-muted">
              Checking your session…
            </p>
          </div>
        )}

        {phase === "reset" && (
          <form onSubmit={submitNewPassword} className="space-y-sm">
            <h1 className="font-title-md text-title-md text-text-primary">
              Set a new password
            </h1>
            <label className="block">
              <span className="font-title-md text-title-md text-text-primary mb-xs block">
                New password
              </span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className={inputCls}
                style={{ fontSize: 14 }}
              />
            </label>
            {error && (
              <p className="text-body-sm" style={{ color: "var(--danger, #dc2626)" }}>
                {error}
              </p>
            )}
            {message && (
              <p className="text-body-sm" style={{ color: "var(--primary, #4f46e5)" }}>
                {message}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center px-5 py-2.5 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary transition-colors disabled:opacity-60"
            >
              {busy ? "Saving…" : "Update password"}
            </button>
          </form>
        )}

        {phase === "done" && user && !message && (
          <div>
            <h1 className="font-title-md text-title-md text-text-primary mb-xs">
              You&apos;re signed in
            </h1>
            <p className="font-body-sm text-body-sm text-text-muted mb-md">
              {user.email}
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary transition-colors"
            >
              Go to generator
            </Link>
          </div>
        )}

        {phase === "done" && !user && !message && (
          <div>
            <h1 className="font-title-md text-title-md text-text-primary mb-xs">
              Authentication link
            </h1>
            <p className="font-body-sm text-body-sm text-text-muted mb-md">
              This link wasn&apos;t recognized, or your session already ended.
              Try signing in from the generator.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary transition-colors"
            >
              Back to home
            </Link>
          </div>
        )}

        {message && (
          <p className="text-body-md text-text-primary" style={{ color: "var(--primary, #4f46e5)" }}>
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
