export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "How does AI Review Writer help reduce bias-prone language in reviews?",
    a: "The engine is prompted to be specific rather than generic, to use only the details you provide, and to keep developmental comments constructive and forward-looking rather than punitive. It does not run an automated bias check — AI output can still reflect bias, so always review the draft before use and treat it as a starting point rather than a final evaluation.",
  },
  {
    q: "Can I customize the review tone to match my team's needs?",
    a: "Yes. You can set the tone to Formal (neutral and professional), Encouraging (warm and supportive), or Direct (blunt and to the point), and describe the role, tenure, and context in Steps 2\u20133 to shape the output. Narrative drafts rate competencies on a 1\u20135 scale; the scorecard mode adds weighted KRAs and an A\u2013D grade. Custom rubric import is not available yet.",
  },
  {
    q: "Is confidential company performance data kept private and secure?",
    a: "Your text is sent to our AI provider (DeepSeek) via API to generate your review, and the result is streamed straight back to your browser. We don't store your review text on our servers, and we don't sell your data. What DeepSeek does with the data it receives is governed by DeepSeek's own privacy policy and terms, which we don't control — please review them before submitting anything you consider confidential.",
  },
  {
    q: "Does this work for both tech roles and non-technical business functions?",
    a: "Yes. The engine is role-agnostic — you provide the role, level, and context in Step 2, and it adapts the language to that function. It works for technical roles (engineering, product, design) as well as non-technical functions (sales, marketing, HR, finance, operations). For the strongest output, describe the person's actual deliverables when you paste your notes in Step 3.",
  },
  {
    q: "Can I edit the review draft before exporting it?",
    a: "Yes. Every draft opens on its own page where you can rewrite any sentence directly in the browser, then export the result as Word or PDF. You can also regenerate a complete draft as many times as you like, adjusting format, role, tone, and inputs between runs. Fine-grained, section-by-section regeneration is on our roadmap.",
  },
  {
    q: "How does the 360° feedback synthesis handle conflicting peer feedback?",
    a: "When you paste divergent peer input (e.g., praise for rapid execution alongside concern over documentation pace), you can ask the engine to surface both perspectives as a situational trade-off rather than flatten them into a single judgment. Review the synthesis carefully — conflicting feedback often signals a real tension worth discussing with the employee directly.",
  },
];

export function webApplicationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "AI Performance Review Generator",
    url: "https://aiwritereview.com/",
    description:
      "Generate balanced, evidence-based performance reviews in self, manager, peer & 360° formats — then edit the draft in your browser and export as Word or PDF. Free to use.",
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
