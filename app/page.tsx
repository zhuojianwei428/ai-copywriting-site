import Wizard from "../components/Wizard";
import SeoFooter from "../components/SeoFooter";

export default function Home() {
  return (
    <main>
      <header
        style={{
          borderBottom: "1px solid var(--line)",
          background: "#fff",
        }}
      >
        <div
          className="wrap"
          style={{ display: "flex", alignItems: "center", height: 64 }}
        >
          <span style={{ fontWeight: 700, fontSize: 18, color: "var(--brand-ink)" }}>
            AI Write Review
          </span>
        </div>
      </header>

      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="container">
          <h1>AI Performance Review Generator</h1>
          <p className="lead">
            Write a clear, structured employee performance review—free, no signup
            required.
          </p>
          <div style={{ marginTop: 40 }}>
            <Wizard />
          </div>
        </div>
      </section>

      <SeoFooter />

      <footer
        style={{
          borderTop: "1px solid var(--line)",
          background: "#fff",
          marginTop: 64,
        }}
      >
        <div
          className="wrap"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 24,
            paddingBottom: 24,
            fontSize: 14,
            color: "var(--ink-soft)",
          }}
        >
          <span>
            © {new Date().getFullYear()} AI Write Review. All rights reserved.
          </span>
          <span style={{ display: "flex", gap: 16 }}>
            <a href="/privacy-policy" style={{ color: "var(--ink-soft)" }}>
              Privacy Policy
            </a>
            <a href="/terms" style={{ color: "var(--ink-soft)" }}>
              Terms
            </a>
          </span>
        </div>
      </footer>
    </main>
  );
}
