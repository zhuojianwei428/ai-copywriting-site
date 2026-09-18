import type { Metadata } from "next";
import Landing from "../../components/Landing";
import { AuthProvider } from "../../components/auth/AuthContext";
import { webApplicationLd } from "../../lib/jsonld";

const PATH = "/360-feedback-generator";
const PAGE_URL = `https://www.aiwritereview.com${PATH}`;
const TITLE = "360 Feedback Generator — Free AI Multi-Rater Writer";
const DESCRIPTION =
  "Synthesize self, manager, and peer input into one balanced 360-degree review — including where the perspectives disagree. Free, no signup.";

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
  eyebrow: "AI Review Writer · 360-Degree Format",
  h1: "360 Feedback Generator",
  subtitle:
    "Synthesize self, manager, and peer input into one balanced 360-degree review — including where the perspectives disagree.",
  tagline:
    "Multi-rater reviews break down when you have to reconcile contradictory input. Paste the different perspectives and this format surfaces agreement and tension as a situational trade-off, instead of flattening everything into a single verdict you cannot defend. Free — 5 drafts a day, no signup.",
};

export default function ThreeSixtyFeedbackGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webApplicationLd({
              name: "360 Feedback Generator",
              url: PAGE_URL,
              description: DESCRIPTION,
            })
          ),
        }}
      />
      <AuthProvider>
        <Landing defaultFormat="360" content={CONTENT} />
      </AuthProvider>
    </>
  );
}
