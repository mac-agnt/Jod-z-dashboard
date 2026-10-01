import { useState } from "react";
import { useJodz, openDrawer, openRecord, goTo } from "../store";
import { variantRows, product, pct, fmtDate } from "../derive";
import { Page, Card, Pill, Btn, DemoBadge, LineChart, Legend, Note, Swatch, Table, Seg } from "../ui";
import {
  signalRows, watchSignal, dismissSignal, applySignal, removeSignal, SEARCH_WEEKS, SEARCH_SERIES, HASHTAGS, colourTrends, calendarRows,
  AD_CHANGES, adChangeStatus, draftAdChange, type SignalRow,
} from "../marketing";

const plain = (n: number) => String(Math.round(n));
const COLS = ["var(--ink)", "var(--warn)", "var(--ok)", "var(--bad)"];
const KEY_SKU: Record<string, string> = { an: "JZ-AN-S", cfp: "JZ-CF-L", mbk: "JZ-MB-M" };

export function SignalActions({ x }: { x: SignalRow }) {
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

function Signals() {
  const s = useJodz();
  const [kind, setKind] = useState("all");
  const [showDismissed, setShowDismissed] = useState(false);
  const all = signalRows(s);
  const rows = all.filter((x) => (kind === "all" || x.kind === kind) && (showDismissed || x.status !== "Dismissed"));
  const up = s.assumptions.productUplift || {};
  const vr = variantRows(s);
  return (
    <>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span className="jz-dim" style={{ fontSize: 13, flex: 1 }}>
          {all.filter((x) => x.direction === "up").length} rising · {all.filter((x) => x.direction === "down").length} easing · {all.filter((x) => x.status === "Applied").length} applied to the forecast · {all.filter((x) => x.status === "Watching").length} watching
        </span>
        <Seg options={[["all", "All"], ["Search", "Search"], ["Social", "Social"], ["Own sales", "Own data"], ["Market", "Market"]]} value={kind} onChange={setKind} />
        <Btn sm kind="ghost" onClick={() => setShowDismissed(!showDismissed)}>{showDismissed ? "Hide dismissed" : "Show dismissed"}</Btn>
      </div>
      <div className="jz-grid" style={{ gridTemplateColumns: "minmax(0,2.2fr) minmax(0,1fr)", alignItems: "start" }}>
        <Card pad={false}>
          {rows.map((x, i) => (
            <div key={x.id} style={{ display: "flex", gap: 16, padding: "16px 20px", borderTop: i ? "1px solid var(--border)" : 0, opacity: x.status === "Dismissed" ? 0.5 : 1 }}>
              <div style={{ width: 64, flex: "none", textAlign: "right" }}>
                <div className="jz-mono" style={{ fontSize: 17, fontWeight: 600, color: x.direction === "up" ? "var(--ok)" : x.direction === "down" ? "var(--bad)" : "var(--ink)" }}>{x.direction === "up" ? "↑" : x.direction === "down" ? "↓" : "·"} {x.change.length < 7 ? x.change : ""}</div>
                <div className="jz-faint" style={{ fontSize: 10.5 }}>{x.window}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0, borderLeft: "2px solid var(--track)", paddingLeft: 16 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <span className="jz-label">{x.kind}</span><span className="jz-faint" style={{ fontSize: 11.5 }}>{x.source}</span>
                  <Pill tone={x.confidence === "High" ? "ok" : x.confidence === "Medium" ? "warn" : "outline"}>{x.confidence}</Pill>
                  {x.status !== "New" && <Pill tone={x.status === "Applied" ? "accent" : ""}>{x.status}</Pill>}
                </div>
                <button className="jz-link" style={{ color: "var(--ink)", textDecoration: "none", fontSize: 15, fontWeight: 600, marginTop: 6, textAlign: "left" }} onClick={() => openDrawer("signal", x.id)}>{x.title}</button>
                <div className="jz-dim" style={{ fontSize: 12.5, marginTop: 4, lineHeight: 1.5 }}>
                  {x.products.length > 0 && x.products.length < 4 && <span style={{ marginRight: 6 }}>{x.products.map((p) => <Swatch key={p} productId={p} />)}</span>}
                  {x.impact}
                </div>
                <div style={{ marginTop: 10 }}><SignalActions x={x} /></div>
              </div>
            </div>
          ))}
        </Card>
        <Card title="Applied to the forecast" sub="Demo assumptions only">
          {Object.keys(up).length === 0 ? <Note>Nothing applied yet. Applying a trend lifts that product's forecast demand and recalculates cover and the buying plan.</Note> : (
            <div className="jz-list">
              {Object.entries(up).map(([pid, n]) => {
                const key = vr.find((r) => r.sku === (KEY_SKU[pid] || "JZ-" + pid.toUpperCase() + "-S")) || vr.find((r) => r.p.id === pid)!;
                return <div key={pid}><Swatch productId={pid} /><span style={{ flex: 1 }}>{product(pid).name} +{n}%</span><span className="jz-mono jz-dim">{key.size}: {key.rate.toFixed(1)}/day, {key.cover === null ? "-" : Math.round(key.cover) + "d"}</span></div>;
              })}
            </div>
          )}
          <div style={{ marginTop: 12 }}><Btn sm onClick={() => goTo("Forecasting", "demand")}>Open Forecasting</Btn></div>
        </Card>
      </div>
    </>
  );
}

function SearchSocial() {
  const s = useJodz();
  const ct = colourTrends(s);
  return (
    <>
      <Note>Search interest and hashtag volumes are a simulated index for the demo, not Google Trends or live social data.</Note>
      <div className="jz-grid" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
        <Card title="Search interest" sub="Weekly index, 0 to 100" right={<Legend items={SEARCH_SERIES.map((t, i) => ({ name: t.term, color: COLS[i] }))} />}>
          <LineChart labels={SEARCH_WEEKS} fmt={plain} yMin={0} height={220} series={SEARCH_SERIES.map((t, i) => ({ name: t.term, color: COLS[i], values: t.values }))} />
        </Card>
        <Card title="Social mentions" sub="Weekly posts" right={<Legend items={HASHTAGS.map((t, i) => ({ name: t.tag, color: COLS[i] }))} />}>
          <LineChart labels={SEARCH_WEEKS} fmt={plain} yMin={0} height={220} series={HASHTAGS.map((t, i) => ({ name: t.tag, color: COLS[i], values: t.values }))} />
        </Card>
      </div>
      <Card title="Colour: interest vs Jod-Z sales and stock" sub="Click a colour to open its tightest variant" pad={false}>
        <Table rowKey={(r) => r.productId} rows={ct} onRow={(r) => openDrawer("variant", KEY_SKU[r.productId] || "JZ-" + ({ bb: "BB", mby: "MY", pb: "PB" } as Record<string, string>)[r.productId] + "-S")} cols={[
          { key: "n", label: "Colour", strong: true, render: (r) => <span className="jz-name"><Swatch productId={r.productId} />{r.name}</span> },
          { key: "c", label: "Search, 8 weeks", right: true, num: true, render: (r) => <span className={r.searchChange > 0 ? "jz-ok" : r.searchChange < 0 ? "jz-bad" : ""}>{(r.searchChange > 0 ? "+" : "") + r.searchChange}%</span> },
          { key: "s", label: "Share of online units", right: true, num: true, render: (r) => pct(r.salesShare, 0) },
          { key: "a", label: "Available", right: true, num: true, render: (r) => r.available },
          { key: "v", label: "Read", render: (r) => <Pill tone={r.tone === "ok" ? "" : r.tone}>{r.verdict}</Pill> },
        ]} />
      </Card>
    </>
  );
}

function Calendar() {
  const rows = calendarRows();
  return (
    <Card pad={false}>
      {rows.map((m, i) => (
        <div key={m.id} style={{ display: "flex", gap: 18, padding: "18px 22px", borderTop: i ? "1px solid var(--border)" : 0 }}>
          <div style={{ width: 90, flex: "none" }}>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{fmtDate(m.start)}</div>
            <div className="jz-faint" style={{ fontSize: 11.5 }}>in {m.days} days</div>
          </div>
          <div style={{ flex: 1, borderLeft: "2px solid var(--track)", paddingLeft: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{m.name}{m.end !== m.start && <span className="jz-faint" style={{ fontWeight: 400, fontSize: 12.5 }}> to {fmtDate(m.end)}</span>}</div>
            <div className="jz-dim" style={{ fontSize: 12.5, marginTop: 4 }}>{m.effect}. {m.focus}.</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
              <Pill tone={m.orderByPassed && !("noStock" in m) ? "warn" : ""}>{m.note}</Pill>
              {!("noStock" in m) && !m.orderByPassed && <Pill tone={m.draftInTime ? "ok" : "warn"}>{m.draftInTime ? "PO-D193 lands in time if approved now" : "PO-D193 would land too late"}</Pill>}
              {m.id === "blackfriday" && <Btn sm kind="ghost" onClick={() => goTo("Advertising", "overview")}>Ad plan</Btn>}
              {!("noStock" in m) && <Btn sm kind="ghost" onClick={() => goTo("Forecasting", "buying")}>Buying plan</Btn>}
            </div>
          </div>
        </div>
      ))}
    </Card>
  );
}

export default function Trends() {
  const s = useJodz();
  const sec = s.sections.Trends || "signals";
  return (
    <Page title="Trends" sub="Signals from search, social, sales, returns and wholesale, with what each means for stock. Signals are not orders."
      right={<div style={{ display: "flex", gap: 8, alignItems: "center" }}><Pill tone="outline">Search and social simulated</Pill><DemoBadge /></div>}>
      {sec === "search" ? <SearchSocial /> : sec === "calendar" ? <Calendar /> : <Signals />}
    </Page>
  );
}
