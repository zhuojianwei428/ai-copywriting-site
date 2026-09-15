import type { Metadata } from "next";

/**
 * /auth 是给早期邮箱重置回跳用的兼容页，客户端立即跳回首页，本身没有内容。
 * 给整个 /auth 段打上 noindex，避免这种空壳页被 Google 收录成薄页面。
 * （page.tsx 是 "use client"，无法直接导出 metadata，所以放在这里。）
 */
export const metadata: Metadata = {
  title: "Redirecting — AI Review Writer",
  robots: { index: false, follow: true },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
