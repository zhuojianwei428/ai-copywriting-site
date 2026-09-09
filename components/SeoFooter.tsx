"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAQ_ITEMS } from "../lib/jsonld";

export default function SeoFooter() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="section-v">
      <div className="container" style={{ color: "var(--ink)" }}>
        <h2>How to write a performance review that actually helps</h2>
        <h3>Start with real, specific contributions</h3>
        <p>
          A good performance review is specific, balanced, and forward-looking.
          Start by naming the employee&apos;s real contributions with concrete
          examples, then point to one or two growth areas framed as development
          rather than criticism.
        </p>
        <h3>Let the generator remove the friction</h3>
        <p>
          An AI performance review generator helps managers and HR move from a
          blank page to a structured draft in seconds: pick the review type, add
          the strengths that actually happened, choose a tone, and get a clear
          write-up you can edit before sharing. The goal is not to replace your
          judgment but to remove the writing friction so the feedback gets
          delivered on time.
        </p>

        <h2>Who this tool is for</h2>
        <h3>Built for the reviewer, not the reviewed</h3>
        <p>
          This tool is built for the person writing the review—managers, team
          leads, and HR partners—not the employee being reviewed.
        </p>
        <h3>Every review type in one place</h3>
        <p>
          Use it for self assessments, manager reviews of direct reports, peer
          feedback, and 360 feedback cycles.
        </p>
        <h3>Consistent across your whole team</h3>
        <p>
          Whether you manage one person or fifty, a performance review generator
          keeps the structure consistent across your team and saves the hours
          usually lost to wording. It works for any role because you supply the
          context; the AI handles the professional phrasing.
        </p>

        <h2>Frequently asked questions</h2>
        <div>
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div className="faq-item" key={item.q}>
                <button
                  className="faq-q"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    size={20}
                    className={`faq-arrow ${isOpen ? "open" : ""}`}
                  />
                </button>
                <div className={`faq-a ${isOpen ? "open" : ""}`}>
                  <p style={{ margin: 0 }}>{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
