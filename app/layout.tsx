import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { webApplicationLd, faqLd } from "../lib/jsonld";

export const metadata: Metadata = {
  title: "AI Review Writer — AI Performance Review Generator",
  description:
    "Generate objective, balanced performance reviews across self, manager, peer, and 360° formats in minutes. Calibrated to your rubric, role level, and documented impact.",
  robots: { index: true, follow: true },
  metadataBase: new URL("https://aiwritereview.com"),
  openGraph: {
    title: "AI Review Writer — AI Performance Review Generator",
    description:
      "Generate objective, balanced performance reviews across self, manager, peer, and 360° formats in minutes. Calibrated to your rubric, role level, and documented impact.",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd()) }}
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
