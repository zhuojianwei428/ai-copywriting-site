"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "../../lib/supabase/client";
import { useAuth } from "./AuthContext";

type Mode = "signin" | "signup" | "reset";

/**
 * 登录/注册弹窗：
 * - Google 一键登录（需在 Supabase Auth → Providers 启用 Google）
 * - 邮箱 + 密码 注册/登录
 * - 忘记密码 → 发送重置邮件
 * 会话由 @supabase/ssr 通过 cookie 自动维持。
 */
export default function AuthModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user, signOut } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // 锁定 body 滚动 + Esc 关闭
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  async function handleGoogle() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const supabase = createClient();
      const redirectTo =
        window.location.origin + window.location.pathname;
      const { error: e } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (e) setError(e.message);
      // 成功会整页跳转到 Google
    } catch {
      setError("Google sign-in is unavailable. Try email instead.");
      setBusy(false);
    }
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const supabase = createClient();
      const redirectTo =
        window.location.origin + window.location.pathname;

      if (mode === "signup") {
        const { error: e } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo },
        });
        if (e) setError(e.message);
        else
          setNotice(
            "Account created. Check your inbox to confirm your email, then sign in."
          );
      } else if (mode === "reset") {
        const { error: e } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo,
        });
        if (e) setError(e.message);
        else
          setNotice(
            "If that email exists, a password reset link has been sent. Check your inbox."
          );
      } else {
        const { error: e } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (e) setError(e.message);
        // 成功会触发 onAuthStateChange，登录弹窗由父级关闭
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full px-3.5 py-2.5 border border-border-strong rounded text-text-primary bg-surface-card focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(11,14,40,0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-surface-card border border-border-subtle rounded-xl shadow-modal w-full max-w-md my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-lg pt-lg pb-sm">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-text-muted">
                AI Review Writer
              </span>
              <h2 className="font-title-md text-title-md text-text-primary mt-xs">
                {user ? "Signed in" : "Continue to your full review"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg border border-border-subtle flex items-center justify-center text-text-muted hover:bg-surface-canvas transition-colors"
              aria-label="Close"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        <div className="px-lg pb-lg">
          {user ? (
            <div className="space-y-sm">
              <p className="font-body-md text-body-md text-text-primary">
                Signed in as{" "}
                <span className="font-medium">{user.email || "you"}</span>
              </p>
              <div className="flex flex-col gap-sm">
                <button
                  onClick={onClose}
                  className="inline-flex items-center justify-center gap-xs px-5 py-2.5 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary transition-colors"
                  type="button"
                >
                  Continue
                </button>
                <button
                  onClick={() => {
                    signOut();
                    onClose();
                  }}
                  className="inline-flex items-center justify-center px-4 py-2 border border-border-strong rounded text-text-primary bg-surface-card hover:bg-surface-canvas transition-colors"
                  type="button"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div>
              <button
                onClick={handleGoogle}
                disabled={busy}
                className="w-full inline-flex items-center justify-center gap-xs px-5 py-2.5 border border-border-strong rounded-lg text-text-primary bg-surface-card hover:bg-surface-canvas transition-colors disabled:opacity-60"
                type="button"
              >
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.4 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.4 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                  <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.3 5.3C41.4 36.3 44 30.8 44 24c0-1.3-.1-2.6-.4-3.9z"/>
                </svg>
                {busy ? "Redirecting…" : "Continue with Google"}
              </button>

              <div className="flex items-center gap-sm my-md">
                <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
                <span className="font-label-sm text-label-sm text-text-muted">or</span>
                <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
              </div>

              <form onSubmit={handleSubmit} className="space-y-sm">
                {mode === "reset" ? (
                  <label className="block">
                    <span className="font-title-md text-title-md text-text-primary mb-xs block">
                      Email
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={inputCls}
                      style={{ fontSize: 14 }}
                    />
                  </label>
                ) : (
                  <>
                    <label className="block">
                      <span className="font-title-md text-title-md text-text-primary mb-xs block">
                        Email
                      </span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={inputCls}
                        style={{ fontSize: 14 }}
                      />
                    </label>
                    <label className="block">
                      <span className="font-title-md text-title-md text-text-primary mb-xs block">
                        Password
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
                  </>
                )}

                {error && (
                  <p className="text-body-sm" style={{ color: "var(--danger, #dc2626)" }}>
                    {error}
                  </p>
                )}
                {notice && (
                  <p className="text-body-sm text-text-primary" style={{ color: "var(--primary, #4f46e5)" }}>
                    {notice}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full inline-flex items-center justify-center px-5 py-2.5 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary transition-colors disabled:opacity-60"
                >
                  {busy
                    ? "Please wait…"
                    : mode === "signup"
                    ? "Create account"
                    : mode === "reset"
                    ? "Send reset link"
                    : "Sign in"}
                </button>
              </form>

              <div className="mt-md flex flex-col gap-1 font-label-sm text-label-sm">
                {mode === "signin" && (
                  <>
                    <button
                      type="button"
                      onClick={() => { setMode("signup"); setError(""); setNotice(""); }}
                      className="text-left text-primary-container hover:text-primary"
                    >
                      Need an account? Sign up
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMode("reset"); setError(""); setNotice(""); }}
                      className="text-left text-text-muted hover:text-text-primary"
                    >
                      Forgot password?
                    </button>
                  </>
                )}
                {mode === "signup" && (
                  <button
                    type="button"
                    onClick={() => { setMode("signin"); setError(""); setNotice(""); }}
                    className="text-left text-primary-container hover:text-primary"
                  >
                    Already have an account? Sign in
                  </button>
                )}
                {mode === "reset" && (
                  <button
                    type="button"
                    onClick={() => { setMode("signin"); setError(""); setNotice(""); }}
                    className="text-left text-primary-container hover:text-primary"
                  >
                    Back to sign in
                  </button>
                )}
              </div>
            </div>
          )}

          <p className="mt-lg font-body-xs text-body-xs text-text-muted leading-relaxed">
            We only use your account to let you generate and view your full
            reviews. We don&apos;t store your review text.
          </p>
        </div>
      </div>
    </div>
  );
}
