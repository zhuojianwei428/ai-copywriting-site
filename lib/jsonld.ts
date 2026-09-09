export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "What is an AI performance review generator?",
    a: "It's a tool that turns a few inputs—review type, role, strengths, and growth areas—into a structured, professional performance review. Instead of staring at a blank page, you get a ready-to-edit draft in seconds.",
  },
  {
    q: "Is the generated review ready to send as-is?",
    a: "It's a strong starting point written in clear, professional English. We recommend a quick read to add any company-specific metrics or context before sharing it with the employee.",
  },
  {
    q: "Can I edit the result before using it?",
    a: "Yes. After generation you can edit the text directly in the tool, then copy, regenerate, or export it to PDF or Word.",
  },
  {
    q: "Is it really free?",
    a: "Yes. Every feature—generation, editing, regeneration, PDF export, and Word export—is free and requires no signup.",
  },
  {
    q: "Does it work for self reviews?",
    a: "Absolutely. Choose the Self Review type and the tool shapes the tone and structure for writing about your own performance.",
  },
];

export function webApplicationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "AI Performance Review Generator",
    url: "https://aiwritereview.com/",
    description:
      "Generate a clear, structured performance review in seconds. Built for managers and HR. Free, no signup required.",
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
