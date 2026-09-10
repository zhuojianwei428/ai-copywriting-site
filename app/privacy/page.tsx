import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — AI Review Writer",
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
            AI Review Writer is a free tool that generates performance-review
            drafts. No account is required to generate a draft. Signing in is
            optional and is handled by a third-party authentication provider
            (Clerk); when you sign in we receive your email address and a user
            identifier, which we use only to show you the drafts you have saved.
          </p>

          <h2 className="font-headline-sm text-headline-sm text-text-primary tracking-tight mt-xl mb-sm">
            What we collect
          </h2>
          <p className="font-body-md text-body-md text-text-muted leading-relaxed mb-md">
            We do not store the review text you enter, or the drafts we
            generate, on our servers. When you click Generate, your text is sent
            to our AI provider (DeepSeek) via API to generate your review, and
            the result is streamed straight back to your browser. We do not save
            those inputs or the generated output on our servers. To keep the
            service running and to spot abuse, we log operational metadata only
            — a timestamp, a masked IP address, the number of characters you
            submitted, and the number of tokens the request consumed. We never
            log the text of your review.
          </p>

          <h2 className="font-headline-sm text-headline-sm text-text-primary tracking-tight mt-xl mb-sm">
            Drafts you save
          </h2>
          <p className="font-body-md text-body-md text-text-muted leading-relaxed mb-md">
            When you generate a draft, it is saved in your own browser&apos;s
            local storage on your device, keyed to your account if you are
            signed in. Those saved drafts never leave your device and are not
            sent to us. Clearing your browser data, or using a different browser
            or device, removes or hides them.
          </p>

          <h2 className="font-headline-sm text-headline-sm text-text-primary tracking-tight mt-xl mb-sm">
            Abuse prevention
          </h2>
          <p className="font-body-md text-body-md text-text-muted leading-relaxed mb-md">
            To prevent abuse, we keep a short-lived, in-memory counter of
            requests per IP address, and a daily counter of how many drafts have
            been generated across the site. Neither counter is linked to your
            review content and neither is used for any other purpose. We also
            set one first-party cookie, <code>air_quota</code>, which holds
            nothing but today&apos;s date and a count of how many drafts you
            have generated in the last 24 hours, so that the free daily
            allowance can work. It is HTTP-only, same-site, expires after two
            days, contains no personal information, and is never used for
            advertising or cross-site tracking.
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
          {/* TODO: 目前未配置 NEXT_PUBLIC_ADSENSE_CLIENT，故"不设广告 cookie"成立。
              一旦在 Vercel 填入 AdSense publisher ID（见 app/layout.tsx 的 AdSenseScript、
              app/ads.txt/route.ts），AdSense 会写入广告 cookie —— 届时不只本句失效，
              还必须补上广告 cookie 披露与同意机制（GDPR/EEA 需 CMP），上线前务必处理。 */}
          <p className="font-body-md text-body-md text-text-muted leading-relaxed mb-md">
            We don&apos;t sell your data. We don&apos;t store your reviews on our
            servers — the review text you enter and the drafts we generate are
            never written to a database or a file. This site does not currently
            set advertising or cross-site tracking cookies; if we introduce
            advertising in the future, this policy will be updated and any
            required consent will be collected before those cookies are used.
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
