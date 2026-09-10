/**
 * ads.txt —— AdSense 站群审核第一步（哥飞《Adsense 提交网站申请的小细节》）：
 * "先添加 ads.txt，添加之后，确保浏览器里使用 域名/ads.txt 可以打开文件，看到里边的一行文字"。
 *
 * 注意：文件名必须全小写 ads.txt（不是 Ads.txt），且必须在根域可直接访问。
 *
 * 内容由服务端 env `ADSENSE_PUBLISHER_ID` 动态生成 —— 拿到 publisher ID 后在 Vercel
 * 填环境变量即可生效，**不需要改代码、不需要重新构建**（Route Handler 每次请求都读 env）。
 * 未配置时返回带注释的占位文件，便于提前验证路由可访问。
 */
export const dynamic = "force-dynamic";

export function GET() {
  const pub = (process.env.ADSENSE_PUBLISHER_ID || "").trim();
  const body = pub
    ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`
    : [
        "# ads.txt placeholder",
        "# Set the ADSENSE_PUBLISHER_ID environment variable (e.g. pub-1234567890123456)",
        "# in Vercel -> Project -> Settings -> Environment Variables.",
        "# This file is generated on every request, so no redeploy is needed.",
        "",
      ].join("\n");

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
