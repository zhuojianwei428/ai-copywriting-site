"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * 兼容页：早期版本把邮箱重置链接的回跳落在这里。
 * 现在所有认证流程（登录/注册/验证码/重置密码/Google 回调）都由 Clerk 处理，
 * 本页只负责把老链接或直接访问的用户送回首页。
 */
export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <main className="min-h-screen bg-surface-canvas flex items-center justify-center px-4">
      <div className="bg-surface-card border border-border-subtle rounded-xl shadow-modal w-full max-w-md p-lg">
        <h1 className="font-title-md text-title-md text-text-primary mb-xs">
          AI Review Writer
        </h1>
        <p className="font-body-sm text-body-sm text-text-muted">
          Sign-in is handled in the generator. Taking you back…
        </p>
      </div>
    </main>
  );
}
