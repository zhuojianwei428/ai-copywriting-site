import type { Metadata } from "next";
import Landing from "../../components/Landing";
import { AuthProvider } from "../../components/auth/AuthContext";
import { webApplicationLd } from "../../lib/jsonld";

const PATH = "/self-review-generator";
const PAGE_URL = `https://www.aiwritereview.com${PATH}`;
const TITLE = "Self Review Generator — Free AI Self-Assessment Writer";
const DESCRIPTION =
  "Turn rough notes into a balanced self-assessment — achievements, growth areas, and measurable impact — in minutes. Free to use, no signup required.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    type: "website",
  },
};

const CONTENT = {
  eyebrow: "AI Review Writer · Self Review Format",
  h1: "Self Review Generator",
  subtitle:
    "Turn rough notes into a balanced self-assessment — achievements, growth areas, and measurable impact — in minutes.",
  tagline:
    "Self-reviews fail in two opposite ways: over-claiming, or underselling your own work. This format keeps every claim tied to the evidence you paste in, separates results from effort, and writes the growth section without turning it into an apology. Free — 5 drafts a day, no signup.",
};

export default function SelfReviewGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webApplicationLd({
              name: "Self Review Generator",
              url: PAGE_URL,
              description: DESCRIPTION,
            })
          ),
        }}
      />
      <AuthProvider>
        <Landing defaultFormat="self" content={CONTENT} />
      </AuthProvider>
    </>
  );
}
