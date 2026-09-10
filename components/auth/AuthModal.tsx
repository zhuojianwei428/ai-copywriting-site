"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "../../lib/supabase/client";
import { useAuth } from "./AuthContext";

type Mode = "signin" | "signup" | "reset" | "verify";

/**
 * 登录/注册弹窗：
 * - Google 一键登录（需在 Supabase Auth → Providers 启用 Google）
 * - 邮箱 + 密码 注册/登录；注册后需填入邮件里的 6 位验证码完成确认
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
  const [otp, setOtp] = useState("");
  const [resendIn, setResendIn] = useState(0);
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

  // 重发验证码的 60 秒冷却倒计时
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // 关闭时清掉验证码与倒计时，下次打开是干净的
  useEffect(() => {
    if (!open) {
      setMode("signin");
      setOtp("");
      setResendIn(0);
      setError("");
      setNotice("");
      setPassword("");
    }
  }, [open]);

  if (!open) return null;

  async function handleGoogle() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const supabase = createClient();
      const redirectTo = window.location.origin + "/auth";
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

  /** 重发注册验证码 */
  async function handleResend() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const supabase = createClient();
      const { error: e } = await supabase.auth.resend({ type: "signup", email });
      if (e) {
        setError(e.message);
      } else {
        setNotice(`A new code was sent to ${email}.`);
        setResendIn(60);
      }
    } catch {
      setError("Couldn't resend the code. Please try again.");
    } finally {
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
      const redirectTo = window.location.origin + "/auth";

      if (mode === "verify") {
        const token = otp.replace(/\D/g, "");
        if (token.length < 6) {
          setError("Enter the 6-digit code from your email.");
          return;
        }
        const { error: e } = await supabase.auth.verifyOtp({
          email,
          token,
          type: "signup",
        });
        if (e) setError(e.message);
        // 成功即建立会话 → AuthContext 会关闭弹窗并继续原动作
      } else if (mode === "signup") {
        const { data, error: e } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo },
        });
        if (e) {
          setError(e.message);
        } else if (data.session) {
          // 邮箱确认被关闭时，注册即登录
          setNotice("Account created. You're signed in.");
        } else {
          // 需要邮箱确认 → 进入验证码步骤
          setMode("verify");
          setOtp("");
          setResendIn(60);
          setNotice(`We emailed a 6-digit code to ${email}.`);
        }
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
        if (e) {
          // 账号还没验证过 → 直接引导到验证码步骤
          if (
            e.code === "email_not_confirmed" ||
            /not confirmed/i.test(e.message)
          ) {
            setMode("verify");
            setOtp("");
            setPassword("");
            setResendIn(60);
            setNotice(
              `Your email isn't confirmed yet. We sent a fresh 6-digit code to ${email}.`
            );
            try {
              await supabase.auth.resend({ type: "signup", email });
            } catch {
              // 重发失败不阻塞：用户可用界面上的重发按钮
            }
          } else {
            setError(e.message);
          }
        }
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
                {user
                  ? "Signed in"
                  : mode === "verify"
                  ? "Confirm your email"
                  : mode === "signup"
                  ? "Create your account"
                  : mode === "reset"
                  ? "Reset your password"
                  : "Continue to your full review"}
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
                {mode === "verify" ? (
                  <>
                    <p className="font-body-sm text-body-sm text-text-muted">
                      Enter the 6-digit code we sent to{" "}
                      <span className="font-medium text-text-primary">
                        {email}
                      </span>
                      . It may take a minute to arrive — check your spam folder
                      too.
                    </p>
                    <label className="block">
                      <span className="font-title-md text-title-md text-text-primary mb-xs block">
                        Verification code
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        required
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        placeholder="123456"
                        className={`${inputCls} tracking-[0.4em] text-center`}
                        style={{ fontSize: 18, fontVariantNumeric: "tabular-nums" }}
                      />
                    </label>
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        disabled={busy || resendIn > 0}
                        onClick={handleResend}
                        className="font-label-sm text-label-sm text-primary-container hover:text-primary disabled:text-text-muted disabled:cursor-default"
                      >
                        {resendIn > 0
                          ? `Resend code in ${resendIn}s`
                          : "Resend code"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMode("signup");
                          setOtp("");
                          setError("");
                          setNotice("");
                        }}
                        className="font-label-sm text-label-sm text-text-muted hover:text-text-primary"
                      >
                        ← Use a different email
                      </button>
                    </div>
                  </>
                ) : mode === "reset" ? (
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
                    : mode === "verify"
                    ? "Confirm & sign in"
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
                {mode === "verify" && (
                  <button
                    type="button"
                    onClick={() => { setMode("signin"); setOtp(""); setError(""); setNotice(""); }}
                    className="text-left text-primary-container hover:text-primary"
                  >
                    Already confirmed? Sign in
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
