"use client";

import { useEffect } from "react";
import { SignIn } from "@clerk/nextjs";

/**
 * 登录/注册弹窗，内部直接挂 Clerk 的 <SignIn /> 组件。
 *
 * Clerk 负责全部流程：Google 一键登录、邮箱+密码、邮箱验证码（OTP）、
 * 忘记密码、注册后的邮箱确认。我们只提供站点的弹窗外壳，保证视觉与站内一致。
 *
 * - routing="hash"：让 Clerk 在弹窗内切换"登录/注册/验证码/重置密码"步骤，
 *   而不是跳转到独立页面。
 * - 登录成功后由 AuthContext 监听 isSignedIn，自动关闭弹窗并续上被拦下的动作。
 */
export default function AuthModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
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

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(11,14,40,0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-surface-card border border-border-subtle rounded-xl shadow-modal w-full max-w-md my-8 px-lg py-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-md">
          <div>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-text-muted">
              AI Review Writer
            </span>
            <h2 className="font-title-md text-title-md text-text-primary mt-xs">
              Continue to your full review
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

        <SignIn
          routing="hash"
          appearance={{
            variables: {
              colorPrimary: "#4F46E5",
              colorText: "#0B0E28",
              colorTextSecondary: "#64748B",
              colorBackground: "#FFFFFF",
              colorInputBackground: "#FFFFFF",
              colorInputText: "#0B0E28",
              colorDanger: "#dc2626",
              fontFamily:
                "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
              borderRadius: "0.5rem",
            },
            elements: {
              rootBox: "w-full",
              cardBox: "w-full shadow-none border-0",
              card: "shadow-none border-0 p-0 bg-transparent",
              // 弹窗自带标题，隐藏 Clerk 的默认标题避免重复
              header: "hidden",
              footer: "bg-transparent",
              formButtonPrimary: "normal-case shadow-none",
              socialButtonsBlockButton: "border border-border-strong shadow-none",
              formFieldInput: "border border-border-strong shadow-none",
            },
          }}
        />
      </div>
    </div>
  );
}
