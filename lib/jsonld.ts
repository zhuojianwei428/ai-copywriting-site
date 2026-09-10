export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "How does the AI ensure objectivity and reduce bias in reviews?",
    a: "Our evaluation models run a dedicated bias verification pass on every generated draft. The system explicitly flags and converts subjective personality characterizations (e.g., \"too aggressive,\" \"passive,\" \"likable\") into verifiable, behavioral descriptions tied directly to project deliverables, observable work, and your rubric.",
  },
  {
    q: "Can I customize the review tone to match our company's rating rubric?",
    a: "Yes. You can select standard enterprise scales (e.g., 5-point Likert, Meets/Exceeds, or Radical Candor grids) or upload custom rubric parameters. You can calibrate tone from \"Supportive & Developmental\" to \"Direct & Rigorous\" depending on seniority and context.",
  },
  {
    q: "Is confidential company performance data kept private and secure?",
    a: "Your text is sent to our AI provider (DeepSeek) via API to generate your review, and the result is streamed straight back to your browser. We don't store your review text on our servers, and we don't sell your data. What DeepSeek does with the data it receives is governed by DeepSeek's own privacy policy and terms, which we don't control — please review them before submitting anything you consider confidential.",
  },
  {
    q: "Does this work for both tech roles and non-technical business functions?",
    a: "Absolutely. Pre-configured career tracks cover Software Engineering, Product Management, Product Design, Sales, Marketing, HR, Finance, and Customer Operations. Each track features dedicated competency models reflecting actual day-to-day deliverables.",
  },
  {
    q: "Can I edit and regenerate specific sections of the review draft?",
    a: "Yes. AI Review Writer provides granular sectional regeneration. If an executive summary is accurate but developmental goals require greater specificity, you can prompt the engine to rewrite solely that subsection without altering the rest of your document.",
  },
  {
    q: "How does the 360° feedback synthesis handle conflicting peer feedback?",
    a: "When divergent perspectives occur (e.g., praise for rapid execution from one peer vs. concern over documentation pace from another), the engine transparently surfaces this tension as a situational trade-off rather than an irreconcilable contradiction.",
  },
];

export function webApplicationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "AI Performance Review Generator",
    url: "https://aiwritereview.com/",
    description:
      "Generate objective, balanced performance reviews across self, manager, peer, and 360° formats in minutes. Free to use.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

export function faqLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}
