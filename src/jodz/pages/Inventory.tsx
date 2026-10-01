/* Inventory: stock by product, colour and size; incoming purchase orders; returns and adjustments. */
import { useMemo, useState } from "react";
import { useJodz, openDrawer, receivePO, decideReturn, type JodzState } from "../store";
import {
  variantRows, stockTotals, poTotal, poUnits, poPayments, supplier, productOfSku, sizeOfSku, sizeAge, eur, num, fmtDate,
  type VariantRow,
} from "../derive";
import { PRODUCTS, type PurchaseOrder } from "../data";
import { Page, Card, Figures, Table, type Col, Pill, Btn, Seg, Swatch, VariantName, RecLink, Note, DemoBadge, Meter, Tip, downloadCSV, type Tone } from "../ui";

/* ---------------- shared helpers ---------------- */

export const coverText = (c: number | null) => (c === null ? "No sales" : c > 365 ? "365+ days" : Math.round(c) + " days");

export function flagTone(f: string): Tone {
  if (f === "Unavailable") return "bad";
  if (f === "Low cover") return "warn";
  if (f === "Overstock") return "accent";
  return "outline";
}

function cellTone(r: VariantRow): string {
  if (r.available <= 0 || (r.cover !== null && r.cover < 7)) return "bad";
  if (r.cover !== null && r.cover < 14) return "warn";
  if (r.flags.includes("Overstock")) return "mute";
  return "";
}

export function poStatusTone(status: PurchaseOrder["status"]): Tone {
  if (status === "Draft") return "warn";
  if (status === "Received") return "outline";
  return "ok";
}

function Track({ value, max, tone = "accent" }: { value: number; max: number; tone?: "accent" | "ok" | "warn" | "bad" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 130 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 99, overflow: "hidden" }}>
        <Meter value={value} max={max} tone={tone} />
      </div>
      <span className="jz-mono jz-dim" style={{ fontSize: 11 }}>{num(value)}/{num(max)}</span>
    </div>
  );
}

/* ---------------- page ---------------- */

export default function Inventory() {
  const s = useJodz();
  const section = s.sections.Inventory || "stock";
  const sub =
    section === "incoming"
      ? "Purchase orders and deliveries. Committed orders count as incoming stock; the draft recommendation does not until it is approved."
      : section === "returns"
        ? "Returns, restock decisions and stock adjustments waiting for approval."
        : "Every product, colour and size. Available now is on hand less reserved and unavailable units.";
  return (
    <Page title="Inventory" sub={sub} right={<DemoBadge />}>
      {section === "incoming" ? <Incoming s={s} /> : section === "returns" ? <Returns s={s} /> : <Stock s={s} />}
    </Page>
  );
}

/* ---------------- stock ---------------- */

type FlagFilter = "all" | "low" | "over";
type View = "table" | "matrix";

function Stock({ s }: { s: JodzState }) {
  const rows = useMemo(() => variantRows(s), [s]);
  const t = useMemo(() => stockTotals(s), [s]);
  const [q, setQ] = useState("");
  const [family, setFamily] = useState<"all" | "Young Rider" | "Jockeys">("all");
  const [flag, setFlag] = useState<FlagFilter>("all");
  const [view, setView] = useState<View>("table");

  const filtered = rows.filter((r) => {
    if (family !== "all" && r.p.family !== family) return false;
    if (flag === "low" && !(r.flags.includes("Low cover") || r.flags.includes("Unavailable"))) return false;
    if (flag === "over" && !r.flags.includes("Overstock")) return false;
    if (q) {
      const hay = (r.sku + " " + r.name + " " + r.p.colour + " " + r.size).toLowerCase();
      if (!q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    return true;
  });

  const cols: Col<VariantRow>[] = [
    { key: "sku", label: "SKU", render: (r) => <span className="jz-mono jz-dim" style={{ fontSize: 11.5 }}>{r.sku}</span> },
    { key: "product", label: "Product", strong: true, render: (r) => <span className="jz-name"><Swatch sku={r.sku} />{r.name}</span> },
    {
      key: "size", label: "Size", render: (r) => {
        const age = sizeAge(r.size, r.p.id);
        return <span><b style={{ fontWeight: 600 }}>{r.size}</b>{age && <span className="jz-faint" style={{ marginLeft: 6, fontSize: 11 }}>{age}</span>}</span>;
      },
    },
    { key: "colour", label: "Colour", render: (r) => <span className="jz-dim">{r.p.colour}</span> },
    { key: "on", label: "On hand", right: true, num: true, render: (r) => num(r.onHand) },
    { key: "res", label: "Reserved", right: true, num: true, render: (r) => (r.reserved ? num(r.reserved) : <span className="jz-faint">0</span>) },
    { key: "un", label: "Unavail.", right: true, num: true, render: (r) => (r.unavailable ? <span className="jz-warn">{r.unavailable}</span> : <span className="jz-faint">0</span>) },
    { key: "av", label: "Available", right: true, num: true, strong: true, render: (r) => <span className={r.available <= 0 ? "jz-bad" : ""}>{num(r.available)}</span> },
    {
      key: "inc", label: "Incoming", right: true, num: true, render: (r) =>
        r.incoming ? <span>{num(r.incoming)}<span className="jz-faint" style={{ marginLeft: 6, fontSize: 11 }}>{r.nextArrival ? fmtDate(r.nextArrival) : ""}</span></span> : <span className="jz-faint">0</span>,
    },
    { key: "sales", label: <>Sales 30d <Tip text="Online units sold in the last 30 days, plus wholesale units dispatched in the same window." /></>, right: true, num: true, render: (r) => <span>{num(r.s30o + r.s30w)}<span className="jz-faint" style={{ marginLeft: 6, fontSize: 11 }}>{r.s30o} on · {r.s30w} ws</span></span> },
    { key: "cover", label: "Cover", right: true, num: true, render: (r) => <span className={r.cover !== null && r.cover < 7 ? "jz-bad" : r.cover !== null && r.cover < 14 ? "jz-warn" : ""}>{coverText(r.cover)}</span> },
    { key: "val", label: "Value at cost", right: true, num: true, render: (r) => eur(r.valueAtCost) },
    {
      key: "flags", label: "Flags", render: (r) => (
        <span style={{ display: "inline-flex", gap: 4 }}>
          {r.flags.filter((f) => f !== "Low history" && f !== "Stockout in period").map((f) => <Pill key={f} tone={flagTone(f)}>{f}</Pill>)}
          {r.flags.includes("Low history") && <Pill tone="outline">Low history</Pill>}
        </span>
      ),
    },
  ];

  const exportCsv = () =>
    downloadCSV("jodz-stock.csv", ["SKU", "Product", "Size", "On hand", "Reserved", "Unavailable", "Available", "Incoming", "Next arrival", "Online 30d", "Wholesale 30d", "Cover days", "Value at cost", "Flags"],
      filtered.map((r) => [r.sku, r.name, r.size, r.onHand, r.reserved, r.unavailable, r.available, r.incoming, r.nextArrival || "", r.s30o, r.s30w, r.cover === null ? "" : Math.round(r.cover), r.valueAtCost, r.flags.join("; ")]));

  return (
    <>
      <Figures
        items={[
          { label: "On hand", value: num(t.onHand), sub: "Units in the warehouse", tip: "Physical units held, including reserved and quarantined units." },
          { label: "Reserved", value: num(t.reserved), sub: "Held for open orders", tip: "Units allocated to confirmed wholesale orders that have not yet been dispatched." },
          { label: "Unavailable", value: num(t.unavailable), sub: "Quarantined or damaged", tip: "On hand but not sellable, for example damaged returns awaiting write-off." },
          { label: "Available now", value: num(t.available), tone: "hero", sub: t.lowCover.length + " variants low or out", tip: "On hand less reserved less unavailable. This is what can be sold or allocated today.", onClick: () => { setFlag("low"); setView("table"); } },
          { label: "Incoming", value: num(t.incoming), sub: "Committed purchase orders", tip: "Units on confirmed or approved purchase orders not yet received. The draft PO-D193 is excluded." },
          { label: "Stock value at cost", value: eur(t.valueAtCost), sub: t.overstock.length + " overstock variant" + (t.overstock.length === 1 ? "" : "s"), tip: "On-hand units at illustrative landed cost." },
        ]}
      />
      <Card
        title="Stock by product, colour and size"
        sub={filtered.length + " of " + rows.length + " variants"}
        right={<Seg<View> options={[["table", "Table"], ["matrix", "Matrix"]]} value={view} onChange={setView} />}
        pad={false}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "0 20px 12px", alignItems: "center" }}>
          <input className="jz-input" placeholder="Search SKU, product, colour or size" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 260 }} aria-label="Search stock" />
          <select className="jz-select" value={family} onChange={(e) => setFamily(e.target.value as typeof family)} aria-label="Family">
            <option value="all">All families</option>
            <option value="Young Rider">Young Rider</option>
            <option value="Jockeys">Jockeys</option>
          </select>
          <Seg<FlagFilter> options={[["all", "All"], ["low", "Low cover"], ["over", "Overstock"]]} value={flag} onChange={setFlag} />
          <span style={{ flex: 1 }} />
          <Btn sm kind="ghost" onClick={exportCsv}>Export CSV</Btn>
        </div>
        {view === "table" ? (
          <Table cols={cols} rows={filtered} rowKey={(r) => r.sku} onRow={(r) => openDrawer("variant", r.sku)} selected={s.drawer?.kind === "variant" ? s.drawer.id : undefined} maxHeight={560} empty="No variants match these filters" />
        ) : (
          <Matrix rows={filtered} />
        )}
      </Card>
    </>
  );
}

function Matrix({ rows }: { rows: VariantRow[] }) {
  const families = (["Young Rider", "Jockeys"] as const).filter((f) => rows.some((r) => r.p.family === f));
  if (!families.length) return <div className="jz-faint" style={{ padding: "28px 20px", textAlign: "center" }}>No variants match these filters</div>;
  return (
    <div style={{ padding: "0 20px 18px", display: "flex", flexDirection: "column", gap: 18 }}>
      {families.map((fam) => {
        const prods = PRODUCTS.filter((p) => p.family === fam && rows.some((r) => r.p.id === p.id));
        const sizes = prods[0]?.sizes ?? [];
        const grid = `minmax(170px,1.4fr) repeat(${sizes.length}, minmax(64px,1fr)) minmax(90px,1fr)`;
        return (
          <div key={fam} style={{ overflowX: "auto" }}>
            <div className="jz-matrix" style={{ gridTemplateColumns: grid, minWidth: 620 }}>
              <div className="jz-label" style={{ alignSelf: "end", paddingBottom: 4 }}>{fam}</div>
              {sizes.map((z) => (
                <div key={z} className="jz-label" style={{ textAlign: "center", alignSelf: "end", paddingBottom: 4 }}>
                  {z}
                  {fam === "Young Rider" && <div style={{ textTransform: "none", letterSpacing: 0, marginTop: 2 }}>{sizeAge(z, prods[0].id)}</div>}
                </div>
              ))}
              <div className="jz-label" style={{ textAlign: "right", alignSelf: "end", paddingBottom: 4 }}>Product total</div>
              {prods.map((p) => {
                const pr = rows.filter((r) => r.p.id === p.id);
                const all = pr.reduce((a, r) => a + r.available, 0);
                const onHand = pr.reduce((a, r) => a + r.onHand, 0);
                return [
                  <div key={p.id + "n"} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}><Swatch productId={p.id} />{p.name}</div>,
                  ...sizes.map((z) => {
                    const r = pr.find((x) => x.size === z);
                    if (!r) return <div key={p.id + z} />;
                    return (
                      <button key={p.id + z} className={"jz-cell " + cellTone(r)} onClick={() => openDrawer("variant", r.sku)} title={r.name + " " + r.size + ": " + r.available + " available, " + coverText(r.cover) + " cover"} style={{ color: undefined, font: "inherit", fontFamily: "var(--mono)" }}>
                        {num(r.available)}
                        <small>{r.cover === null ? "no sales" : r.cover > 365 ? "365+ d" : Math.round(r.cover) + " d"}</small>
                      </button>
                    );
                  }),
                  <div key={p.id + "t"} style={{ textAlign: "right", alignSelf: "center" }}>
                    <div className="jz-mono" style={{ fontSize: 14, fontWeight: 600 }}>{num(all)}</div>
                    <div className="jz-faint" style={{ fontSize: 10.5 }}>of {num(onHand)} on hand</div>
                  </div>,
                ];
              })}
            </div>
          </div>
        );
      })}
      <div className="jz-faint" style={{ fontSize: 11.5, display: "flex", gap: 14, flexWrap: "wrap" }}>
        <span>Cells show available now and days of cover.</span>
        <span className="jz-bad">Red: none available or under 7 days</span>
        <span className="jz-warn">Amber: under 14 days</span>
        <span>Faded: overstock</span>
        <span>A product can look healthy in total while one size is gone.</span>
      </div>
    </div>
  );
}

/* ---------------- incoming ---------------- */

function linesSummary(po: PurchaseOrder) {
  return po.lines.slice(0, 3).map((l) => productOfSku(l.sku).name.split(" (")[0] + " " + sizeOfSku(l.sku) + " " + l.qty).join(", ") + (po.lines.length > 3 ? " +" + (po.lines.length - 3) + " more" : "");
}

function Incoming({ s }: { s: JodzState }) {
  const committed = s.pos.filter((p) => p.status === "Confirmed" || p.status === "Approved").sort((a, b) => a.expected.localeCompare(b.expected));
  const drafts = s.pos.filter((p) => p.status === "Draft");
  const received = s.pos.filter((p) => p.status === "Received");
  const committedUnits = committed.reduce((a, p) => a + p.lines.reduce((b, l) => b + l.qty - l.received, 0), 0);
  const committedValue = committed.reduce((a, p) => a + poTotal(p), 0);
  const remaining = committed.reduce((a, p) => a + poPayments(p).filter((x) => !x.paid).reduce((b, x) => b + x.amount, 0), 0);
  const draftUnits = drafts.reduce((a, p) => a + poUnits(p), 0);
  const draftValue = drafts.reduce((a, p) => a + poTotal(p), 0);
  const next = committed[0];

  const base: Col<PurchaseOrder>[] = [
    { key: "id", label: "PO", strong: true, render: (p) => <span className="jz-mono">{p.id}</span> },
    { key: "sup", label: "Supplier", render: (p) => supplier(p.supplierId).name },
    { key: "lines", label: "Variants", render: (p) => <span className="jz-dim" style={{ fontSize: 12 }}>{p.lines.length} lines · {linesSummary(p)}</span> },
    { key: "units", label: "Units", right: true, num: true, render: (p) => num(poUnits(p)) },
    { key: "val", label: "Value", right: true, num: true, render: (p) => eur(poTotal(p)) },
    { key: "exp", label: "Expected", render: (p) => fmtDate(p.expected) },
    { key: "status", label: "Status", render: (p) => <Pill tone={poStatusTone(p.status)}>{p.status === "Draft" ? "Draft, not committed" : p.status}</Pill> },
  ];
  const payCols: Col<PurchaseOrder>[] = [
    { key: "dep", label: "Deposit", right: true, num: true, render: (p) => { const d = poPayments(p)[0]; return <span>{eur(d.amount)} <span className={d.paid ? "jz-ok" : "jz-faint"} style={{ fontSize: 11 }}>{d.paid ? "paid" : "due " + fmtDate(d.date)}</span></span>; } },
    { key: "rem", label: "Remaining", right: true, num: true, render: (p) => eur(poPayments(p).filter((x) => !x.paid).reduce((a, x) => a + x.amount, 0)) },
  ];
  const progress: Col<PurchaseOrder> = { key: "prog", label: "Delivery", render: (p) => { const rec = p.lines.reduce((a, l) => a + l.received, 0); return <Track value={rec} max={poUnits(p)} tone={rec >= poUnits(p) ? "ok" : "accent"} />; } };

  const committedCols: Col<PurchaseOrder>[] = [
    ...base, ...payCols, progress,
    { key: "act", label: "", right: true, render: (p) => <span onClick={(e) => e.stopPropagation()}><Btn sm onClick={() => receivePO(p.id)}>Receive delivery (simulated)</Btn></span> },
  ];

  return (
    <>
      <Figures
        items={[
          { label: "Committed incoming", value: num(committedUnits) + " units", sub: committed.length + " confirmed or approved POs", tip: "Units on confirmed or approved purchase orders not yet received." },
          { label: "Next arrival", value: next ? fmtDate(next.expected) : "None", sub: next ? next.id + " · " + num(poUnits(next)) + " units" : "No committed deliveries" },
          { label: "Committed value", value: eur(committedValue), sub: eur(remaining) + " still to pay", tip: "Total of committed purchase orders at unit cost. Remaining excludes deposits already paid." },
          { label: "Draft recommendation", value: num(draftUnits) + " units", sub: eur(draftValue) + " · not committed", tip: "Prepared by the Stock & Demand agent. Not approved and not sent to a supplier. Excluded from incoming stock and committed cash." },
        ]}
      />
      <Card title="Committed purchase orders" sub="Confirmed with the supplier or approved in the demo. These count as incoming stock and cash commitments." pad={false}>
        <Table cols={committedCols} rows={committed} rowKey={(p) => p.id} onRow={(p) => openDrawer("po", p.id)} selected={s.drawer?.kind === "po" ? s.drawer.id : undefined} empty="No committed purchase orders open" />
        <div style={{ padding: "12px 20px 16px" }}>
          <Note>Receiving a delivery adds the units to on-hand stock and makes them available. Short wholesale orders (for example JOD-W1041, Midnight Black M) can then be allocated from Sales. Nothing here contacts the supplier.</Note>
        </div>
      </Card>
      <Card title="Draft recommendation" sub="Not committed. Excluded from incoming stock and from cash commitments until approved." pad={false} right={<Pill tone="warn">Awaiting approval</Pill>}>
        <Table cols={[...base, { key: "act", label: "", right: true, render: (p) => <span onClick={(e) => e.stopPropagation()}><Btn sm kind="primary" onClick={() => openDrawer("po", p.id)}>Review</Btn></span> }]} rows={drafts} rowKey={(p) => p.id} onRow={(p) => openDrawer("po", p.id)} empty="No draft recommendations. Approved drafts move to committed purchase orders." />
      </Card>
      <Card title="Received" sub="Delivery history" pad={false}>
        <Table cols={[...base, ...payCols, progress]} rows={received} rowKey={(p) => p.id} onRow={(p) => openDrawer("po", p.id)} empty="Nothing received yet" />
      </Card>
    </>
  );
}

/* ---------------- returns ---------------- */

function Returns({ s }: { s: JodzState }) {
  const pending = s.returns.filter((r) => r.restock === "Pending");
  const sizeSignal = PRODUCTS.map((p) => {
    const rs = s.returns.filter((r) => r.sizeRelated && productOfSku(r.sku).id === p.id);
    return { p, n: rs.length, total: s.returns.filter((r) => productOfSku(r.sku).id === p.id).length, skus: Array.from(new Set(rs.map((r) => sizeOfSku(r.sku)))) };
  }).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
  const adjustments = s.approvals.filter((a) => a.kind === "Stock adjustment");

  type R = JodzState["returns"][number];
  const cols: Col<R>[] = [
    { key: "id", label: "Return", strong: true, render: (r) => <span className="jz-mono">{r.id}</span> },
    { key: "ord", label: "Original order", render: (r) => <span className="jz-mono jz-dim">{r.orderRef}<span className="jz-faint" style={{ marginLeft: 6, fontFamily: "var(--ui)", fontSize: 11 }}>{r.channel}</span></span> },
    { key: "v", label: "Variant", render: (r) => <VariantName sku={r.sku} /> },
    { key: "reason", label: "Reason", render: (r) => <span>{r.reason}{r.sizeRelated && <span style={{ marginLeft: 6 }}><Pill tone="outline">Size</Pill></span>}</span> },
    { key: "cond", label: "Condition", render: (r) => <Pill tone={r.condition === "Sellable" ? "ok" : "bad"}>{r.condition}</Pill> },
    { key: "res", label: "Refund / exchange", render: (r) => <span>{r.resolution === "Exchange" && r.exchangeSku ? "Exchange for " + sizeOfSku(r.exchangeSku) : "Refund " + eur(r.refund)}<span className="jz-faint" style={{ marginLeft: 6, fontSize: 11 }}>{r.status}</span></span> },
    { key: "rs", label: "Restock", render: (r) => <Pill tone={r.restock === "Pending" ? "warn" : r.restock === "Restocked" ? "ok" : "outline"}>{r.restock}</Pill> },
    { key: "act", label: "", right: true, render: (r) => r.restock === "Pending" ? <span onClick={(e) => e.stopPropagation()}><Btn sm onClick={() => decideReturn(r.id)}>{r.condition === "Sellable" ? "Restock" : "Quarantine"}</Btn></span> : null },
  ];

  return (
    <>
      <Card title="Returns" sub={pending.length + " awaiting a restock decision"} pad={false}>
        <Table cols={cols} rows={[...s.returns].sort((a, b) => b.received.localeCompare(a.received))} rowKey={(r) => r.id} onRow={(r) => openDrawer("return", r.id)} selected={s.drawer?.kind === "return" ? s.drawer.id : undefined} />
        <div style={{ padding: "12px 20px 16px" }}>
          <Note>Only sellable returns go back into available stock. Damaged returns are added to on hand but held as unavailable until written off. An exchange sends the replacement size from stock and does not create a second sale.</Note>
        </div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 14 }}>
        <Card title="Size-related returns" sub="Detected pattern. Fed into forecasting and reporting as a signal, not a correction.">
          {sizeSignal.length === 0 ? <div className="jz-faint">No size-related returns recorded</div> : (
            <div className="jz-list">
              {sizeSignal.map((x) => (
                <div key={x.p.id}>
                  <Swatch productId={x.p.id} />
                  <span style={{ flex: 1 }}>{x.p.name}<span className="jz-faint" style={{ marginLeft: 6, fontSize: 11.5 }}>sizes {x.skus.join(", ")}</span></span>
                  <span className="jz-mono">{x.n} of {x.total}</span>
                  {x.n >= 2 && <Pill tone="warn">Running small</Pill>}
                </div>
              ))}
            </div>
          )}
          {sizeSignal.some((x) => x.n >= 2) && (
            <div className="jz-dim" style={{ fontSize: 12, marginTop: 10, lineHeight: 1.5 }}>
              Customers are exchanging up a size. This shifts demand from S towards M and is worth checking against the size guide before the next buy.
            </div>
          )}
        </Card>
        <Card title="Stock adjustments" sub="Changes to on-hand stock need owner approval">
          {adjustments.length === 0 ? <div className="jz-faint">No adjustments raised</div> : (
            <div className="jz-list">
              {adjustments.map((a) => (
                <div key={a.id} style={{ cursor: "pointer" }} onClick={() => openDrawer("approval", a.id)}>
                  <span style={{ flex: 1 }}>
                    <div>{a.title}</div>
                    <div className="jz-faint" style={{ fontSize: 11.5 }}>{a.value} · raised {fmtDate(a.raised)} by {a.requestedBy}</div>
                  </span>
                  <Pill tone={a.status === "Awaiting approval" ? "warn" : a.status === "Declined" ? "outline" : "ok"}>{a.status}</Pill>
                  <RecLink link={a.link}>{a.link.id}</RecLink>
                </div>
              ))}
            </div>
          )}
          <div className="jz-dim" style={{ fontSize: 12, marginTop: 10, lineHeight: 1.5 }}>Writing off quarantined units lowers on hand and unavailable together, so available stock does not change.</div>
        </Card>
      </div>
    </>
  );
}
