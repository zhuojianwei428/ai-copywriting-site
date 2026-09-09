import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — AI Write Review",
  robots: { index: true, follow: true },
};

export default function Privacy() {
  return (
    <main className="min-h-screen bg-surface-canvas">
      <div className="max-w-container mx-auto px-gutter-mobile lg:px-gutter-desktop py-3xl">
        <article className="bg-surface-card border border-border-subtle rounded-xl shadow-sm p-lg lg:p-2xl max-w-3xl mx-auto">
          <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight mb-lg">
            Privacy Policy
          </h1>

          <p className="font-body-md text-body-md text-text-muted leading-relaxed mb-md">
            AI Write Review is a free tool that generates performance-review
            drafts. No account is required to use it.
          </p>

          <h2 className="font-headline-sm text-headline-sm text-text-primary tracking-tight mt-xl mb-sm">
            What we collect
          </h2>
          <p className="font-body-md text-body-md text-text-muted leading-relaxed mb-md">
            We do not create user accounts, and we do not store the review text
            you enter or the drafts we generate. When you click Generate, your
            text is sent to our AI provider (DeepSeek) via API to generate your
            review, and the result is streamed straight back to your browser. We
            do not save those inputs or the generated output on our servers. To
            keep the service running and to spot abuse, we log operational
            metadata only — a timestamp, a masked IP address, the number of
            characters you submitted, and the number of tokens the request
            consumed. We never log the text of your review.
          </p>

          <h2 className="font-headline-sm text-headline-sm text-text-primary tracking-tight mt-xl mb-sm">
            Abuse prevention
          </h2>
          <p className="font-body-md text-body-md text-text-muted leading-relaxed mb-md">
            To prevent abuse, we keep a short-lived, in-memory counter of
            requests per IP address. This counter is not linked to your review
            content and is used for no other purpose.
          </p>

          <h2 className="font-headline-sm text-headline-sm text-text-primary tracking-tight mt-xl mb-sm">
            How DeepSeek is used
          </h2>
          <p className="font-body-md text-body-md text-text-muted leading-relaxed mb-md">
            Generation is performed by DeepSeek. Your inputs are transmitted to
            DeepSeek for processing under{" "}
            <a
              href="https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-container hover:text-primary underline underline-offset-2"
            >
              DeepSeek&apos;s Privacy Policy
            </a>
            . We don&apos;t control how DeepSeek retains or uses the data it
            receives, and we don&apos;t make any claim on DeepSeek&apos;s behalf
            about whether that data is stored or used for model training. Please
            read DeepSeek&apos;s own policy before submitting anything you
            consider confidential.
          </p>

          <h2 className="font-headline-sm text-headline-sm text-text-primary tracking-tight mt-xl mb-sm">
            What we don&apos;t do
          </h2>
          <p className="font-body-md text-body-md text-text-muted leading-relaxed mb-md">
            We don&apos;t sell your data. We don&apos;t store your reviews on our
            servers — the review text you enter and the drafts we generate are
            never written to a database or a file. This site does not set
            advertising or cross-site tracking cookies.
          </p>

          <h2 className="font-headline-sm text-headline-sm text-text-primary tracking-tight mt-xl mb-sm">
            Contact
          </h2>
          <p className="font-body-md text-body-md text-text-muted leading-relaxed mb-lg">
            Questions about this policy? Email us at{" "}
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
