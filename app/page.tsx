import Wizard from "../components/Wizard";
import SeoFooter from "../components/SeoFooter";

export default function Home() {
  return (
    <main>
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          background: "#fff",
        }}
      >
        <div
          className="container"
          style={{ display: "flex", alignItems: "center", height: 56 }}
        >
          <span style={{ fontWeight: 700, fontSize: 18, color: "var(--brand-700)" }}>
            AI Write Review
          </span>
        </div>
      </header>

      <section style={{ paddingTop: 36, paddingBottom: 8 }}>
        <div className="container">
          <h1>AI Performance Review Generator</h1>
          <p
            style={{
              color: "var(--muted)",
              fontSize: 17,
              marginTop: -4,
              maxWidth: 620,
              lineHeight: 1.6,
            }}
          >
            Write a structured, professional employee performance review in under a minute.
            Pick a type, add what went well, choose a tone—and get a ready-to-edit draft.
            Free, no signup required.
          </p>
          <Wizard />
        </div>
      </section>

      <SeoFooter />

      <footer
        style={{
          borderTop: "1px solid var(--border)",
          background: "#fff",
          marginTop: 40,
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 20,
            paddingBottom: 20,
            fontSize: 14,
            color: "var(--muted)",
          }}
        >
          <span>© {new Date().getFullYear()} AI Write Review. All rights reserved.</span>
          <span style={{ display: "flex", gap: 16 }}>
            <a href="/privacy-policy" style={{ color: "var(--muted)" }}>
              Privacy Policy
            </a>
            <a href="/terms" style={{ color: "var(--muted)" }}>
              Terms
            </a>
          </span>
        </div>
      </footer>
    </main>
  );
}
