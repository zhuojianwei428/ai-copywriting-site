import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Review Writer — AI Performance Review Generator",
  description:
    "Generate balanced, evidence-based performance reviews in self, manager, peer, skip-level & 360-degree formats — then edit the draft in your browser and export as PDF or Word.",
  robots: { index: true, follow: true },
  // 规范主机是 www（裸域 308 跳 www）。metadataBase 必须写 www，
  // 否则 og:image 等绝对地址会落在裸域上多绕一次 308，部分抓取器不跟随重定向会取不到图。
  metadataBase: new URL("https://www.aiwritereview.com"),
  openGraph: {
    title: "AI Review Writer — AI Performance Review Generator",
    description:
      "Generate balanced, evidence-based performance reviews in self, manager, peer, skip-level & 360-degree formats — then edit the draft in your browser and export as PDF or Word.",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "AI Review Writer — AI Performance Review Generator",
      },
    ],
  },
};

/**
 * Clerk 未配置时不挂 <ClerkProvider>，站点照常渲染（游客可浏览），
 * 此时登录墙不生效——见 components/auth/AuthContext.tsx 的降级分支。
 */
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

/**
 * AdSense 主脚本（预埋）。拿到 publisher ID 后填 env `NEXT_PUBLIC_ADSENSE_CLIENT`
 * 重新构建即可全站生效；未配置时不输出任何标签，对页面零影响。
 *
 * 为什么现在就挂：审核期间挂了代码的站点，谷歌能监测到访问量，有流量的站会优先审；
 * 且审核一通过就能立刻开自动广告，不浪费流量（哥飞《Adsense 提交网站申请的小细节》）。
 */
const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const page = (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
          rel="stylesheet"
        />
        {adsenseClient && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            crossOrigin="anonymous"
          />
        )}
        {/*
          结构化数据不在这里注入：首页与各格式变体落地页各自声明自己的
          WebApplication url/name（见 app/page.tsx 与 app/*-generator/page.tsx），
          避免所有页面都把自己标成首页那个 url。
        */}
        {/* Mesure d'audience : Microsoft Clarity + Google Analytics (gtag.js)。
            Placés en dur dans l'en-tête du layout racine : une seule source pour
            tout le site. Les identifiants sont publics par nature (visibles dans
            le source de la page), ce ne sont pas des secrets. */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "yppho023ix");`,
          }}
        />
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-P6FTL4MWDB"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-P6FTL4MWDB');`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );

  if (!clerkPublishableKey) return page;

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>{page}</ClerkProvider>
  );
}
