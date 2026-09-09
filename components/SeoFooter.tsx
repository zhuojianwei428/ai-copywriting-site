import { FAQ_ITEMS } from "../lib/jsonld";

export default function SeoFooter() {
  return (
    <section
      className="container"
      style={{ marginTop: 56, paddingBottom: 40, color: "var(--text)" }}
    >
      <h2>How to write a performance review that actually helps</h2>
      <p style={{ lineHeight: 1.8 }}>
        A good performance review is specific, balanced, and forward-looking. Start by
        naming the employee&apos;s real contributions with concrete examples, then point to
        one or two growth areas framed as development rather than criticism. An AI
        performance review generator helps managers and HR move from a blank page to a
        structured draft in seconds: pick the review type, add the strengths that
        actually happened, choose a tone, and get a clear write-up you can edit before
        sharing. The goal is not to replace your judgment but to remove the writing
        friction so the feedback gets delivered on time.
      </p>

      <h2>Who this tool is for</h2>
      <p style={{ lineHeight: 1.8 }}>
        This tool is built for the person writing the review—managers, team leads, and HR
        partners—not the employee being reviewed. Use it for self assessments, manager
        reviews of direct reports, peer feedback, and 360 feedback cycles. Whether you
        manage one person or fifty, a performance review generator keeps the structure
        consistent across your team and saves the hours usually lost to wording. It works
        for any role because you supply the context; the AI handles the professional
        phrasing.
      </p>

      <h2>Frequently asked questions</h2>
      <div style={{ display: "grid", gap: 18 }}>
        {FAQ_ITEMS.map((item) => (
          <div key={item.q}>
            <h3 style={{ margin: "0 0 6px", fontSize: 16 }}>{item.q}</h3>
            <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.7 }}>{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
