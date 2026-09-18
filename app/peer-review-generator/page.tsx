import type { Metadata } from "next";
import Landing from "../../components/Landing";
import { AuthProvider } from "../../components/auth/AuthContext";
import { webApplicationLd } from "../../lib/jsonld";

const PATH = "/peer-review-generator";
const PAGE_URL = `https://www.aiwritereview.com${PATH}`;
const TITLE = "Peer Review Generator — Free AI Peer Feedback Writer";
const DESCRIPTION =
  "Write peer feedback on collaboration, execution, and cross-team contribution — specific, constructive, and safe to share. Free, no signup.";

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
  eyebrow: "AI Review Writer · Peer Review Format",
  h1: "Peer Review Generator",
  subtitle:
    "Write peer feedback on collaboration, execution, and cross-team contribution — specific, constructive, and safe to share.",
  tagline:
    "Peer feedback is the hardest kind to write honestly: too soft and it helps nobody, too blunt and it costs you the working relationship. This format keeps the draft anchored to observable work, separates collaboration signals from output, and reads like something you could sign your name to. Free — 5 drafts a day, no signup.",
};

export default function PeerReviewGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webApplicationLd({
              name: "Peer Review Generator",
              url: PAGE_URL,
              description: DESCRIPTION,
            })
          ),
        }}
      />
      <AuthProvider>
        <Landing defaultFormat="peer" content={CONTENT} />
      </AuthProvider>
    </>
  );
}
