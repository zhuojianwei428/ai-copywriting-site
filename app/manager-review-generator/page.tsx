import type { Metadata } from "next";
import Landing from "../../components/Landing";
import { AuthProvider } from "../../components/auth/AuthContext";
import { webApplicationLd } from "../../lib/jsonld";

const PATH = "/manager-review-generator";
const PAGE_URL = `https://www.aiwritereview.com${PATH}`;
const TITLE = "Manager Review Generator — Free AI Evaluation Writer";
const DESCRIPTION =
  "Draft a structured manager evaluation — outcomes, competencies, and forward-looking development goals. Evidence-based, editable, free to use.";

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
  eyebrow: "AI Review Writer · Manager Review Format",
  h1: "Manager Review Generator",
  subtitle:
    "Draft a structured manager evaluation — outcomes, competencies, and forward-looking development goals.",
  tagline:
    "Manager reviews carry weight, so this format pushes every statement toward observable evidence and keeps ratings tied to the rubric you describe. Developmental comments stay constructive and forward-looking rather than punitive, and the draft is yours to edit before it goes anywhere. Free — 5 drafts a day, no signup.",
};

export default function ManagerReviewGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webApplicationLd({
              name: "Manager Review Generator",
              url: PAGE_URL,
              description: DESCRIPTION,
            })
          ),
        }}
      />
      <AuthProvider>
        <Landing defaultFormat="manager" content={CONTENT} />
      </AuthProvider>
    </>
  );
}
