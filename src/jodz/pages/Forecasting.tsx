/* Forecasting: demand, size and colour matrix, and the buying plan. Every figure comes from derive.ts. */
import { useState } from "react";
import { PRODUCTS, SNAPSHOT, SUPPLIERS } from "../data";
import { useJodz, setSection, setAssumption, openDrawer, openRecord, type Assumptions, type JodzState } from "../store";
import { addDays, daysBetween } from "../store";
import {
  variantRows, demandSummary, predictedReorders, confidence, demandUnits, projection, suggestedQty, poTotal, poUnits, poPayments,
  supplier, eur, num, fmtDate, variantName, productOfSku, type VariantRow,
} from "../derive";
import { Page, Card, Figures, Table, Pill, Btn, Seg, Tip, Swatch, VariantName, RecLink, Note, DemoBadge, LineChart, Legend, type Col } from "../ui";

type Sub = "demand" | "matrix" | "buying";
const ALL_SIZES = ["2XS", "XS", "S", "M", "L", "XL"];

export default function Forecasting() {
  const s = useJodz();
  const sub = (s.sections.Forecasting as Sub) || "demand";
  return (
    <Page
      title="Forecasting"
      sub="Predicted demand and a buying plan built from recent sales. Predictions are ranges, not orders."
      right={
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <DemoBadge />
        </div>
      }
    >
      {sub === "demand" && <Demand s={s} />}
      {sub === "matrix" && <Matrix s={s} />}
      {sub === "buying" && <Buying s={s} />}
    </Page>
  );
}

/* ---------------- Demand ---------------- */

function NumInput({ k, value, suffix }: { k: keyof Assumptions; value: number; suffix: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <input
        className="jz-input jz-num-input"
        type="number"
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) setAssumption(k, n);
        }}
      />
      <span className="jz-faint" style={{ fontSize: 12 }}>{suffix}</span>
    </span>
  );
}

function Demand({ s }: { s: JodzState }) {
  const sum = demandSummary(s);
  const rows = variantRows(s);
  const reorders = predictedReorders(s);
  const a = s.assumptions;
  const lowHist = PRODUCTS.filter((p) => p.family === "Jockeys");
  const stockouts = rows.filter((r) => r.v.stockoutDays > 0);
  const unavailable = rows.filter((r) => r.available <= 0 && r.rate > 0);

  const byProduct = PRODUCTS.map((p) => {
    const vs = s.variants.filter((v) => v.productId === p.id);
    const d30 = vs.reduce((acc, v) => acc + demandUnits(s, v, 30), 0);
    const d90 = vs.reduce((acc, v) => acc + demandUnits(s, v, 90), 0);
    const c = confidence(vs[0]);
    const worst = vs.map(confidence).sort((x, y) => y.spread - x.spread)[0];
    return { p, s28: vs.reduce((acc, v) => acc + v.s28, 0), d30, d90, conf: p.family === "Jockeys" ? c : worst };
  });

  return (
    <>
      <Card title="Expected demand" sub="Online demand is a forecast range. Wholesale is split into confirmed orders already placed and predicted reorders, which are not orders." pad={false}>
        <Table
          rowKey={(r) => String(r.days)}
          rows={sum}
          cols={[
            { key: "h", label: "Horizon", render: (r) => <b>Next {r.days} days</b> },
            { key: "on", label: "Online units", right: true, num: true, strong: true, render: (r) => num(r.online) },
            { key: "rng", label: "Range", right: true, num: true, render: (r) => num(r.onlineLo) + " to " + num(r.onlineHi) },
            { key: "oo", label: <>Online orders <Tip text="Online units divided by 1.25 units per order, the recent average." /></>, right: true, num: true, render: (r) => num(r.onlineOrders) },
            { key: "cw", label: "Confirmed wholesale", right: true, num: true, render: (r) => num(r.confirmedWholesale) + " units" },
            { key: "pw", label: "Predicted wholesale", right: true, num: true, render: (r) => <span className="jz-dim">{num(r.predictedWholesale)} units, predicted</span> },
            { key: "t", label: "Total expected", right: true, num: true, strong: true, render: (r) => num(r.online + r.confirmedWholesale + r.predictedWholesale) },
          ]}
        />
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.5fr)", gap: 14 }}>
        <Card title="How the forecast is made" sub="Edit any input. Every screen updates.">
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 12.5, color: "var(--body)", lineHeight: 1.5 }}>
            <div>1. Daily rate = online units sold in the last 28 days ÷ days the variant was in stock. Days with no stock are excluded, so zero sales while unavailable are not read as zero demand.</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>2. Growth on the recent rate <span style={{ flex: 1 }} /><NumInput k="growthPct" value={a.growthPct} suffix="%" /></div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>3. November seasonal uplift <span style={{ flex: 1 }} /><NumInput k="novUpliftPct" value={a.novUpliftPct} suffix="%" /></div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>4. December seasonal uplift <span style={{ flex: 1 }} /><NumInput k="decUpliftPct" value={a.decUpliftPct} suffix="%" /></div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>Cover target for buying <span style={{ flex: 1 }} /><NumInput k="coverTargetDays" value={a.coverTargetDays} suffix="days" /></div>
            <div>5. Range = forecast ± a spread set by confidence: High ±15%, Medium ±25 to 30%, Low ±40%.</div>
            <div>6. Wholesale reorders are predicted from each account's previous order date and typical interval. They are never counted as orders until the retailer places one.</div>
          </div>
        </Card>

        <Card title="Forecast by product" sub="Confidence reflects history length and stockouts" pad={false}>
          <Table
            rowKey={(r) => r.p.id}
            rows={byProduct}
            cols={[
              { key: "p", label: "Product", render: (r) => <span className="jz-name"><Swatch productId={r.p.id} />{r.p.name}</span> },
              { key: "s", label: "Sold, 28 days", right: true, num: true, render: (r) => num(r.s28) },
              { key: "d30", label: "30 days", right: true, num: true, strong: true, render: (r) => num(Math.round(r.d30)) },
              { key: "d90", label: "90 days", right: true, num: true, render: (r) => num(Math.round(r.d90 * (1 - r.conf.spread))) + " to " + num(Math.round(r.d90 * (1 + r.conf.spread))) },
              { key: "c", label: "Confidence", render: (r) => <span title={r.conf.why}><Pill tone={r.conf.label === "High" ? "ok" : r.conf.label === "Low" ? "bad" : "warn"}>{r.conf.label}</Pill></span> },
            ]}
          />
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
        <Note tone="warn">
          <b>Low history.</b> {lowHist.map((p) => p.name).join(" and ")} have under 60 days of sales. Forecasts use a ±40% range and should be read as indicative.
        </Note>
        {stockouts.map((r) => (
          <Note tone="warn" key={r.sku}>
            <b>{variantName(r.sku)} had {r.v.stockoutDays} stockout days.</b> {r.s28} sold in {28 - r.v.stockoutDays} days in stock, so the rate is {r.rate.toFixed(1)} a day, not {(r.s28 / 28).toFixed(1)}.
          </Note>
        ))}
        {unavailable.map((r) => (
          <Note tone="bad" key={r.sku}>
            <b>{variantName(r.sku)} has 0 available now.</b> Sales from here are held back by stock, not demand. Forecast stays at {r.rate.toFixed(1)} a day.
          </Note>
        ))}
      </div>

      <Card title="Wholesale reorder predictions" sub="Predicted from order history. Not customer orders." pad={false}>
        <Table
          rowKey={(r) => r.r.id}
          rows={reorders}
          onRow={(r) => openDrawer("retailer", r.r.id)}
          cols={[
            { key: "a", label: "Account", strong: true, render: (r) => r.r.name },
            { key: "l", label: "Previous order", render: (r) => fmtDate(r.r.lastOrder) },
            { key: "i", label: "Typical interval", right: true, num: true, render: (r) => r.r.intervalDays + " days" },
            { key: "w", label: "Likely reorder window", render: (r) => fmtDate(r.windowFrom) + " to " + fmtDate(r.windowTo) },
            { key: "m", label: "Suggested mix", render: (r) => <span className="jz-dim">{r.r.typicalMix}, about {r.r.typicalUnits} units</span> },
            { key: "st", label: "Status", render: (r) => <Pill tone={r.status === "Likely" ? "accent" : r.overdue ? "bad" : ""}>{r.status === "Likely" ? "Predicted: likely" : r.status}</Pill> },
          ]}
        />
      </Card>
    </>
  );
}

/* ---------------- Size & colour matrix ---------------- */

type Metric = "sold" | "avail" | "fc" | "cover" | "suggest";

function Matrix({ s }: { s: JodzState }) {
  const [metric, setMetric] = useState<Metric>("cover");
  const rows = variantRows(s);
  const bySku = new Map(rows.map((r) => [r.sku, r]));
  const value = (r: VariantRow): string => {
    if (metric === "sold") return num(r.s30o + r.s30w);
    if (metric === "avail") return num(r.available);
    if (metric === "fc") return num(Math.round(demandUnits(s, r.v, 30)));
    if (metric === "cover") return r.cover === null ? "-" : r.cover > 365 ? "365+" : String(Math.round(r.cover));
    return num(suggestedQty(s, r));
  };
  const tone = (r: VariantRow) => {
    if (r.flags.includes("Unavailable") || (r.cover !== null && r.cover < 7)) return "bad";
    if (r.flags.includes("Overstock") || r.flags.includes("Low cover")) return "warn";
    if (r.lowHistory) return "mute";
    return "";
  };
  const note = (r: VariantRow) => {
    if (r.flags.includes("Unavailable")) return "0 available";
    if (r.cover !== null && r.cover < 14) return Math.round(r.cover) + "d cover";
    if (r.flags.includes("Overstock")) return "overstock";
    if (r.lowHistory) return "low history";
    return "";
  };
  const short = rows.filter((r) => r.cover !== null && r.cover < 14).sort((a, b) => (a.cover ?? 0) - (b.cover ?? 0));
  const over = rows.filter((r) => r.flags.includes("Overstock"));

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 }}>
        {short.map((r) => (
          <Note tone="bad" key={r.sku}>
            <b>Shortage: {variantName(r.sku)}.</b> {num(r.available)} available, about {r.rate.toFixed(1)} a day, so {r.cover !== null ? r.cover.toFixed(1) : "0"} days of cover.
            {r.nextArrival ? " Next delivery " + fmtDate(r.nextArrival) + " (" + r.nextArrivalQty + " units)." : " No delivery booked."}
          </Note>
        ))}
        {over.map((r) => (
          <Note tone="warn" key={r.sku}>
            <b>Overstock: {variantName(r.sku)}.</b> {num(r.available)} available, {r.s28} sold in 28 days, {eur(r.valueAtCost)} at cost. Pause replenishment on this size only.
          </Note>
        ))}
      </div>
      <Card
        title="Size and colour"
        sub="Each cell is its own variant. Demand is forecast per size from that size's own sales, never spread evenly."
        right={<Seg<Metric> options={[["sold", "Units sold, 30d"], ["avail", "Available"], ["fc", "Forecast, 30d"], ["cover", "Days of cover"], ["suggest", "Suggested buy"]]} value={metric} onChange={setMetric} />}
      >
        <div style={{ overflowX: "auto" }}>
          <div className="jz-matrix" style={{ gridTemplateColumns: `minmax(210px,1.4fr) repeat(${ALL_SIZES.length}, minmax(76px,1fr))`, minWidth: 720 }}>
            <div />
            {ALL_SIZES.map((sz) => <div key={sz} className="jz-label" style={{ textAlign: "center", padding: "4px 0" }}>{sz}</div>)}
            {PRODUCTS.map((p) => (
              <Row key={p.id} name={p.name} pid={p.id} family={p.family}>
                {ALL_SIZES.map((sz) => {
                  const sku = s.variants.find((v) => v.productId === p.id && v.size === sz)?.sku;
                  const r = sku ? bySku.get(sku) : undefined;
                  if (!r) return <div key={sz} className="jz-cell mute" style={{ cursor: "default", opacity: 0.35 }}>·</div>;
                  return (
                    <div key={sz} className={"jz-cell " + tone(r)} onClick={() => openDrawer("variant", r.sku)} title={variantName(r.sku) + ". Click for details."}>
                      {value(r)}
                      {note(r) && <small>{note(r)}</small>}
                    </div>
                  );
                })}
              </Row>
            ))}
          </div>
        </div>
        <div className="jz-faint" style={{ fontSize: 11.5, marginTop: 12 }}>
          Red: under 7 days of cover or nothing available. Amber: under 14 days, or overstocked. Grey: low sales history. Click a cell to open the variant.
        </div>
      </Card>
    </>
  );
}

function Row({ name, pid, family, children }: { name: string; pid: string; family: string; children: React.ReactNode }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
        <Swatch productId={pid} />
        <span>{name}</span>
        <span className="jz-faint" style={{ fontSize: 11 }}>{family}</span>
      </div>
      {children}
    </>
  );
}

/* ---------------- Buying plan ---------------- */

function Buying({ s }: { s: JodzState }) {
  const po = s.pos.find((p) => p.id === "PO-D193");
  const rows = variantRows(s);
  const bySku = new Map(rows.map((r) => [r.sku, r]));
  const sup = po ? supplier(po.supplierId) : SUPPLIERS[0];
  const pays = po ? poPayments(po) : [];
  const isDraft = po?.status === "Draft";
  const awaiting = s.approvals.find((a) => a.link.id === "PO-D193" && a.status === "Awaiting approval");

  const lines = (po?.lines ?? []).map((l) => {
    const r = bySku.get(l.sku)!;
    const pr = projection(s, l.sku, 90, false);
    const cost = l.qty * (po?.unitCost ?? 0);
    const why = pr.stockoutDate
      ? "Runs out " + fmtDate(pr.stockoutDate) + " without it" + (pr.unmet > 0 ? "; about " + num(pr.unmet) + (pr.unmet === 1 ? " unit" : " units") + " of demand unmet in 90 days" : ", just before the next delivery")
      : "Holds cover above " + s.assumptions.coverTargetDays + " days through the peak";
    return { l, r, pr, cost, why, suggested: suggestedQty(s, r) };
  });

  const keySkus = rows.filter((r) => r.flags.includes("Low cover") || r.flags.includes("Unavailable")).map((r) => r.sku);
  const gaps = keySkus.map((sku) => {
    const pr = projection(s, sku, 90, false);
    const arrival = pr.nextArrival?.date;
    const gapDays = pr.stockoutDate && arrival ? Math.max(0, daysBetween(pr.stockoutDate, arrival)) : 0;
    const toArrival = arrival ? projection(s, sku, Math.max(1, daysBetween(SNAPSHOT, arrival) - 1), false).unmet : pr.unmet;
    return { sku, pr, arrival, gapDays, short: toArrival };
  });
  const ans = gaps.find((g) => g.sku === "JZ-AN-S") ?? gaps[0];
  const chartBase = ans ? projection(s, ans.sku, 90, false) : null;
  const chartDraft = ans ? projection(s, ans.sku, 90, true) : null;

  const cfl = bySku.get("JZ-CF-L");

  const cols: Col<(typeof lines)[number]>[] = [
    { key: "v", label: "What to buy", render: (x) => <VariantName sku={x.l.sku} /> },
    { key: "q", label: "Qty", right: true, num: true, strong: true, render: (x) => num(x.l.qty) },
    { key: "now", label: "Available / cover", right: true, num: true, render: (x) => num(x.r.available) + " · " + (x.r.cover === null ? "-" : Math.round(x.r.cover) + "d") },
    { key: "why", label: "Why", render: (x) => <span className="jz-dim" style={{ fontSize: 12 }}>{x.why}</span> },
    { key: "arr", label: "Expected arrival", render: (x) => (po ? fmtDate(po.expected) : "-") },
    { key: "c", label: "Cost", right: true, num: true, render: (x) => eur(x.cost) },
  ];

  return (
    <>
      <Card
        title={<>Main proposal: {isDraft ? "draft " : ""}<RecLink link={{ kind: "po", id: "PO-D193" }} /> from {sup.name}</>}
        sub={po ? (isDraft ? "Draft prepared. Not approved, not in committed incoming stock, not sent to the supplier." : po.status === "Approved" ? "Approved in demo. Counted in incoming stock and cash commitments. Nothing has been sent to the supplier." : po.status) : "Not found"}
        right={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Pill tone={isDraft ? (awaiting ? "warn" : "") : "ok"}>{isDraft ? (awaiting ? "Awaiting approval" : "Draft prepared") : "Approved in demo"}</Pill>
            <Btn kind="primary" onClick={() => openDrawer("po", "PO-D193")}>Review purchase and cash impact</Btn>
          </div>
        }
        pad={false}
      >
        {po && (
          <div style={{ padding: "0 20px 14px" }}>
            <Figures
              items={[
                { label: "Units", value: num(poUnits(po)), sub: po.lines.length + " variants" },
                { label: "Cost", value: eur(poTotal(po)), sub: eur(po.unitCost) + " a unit" },
                { label: "Deposit", value: eur(pays[0].amount), sub: po.depositPct + "% by " + fmtDate(pays[0].date) + ", within 30 days" },
                { label: "Balance", value: eur(pays[1].amount), sub: "Due " + fmtDate(pays[1].date) + ", days 31 to 60" },
                { label: "Supplier terms", value: sup.leadDays + " days", sub: "MOQ " + sup.moq, tip: sup.balanceTerms },
              ]}
            />
          </div>
        )}
        <Table rowKey={(x) => x.l.sku} rows={lines} cols={cols} onRow={(x) => openDrawer("variant", x.l.sku)} />
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr)", gap: 14 }}>
        <Card
          title={ans ? "Stock projection: " + variantName(ans.sku) : "Stock projection"}
          sub="Usable stock after open orders, confirmed deliveries and forecast online demand"
          right={<Legend items={[{ name: "Confirmed deliveries only", color: "var(--bad)" }, { name: "With PO-D193", color: "var(--accent)", dashed: true }]} />}
        >
          {chartBase && chartDraft && (
            <LineChart
              labels={chartBase.pts.map((p) => fmtDate(p.date))}
              series={[
                { name: "Confirmed only", color: "var(--bad)", values: chartBase.pts.map((p) => Math.round(p.stock)), area: true },
                { name: "With PO-D193", color: "var(--accent)", values: chartDraft.pts.map((p) => Math.round(p.stock)), dashed: true },
              ]}
              fmt={(n) => num(n) + " u"}
              height={200}
              marker={chartBase.stockoutDate ? { index: daysBetween(SNAPSHOT, chartBase.stockoutDate), label: "Runs out " + fmtDate(chartBase.stockoutDate) } : undefined}
            />
          )}
        </Card>

        <Card title="Gaps before replenishment" sub="Where stock runs out before the next confirmed delivery">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {gaps.length === 0 && <div className="jz-faint">No gaps projected.</div>}
            {gaps.map((g) => (
              <div key={g.sku} style={{ display: "flex", flexDirection: "column", gap: 6, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <VariantName sku={g.sku} />
                  <span style={{ flex: 1 }} />
                  <Pill tone="bad">{g.gapDays} days short</Pill>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--body)", lineHeight: 1.5 }}>
                  {g.pr.stockoutDate ? "Runs out " + fmtDate(g.pr.stockoutDate) : "Out now"}
                  {g.arrival ? ". " + g.pr.nextArrival!.qty + " units arrive " + fmtDate(g.arrival) + " on " + g.pr.nextArrival!.po.id : ". No delivery booked"}
                  {". About " + num(g.short) + " units of demand fall in the gap."}
                </div>
                <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.5 }}>
                  Options: ask {g.pr.nextArrival ? supplier(g.pr.nextArrival.po.supplierId).name : "the supplier"} to expedite part of the delivery; fulfil wholesale orders partially and keep some stock for online; or give later promise dates on new orders.
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {cfl && (
        <Card
          title="Pause replenishment: Candy Floss Pink L"
          sub="Recommendation, not an action"
          right={
            <div style={{ display: "flex", gap: 8 }}>
              <Pill tone="warn">{s.clearanceReview ? "Clearance review open" : "Detected"}</Pill>
              <Btn sm onClick={() => openRecord({ kind: "variant", id: "JZ-CF-L" })}>Open variant</Btn>
            </div>
          }
        >
          <div style={{ fontSize: 13, color: "var(--body)", lineHeight: 1.6 }}>
            {num(cfl.available)} available against {cfl.s28} sold in 28 days, about {cfl.cover === null ? "-" : Math.round(cfl.cover)} days of cover and {eur(cfl.valueAtCost)} tied up at cost.
            Suggested buy is {suggestedQty(s, cfl)} and it is not on PO-D193. Review a targeted clearance on size L only. Other Candy Floss Pink sizes sell at a normal rate, so a range-wide discount is not recommended.
          </div>
        </Card>
      )}

      <Card title="Other variants below the cover target" sub={"Suggested quantities to reach " + s.assumptions.coverTargetDays + " days of cover after lead time. Not on any purchase order yet."} pad={false}>
        <Table
          rowKey={(r) => r.sku}
          rows={rows.filter((r) => suggestedQty(s, r) > 0 && !(po?.lines ?? []).some((l) => l.sku === r.sku))}
          onRow={(r) => openDrawer("variant", r.sku)}
          empty="Every variant is covered by stock, confirmed deliveries or the draft."
          cols={[
            { key: "v", label: "Variant", render: (r) => <VariantName sku={r.sku} /> },
            { key: "a", label: "Available", right: true, num: true, render: (r) => num(r.available) },
            { key: "i", label: "Incoming", right: true, num: true, render: (r) => num(r.incoming) },
            { key: "q", label: "Suggested", right: true, num: true, strong: true, render: (r) => num(suggestedQty(s, r)) },
            { key: "sup", label: "Supplier constraint", render: (r) => { const sp = SUPPLIERS.find((x) => x.makes.includes(productOfSku(r.sku).family === "Jockeys" ? "Jockeys" : "Young Rider"))!; return <span className="jz-dim">{sp.name}, {sp.leadDays} days, MOQ {sp.moq}</span>; } },
            { key: "c", label: "Cost", right: true, num: true, render: (r) => eur(suggestedQty(s, r) * r.p.cost) },
            { key: "arr", label: "Earliest arrival", render: (r) => fmtDate(addDays(SNAPSHOT, r.p.family === "Jockeys" ? 42 : 35)) },
          ]}
        />
      </Card>
    </>
  );
}
