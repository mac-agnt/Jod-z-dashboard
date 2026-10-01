/* Reporting: one workspace, four reports. Each report builds its rows once; the table and the CSV export use the same rows. */
import { useState } from "react";
import { PREV_PERIOD, RETAILERS, SNAPSHOT, SNAPSHOT_LABEL } from "../data";
import { useJodz, setSection, type JodzState } from "../store";
import {
  salesSummary, variantRows, receivables, invoiceBalance, invoiceStatus, daysOverdue, orderRows, predictedReorders, cashOutlook, cashLines,
  wholesaleDispatches, poTotal, eur, num, pct, fmtDate, variantName, WINDOW_START,
} from "../derive";
import { Page, Card, Seg, Btn, Pill, DemoBadge, downloadCSV } from "../ui";

type ReportKey = "summary" | "product" | "wholesale" | "cash";
type Cell = string | number;
interface Report { title: string; findings: string[]; header: string[]; rows: Cell[][]; numeric: boolean[]; file: string }

const RANGE = fmtDate(WINDOW_START) + " to " + SNAPSHOT_LABEL;
const chg = (a: number, b: number) => (b ? (a >= b ? "+" : "") + pct((a - b) / b) : "-");

/** Day 60 and 90 cash with and without PO-D193, whatever its status. */
function purchaseEffect(s: JodzState) {
  const asDraft: JodzState = { ...s, pos: s.pos.map((p) => (p.id === "PO-D193" ? { ...p, status: "Draft" } : p)) };
  const without = cashOutlook(asDraft, { includeDraft: false });
  const withPo = cashOutlook(asDraft, { includeDraft: true });
  return { without, withPo };
}

function summaryReport(s: JodzState, compare: boolean): Report {
  const all = salesSummary(s, "all");
  const on = salesSummary(s, "online");
  const wh = salesSummary(s, "wholesale");
  const ar = receivables(s);
  const base = cashOutlook(s, { includeDraft: false });
  const draft = s.pos.find((p) => p.id === "PO-D193");
  const prevCogs = PREV_PERIOD.cogs;
  const prevNet = PREV_PERIOD.online + PREV_PERIOD.wholesale;
  const lines: [string, number, number | null, (n: number) => string][] = [
    ["Net sales", all.net, prevNet, (n) => eur(n)],
    ["Online sales", on.net, PREV_PERIOD.online, (n) => eur(n)],
    ["Wholesale sales", wh.net, PREV_PERIOD.wholesale, (n) => eur(n)],
    ["Online orders", on.orders, PREV_PERIOD.onlineOrders, num],
    ["Wholesale orders dispatched", wh.orders, PREV_PERIOD.wholesaleOrders, num],
    ["Cost of goods", all.cogs, prevCogs, (n) => eur(n)],
    ["Gross margin", all.net - all.cogs, prevNet - prevCogs, (n) => eur(n)],
    ["Open receivables", ar.total, null, (n) => eur(n)],
    ["Overdue receivables", ar.overdueTotal, null, (n) => eur(n)],
    ["Cash at day 90 (committed only)", base.horizons[2].closing, null, (n) => eur(n)],
  ];
  const findings = [
    `Net sales were ${eur(all.net)}, ${chg(all.net, prevNet)} on the previous 30 days: ${eur(on.net)} online and ${eur(wh.net)} wholesale.`,
    `Gross margin was ${pct(all.margin)} (${eur(all.net - all.cogs)}), against ${pct((prevNet - prevCogs) / prevNet)} in the previous period.`,
    `${eur(ar.total)} is owed by retailers, of which ${eur(ar.overdueTotal)} is overdue.`,
    draft && draft.status === "Draft"
      ? `Draft PO-D193 (${eur(poTotal(draft))}) is not approved. If approved, day 90 cash moves from ${eur(base.horizons[2].closing)} to ${eur(cashOutlook(s, { includeDraft: true }).horizons[2].closing)}.`
      : (() => { const e = purchaseEffect(s); return `PO-D193 was approved in demo, which moved day 60 cash from ${eur(e.without.horizons[1].closing)} to ${eur(e.withPo.horizons[1].closing)} and day 90 from ${eur(e.without.horizons[2].closing)} to ${eur(e.withPo.horizons[2].closing)}.`; })(),
  ];
  return {
    title: "Management summary", findings, file: "management-summary",
    header: compare ? ["Measure", "Last 30 days", "Previous 30 days", "Change"] : ["Measure", "Last 30 days"],
    numeric: compare ? [false, true, true, true] : [false, true],
    rows: lines.map(([k, v, p, f]) => (compare ? [k, f(v), p === null ? "-" : f(p), p === null ? "-" : chg(v, p)] : [k, f(v)])),
  };
}

function productReport(s: JodzState): Report {
  const rows = variantRows(s).map((r) => {
    const sales = r.s30o * r.p.onlineNet + r.s30w * r.p.trade;
    const cost = (r.s30o + r.s30w) * r.p.cost;
    const sizeReturns = s.returns.filter((x) => x.sku === r.sku && x.sizeRelated).length;
    return { r, sales, cost, margin: sales - cost, sizeReturns };
  }).sort((a, b) => b.sales - a.sales);
  const top = rows.slice(0, 3);
  const ageing = rows.filter((x) => x.r.flags.includes("Overstock"));
  const sized = rows.filter((x) => x.sizeReturns > 0);
  const low = rows.filter((x) => x.r.cover !== null && x.r.cover < 14);
  const findings = [
    `Top sellers by net sales: ${top.map((x) => variantName(x.r.sku) + " (" + eur(x.sales) + ", margin " + eur(x.margin) + ")").join(", ")}.`,
    ageing.length ? `Stock is ageing on ${ageing.map((x) => variantName(x.r.sku) + ": " + num(x.r.available) + " available, about " + Math.round(x.r.cover ?? 0) + " days of cover, " + eur(x.r.valueAtCost) + " at cost").join("; ")}.` : "No variant is overstocked.",
    low.length ? `Low cover on ${low.map((x) => variantName(x.r.sku) + " (" + Math.round(x.r.cover ?? 0) + " days)").join(", ")}.` : "No variant is under 14 days of cover.",
    sized.length ? `Size-related returns: ${sized.map((x) => variantName(x.r.sku) + " " + x.sizeReturns).join(", ")}. Customers are sizing up from Admiral Navy XS and S, which adds to demand for the next size.` : "No size-related returns in the period.",
  ];
  return {
    title: "Product and variant performance", findings, file: "product-variant-performance",
    header: ["Variant", "Online units", "Wholesale units", "Net sales", "Cost", "Margin", "Available", "Days of cover", "Size returns", "Flags"],
    numeric: [false, true, true, true, true, true, true, true, true, false],
    rows: rows.map((x) => [variantName(x.r.sku), x.r.s30o, x.r.s30w, x.sales, x.cost, x.margin, x.r.available, x.r.cover === null ? "-" : Math.round(x.r.cover), x.sizeReturns, x.r.flags.join("; ")]),
  };
}

function wholesaleReport(s: JodzState): Report {
  const wd = wholesaleDispatches(s);
  const ors = orderRows(s);
  const pred = predictedReorders(s);
  const rows = RETAILERS.map((r) => {
    const d = wd.filter((x) => x.order.retailerId === r.id);
    const inv = s.invoices.filter((i) => i.retailerId === r.id);
    const bal = inv.reduce((a, i) => a + Math.max(0, invoiceBalance(i)), 0);
    const late = inv.filter((i) => invoiceStatus(i) === "Overdue");
    const paidLate = inv.filter((i) => i.payments.some((p) => p.date > i.due));
    const open = ors.filter((o) => o.o.retailerId === r.id && o.isOpen);
    const placed = s.orders.filter((o) => o.retailerId === r.id && o.created >= WINDOW_START && o.created <= SNAPSHOT);
    const p = pred.find((x) => x.r.id === r.id)!;
    return {
      r, units: d.reduce((a, x) => a + x.units, 0), sales: d.reduce((a, x) => a + x.value, 0), placed: placed.length,
      openValue: open.reduce((a, o) => a + o.openValue, 0), bal, overdueDays: late.reduce((a, i) => Math.max(a, daysOverdue(i)), 0), paidLate: paidLate.length, p,
    };
  });
  const reordered = rows.filter((x) => x.placed > 0);
  const late = rows.filter((x) => x.overdueDays > 0);
  const findings = [
    `${reordered.length} accounts placed orders in the period: ${reordered.map((x) => x.r.name).join(", ")}.`,
    `Wholesale dispatched ${num(rows.reduce((a, x) => a + x.units, 0))} units worth ${eur(rows.reduce((a, x) => a + x.sales, 0))}, with ${eur(rows.reduce((a, x) => a + x.openValue, 0))} still in open orders.`,
    late.length ? `${late.map((x) => x.r.name + " is " + x.overdueDays + " days overdue on " + eur(x.bal)).join("; ")}. Its predicted reorder is on hold.` : "No account is paying late.",
    `${pred.filter((p) => p.status === "Likely").length} accounts are predicted to reorder within 90 days. These are predictions, not orders.`,
  ];
  return {
    title: "Wholesale accounts", findings, file: "wholesale-accounts",
    header: ["Account", "Orders placed", "Units dispatched", "Net sales", "Open order value", "Owed", "Days overdue", "Last order", "Predicted reorder", "Status"],
    numeric: [false, true, true, true, true, true, true, false, false, false],
    rows: rows.map((x) => [x.r.name, x.placed, x.units, x.sales, x.openValue, x.bal, x.overdueDays, fmtDate(x.r.lastOrder), fmtDate(x.p.windowFrom) + " to " + fmtDate(x.p.windowTo), x.p.status]),
  };
}

function cashReport(s: JodzState): Report {
  const all = salesSummary(s, "all");
  const on = salesSummary(s, "online");
  const wh = salesSummary(s, "wholesale");
  const draft = s.pos.find((p) => p.id === "PO-D193");
  const isDraft = draft?.status === "Draft";
  const now = cashOutlook(s, { includeDraft: false });
  const withDraft = cashOutlook(s, { includeDraft: true });
  const lines = cashLines(s, { includeDraft: false });
  const findings = [
    `Gross margin was ${pct(all.margin)}: online ${pct(on.margin)} on ${eur(on.net)}, wholesale ${pct(wh.margin)} on ${eur(wh.net)}.`,
    `Committed cash is ${eur(now.horizons[0].closing)} at day 30, ${eur(now.horizons[1].closing)} at day 60 and ${eur(now.horizons[2].closing)} at day 90. The lowest point is ${eur(now.low.balance)} on ${fmtDate(now.low.date)}.`,
    isDraft
      ? `Approving PO-D193 would lower day 60 cash to ${eur(withDraft.horizons[1].closing)} and ${withDraft.breach ? "take the balance below the " + eur(withDraft.buffer) + " buffer from " + fmtDate(withDraft.breach.date) : "keep it above the buffer"}.`
      : `PO-D193 was approved in demo, lowering day 60 cash by ${eur(purchaseEffect(s).without.horizons[1].closing - now.horizons[1].closing)}. ${now.breach ? "The balance falls below the " + eur(now.buffer) + " buffer from " + fmtDate(now.breach.date) + "." : "The balance stays above the buffer."}`,
    `${lines.filter((l) => l.certainty === "estimated").length} of ${lines.length} expected movements are estimates, including predicted wholesale reorders that are not orders.`,
  ];
  return {
    title: "Cash and margin", findings, file: "cash-and-margin",
    header: ["Date", "Item", "Category", "Certainty", "Amount"],
    numeric: [false, false, false, false, true],
    rows: lines.map((l) => [fmtDate(l.date), l.label, l.category, l.certainty === "known" ? "Known" : "Estimated", l.amount]),
  };
}

export default function Reporting() {
  const s = useJodz();
  const key = (s.sections.Reporting as ReportKey) || "summary";
  const [compare, setCompare] = useState(true);
  const rep = key === "product" ? productReport(s) : key === "wholesale" ? wholesaleReport(s) : key === "cash" ? cashReport(s) : summaryReport(s, compare);
  const fmtCell = (v: Cell, i: number) => (typeof v === "number" ? (/sales|Cost|Margin|value|Owed|Amount/i.test(rep.header[i]) ? eur(v) : num(v)) : v);

  return (
    <Page
      title="Reporting"
      sub="One report at a time, built from the same figures as the operational screens."
      right={<DemoBadge />}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <Seg<ReportKey>
          options={[["summary", "Management summary"], ["product", "Product & variant"], ["wholesale", "Wholesale accounts"], ["cash", "Cash & margin"]]}
          value={key}
          onChange={(k) => setSection("Reporting", k)}
        />
        <span style={{ flex: 1 }} />
        <select className="jz-select" value="30" onChange={() => undefined} aria-label="Date range">
          <option value="30">Last 30 days · {RANGE}</option>
        </select>
        {key === "summary" && <Seg<"on" | "off"> options={[["on", "Compare previous 30 days"], ["off", "No comparison"]]} value={compare ? "on" : "off"} onChange={(v) => setCompare(v === "on")} />}
      </div>

      <Card title={rep.title} sub={RANGE + (key === "cash" ? ". Cash rows cover the next 90 days of committed movements." : "")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13.5, lineHeight: 1.6, color: "var(--body)", maxWidth: 880 }}>
          {rep.findings.map((f, i) => <p key={i} style={{ margin: 0 }}>{f}</p>)}
        </div>
      </Card>

      <Card
        title="Underlying rows"
        sub={num(rep.rows.length) + " rows. The export contains exactly these rows."}
        right={<div style={{ display: "flex", gap: 8, alignItems: "center" }}><Pill>{num(rep.rows.length)} rows</Pill><Btn sm onClick={() => downloadCSV("jodz-" + rep.file + "-" + SNAPSHOT + ".csv", rep.header, rep.rows)}>Export CSV</Btn></div>}
        pad={false}
      >
        <div className="jz-table-wrap" style={{ maxHeight: 520, overflowY: "auto" }}>
          <table className="jz-table">
            <thead>
              <tr>{rep.header.map((h, i) => <th key={h} className={rep.numeric[i] ? "jz-r" : ""}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {rep.rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, i) => <td key={i} className={(rep.numeric[i] ? "jz-r jz-num" : "") + (i === 0 ? " jz-strong" : "")}>{fmtCell(c, i)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Page>
  );
}
