import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — AI Performance Review Generator",
  robots: { index: true, follow: true },
};

export default function PrivacyPolicy() {
  return (
    <main className="container" style={{ paddingTop: 48, paddingBottom: 60, maxWidth: 720 }}>
      <h1>Privacy Policy</h1>
      <p style={{ color: "var(--muted)", lineHeight: 1.8 }}>
        This tool runs entirely in your browser for the form state and calls our server only
        to generate text. We do not require an account, and we do not store the content you
        enter or the reviews we generate. Inputs sent to the AI provider are used solely to
        produce your result and are not used to train models without your action.
      </p>
      <p style={{ color: "var(--muted)", lineHeight: 1.8 }}>
        We may collect anonymous, aggregated usage data (such as request counts) to keep the
        service running. We do not sell personal information.
      </p>
      <p style={{ marginTop: 24 }}>
        <Link href="/" style={{ color: "var(--brand-600)", fontWeight: 600 }}>
          ← Back to the generator
        </Link>
      </p>
    </main>
  );
}
