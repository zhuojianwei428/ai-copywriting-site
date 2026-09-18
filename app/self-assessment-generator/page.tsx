import type { Metadata } from "next";
import Landing from "../../components/Landing";
import { AuthProvider } from "../../components/auth/AuthContext";
import { webApplicationLd } from "../../lib/jsonld";

const PATH = "/self-assessment-generator";
const PAGE_URL = `https://www.aiwritereview.com${PATH}`;
const TITLE = "Self Assessment Generator — Free AI Employee Self-Assessment";
const DESCRIPTION =
  "Turn rough notes into a scored employee self-assessment — weighted KRAs, 1–5 ratings, and a letter grade with a written summary. Free to use, no signup required.";

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
  eyebrow: "AI Review Writer · Employee Self-Assessment",
  h1: "Self Assessment Generator",
  subtitle:
    "Turn rough notes into a scored employee self-assessment — weighted KRAs, 1–5 ratings, and a letter grade with a written summary.",
  tagline:
    "A work self-assessment is not a personality quiz — it is a claim about your impact, and your manager has to be able to verify it. Here you score only what you can evidence: define your KRAs, rate each one 1–5, and get a weighted grade plus a written summary you can defend. Free — 5 drafts a day, no signup.",
};

export default function SelfAssessmentGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webApplicationLd({
              name: "Self Assessment Generator",
              url: PAGE_URL,
              description: DESCRIPTION,
            })
          ),
        }}
      />
      <AuthProvider>
        {/* defaultMode="scored"：首屏直接落在 KRA 评分卡上，与 /self-review-generator
            的叙述式自评形成真实的功能差异，而不是同一页换个 H1。 */}
        <Landing defaultFormat="self" defaultMode="scored" content={CONTENT} />
      </AuthProvider>
    </>
  );
}
