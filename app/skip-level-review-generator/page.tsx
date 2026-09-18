import type { Metadata } from "next";
import Landing from "../../components/Landing";
import { AuthProvider } from "../../components/auth/AuthContext";
import { webApplicationLd } from "../../lib/jsonld";

const PATH = "/skip-level-review-generator";
const PAGE_URL = `https://www.aiwritereview.com${PATH}`;
const TITLE = "Skip Level Review Generator — Free AI Skip-Level Review Writer";
const DESCRIPTION =
  "Write a skip-level review from the vantage point you actually have: cross-team impact, reputation with partner teams, and readiness for broader scope. Free, no signup.";

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
  eyebrow: "AI Review Writer · Skip-Level Format",
  h1: "Skip Level Review Generator",
  subtitle:
    "Write a skip-level review from the vantage point you actually have — cross-team impact, reputation with partner teams, and readiness for broader scope.",
  tagline:
    "A skip-level review fails in two opposite ways: pretending you can see daily work you never see, or writing something so general it repeats what the direct manager already said. This format scores six areas a level above can genuinely observe, and keeps every comment tied to the observations you supply. Free — 5 drafts a day, no signup.",
};

export default function SkipLevelReviewGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webApplicationLd({
              name: "Skip Level Review Generator",
              url: PAGE_URL,
              description: DESCRIPTION,
            })
          ),
        }}
      />
      <AuthProvider>
        {/* defaultFormat="skip"：首屏直接预置 skip-level 视角的六个维度，
            该视角在 evalTable.ts 里限定为「只写隔级真的能观察到的行为」。 */}
        <Landing defaultFormat="skip" content={CONTENT} />
      </AuthProvider>
    </>
  );
}
