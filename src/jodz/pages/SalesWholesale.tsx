import { useState } from "react";
import { Page, DemoBadge, Card, Figures, Seg, Btn, Table, Pill, Bars, Legend, Meter, Swatch, VariantName, Tip, type Col, type Tone } from "../ui";
import { useJodz, openDrawer } from "../store";
import {
  salesSummary, salesTrend, variantRows, orderRows, openOrderBook, eur, num, pct, fmtDate, staff, WINDOW_START,
  type Channel, type OrderRow,
} from "../derive";
import { PRODUCTS, PREV_PERIOD, SNAPSHOT_LABEL } from "../data";
import NewOrderDrawer from "../drawers/NewOrderDrawer";

type OrderFilter = "open" | "draft" | "completed" | "all";

const ONLINE_C = "var(--accent)";
const WHOLESALE_C = "var(--dim)";

const change = (now: number, prev: number) => {
  if (!prev) return null;
  const c = (now - prev) / prev;
  return <span className={c >= 0 ? "jz-ok" : "jz-bad"}>{(c >= 0 ? "+" : "") + pct(c)} vs previous 30 days</span>;
};

export function stageTone(stage: string): Tone {
  if (stage === "Complete") return "ok";
  if (stage === "Draft") return "outline";
  if (stage === "Dispatched") return "accent";
  return "";
}

export function paymentTone(p: string): Tone {
  if (p === "Paid") return "ok";
  if (p === "Overdue") return "bad";
  if (p === "Not invoiced") return "outline";
  return "warn";
}

export function allocationTone(a: string): Tone {
  if (a === "Allocated") return "ok";
  if (a === "Part allocated") return "warn";
  if (a === "Unallocated") return "bad";
  return "outline";
}

export default function SalesWholesale() {
  const s = useJodz();
  const [channel, setChannel] = useState<Channel>("all");
  const [filter, setFilter] = useState<OrderFilter>("open");
  const [newOrder, setNewOrder] = useState(false);

  const sum = salesSummary(s, channel);
  const all = salesSummary(s, "all");
  const trend = salesTrend(s);
  const book = openOrderBook(s);
  const rows = orderRows(s);

  const prevOrders = channel === "online" ? PREV_PERIOD.onlineOrders : channel === "wholesale" ? PREV_PERIOD.wholesaleOrders : PREV_PERIOD.onlineOrders + PREV_PERIOD.wholesaleOrders;

  /* best sellers, respecting the channel filter */
  const vr = variantRows(s);
  const unitsOf = (o: number, w: number) => (channel === "online" ? o : channel === "wholesale" ? w : o + w);
  const products = PRODUCTS.map((p) => {
        const rs = vr.filter((r) => r.p.id === p.id);
        const units = rs.reduce((a, r) => a + unitsOf(r.s30o, r.s30w), 0);
        const revenue = rs.reduce((a, r) => a + unitsOf(r.s30o * p.onlineNet, r.s30w * p.trade), 0);
        return { p, units, revenue };
      }).sort((a, b) => b.revenue - a.revenue);
  const topVariants = vr
    .map((r) => ({ r, units: unitsOf(r.s30o, r.s30w) }))
    .filter((x) => x.units > 0)
    .sort((a, b) => b.units - a.units)
    .slice(0, 4);
  const maxRev = Math.max(1, ...products.map((x) => x.revenue));

  const filtered = rows
    .filter((r) => (filter === "open" ? r.isOpen : filter === "draft" ? r.o.stage === "Draft" : filter === "completed" ? r.o.stage === "Complete" : true))
    .sort((a, b) => b.o.id.localeCompare(a.o.id));
  const draftCount = rows.filter((r) => r.o.stage === "Draft").length;

  const cols: Col<OrderRow>[] = [
    { key: "id", label: "Order", render: (r) => <span className="jz-mono">{r.o.id}</span>, strong: true },
    {
      key: "ret", label: "Retailer",
      render: (r) => (
        <button className="jz-link" onClick={(e) => { e.stopPropagation(); openDrawer("retailer", r.o.retailerId); }}>{r.retailerName}</button>
      ),
    },
    { key: "units", label: "Units", right: true, num: true, render: (r) => num(r.units) },
    { key: "value", label: "Value ex tax", right: true, num: true, render: (r) => eur(r.value) },
    { key: "req", label: "Requested dispatch", render: (r) => (
      <span>
        {fmtDate(r.o.requestedDispatch)}
        {r.o.promiseDate && <span className="jz-faint" style={{ display: "block", fontSize: 11 }}>Proposed {fmtDate(r.o.promiseDate)}</span>}
      </span>
    ) },
    { key: "alloc", label: "Allocation", render: (r) => <Pill tone={allocationTone(r.allocation)}>{r.allocation === "Not reserved (draft)" ? "Not reserved" : r.allocation}</Pill> },
    { key: "stage", label: "Fulfilment", render: (r) => <Pill tone={stageTone(r.o.stage)}>{r.o.stage === "Dispatched" ? r.fulfilment : r.o.stage}</Pill> },
    { key: "pay", label: "Payment", render: (r) => <Pill tone={paymentTone(r.payment)}>{r.payment}</Pill> },
    { key: "owner", label: "Owner", render: (r) => <span className="jz-dim">{staff(r.o.owner).name}</span> },
    { key: "flags", label: "Flags", render: (r) => (
      <span style={{ display: "inline-flex", gap: 4, flexWrap: "wrap" }}>
        {r.flags.length === 0 ? <span className="jz-faint">None</span> : r.flags.map((f) => <Pill key={f} tone={f === "Payment hold" ? "bad" : "warn"}>{f}</Pill>)}
      </span>
    ) },
  ];

  const stacks = [
    ...(channel !== "wholesale" ? [{ name: "Online", color: ONLINE_C, values: trend.map((t) => t.online) }] : []),
    ...(channel !== "online" ? [{ name: "Wholesale dispatched", color: WHOLESALE_C, values: trend.map((t) => t.wholesale) }] : []),
  ];

  return (
    <Page
      title="Sales & Wholesale"
      sub={<>Last 30 days to {SNAPSHOT_LABEL} ({fmtDate(WINDOW_START)} to {SNAPSHOT_LABEL}), compared with the 30 days before. Wholesale counts as a sale on dispatch.</>}
      right={
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Seg<Channel> options={[["all", "All channels"], ["online", "Online"], ["wholesale", "Wholesale"]]} value={channel} onChange={setChannel} />
          <Btn kind="primary" onClick={() => setNewOrder(true)}>New wholesale order</Btn>
          <DemoBadge />
        </div>
      }
    >
      <Figures
        items={[
          { label: "Net sales ex tax", tone: "hero", value: eur(sum.net), sub: change(sum.net, sum.prevNet), tip: "Online order revenue plus wholesale orders dispatched in the period, excluding tax, after discounts. Open and draft wholesale orders are not included." },
          {
            label: "Channel split", value: (
              <span style={{ fontSize: "0.72em" }}>
                <span style={{ color: ONLINE_C }}>{eur(all.online)}</span>
                <span className="jz-faint"> / </span>
                <span style={{ color: WHOLESALE_C }}>{eur(all.wholesale)}</span>
              </span>
            ),
            sub: <>Online {pct(all.net ? all.online / all.net : 0, 0)} · wholesale {pct(all.net ? all.wholesale / all.net : 0, 0)}</>,
            tip: "Online is Shopify order revenue (demo connection). Wholesale is completed trade orders only, valued at the agreed trade price when dispatched.",
          },
          { label: "Orders", value: num(sum.orders), sub: change(sum.orders, prevOrders), tip: "Online orders placed plus wholesale orders with a dispatch in the period." },
          { label: "Average order value", value: eur(sum.aov, 2), sub: <>{num(sum.units)} units sold</>, tip: "Net sales ex tax divided by order count. Wholesale orders are much larger, so the blended figure moves with the channel mix." },
          { label: "Gross margin", value: pct(sum.margin), sub: <>{eur(sum.net - sum.cogs)} after {eur(sum.cogs)} cost</>, tip: "Net sales less illustrative landed unit costs (product, freight and duty). Costs are demo assumptions, not Jod-Z's real costs." },
        ]}
      />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.55fr) minmax(0, 1fr)", gap: 14, alignItems: "start" }} className="jz-sw-top">
        <Card
          title="Daily net sales"
          sub="Online orders by day, wholesale by dispatch date"
          right={<Legend items={stacks.map((x) => ({ name: x.name, color: x.color }))} />}
        >
          <Bars labels={trend.map((t) => fmtDate(t.date))} stacks={stacks} height={330} />
          <div style={{ display: "flex", gap: 22, marginTop: 14, fontSize: 12, color: "var(--dim)", flexWrap: "wrap" }}>
            <span>Online <b className="jz-mono" style={{ color: "var(--ink)" }}>{eur(all.online)}</b> from {num(all.onlineOrders)} orders</span>
            <span>Wholesale dispatched <b className="jz-mono" style={{ color: "var(--ink)" }}>{eur(all.wholesale)}</b> from {num(all.wholesaleOrders)} orders</span>
            <span>Previous period <b className="jz-mono" style={{ color: "var(--ink)" }}>{eur(PREV_PERIOD.online + PREV_PERIOD.wholesale)}</b></span>
          </div>
        </Card>

        <Card title="Best sellers" sub={channel === "all" ? "Online and wholesale units, last 30 days" : channel === "online" ? "Online units, last 30 days" : "Wholesale units dispatched, last 30 days"}>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {products.map((x) => (
              <div key={x.p.id} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 54px 70px", gap: 10, alignItems: "center", fontSize: 12.5 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <Swatch productId={x.p.id} /> {x.p.name}
                  </div>
                  <Meter value={x.revenue} max={maxRev} tone={x.p.family === "Jockeys" ? "warn" : "accent"} />
                </div>
                <span className="jz-mono jz-dim" style={{ textAlign: "right" }}>{num(x.units)}</span>
                <span className="jz-mono" style={{ textAlign: "right" }}>{eur(x.revenue)}</span>
              </div>
            ))}
          </div>
          <div className="jz-label" style={{ margin: "18px 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
            Top variants <Tip text="Revenue per product uses the online selling price for online units and the trade price for wholesale units. Tax excluded." />
          </div>
          <div className="jz-list">
            {topVariants.map(({ r, units }) => (
              <div key={r.sku} style={{ cursor: "pointer" }} onClick={() => openDrawer("variant", r.sku)}>
                <span style={{ flex: 1, minWidth: 0 }}><VariantName sku={r.sku} /></span>
                <span className="jz-faint" style={{ fontSize: 11 }}>{channel === "all" ? `${r.s30o} online · ${r.s30w} trade` : ""}</span>
                <b className="jz-mono" style={{ width: 40, textAlign: "right" }}>{units}</b>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card
        pad={false}
        title="Wholesale orders"
        sub="Fulfilment and payment are tracked separately. Shortages and payment holds are flags, not stages."
        right={
          <Seg<OrderFilter>
            options={[["open", `Open (${book.count})`], ["draft", `Drafts (${draftCount})`], ["completed", "Completed"], ["all", "All"]]}
            value={filter}
            onChange={setFilter}
          />
        }
      >
        <div style={{ display: "flex", gap: 28, padding: "4px 20px 14px", flexWrap: "wrap", alignItems: "baseline", fontSize: 12.5, color: "var(--dim)" }}>
          <span>
            Open order book <b className="jz-mono" style={{ fontSize: 17, color: "var(--ink)", marginLeft: 6 }}>{eur(book.value)}</b>
            <span style={{ marginLeft: 6 }}>ex tax across {book.count} orders, {num(book.units)} units</span>
          </span>
          <span className="jz-faint">
            {book.rows.map((r) => `${r.o.id} ${eur(r.openValue)}`).join(" + ")}
          </span>
          {book.short > 0 && <span className="jz-warn">{num(book.short)} units short</span>}
          <span className="jz-faint">Not in net sales until dispatched</span>
        </div>
        <Table<OrderRow>
          cols={cols}
          rows={filtered}
          rowKey={(r) => r.o.id}
          selected={s.drawer?.kind === "order" ? s.drawer.id : undefined}
          onRow={(r) => openDrawer("order", r.o.id)}
          empty={filter === "draft" ? "No draft orders. Use New wholesale order to start one." : "No orders match this filter"}
        />
      </Card>

      {newOrder && <NewOrderDrawer onClose={() => setNewOrder(false)} />}
      <style>{`@media (max-width: 980px){.jz-sw-top{grid-template-columns:minmax(0,1fr)!important}}`}</style>
    </Page>
  );
}
