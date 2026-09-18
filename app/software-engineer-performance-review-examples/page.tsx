import type { Metadata } from "next";

const PATH = "/software-engineer-performance-review-examples";
const PAGE_URL = `https://www.aiwritereview.com${PATH}`;
const TITLE = "Performance Review Examples for Software Engineers";
const DESCRIPTION =
  "Concrete review wording for code quality, delivery, incidents, design and mentoring — plus how the same behaviour reads at junior, mid, senior and staff level.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    type: "article",
  },
};

const INTRO = [
  "Engineering reviews go wrong in a specific way: the work is real, but the wording is vague enough that it could describe anyone on the team. \u201cGood team player.\u201d \u201cStrong coder.\u201d \u201cNeeds to improve communication.\u201d None of those sentences survive the question \u2014 evidence? \u2014 and none of them help the engineer know what to do differently next quarter.",
  "This page collects wording that does survive that question: behaviour you can point at, in six dimensions that cover most software engineering work. Every example names a unit \u2014 a PR, a system, an incident, a date \u2014 because that is what turns a compliment into a review.",
  "One warning before you copy anything. The examples below are deliberately specific, and that is the point. If you paste them unchanged, you have replaced one set of generic sentences with another. Swap in your own module names, incidents and dates, or they will not mean anything.",
];

const LEVEL_TABLE = {
  head: ["Dimension", "Junior (L1\u2013L2)", "Mid (L3)", "Senior (L4)", "Staff (L5+)"],
  rows: [
    [
      "Scope",
      "Completes well-defined tasks",
      "Owns a feature end to end",
      "Owns a system; sees cross-quarter risk",
      "Owns a domain; decides what not to build",
    ],
    [
      "Code quality",
      "Writes to the team standard after review",
      "Ships testable, maintainable modules",
      "Sets the standard; reviews designs, not just code",
      "Makes several teams\u2019 codebases simpler",
    ],
    [
      "Ambiguity",
      "Raises what is unclear",
      "Turns a vague request into a plan",
      "Stops when the request itself is wrong",
      "Sets direction when even the goal is unclear",
    ],
    [
      "Measured impact",
      "Tasks land on time",
      "Features land and behave as promised",
      "System reliability or team velocity improves",
      "A business metric or team capability changes",
    ],
    [
      "Mentoring",
      "Seeks review actively",
      "Guides one intern or new hire",
      "Regularly unblocks others; default reviewer",
      "Has developed people who now lead work",
    ],
  ],
};

type Section = {
  id: string;
  title: string;
  trap: string;
  strong: string[];
  fixes: { weak: string; better: string; why: string }[];
};

const SECTIONS: Section[] = [
  {
    id: "code-quality",
    title: "Code quality and maintainability",
    trap: "The failure mode is praising volume \u2014 lines written, PRs merged \u2014 rather than whether the codebase got easier or harder to change.",
    strong: [
      "Her PRs are consistently small enough to review in one sitting, and each one lands with tests that would actually fail if the behaviour regressed.",
      "He refactored the billing module without changing a single public interface, which is why the follow-up feature took two days instead of the two weeks the old design implied.",
      "She treats a flaky test as a production bug: when the suite went intermittently red, she traced it to a shared fixture and fixed the cause rather than adding a retry.",
      "His code is boring in the useful way \u2014 clear names, no clever abstractions, and a comment only where the reasoning is genuinely non-obvious.",
    ],
    fixes: [
      {
        weak: "Writes clean code.",
        better:
          "His modules have no direct dependency on the HTTP layer, which is why swapping the upstream API last quarter touched one file.",
        why: "Names a structural property and the moment it paid off.",
      },
      {
        weak: "Could improve code quality.",
        better:
          "Three of his last five PRs mixed refactoring with behaviour changes, which slowed review; splitting them would cut review time and reduce rollback risk.",
        why: "Names the pattern, the count, and the cost \u2014 and the fix is obvious.",
      },
    ],
  },
  {
    id: "delivery",
    title: "Delivery and execution",
    trap: "\u201cShipped on time\u201d is not evidence unless you say what was committed to, what changed, and what was renegotiated rather than quietly dropped.",
    strong: [
      "She committed to a two-week cut for the search rewrite, flagged a one-week risk the moment the index migration proved slower than expected, and still landed the core path on the original date.",
      "He split the notifications migration into five independently deployable steps, so when step four slipped, the first three were already in production and delivering value.",
      "When the vendor SDK turned out to be unusable, she proposed an alternative within the same week rather than absorbing the cost silently.",
      "His sprint commitments have held for six consecutive sprints, and both items he dropped were explicitly renegotiated with the product owner rather than rolled over.",
    ],
    fixes: [
      {
        weak: "Always delivers.",
        better:
          "Delivered 9 of 10 committed items this half; the one slip was raised three weeks before the deadline with two options attached.",
        why: "A ratio plus the behaviour that made the miss survivable.",
      },
      {
        weak: "Sometimes struggles with deadlines.",
        better:
          "Two of his four estimates this half assumed no interruptions; adding a buffer for on-call weeks would make the commitments realistic.",
        why: "Locates the cause in the estimate, not the person \u2014 which is actionable.",
      },
    ],
  },
  {
    id: "incidents",
    title: "Debugging and incident response",
    trap: "Separate \u201cwas in the room\u201d from \u201cshortened the outage\u201d. Only the second belongs in a review.",
    strong: [
      "During the checkout outage he took incident command, kept the timeline in the channel, and had a rollback decision made in eleven minutes.",
      "She found the cause of the intermittent 500s by reading the query plan instead of adding more logging \u2014 the fix removed a full table scan.",
      "He wrote the postmortem himself, and the action items he proposed shipped two weeks later: the same failure mode has not recurred.",
      "She is the person who says \u201clet me reproduce it locally first\u201d before anyone starts guessing, which has prevented at least two wrong fixes.",
    ],
    fixes: [
      {
        weak: "Good at fixing bugs.",
        better:
          "Reduced on-call escalations from the payments service by fixing the three recurring causes rather than the individual symptoms.",
        why: "Moves the claim from activity to a trend.",
      },
      {
        weak: "Handles pressure well.",
        better:
          "In the February incident he kept the customer-facing updates factual and on schedule, which support cited as the reason ticket volume stayed manageable.",
        why: "Names the observable behaviour and who felt the benefit.",
      },
    ],
  },
  {
    id: "design",
    title: "Technical design and architecture",
    trap: "Review the quality of the decision, not whether you personally liked the outcome. A design that documents its rejected alternatives is reviewable; one that does not is a preference.",
    strong: [
      "Her design doc for the event pipeline listed the two alternatives she rejected and why, which let reviewers challenge the reasoning instead of the conclusion.",
      "He chose a deliberately unglamorous queue-based design over the event bus he wanted, because the team had no operational experience with the latter \u2014 and it has not paged anyone in six months.",
      "She scoped the migration so every step was reversible, which is what made the one-hour rollback during cutover a non-event.",
      "He pushed back on building a custom search index and showed the numbers that made the existing database sufficient for two more years of growth.",
    ],
    fixes: [
      {
        weak: "Strong technical skills.",
        better:
          "His design for the sync service replaced three bespoke integrations with one config-driven path, removing roughly 400 lines of duplicated code.",
        why: "One design decision, one measurable consequence.",
      },
      {
        weak: "Designs could be simpler.",
        better:
          "Two of his last three designs introduced a new service where a module would have done; starting from the smallest deployable unit would shrink the operational surface.",
        why: "Counts the pattern and offers a concrete alternative heuristic.",
      },
    ],
  },
  {
    id: "collaboration",
    title: "Collaboration, communication and code review",
    trap: "Kindness is not the same as usefulness. A good reviewer makes other people\u2019s work better and says so in a way they can act on.",
    strong: [
      "His review comments separate \u201cthis is a bug\u201d from \u201cthis is a preference\u201d and label which is which \u2014 junior engineers on the team cite this as the reason they ask him for reviews.",
      "She wrote the onboarding doc that takes a new engineer from zero to first production deploy in three days, and keeps it current as the setup changes.",
      "When the product requirements were ambiguous, he wrote a one-page summary of what he understood and asked for corrections before writing any code.",
      "She disagrees with the team\u2019s testing strategy openly in review and then commits fully once the decision is made \u2014 no passive resistance in standup.",
    ],
    fixes: [
      {
        weak: "Great team player.",
        better:
          "He picked up two unowned items from the platform backlog last quarter and drove both to completion without being asked.",
        why: "\u201cTeam player\u201d is a label; this is an event with a count.",
      },
      {
        weak: "Communication needs improvement.",
        better:
          "Her status updates arrive after a blocker has lasted a week; posting it when it appears would let others unblock her sooner.",
        why: "Specifies the timing problem and the changed behaviour.",
      },
    ],
  },
  {
    id: "growth",
    title: "Growth, mentoring and technical leadership",
    trap: "Mentoring is not \u201cbeing nice to juniors\u201d. Look for the people who got measurably better because of a specific person.",
    strong: [
      "He mentored two engineers through their first on-call rotation, and both now handle pages independently.",
      "She runs the weekly design review, and since she took it over, fewer designs reach implementation with unresolved questions.",
      "He introduced the ADR practice the team now uses; the last three architecture debates started from a written record rather than from scratch.",
      "She gave the talk on the incident process that the SRE team adopted for their own service.",
    ],
    fixes: [
      {
        weak: "Shows leadership potential.",
        better:
          "He has been the de facto owner of the CI pipeline for two quarters and made it fast enough that the team stopped batching merges.",
        why: "Ownership plus the effect on how everyone else works.",
      },
      {
        weak: "Should share knowledge more.",
        better:
          "Her project documentation lives only in her head and her branch; a short handover note per feature would let others cover her leave.",
        why: "Converts a vague instruction into a named artefact.",
      },
    ],
  },
];

const PRINCIPLES = [
  {
    t: "Every sentence carries evidence",
    d: "If you cannot attach a specific event, date or artefact to a claim, delete the claim. \u201cConsistently reliable\u201d means nothing next to \u201cno missed on-call handovers in six months\u201d.",
  },
  {
    t: "Balance each dimension, not the document",
    d: "A review that is uniformly positive reads as disengaged, and one that is uniformly negative reads as a case for dismissal. Give at least one concrete strength and one concrete development area per dimension that matters for the level.",
  },
  {
    t: "Describe behaviour, not character",
    d: "\u201cInterrupts people in design review\u201d is usable feedback. \u201cIs arrogant\u201d is a judgement the engineer cannot act on \u2014 and one that tends to attract bias complaints.",
  },
  {
    t: "Calibrate the expectation to the level",
    d: "The same behaviour can be a strength at L2 and a gap at L4. Shipping a feature independently is the whole job at mid level; at senior level the question is whether the system held up afterwards.",
  },
];

const FAQ = [
  {
    q: "Can I use these examples in my own self-review?",
    a: "Yes, with two changes. Switch the subject to the first person, and replace the third-party evidence with something a reader can verify \u2014 a PR number, a migration you led, an incident you commanded. A self-review that borrows the wording but not the evidence reads as inflated, which is worse than writing plainly.",
  },
  {
    q: "What if an engineer\u2019s work does not fit these six dimensions?",
    a: "Add a dimension. These six cover most product engineering work, but a platform, security or data engineer may need different ones \u2014 release safety, data correctness, cost efficiency. The structure matters more than the categories: name the dimension, state the expectation for that level, then attach evidence.",
  },
  {
    q: "How do I avoid bias when writing from a list of examples?",
    a: "Anchor every sentence to evidence before you write the judgement, and write the evidence section first. Examples cannot detect bias for you \u2014 they only make it easier to spot a claim with nothing behind it. Peer calibration, where managers compare drafts for the same level, catches the rest.",
  },
  {
    q: "Should I write a rating, a paragraph, or both?",
    a: "Follow whatever your process requires. Many organisations expect a written narrative plus a rating against weighted objectives; others want the scorecard only. If you need both and are short on time, write the evidence first and let the narrative and the rating fall out of it, rather than writing the rating and reverse-engineering the justification.",
  },
];

const RELATED = [
  { href: "/self-assessment-generator", label: "Self assessment generator" },
  { href: "/self-review-generator", label: "Self review generator" },
  { href: "/manager-review-generator", label: "Manager review generator" },
  { href: "/peer-review-generator", label: "Peer review generator" },
  { href: "/360-feedback-generator", label: "360-degree feedback generator" },
];

export default function SoftwareEngineerReviewExamplesPage() {
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: TITLE,
      description: DESCRIPTION,
      url: PAGE_URL,
      isPartOf: { "@type": "WebSite", url: "https://www.aiwritereview.com/" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];

  return (
    <main className="min-h-screen bg-surface-canvas">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      {/* ===================== HEADER ===================== */}
      <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-surface-card/90 backdrop-blur">
        <div className="max-w-[1280px] mx-auto px-gutter-mobile lg:px-gutter-desktop h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-[22px]">
              rate_review
            </span>
            <span className="font-title-md text-title-md text-text-primary tracking-tight">
              AI Review Writer
            </span>
          </a>
          <a
            href="/"
            className="inline-flex items-center gap-xs px-4 py-2 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary transition-colors"
          >
            <span>Open the generator</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </a>
        </div>
      </header>

      {/* ===================== HERO ===================== */}
      <section className="w-full border-b border-border-subtle bg-surface-card py-3xl">
        <div className="max-w-[1280px] mx-auto px-gutter-mobile lg:px-gutter-desktop">
          <div className="inline-flex items-center gap-xs px-3 py-1 rounded-full border border-border-strong bg-surface-canvas mb-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-text-primary">
              Review wording guide · Software engineering
            </span>
          </div>
          <h1 className="font-display-lg text-display-lg-mobile lg:text-display-lg text-text-primary max-w-4xl tracking-tight mb-md">
            Performance Review Examples for Software Engineers
          </h1>
          <div className="max-w-3xl flex flex-col gap-md">
            {INTRO.map((p) => (
              <p key={p} className="font-body-lg text-body-lg text-text-muted">
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== LEVEL TABLE ===================== */}
      <section className="w-full border-b border-border-subtle bg-surface-canvas py-3xl">
        <div className="max-w-[1280px] mx-auto px-gutter-mobile lg:px-gutter-desktop">
          <h2 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg text-text-primary mb-sm">
            The same sentence is a strength at one level and a gap at another
          </h2>
          <p className="font-body-md text-body-md text-text-muted max-w-3xl mb-xl">
            Before you borrow any wording, fix the expectation. Most disputed
            reviews are not disagreements about facts; they are disagreements
            about what the level was supposed to mean.
          </p>
          <div className="overflow-x-auto rounded-xl border border-border-subtle bg-surface-card">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-canvas">
                  {LEVEL_TABLE.head.map((h) => (
                    <th
                      key={h}
                      className="text-left font-label-md text-label-md uppercase tracking-wider text-text-muted px-md py-sm"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LEVEL_TABLE.rows.map((row) => (
                  <tr key={row[0]} className="border-b border-border-subtle last:border-0">
                    {row.map((cell, i) => (
                      <td
                        key={`${row[0]}-${i}`}
                        className={`px-md py-sm align-top font-body-sm text-body-sm ${
                          i === 0
                            ? "font-title-sm text-title-sm text-text-primary whitespace-nowrap"
                            : "text-text-muted"
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===================== SECTIONS ===================== */}
      {SECTIONS.map((s, idx) => (
        <section
          key={s.id}
          id={s.id}
          className={`w-full border-b border-border-subtle py-3xl ${
            idx % 2 === 0 ? "bg-surface-card" : "bg-surface-canvas"
          }`}
        >
          <div className="max-w-[1280px] mx-auto px-gutter-mobile lg:px-gutter-desktop">
            <h2 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg text-text-primary mb-sm">
              {s.title}
            </h2>
            <p className="font-body-md text-body-md text-text-muted max-w-3xl mb-xl">
              <span className="font-title-sm text-title-sm text-text-primary">Watch out: </span>
              {s.trap}
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
              {/* strong examples */}
              <div>
                <div className="font-label-sm text-label-sm uppercase tracking-wider text-text-muted mb-sm">
                  Wording that holds up
                </div>
                <ul className="flex flex-col gap-sm">
                  {s.strong.map((line) => (
                    <li
                      key={line}
                      className="rounded-lg border border-border-subtle bg-surface-card p-md flex items-start gap-sm"
                    >
                      <span className="material-symbols-outlined text-primary-container text-[18px] shrink-0 mt-0.5">
                        check_circle
                      </span>
                      <span className="font-body-md text-body-md text-text-primary">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* fixes */}
              <div>
                <div className="font-label-sm text-label-sm uppercase tracking-wider text-text-muted mb-sm">
                  Rewrites
                </div>
                <div className="flex flex-col gap-sm">
                  {s.fixes.map((f) => (
                    <div
                      key={f.weak}
                      className="rounded-lg border border-border-subtle bg-surface-card p-md"
                    >
                      <div className="flex items-start gap-sm mb-sm">
                        <span className="material-symbols-outlined text-text-muted text-[18px] shrink-0 mt-0.5">
                          close
                        </span>
                        <span className="font-body-md text-body-md text-text-muted line-through">
                          {f.weak}
                        </span>
                      </div>
                      <div className="flex items-start gap-sm mb-sm">
                        <span className="material-symbols-outlined text-primary-container text-[18px] shrink-0 mt-0.5">
                          edit
                        </span>
                        <span className="font-body-md text-body-md text-text-primary">
                          {f.better}
                        </span>
                      </div>
                      <div className="font-body-sm text-body-sm text-text-muted pl-[26px]">
                        {f.why}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* ===================== PRINCIPLES ===================== */}
      <section className="w-full border-b border-border-subtle bg-surface-card py-3xl">
        <div className="max-w-[1280px] mx-auto px-gutter-mobile lg:px-gutter-desktop">
          <h2 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg text-text-primary mb-xl">
            Four rules that matter more than the wording
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            {PRINCIPLES.map((p) => (
              <div key={p.t} className="rounded-xl border border-border-subtle p-lg">
                <h3 className="font-headline-sm text-headline-sm text-text-primary mb-xs">
                  {p.t}
                </h3>
                <p className="font-body-md text-body-md text-text-muted">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FAQ ===================== */}
      <section id="faq" className="w-full border-b border-border-subtle bg-surface-canvas py-3xl">
        <div className="max-w-[1280px] mx-auto px-gutter-mobile lg:px-gutter-desktop">
          <h2 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg text-text-primary mb-xl">
            Questions that come up when using examples
          </h2>
          <div className="flex flex-col gap-sm max-w-4xl">
            {FAQ.map((item) => (
              <div
                key={item.q}
                className="rounded-lg border border-border-subtle bg-surface-card p-lg"
              >
                <h3 className="font-title-md text-title-md text-text-primary mb-xs">{item.q}</h3>
                <p className="font-body-md text-body-md text-text-muted">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="w-full border-b border-border-subtle bg-surface-card py-3xl">
        <div className="max-w-[1280px] mx-auto px-gutter-mobile lg:px-gutter-desktop">
          <div className="rounded-xl border border-border-strong bg-surface-canvas p-xl flex flex-col lg:flex-row lg:items-center justify-between gap-lg">
            <div className="max-w-2xl">
              <h2 className="font-headline-md text-headline-md text-text-primary mb-xs">
                Turn the wording into the full review
              </h2>
              <p className="font-body-md text-body-md text-text-muted">
                Paste your raw notes about the engineer &mdash; what they shipped,
                what broke, what they unblocked &mdash; and the generator drafts the
                narrative against the level and tone you pick, or scores the work
                against weighted objectives and produces a letter grade with a
                written summary. Free to use, five drafts a day, no signup
                required; edit the draft in the browser and export it as PDF or
                Word.
              </p>
            </div>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-xs px-5 py-2.5 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary transition-colors shrink-0"
            >
              <span>Open the generator</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </a>
          </div>
          <p className="font-label-md text-label-md text-text-muted pt-lg max-w-3xl font-medium">
            AI-generated drafts. Review and edit before use. Not a substitute for
            HR, legal, or employment advice.
          </p>
        </div>
      </section>

      {/* ===================== RELATED ===================== */}
      <footer className="w-full bg-surface-canvas border-t border-border-subtle">
        <div className="max-w-[1280px] mx-auto px-gutter-mobile lg:px-gutter-desktop py-xl">
          <div className="flex flex-col gap-2xs mb-xl">
            <span className="font-label-sm text-label-sm uppercase text-text-muted tracking-wider mb-2xs">
              Review types
            </span>
            {RELATED.map((r) => (
              <a
                key={r.href}
                href={r.href}
                className="font-body-sm text-body-sm text-text-muted hover:text-text-primary transition-colors"
              >
                {r.label}
              </a>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-sm pt-lg border-t border-border-subtle">
            <span className="font-body-sm text-body-sm text-text-muted">
              © 2026 AI Review Writer
            </span>
            <div className="flex items-center gap-md">
              <a
                href="/privacy"
                className="font-body-sm text-body-sm text-text-muted hover:text-text-primary transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                className="font-body-sm text-body-sm text-text-muted hover:text-text-primary transition-colors"
              >
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
