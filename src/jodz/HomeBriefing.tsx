/* Today's briefing on the Home page. Each sentence opens the record or decision behind it. */
import { useJodz } from "./store";
import { briefing, openBrief } from "./home";

export default function HomeBriefing() {
  const s = useJodz();
  const items = briefing(s);
  return (
    <div style={{ marginTop: 18, maxWidth: 620, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 4px", fontSize: 14.5, lineHeight: 1.6, color: "var(--body)", textWrap: "pretty" }}>
      {items.map((b) => (
        <button
          key={b.key}
          onClick={() => openBrief(b.link)}
          className="ixf"
          style={{ display: "inline", padding: "1px 4px", border: 0, borderRadius: 6, background: "none", color: "inherit", font: "inherit", textAlign: "center", cursor: "pointer", textDecoration: "underline", textDecorationColor: b.tone === "bad" ? "var(--bad)" : b.tone === "warn" ? "var(--warn)" : "var(--border-strong)", textUnderlineOffset: 4, textDecorationThickness: 1.5 }}
        >
          {b.text}
        </button>
      ))}
    </div>
  );
}
