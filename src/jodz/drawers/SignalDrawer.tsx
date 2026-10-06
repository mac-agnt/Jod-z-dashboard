import { useJodz, closeDrawer, openRecord, goTo } from "../store";
import { variantRows, product } from "../derive";
import { Drawer, KV, Section, Note, Pill, VariantName, LineChart, Btn } from "../ui";
import {
  signalRows, watchSignal, dismissSignal, applySignal, removeSignal, SEARCH_SERIES, SEARCH_WEEKS, AD_CHANGES, adChangeStatus, draftAdChange, type SignalRow,
} from "../marketing";

function SignalActions({ x }: { x: SignalRow }) {
  const s = useJodz();
  const a = x.action;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
      {a?.type === "uplift" && (x.status === "Applied"
        ? <Btn sm kind="ghost" onClick={() => removeSignal(x.id)}>Remove from forecast</Btn>
        : <Btn sm kind="primary" onClick={() => applySignal(x.id)}>Apply +{a.pct}% to {product(a.productId).name}</Btn>)}
      {a?.type === "link" && <Btn sm onClick={() => (a.link ? openRecord(a.link) : goTo(a.page, a.section))}>{a.label}</Btn>}
      {a?.type === "ad" && (() => {
        const ch = AD_CHANGES.find((c) => c.id === a.changeId)!;
        const st = adChangeStatus(s, ch.id);
        return st === "none"
          ? <Btn sm onClick={() => draftAdChange(ch.id)}>Draft ad change</Btn>
          : <Btn sm onClick={() => ch.campaignId && openRecord({ kind: "campaign", id: ch.campaignId })}>{st === "approved" ? "Ad change approved in demo" : "Ad change drafted"}: open</Btn>;
      })()}
      {x.status !== "Watching" && x.status !== "Applied" && <Btn sm kind="ghost" onClick={() => watchSignal(x.id)}>Watch</Btn>}
      {x.status !== "Dismissed" && x.status !== "Applied" && <Btn sm kind="ghost" onClick={() => dismissSignal(x.id)}>Dismiss</Btn>}
    </div>
  );
}

const TERM: Record<string, string> = { "sig-navy": "navy riding leggings kids", "sig-pink": "pink riding leggings" };

export default function SignalDrawer({ id }: { id: string }) {
  const s = useJodz();
  const x = signalRows(s).find((r) => r.id === id);
  if (!x) return null;
  const series = SEARCH_SERIES.find((t) => t.term === TERM[id]);
  const up = x.action?.type === "uplift" ? x.action : null;
  const vr = variantRows(s).filter((r) => x.products.includes(r.p.id) && x.products.length < 4 && r.rate > 0);
  return (
    <Drawer wide eyebrow={x.kind + " · " + x.source} title={x.title} onClose={closeDrawer} foot={<SignalActions x={x} />}>
      <KV items={[["Change", x.change], ["Window", x.window], ["Confidence", <Pill tone={x.confidence === "High" ? "ok" : x.confidence === "Medium" ? "warn" : "outline"}>{x.confidence}</Pill>], ["Status", x.status], ["Detected", x.detected]]} />
      <Note>{x.impact}</Note>
      {series && (
        <Section title={"Search interest: " + series.term + " (simulated index)"}>
          <LineChart labels={SEARCH_WEEKS} fmt={(n) => String(Math.round(n))} yMin={0} height={170} series={[{ name: series.term, color: "var(--ink)", values: series.values, area: true }]} />
        </Section>
      )}
      {vr.length > 0 && (
        <Section title={up ? "Forecast effect of +" + up.pct + "%" : "Stock behind this trend"}>
          <div className="jz-list">
            {vr.map((r) => {
              const k = 1 + (up ? up.pct : 0) / 100;
              const now = r.rate, other = x.status === "Applied" ? now / k : now * k;
              const cov = (rt: number) => (rt > 0 ? Math.round(r.available / rt) + "d" : "-");
              return (
                <div key={r.sku} style={{ cursor: "pointer" }} onClick={() => openRecord({ kind: "variant", id: r.sku })}>
                  <span style={{ flex: 1 }}><VariantName sku={r.sku} /></span>
                  <span className="jz-mono">{r.available} available</span>
                  {up ? <span className="jz-mono jz-dim">{x.status === "Applied" ? other.toFixed(1) + " → " + now.toFixed(1) : now.toFixed(1) + " → " + other.toFixed(1)}/day, cover {x.status === "Applied" ? cov(other) + " → " + cov(now) : cov(now) + " → " + cov(other)}</span>
                    : <span className="jz-mono jz-dim">{r.cover === null ? "-" : Math.round(r.cover) + "d cover"}</span>}
                </div>
              );
            })}
          </div>
        </Section>
      )}
      <Note>Trends are signals, not orders. Applying one changes a demo forecast assumption only.</Note>
    </Drawer>
  );
}
