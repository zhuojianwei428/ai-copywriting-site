import Link from "next/link";

export const metadata = {
  title: "Terms of Service — AI Review Writer",
  robots: { index: true, follow: true },
};

export default function Terms() {
  return (
    <main className="min-h-screen bg-surface-canvas">
      <div className="max-w-container mx-auto px-gutter-mobile lg:px-gutter-desktop py-3xl">
        <article className="bg-surface-card border border-border-subtle rounded-xl shadow-sm p-lg lg:p-2xl max-w-3xl mx-auto">
          <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight mb-lg">
            Terms of Service
          </h1>

          <p className="font-body-md text-body-md text-text-muted leading-relaxed mb-md">
            AI Review Writer generates performance-review drafts to assist your own
            professional judgment. The service is provided free of charge and does
            not require you to create an account. A free daily usage allowance
            applies, and signing in raises that allowance.
          </p>

          <h2 className="font-headline-sm text-headline-sm text-text-primary tracking-tight mt-xl mb-sm">
            Your responsibility
          </h2>
          <p className="font-body-md text-body-md text-text-muted leading-relaxed mb-md">
            The generated reviews are drafts. You are responsible for reviewing
            and editing any output before sharing it with an employee or using it
            in an employment decision. Do not rely on generated text as a
            substitute for your own assessment.
          </p>

          <h2 className="font-headline-sm text-headline-sm text-text-primary tracking-tight mt-xl mb-sm">
            How your input is processed
          </h2>
          <p className="font-body-md text-body-md text-text-muted leading-relaxed mb-md">
            Your text is sent to our AI provider (DeepSeek) via API to generate
            your review, as described in our{" "}
            <Link
              href="/privacy"
              className="text-primary-container hover:text-primary underline underline-offset-2"
            >
              Privacy Policy
            </Link>
            . We do not store your review text on our servers. How DeepSeek
            handles the data it receives is governed by DeepSeek&apos;s own
            privacy policy and terms, which we do not control and make no
            representations about.
          </p>

          <h2 className="font-headline-sm text-headline-sm text-text-primary tracking-tight mt-xl mb-sm">
            Disclaimer
          </h2>
          <p className="font-body-md text-body-md text-text-muted leading-relaxed mb-md">
            The service is offered &quot;as is&quot; and free of charge. We are
            not liable for decisions made on the basis of generated content.
          </p>

          <h2 className="font-headline-sm text-headline-sm text-text-primary tracking-tight mt-xl mb-sm">
            Contact
          </h2>
          <p className="font-body-md text-body-md text-text-muted leading-relaxed mb-lg">
            Questions about these terms? Email us at{" "}
            <a
              href="mailto:support@aiwritereview.com"
              className="text-primary-container hover:text-primary underline underline-offset-2"
            >
              support@aiwritereview.com
            </a>
            .
          </p>

          <Link
            href="/"
            className="font-label-md text-label-md text-primary-container hover:text-primary transition-colors"
          >
            ← Back to the generator
          </Link>
        </article>
      </div>
    </main>
  );
}
