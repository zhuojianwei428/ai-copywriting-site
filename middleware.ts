import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Clerk 会话中间件。
 *
 * 未配置 Clerk（缺 NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY）时退化为 no-op，
 * 全站保持公开，方便在没有 key 的环境（本地/预览）跑构建与开发。
 * 配好 key 后自动启用会话校验与刷新。
 */
const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

function noopMiddleware(_request: NextRequest) {
  return NextResponse.next();
}

export default clerkConfigured ? clerkMiddleware() : noopMiddleware;

// 静态资源不跑中间件，其余路径都走（体积小、开销可忽略）。
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|og.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
