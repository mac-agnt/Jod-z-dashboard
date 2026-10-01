import { useState } from "react";
import {
  Page, DemoBadge, Card, Figures, Table, Pill, Btn, Seg, RecLink, Note, Legend, LineChart, KV, downloadCSV, type Col, type Series,
} from "../ui";
import {
  useJodz, setSection, goTo, openDrawer, openRecord, setPurchasePreview, setScenario, setAssumption, type Scenario, type JodzState,
} from "../store";
import {
  eur, pct, fmtDate, retailer, supplier, bankCash, receivables, payables, invoiceBalance, invoiceStatus, daysOverdue, billBalance,
  poPayments, salesSummary, cashLines, cashOutlook, type CashLine,
} from "../derive";
import { SNAPSHOT, type RecordLink } from "../data";
import { addDays } from "../store";
import { statusTone } from "../drawers/InvoiceDrawer";
import { billStatus } from "../drawers/BillDrawer";

type Sub = "overview" | "invoices" | "cash";

export default function Accounting() {
  const s = useJodz();
  const sub = (s.sections.Accounting || "overview") as Sub;
  const subtitle = {
    overview: "Bank cash, what customers owe, what Jod-Z owes and what is due next. An operational view of the books, not a ledger or tax product.",
    invoices: "Customer invoices and supplier bills in one place. Open any row for detail and demo actions.",
    cash: "Expected bank balance over the next 90 days from known commitments and estimated trading.",
  }[sub];
  return (
    <Page
      title={sub === "cash" ? "Cash Outlook" : sub === "invoices" ? "Invoices & Bills" : "Accounting"}
      sub={subtitle}
      right={<div style={{ display: "flex", gap: 10, alignItems: "center" }}><span className="jz-faint" style={{ fontSize: 11.5 }}>Accounting system: provider to confirm, demo data</span><DemoBadge /></div>}
    >
      {sub === "overview" && <Overview s={s} />}
      {sub === "invoices" && <Ledger s={s} />}
      {sub === "cash" && <Outlook s={s} />}
    </Page>
  );
}

/* ---------------- overview ---------------- */

function Overview({ s }: { s: JodzState }) {
  const cash = bankCash(s);
  const rec = receivables(s);
  const pay = payables(s);
  const sales = salesSummary(s);
  const base = cashOutlook(s, { includeDraft: false });
  const in30 = addDays(SNAPSHOT, 30);
  const upcoming = cashLines(s, { includeDraft: false }).filter((l) => l.amount < 0 && l.date <= in30);
  const draft = s.pos.find((p) => p.id === "PO-D193");

  return (
    <>
      <Figures items={[
        { label: "Bank cash", value: eur(cash), sub: "Bank balance, not revenue", tone: "hero", tip: "Money in the bank today (demo). Changes only when cash actually moves, including simulated payments." },
        { label: "Customer balances", value: eur(rec.total), sub: rec.open.length + " open invoices", tip: "Receivables: invoiced to wholesale customers and not yet paid. Not in the bank yet.", onClick: () => setSection("Accounting", "invoices") },
        { label: "Overdue", value: eur(rec.overdueTotal), sub: rec.overdue.length ? rec.overdue.length + " invoice past due" : "Nothing overdue", tone: rec.overdue.length ? "alert" : undefined },
        { label: "Owed to suppliers", value: eur(pay.total + pay.poTotal), sub: eur(pay.total) + " bills, " + eur(pay.poTotal) + " PO balances", tip: "Open supplier bills plus unpaid deposits and balances on committed purchase orders. Draft POs are excluded." },
        { label: "Lowest expected balance", value: eur(base.low.balance), sub: "on " + fmtDate(base.low.date) + ", base case", onClick: () => setSection("Accounting", "cash") },
      ]} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 14 }}>
        <Card title="Overdue invoices" sub="Past their due date and still unpaid">
          {rec.overdue.length === 0 ? <Note tone="ok">No overdue invoices.</Note> : (
            <div className="jz-list">
              {rec.overdue.map((i) => (
                <div key={i.id} className="jz-row" style={{ cursor: "pointer" }} onClick={() => openDrawer("invoice", i.id)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div><RecLink link={{ kind: "invoice", id: i.id }} /> <span className="jz-dim">· {retailer(i.retailerId).name}</span></div>
                    <div className="jz-faint" style={{ fontSize: 11.5, marginTop: 3 }}>
                      Due {fmtDate(i.due)}, {daysOverdue(i)} days overdue · {i.reminder === "approved" ? "Reminder approved in demo (not sent)" : i.reminder === "drafted" ? "Reminder drafted, not sent" : "No reminder yet"}
                    </div>
                  </div>
                  <b className="jz-mono jz-bad">{eur(invoiceBalance(i))}</b>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Upcoming payments" sub={"Due out of the bank by " + fmtDate(in30) + " (next 30 days)"} right={<Btn sm kind="ghost" onClick={() => setSection("Accounting", "cash")}>Cash Outlook</Btn>}>
          <div className="jz-list" style={{ maxHeight: 280, overflowY: "auto" }}>
            {upcoming.map((l) => (
              <div key={l.id}>
                <span className="jz-mono jz-faint" style={{ width: 50, fontSize: 11.5 }}>{fmtDate(l.date)}</span>
                <span style={{ flex: 1, minWidth: 0 }}>{l.link ? <RecLink link={l.link}>{l.label}</RecLink> : l.label}<span className="jz-faint" style={{ fontSize: 11 }}> · {l.certainty === "known" ? "known" : "estimate"}</span></span>
                <b className="jz-mono">{eur(-l.amount)}</b>
              </div>
            ))}
          </div>
          <div className="jz-faint" style={{ fontSize: 11.5, marginTop: 8 }}>Total {eur(-upcoming.reduce((a, l) => a + l.amount, 0))}. Excludes draft purchase PO-D193.</div>
        </Card>

        <Card title="Supplier bills and PO balances due" right={<Btn sm kind="ghost" onClick={() => setSection("Accounting", "invoices")}>All bills</Btn>}>
          <div className="jz-list">
            {pay.open.map((b) => (
              <div key={b.id}>
                <span style={{ flex: 1, minWidth: 0 }}><RecLink link={{ kind: "bill", id: b.id }} /> <span className="jz-dim">· {b.payee}</span></span>
                <span className="jz-faint" style={{ fontSize: 11.5 }}>due {fmtDate(b.due)}</span>
                <b className="jz-mono" style={{ width: 70, textAlign: "right" }}>{eur(billBalance(b))}</b>
              </div>
            ))}
            {s.pos.filter((p) => p.status !== "Draft").flatMap((p) => poPayments(p).filter((x) => !x.paid).map((x) => (
              <div key={p.id + x.label}>
                <span style={{ flex: 1, minWidth: 0 }}><RecLink link={{ kind: "po", id: p.id }} /> <span className="jz-dim">{x.label.toLowerCase()} · {supplier(p.supplierId).name}</span></span>
                <span className="jz-faint" style={{ fontSize: 11.5 }}>due {fmtDate(x.date)}</span>
                <b className="jz-mono" style={{ width: 70, textAlign: "right" }}>{eur(x.amount)}</b>
              </div>
            )))}
          </div>
          {draft && draft.status === "Draft" && (
            <div style={{ marginTop: 10 }}>
              <Note>Draft PO-D193 ({eur(poPayments(draft).reduce((a, x) => a + x.amount, 0))}) is not a commitment yet and is not included. <button className="jz-link" onClick={() => goTo("Forecasting", "buying")}>See the buying plan</button> or <button className="jz-link" onClick={() => { setPurchasePreview(true); setSection("Accounting", "cash"); }}>preview its cash impact</button>.</Note>
            </div>
          )}
        </Card>

        <Card title="Revenue and gross margin" sub="Last 30 days, online and wholesale">
          <KV items={[
            ["Revenue (net sales)", eur(sales.net)],
            ["Cost of goods (illustrative)", eur(sales.cogs)],
            ["Gross margin", eur(sales.net - sales.cogs)],
            ["Gross margin %", pct(sales.margin)],
          ]} />
          <div className="jz-faint" style={{ fontSize: 11.5, marginTop: 10, lineHeight: 1.5 }}>
            Costs use an illustrative landed cost per unit (demo). Gross margin is before staff, rent, advertising and other operating costs, so it is not net profit.
          </div>
        </Card>
      </div>

      <Card title="Four numbers that are easy to mix up">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, fontSize: 12.5, lineHeight: 1.55, color: "var(--body)" }}>
          <div><b>Revenue</b><div className="jz-dim">What was sold: online orders plus wholesale dispatched. Recorded when sold, whether or not it has been paid.</div></div>
          <div><b>Profit (gross margin)</b><div className="jz-dim">Revenue less the cost of the goods sold. Operating costs still come out of this.</div></div>
          <div><b>Receivables</b><div className="jz-dim">Invoiced to customers but not yet paid. Money owed to Jod-Z, not money in the bank.</div></div>
          <div><b>Bank cash</b><div className="jz-dim">What is actually in the bank today. Moves only when a payment lands or leaves.</div></div>
        </div>
      </Card>
    </>
  );
}

/* ---------------- invoices & bills ---------------- */

interface LedgerRow {
  key: string; number: RecordLink; party: string; partyLink?: RecordLink; linked?: RecordLink; issued?: string; due: string;
  net: number; tax: number | null; balance: number; status: string; expected: string; note?: string; open: () => void;
}

function Ledger({ s }: { s: JodzState }) {
  const [mode, setMode] = useState<"rec" | "pay">("rec");
  const [openOnly, setOpenOnly] = useState(false);
  const rec = receivables(s);
  const pay = payables(s);

  const recRows: LedgerRow[] = s.invoices.map((i) => ({
    key: i.id, number: { kind: "invoice", id: i.id }, party: retailer(i.retailerId).name, partyLink: { kind: "retailer", id: i.retailerId },
    linked: { kind: "order", id: i.orderId }, issued: i.issued, due: i.due, net: i.net, tax: i.tax, balance: invoiceBalance(i),
    status: invoiceStatus(i), expected: invoiceBalance(i) > 0 ? i.expected : "", open: () => openDrawer("invoice", i.id),
  }));
  const billRows: LedgerRow[] = s.bills.map((b) => ({
    key: b.id, number: { kind: "bill", id: b.id }, party: b.payee, partyLink: b.supplierId ? { kind: "supplier", id: b.supplierId } : undefined,
    linked: b.poId ? { kind: "po", id: b.poId } : undefined, issued: b.issued, due: b.due, net: b.net, tax: b.tax, balance: billBalance(b),
    status: billStatus(b), expected: billBalance(b) > 0 ? b.expected : "", note: b.category, open: () => openDrawer("bill", b.id),
  }));
  const poRows: LedgerRow[] = s.pos.filter((p) => p.status !== "Draft").flatMap((p) =>
    poPayments(p).filter((x) => !x.paid).map((x) => ({
      key: p.id + "-" + x.label, number: { kind: "po" as const, id: p.id }, party: supplier(p.supplierId).name, partyLink: { kind: "supplier" as const, id: p.supplierId },
      linked: { kind: "po" as const, id: p.id }, issued: p.ordered, due: x.date, net: x.amount, tax: null, balance: x.amount,
      status: x.date < SNAPSHOT ? "Overdue" : "Due", expected: x.date, note: "PO " + x.label.toLowerCase() + " (committed, no bill yet)",
      open: () => openRecord({ kind: "po", id: p.id }),
    })));

  let rows = mode === "rec" ? recRows : [...billRows, ...poRows];
  if (openOnly) rows = rows.filter((r) => r.balance > 0);
  rows = [...rows].sort((a, b) => a.due.localeCompare(b.due));

  const cols: Col<LedgerRow>[] = [
    { key: "n", label: "Number", render: (r) => <div><RecLink link={r.number} />{r.note && <div className="jz-faint" style={{ fontSize: 11 }}>{r.note}</div>}</div> },
    { key: "p", label: mode === "rec" ? "Customer" : "Supplier / payee", render: (r) => (r.partyLink ? <RecLink link={r.partyLink}>{r.party}</RecLink> : r.party) },
    { key: "l", label: mode === "rec" ? "Order" : "PO", render: (r) => (r.linked ? <RecLink link={r.linked} /> : <span className="jz-faint">None</span>) },
    { key: "i", label: "Issued", render: (r) => (r.issued ? fmtDate(r.issued) : "") },
    { key: "d", label: "Due", render: (r) => fmtDate(r.due) },
    { key: "a", label: "Amount (net)", right: true, num: true, render: (r) => eur(r.net) },
    { key: "t", label: <span title="Synthetic tax field, treatment to confirm">Tax (synthetic)</span>, right: true, num: true, render: (r) => (r.tax === null ? <span className="jz-faint">n/a</span> : eur(r.tax)) },
    { key: "b", label: "Balance", right: true, num: true, strong: true, render: (r) => eur(r.balance) },
    { key: "s", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
    { key: "e", label: "Expected payment", render: (r) => (r.expected ? fmtDate(r.expected) : <span className="jz-faint">Settled</span>) },
  ];

  const exportCsv = () =>
    downloadCSV(mode === "rec" ? "jodz-receivables-demo.csv" : "jodz-payables-demo.csv",
      ["Number", "Party", "Linked", "Issued", "Due", "Net", "Tax (synthetic)", "Balance", "Status", "Expected"],
      rows.map((r) => [r.number.id + (r.note ? " " + r.note : ""), r.party, r.linked?.id ?? "", r.issued ?? "", r.due, r.net, r.tax ?? "", r.balance, r.status, r.expected]));

  return (
    <Card
      title={mode === "rec" ? "Receivables" : "Payables"}
      sub={mode === "rec"
        ? eur(rec.total) + " open across " + rec.open.length + " invoices, " + eur(rec.overdueTotal) + " overdue"
        : eur(pay.total) + " in open bills plus " + eur(pay.poTotal) + " unpaid on committed purchase orders"}
      right={
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label className="jz-dim" style={{ fontSize: 12, display: "inline-flex", gap: 6, alignItems: "center" }}>
            <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} /> Open only
          </label>
          <Seg options={[["rec", "Receivables"], ["pay", "Payables"]]} value={mode} onChange={setMode} />
          <Btn sm kind="ghost" onClick={exportCsv}>Export CSV</Btn>
        </div>
      }
      pad={false}
    >
      <Table cols={cols} rows={rows} rowKey={(r) => r.key} onRow={(r) => r.open()} empty="Nothing open" />
      <div className="jz-card-body" style={{ paddingTop: 12 }}>
        <div className="jz-faint" style={{ fontSize: 11.5, lineHeight: 1.5 }}>
          Tax is a synthetic tax field, treatment to confirm; seeded at €0. {mode === "pay" && "PO rows are deposits and balances on confirmed or approved purchase orders that have no bill yet. Draft POs are not listed. "}
          Payments recorded here are simulated and never move real money.
        </div>
      </div>
    </Card>
  );
}

/* ---------------- cash outlook ---------------- */

const SCENARIO_TEXT: Record<Scenario, string> = {
  base: "Known commitments at their scheduled dates. Online payouts and predicted wholesale reorders at the seeded estimates. Open invoices collected on their expected date (overdue ones assumed 7 days from today).",
  slow: "Slower Sales: online payouts 15% lower and predicted wholesale reorders 50% lower. Commitments and invoices unchanged.",
  late: "Late Wholesale Payments: every wholesale receipt (open invoices, open orders and predicted reorders) lands 30 days later. Online payouts and payments unchanged.",
};

const CATEGORY_ORDER = [
  "Invoice collections", "Open wholesale orders", "Online payouts", "Predicted wholesale",
  "Supplier deposits and balances", "Supplier bills", "Operating expenses", "Refunds", "Tax", "Draft purchase (preview)",
];

function Outlook({ s }: { s: JodzState }) {
  const po = s.pos.find((p) => p.id === "PO-D193");
  const poIsDraft = po?.status === "Draft";
  const poCommitted = po && (po.status === "Approved" || po.status === "Confirmed");
  const poValue = po ? poPayments(po).reduce((a, x) => a + x.amount, 0) : 0;
  const preview = s.purchasePreview && poIsDraft;

  const base = cashOutlook(s, { includeDraft: false });
  const withDraft = cashOutlook(s, { includeDraft: true });
  const active = preview ? withDraft : base;
  const [filter, setFilter] = useState<"all" | "known" | "estimated">("all");

  const labels = [fmtDate(SNAPSHOT), ...active.series.map((p) => fmtDate(p.date))];
  const vals = (o: typeof base) => [o.opening, ...o.series.map((p) => p.balance)];
  const series: Series[] = preview
    ? [
        { name: "With PO-D193 (preview)", color: "var(--warn)", values: vals(withDraft), dashed: true },
        { name: "Without draft purchase", color: "var(--accent)", values: vals(base), area: true },
      ]
    : [{ name: "Expected bank balance", color: "var(--accent)", values: vals(base), area: true }];

  const groups = (["known", "estimated"] as const).map((cert) => {
    const ls = active.lines.filter((l) => l.certainty === cert);
    const cats = CATEGORY_ORDER.map((c) => ({ c, ls: ls.filter((l) => l.category === c) })).filter((g) => g.ls.length);
    return { cert, cats, total: ls.reduce((a, l) => a + l.amount, 0) };
  });

  const lineRows = active.lines.filter((l) => filter === "all" || l.certainty === filter);
  let running = active.opening;
  const balAfter = new Map<string, number>();
  for (const l of active.lines) { running += l.amount; balAfter.set(l.id, running); }

  const lineCols: Col<CashLine>[] = [
    { key: "d", label: "Date", render: (l) => fmtDate(l.date) },
    { key: "l", label: "Item", render: (l) => (l.link ? <RecLink link={l.link}>{l.label}</RecLink> : l.label) },
    { key: "c", label: "Category", render: (l) => <span className="jz-dim">{l.category}</span> },
    { key: "k", label: "Basis", render: (l) => <Pill tone={l.certainty === "known" ? "outline" : "warn"}>{l.certainty === "known" ? "Known" : "Estimate"}</Pill> },
    { key: "src", label: "Source", render: (l) => <span className="jz-faint">{l.source}</span> },
    { key: "a", label: "Amount", right: true, num: true, render: (l) => <span className={l.amount < 0 ? "" : "jz-ok"}>{l.amount > 0 ? "+" : ""}{eur(l.amount)}</span> },
    { key: "b", label: "Balance after", right: true, num: true, render: (l) => eur(balAfter.get(l.id) ?? 0) },
  ];

  const tdR: React.CSSProperties = { textAlign: "right", fontFamily: "var(--mono)", padding: "9px 12px" };
  const tdL: React.CSSProperties = { padding: "9px 12px", color: "var(--dim)" };

  return (
    <>
      <Card
        title="Expected bank balance"
        sub={"From " + eur(active.opening) + " in the bank today (" + fmtDate(SNAPSHOT) + ")"}
        right={<Seg options={[["base", "Base"], ["slow", "Slower Sales"], ["late", "Late Wholesale Payments"]]} value={s.scenario} onChange={(v) => setScenario(v)} />}
      >
        <div className="jz-table-wrap">
          <table className="jz-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th></th>
                {active.horizons.map((h) => <th key={h.day} className="jz-r">Day {h.day}<div className="jz-faint" style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>{fmtDate(h.date)}</div></th>)}
              </tr>
            </thead>
            <tbody>
              <tr><td style={tdL}>Opening cash</td>{active.horizons.map((h) => <td key={h.day} style={tdR}>{eur(active.opening)}</td>)}</tr>
              <tr><td style={tdL}>Cumulative expected receipts</td>{active.horizons.map((h) => <td key={h.day} style={tdR} className="jz-ok">+{eur(h.receipts)}</td>)}</tr>
              <tr><td style={tdL}>Cumulative expected payments</td>{active.horizons.map((h) => <td key={h.day} style={tdR}>{eur(-h.payments)}</td>)}</tr>
              <tr>
                <td style={{ ...tdL, color: "var(--ink)", fontWeight: 600 }}>Expected closing cash</td>
                {active.horizons.map((h, i) => (
                  <td key={h.day} style={{ ...tdR, fontSize: 18, fontWeight: 600, color: h.closing < active.buffer ? "var(--bad)" : "var(--ink)" }}>
                    {eur(h.closing)}
                    {preview && <div className="jz-faint" style={{ fontSize: 11, fontWeight: 400 }}>{eur(base.horizons[i].closing)} without draft</div>}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <div className="jz-faint" style={{ fontSize: 11.5, marginTop: 10, lineHeight: 1.5 }}>
          Each column is cumulative from today to that date, not a monthly forecast. Day 60 includes everything in days 1 to 60.
        </div>
        <div style={{ marginTop: 10 }}><Note>{SCENARIO_TEXT[s.scenario]}</Note></div>
      </Card>

      <Card
        title="Dated cash curve"
        sub="Daily expected bank balance, next 90 days"
        right={
          <label className="jz-dim" style={{ fontSize: 12, display: "inline-flex", gap: 8, alignItems: "center" }}>
            Cash buffer €
            <input className="jz-input jz-num-input" style={{ width: 90 }} type="number" min={0} step={500} value={s.assumptions.buffer}
              onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n) && n >= 0) setAssumption("buffer", n); }} />
          </label>
        }
      >
        <div style={{ marginBottom: 10 }}>
          <Legend items={[...series.map((x) => ({ name: x.name, color: x.color, dashed: x.dashed })), { name: "Cash buffer " + eur(active.buffer), color: "var(--bad)", dashed: true }]} />
        </div>
        <LineChart labels={labels} series={series} height={240} refLine={{ value: active.buffer, label: "Buffer " + eur(active.buffer) }}
          marker={{ index: active.low.day, label: "Lowest projected balance " + eur(active.low.balance) + " on " + fmtDate(active.low.date) + (preview ? " (with preview)" : "") }} />
        <div style={{ marginTop: 12 }}>
          {active.breach ? (
            <Note tone="bad">Below the {eur(active.buffer)} buffer from {fmtDate(active.breach.date)}{preview ? " if PO-D193 is approved as drafted" : ""}. Lowest point {eur(active.low.balance)} on {fmtDate(active.low.date)}.</Note>
          ) : (
            <Note tone="ok">Stays above the {eur(active.buffer)} buffer. Lowest point {eur(active.low.balance)} on {fmtDate(active.low.date)}, {eur(active.low.balance - active.buffer)} of headroom.</Note>
          )}
        </div>
      </Card>

      <Card title="Draft purchase PO-D193" sub={po ? supplier(po.supplierId).name + " · " + eur(poValue) + " total" : undefined}
        right={<Btn sm onClick={() => openRecord({ kind: "po", id: "PO-D193" })}>Review purchase</Btn>}>
        {poIsDraft && po ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <label style={{ display: "inline-flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                <input type="checkbox" checked={s.purchasePreview} onChange={(e) => setPurchasePreview(e.target.checked)} />
                Preview draft purchase PO-D193 ({eur(poValue)})
              </label>
              <span className="jz-faint" style={{ fontSize: 12 }}>
                {poPayments(po).map((x) => x.label + " " + eur(x.amount) + " on " + fmtDate(x.date)).join(", ")}
              </span>
            </div>
            <div className="jz-faint" style={{ fontSize: 12, marginTop: 10, lineHeight: 1.5 }}>
              {preview && withDraft.breach
                ? "With the preview on, the balance falls below the buffer from " + fmtDate(withDraft.breach.date) + ". Day 90 closes at " + eur(withDraft.horizons[2].closing) + ". "
                : ""}
              Approving the PO adds its deposit and balance to known commitments. It does not mean money has left the bank; that happens on the payment dates. <button className="jz-link" onClick={() => goTo("Forecasting", "buying")}>Open the buying plan</button>.
            </div>
          </>
        ) : poCommitted ? (
          <Note>PO-D193 is {po?.status.toLowerCase()}, so its payments are already in the base commitments above under supplier deposits and balances. No preview needed.</Note>
        ) : (
          <Note>PO-D193 is not an open draft, so there is nothing to preview.</Note>
        )}
      </Card>

      <Card title="Known commitments and estimated trading" sub="Movements inside the next 90 days, grouped by how certain they are">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 18 }}>
          {groups.map((g) => (
            <div key={g.cert}>
              <div style={{ display: "flex", alignItems: "baseline", marginBottom: 6 }}>
                <b style={{ flex: 1, fontSize: 13 }}>{g.cert === "known" ? "Known commitments" : "Estimated future trading"}</b>
                <span className="jz-mono" style={{ fontSize: 13 }}>{g.total > 0 ? "+" : ""}{eur(g.total)}</span>
              </div>
              <div className="jz-faint" style={{ fontSize: 11.5, marginBottom: 6 }}>
                {g.cert === "known" ? "Invoices, confirmed orders, bills, committed POs and scheduled costs." : "Payouts, predicted reorders and variable costs based on recent trading."}
              </div>
              <div className="jz-list">
                {g.cats.map(({ c, ls }) => {
                  const t = ls.reduce((a, l) => a + l.amount, 0);
                  return (
                    <div key={c}>
                      <span style={{ flex: 1 }}>{c === "Tax" ? "Tax (synthetic seed)" : c}</span>
                      <span className="jz-faint" style={{ fontSize: 11.5 }}>{ls.length} item{ls.length === 1 ? "" : "s"}</span>
                      <b className={"jz-mono" + (t > 0 ? " jz-ok" : "")} style={{ width: 84, textAlign: "right" }}>{t > 0 ? "+" : ""}{eur(t)}</b>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="jz-faint" style={{ fontSize: 11.5, marginTop: 12, lineHeight: 1.5 }}>
          Invoices and their orders are counted once: dispatched value sits under invoice collections, undispatched value under open wholesale orders. Predicted wholesale reorders are not customer orders. Tax lines are a synthetic seed, treatment to confirm.
        </div>
      </Card>

      <Card
        title="All dated cash lines"
        sub={lineRows.length + " movements" + (preview ? ", including the PO-D193 preview" : "")}
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <Seg options={[["all", "All"], ["known", "Known"], ["estimated", "Estimated"]]} value={filter} onChange={setFilter} />
            <Btn sm kind="ghost" onClick={() => downloadCSV("jodz-cash-outlook-demo.csv", ["Date", "Item", "Category", "Basis", "Source", "Amount"], lineRows.map((l) => [l.date, l.label, l.category, l.certainty, l.source, l.amount]))}>Export CSV</Btn>
          </div>
        }
        pad={false}
      >
        <Table cols={lineCols} rows={lineRows} rowKey={(l) => l.id} maxHeight={460} onRow={(l) => l.link && openRecord(l.link)} />
      </Card>
    </>
  );
}
