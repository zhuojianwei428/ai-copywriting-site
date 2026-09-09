import type { Metadata } from "next";
import "./globals.css";
import { webApplicationLd, faqLd } from "../lib/jsonld";

export const metadata: Metadata = {
  title: "AI Performance Review Generator — Free & Instant",
  description:
    "Generate a clear, structured performance review in seconds. Built for managers and HR. Free, no signup required.",
  robots: { index: true, follow: true },
  metadataBase: new URL("https://aiwritereview.com"),
  openGraph: {
    title: "AI Performance Review Generator — Free & Instant",
    description:
      "Generate a clear, structured performance review in seconds. Built for managers and HR. Free, no signup required.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
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
}
