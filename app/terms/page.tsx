import Link from "next/link";

export const metadata = {
  title: "Terms — AI Performance Review Generator",
  robots: { index: true, follow: true },
};

export default function Terms() {
  return (
    <main className="container" style={{ paddingTop: 48, paddingBottom: 60, maxWidth: 720 }}>
      <h1>Terms</h1>
      <p style={{ color: "var(--muted)", lineHeight: 1.8 }}>
        The generated performance reviews are provided as drafts to assist your own
        professional judgment. You are responsible for reviewing and editing any output
        before sharing it with an employee or using it in an employment decision.
      </p>
      <p style={{ color: "var(--muted)", lineHeight: 1.8 }}>
        The service is offered &quot;as is&quot; and free of charge. We are not liable for
        decisions made on the basis of generated content.
      </p>
      <p style={{ marginTop: 24 }}>
        <Link href="/" style={{ color: "var(--brand-600)", fontWeight: 600 }}>
          ← Back to the generator
        </Link>
      </p>
    </main>
  );
}
