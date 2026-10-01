/* Pure selectors over the shared state. Every figure on every screen comes from here. */
import {
  PRODUCTS, RETAILERS, SUPPLIERS, STAFF, CASH_EVENTS, OPENING_CASH, DAILY_ONLINE, PREV_PERIOD, SNAPSHOT, SIZE_AGES,
  type Product, type Variant, type WholesaleOrder, type Invoice, type Bill, type PurchaseOrder, type CashEvent, type RecordLink,
} from "./data";
import { type JodzState, reservedFor, availableFor, addDays, daysBetween } from "./store";

/* ---------------- formatting ---------------- */

export const eur = (n: number, dp = 0) =>
  (n < 0 ? "−" : "") + "€" + Math.abs(n).toLocaleString("en-IE", { minimumFractionDigits: dp, maximumFractionDigits: dp });
export const num = (n: number) => n.toLocaleString("en-IE");
export const pct = (n: number, dp = 1) => (n * 100).toFixed(dp) + "%";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return d + " " + MONTHS[m - 1] + (y !== 2026 ? " " + y : "");
};
export const product = (id: string): Product => PRODUCTS.find((p) => p.id === id)!;
export const productOfSku = (sku: string): Product => {
  const code = sku.split("-")[1];
  const map: Record<string, string> = { AN: "an", MB: "mbk", BB: "bb", CF: "cfp", MY: "mby", PB: "pb", MON: "mon", ECL: "ecl" };
  return product(map[code]);
};
export const sizeOfSku = (sku: string) => sku.split("-").slice(2).join("-");
export const variantName = (sku: string) => productOfSku(sku).name + " " + sizeOfSku(sku);
export const retailer = (id: string) => RETAILERS.find((r) => r.id === id)!;
export const supplier = (id: string) => SUPPLIERS.find((s) => s.id === id)!;
export const staff = (id: string) => STAFF.find((s) => s.id === id) || STAFF[0];
export const sizeAge = (size: string, productId: string) => (product(productId).family === "Young Rider" ? SIZE_AGES[size] : "");

/* ---------------- sales ---------------- */

export const WINDOW_START = addDays(SNAPSHOT, -29);
const inWindow = (d: string, start = WINDOW_START, end = SNAPSHOT) => d >= start && d <= end;

/** Wholesale value recognised on dispatch, per dispatch date. */
export function wholesaleDispatches(s: JodzState, start = WINDOW_START, end = SNAPSHOT) {
  const out: { date: string; order: WholesaleOrder; units: number; value: number }[] = [];
  for (const o of s.orders) for (const d of o.dispatches) if (inWindow(d.date, start, end)) out.push({ date: d.date, order: o, units: d.units, value: d.value ?? d.units * o.price });
  return out;
}

export function wholesaleUnitsBySku(s: JodzState): Record<string, number> {
  const m: Record<string, number> = {};
  for (const o of s.orders) {
    if (!o.dispatches.some((d) => inWindow(d.date))) continue;
    // lines of orders dispatched in the window; seeded orders dispatch in one go
    for (const l of o.lines) m[l.sku] = (m[l.sku] || 0) + l.dispatched;
  }
  return m;
}

export type Channel = "all" | "online" | "wholesale";

export function salesSummary(s: JodzState, channel: Channel = "all") {
  const online = DAILY_ONLINE.reduce((a, d) => a + d.revenue, 0);
  const onlineOrders = DAILY_ONLINE.reduce((a, d) => a + d.orders, 0);
  const wd = wholesaleDispatches(s);
  const wholesale = wd.reduce((a, d) => a + d.value, 0);
  const wholesaleOrders = new Set(wd.map((d) => d.order.id)).size;
  const onlineUnits = s.variants.reduce((a, v) => a + v.s30o, 0);
  const wholesaleUnits = wd.reduce((a, d) => a + d.units, 0);
  const onlineCogs = s.variants.reduce((a, v) => a + v.s30o * productOfSku(v.sku).cost, 0);
  const wholesaleCogs = wd.reduce((a, d) => {
    const u = d.order.lines.reduce((x, l) => x + l.qty, 0) || 1;
    const avgCost = d.order.lines.reduce((x, l) => x + l.qty * productOfSku(l.sku).cost, 0) / u;
    return a + d.units * avgCost;
  }, 0);
  const pick = <T,>(o: T, w: T, all: T) => (channel === "online" ? o : channel === "wholesale" ? w : all);
  const net = pick(online, wholesale, online + wholesale);
  const orders = pick(onlineOrders, wholesaleOrders, onlineOrders + wholesaleOrders);
  const cogs = pick(onlineCogs, wholesaleCogs, onlineCogs + wholesaleCogs);
  const prevNet = pick(PREV_PERIOD.online, PREV_PERIOD.wholesale, PREV_PERIOD.online + PREV_PERIOD.wholesale);
  return {
    net, online, wholesale, orders, onlineOrders, wholesaleOrders, units: pick(onlineUnits, wholesaleUnits, onlineUnits + wholesaleUnits),
    aov: orders ? net / orders : 0, cogs, margin: net ? (net - cogs) / net : 0, prevNet, change: prevNet ? (net - prevNet) / prevNet : 0,
  };
}

/** Daily net sales for the trend chart. */
export function salesTrend(s: JodzState) {
  const wd = wholesaleDispatches(s);
  return DAILY_ONLINE.map((d) => ({ date: d.date, online: d.revenue, wholesale: wd.filter((x) => x.date === d.date).reduce((a, x) => a + x.value, 0) }));
}

/* ---------------- variants + stock ---------------- */

export interface VariantRow {
  v: Variant; p: Product; sku: string; size: string; name: string;
  onHand: number; reserved: number; unavailable: number; available: number;
  incoming: number; incomingDraft: number; nextArrival?: string; nextArrivalQty?: number;
  s30o: number; s30w: number; s28: number; rate: number; cover: number | null; valueAtCost: number;
  flags: string[]; lowHistory: boolean;
}

export function dailyRate(v: Variant, growthPct = 0, upliftPct = 0) {
  const days = Math.max(1, 28 - v.stockoutDays);
  return (v.s28 / days) * (1 + growthPct / 100) * (1 + upliftPct / 100);
}

/** Forecast rate for a variant: recent sales, the growth assumption and any trend uplift applied to its product. */
export function rateFor(s: JodzState, v: Variant) {
  const up = (s.assumptions.productUplift || {})[productOfSku(v.sku).id] || 0;
  return dailyRate(v, s.assumptions.growthPct, up);
}

export function incomingFor(s: JodzState, sku: string, includeDraft = false) {
  const out: { po: PurchaseOrder; qty: number; date: string }[] = [];
  for (const po of s.pos) {
    const ok = po.status === "Confirmed" || po.status === "Approved" || (includeDraft && po.status === "Draft");
    if (!ok) continue;
    for (const l of po.lines) if (l.sku === sku && l.qty > l.received) out.push({ po, qty: l.qty - l.received, date: po.expected });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export function variantRows(s: JodzState): VariantRow[] {
  const wu = wholesaleUnitsBySku(s);
  return s.variants.map((v) => {
    const p = productOfSku(v.sku);
    const reserved = reservedFor(s, v.sku);
    const available = v.onHand - reserved - v.unavailable;
    const inc = incomingFor(s, v.sku);
    const incDraft = incomingFor(s, v.sku, true).filter((x) => x.po.status === "Draft");
    const rate = rateFor(s, v);
    const cover = rate > 0 ? available / rate : null;
    const lowHistory = p.family === "Jockeys";
    const flags: string[] = [];
    if (available <= 0 && rate > 0) flags.push("Unavailable");
    else if (cover !== null && cover < 14) flags.push("Low cover");
    if (cover !== null && cover > 180 && available > 40) flags.push("Overstock");
    if (v.stockoutDays > 0) flags.push("Stockout in period");
    if (lowHistory) flags.push("Low history");
    return {
      v, p, sku: v.sku, size: v.size, name: p.name, onHand: v.onHand, reserved, unavailable: v.unavailable, available,
      incoming: inc.reduce((a, x) => a + x.qty, 0), incomingDraft: incDraft.reduce((a, x) => a + x.qty, 0),
      nextArrival: inc[0]?.date, nextArrivalQty: inc[0]?.qty,
      s30o: v.s30o, s30w: wu[v.sku] || 0, s28: v.s28, rate, cover, valueAtCost: v.onHand * p.cost, flags, lowHistory,
    };
  });
}

export function stockTotals(s: JodzState) {
  const rows = variantRows(s);
  return {
    onHand: rows.reduce((a, r) => a + r.onHand, 0),
    reserved: rows.reduce((a, r) => a + r.reserved, 0),
    unavailable: rows.reduce((a, r) => a + r.unavailable, 0),
    available: rows.reduce((a, r) => a + r.available, 0),
    incoming: rows.reduce((a, r) => a + r.incoming, 0),
    valueAtCost: rows.reduce((a, r) => a + r.valueAtCost, 0),
    lowCover: rows.filter((r) => r.flags.includes("Low cover") || r.flags.includes("Unavailable")),
    overstock: rows.filter((r) => r.flags.includes("Overstock")),
  };
}

/* ---------------- wholesale orders ---------------- */

export const OPEN_STAGES = ["Confirmed", "Allocated", "Dispatched"];

export interface OrderRow {
  o: WholesaleOrder; retailerName: string; units: number; value: number; allocated: number;
  /** Units not reserved yet. */
  unallocated: number;
  /** Unreserved units that available stock cannot cover today. */
  short: number; dispatched: number;
  openUnits: number; openValue: number; allocation: string; fulfilment: string; payment: string; invoices: Invoice[];
  isOpen: boolean; flags: string[];
}

/** Trade price for one order line. */
export const linePrice = (o: WholesaleOrder, l: WholesaleOrder["lines"][number]) => l.price ?? o.price;

export function orderRow(s: JodzState, o: WholesaleOrder): OrderRow {
  const units = o.lines.reduce((a, l) => a + l.qty, 0);
  const allocated = o.lines.reduce((a, l) => a + l.allocated, 0);
  const dispatched = o.lines.reduce((a, l) => a + l.dispatched, 0);
  const unallocated = units - allocated;
  const short = o.stage === "Draft" || o.stage === "Complete" ? 0
    : o.lines.reduce((a, l) => a + Math.max(0, l.qty - l.allocated - Math.max(0, availableFor(s, l.sku))), 0);
  const isOpen = OPEN_STAGES.includes(o.stage) && units > dispatched;
  const invoices = s.invoices.filter((i) => i.orderId === o.id);
  const allocation = o.stage === "Draft" ? "Not reserved (draft)" : allocated === 0 ? "Unallocated" : unallocated > 0 ? "Part allocated" : "Allocated";
  const fulfilment = o.stage === "Complete" ? "Complete" : dispatched > 0 ? (dispatched < units ? "Part dispatched" : "Dispatched") : o.stage === "Draft" ? "Draft" : "Not dispatched";
  let payment = "Not invoiced";
  if (invoices.length) {
    const bal = invoices.reduce((a, i) => a + i.net + i.tax - i.paid, 0);
    const overdue = invoices.some((i) => i.net + i.tax - i.paid > 0 && i.due < SNAPSHOT);
    payment = bal <= 0 ? "Paid" : overdue ? "Overdue" : invoices.some((i) => i.paid > 0) ? "Part paid" : "Invoiced, unpaid";
  }
  const flags: string[] = [];
  if (isOpen && short > 0 && o.stage !== "Draft") flags.push(short + " short");
  if (isOpen && unallocated > short && o.stage !== "Draft") flags.push(unallocated - short + " to reserve");
  if (o.paymentHold || s.invoices.some((i) => i.retailerId === o.retailerId && i.net + i.tax - i.paid > 0 && i.due < SNAPSHOT)) flags.push("Payment hold");
  if (isOpen && o.requestedDispatch < SNAPSHOT) flags.push("Past requested date");
  return {
    o, retailerName: retailer(o.retailerId).name, units, unallocated, value: o.lines.reduce((a, l) => a + l.qty * linePrice(o, l), 0), allocated, short, dispatched,
    openUnits: isOpen ? units - dispatched : 0, openValue: isOpen ? o.lines.reduce((a, l) => a + (l.qty - l.dispatched) * linePrice(o, l), 0) : 0,
    allocation, fulfilment, payment, invoices, isOpen, flags,
  };
}

export function orderRows(s: JodzState) {
  return s.orders.map((o) => orderRow(s, o));
}

export function openOrderBook(s: JodzState) {
  const rows = orderRows(s).filter((r) => r.isOpen);
  return { rows, count: rows.length, value: rows.reduce((a, r) => a + r.openValue, 0), units: rows.reduce((a, r) => a + r.openUnits, 0), short: rows.reduce((a, r) => a + r.short, 0) };
}

/* ---------------- invoices + bills ---------------- */

export function invoiceBalance(i: Invoice) {
  return i.net + i.tax - i.paid;
}
export function invoiceStatus(i: Invoice) {
  const bal = invoiceBalance(i);
  if (bal <= 0) return "Paid";
  if (i.due < SNAPSHOT) return "Overdue";
  return i.paid > 0 ? "Part paid" : "Due";
}
export function daysOverdue(i: Invoice) {
  return Math.max(0, daysBetween(i.due, SNAPSHOT));
}
export function billBalance(b: Bill) {
  return b.net + b.tax - b.paid;
}

export function receivables(s: JodzState) {
  const open = s.invoices.filter((i) => invoiceBalance(i) > 0);
  const overdue = open.filter((i) => i.due < SNAPSHOT);
  return { open, overdue, total: open.reduce((a, i) => a + invoiceBalance(i), 0), overdueTotal: overdue.reduce((a, i) => a + invoiceBalance(i), 0) };
}

export function payables(s: JodzState) {
  const open = s.bills.filter((b) => billBalance(b) > 0);
  const poDue = s.pos.filter((p) => p.status !== "Draft").flatMap((p) => poPayments(p).filter((x) => !x.paid));
  return { open, total: open.reduce((a, b) => a + billBalance(b), 0), poDue, poTotal: poDue.reduce((a, x) => a + x.amount, 0) };
}

export function poTotal(p: PurchaseOrder) {
  return p.lines.reduce((a, l) => a + l.qty, 0) * p.unitCost;
}
export function poUnits(p: PurchaseOrder) {
  return p.lines.reduce((a, l) => a + l.qty, 0);
}
export function poPayments(p: PurchaseOrder) {
  const total = poTotal(p);
  const dep = Math.round((total * p.depositPct) / 100);
  return [
    { label: "Deposit", amount: dep, date: p.depositDate, paid: p.depositPaid },
    { label: "Balance", amount: total - dep, date: p.balanceDate, paid: p.balancePaid },
  ];
}

/* ---------------- cash outlook ---------------- */

export interface CashLine extends CashEvent { source: string }

export function bankCash(s: JodzState) {
  return OPENING_CASH + s.bankAdjust;
}

/** Every expected movement in the next 90 days. Each source contributes once. */
export function cashLines(s: JodzState, opts: { includeDraft?: boolean; scenario?: JodzState["scenario"] } = {}): CashLine[] {
  const scenario = opts.scenario ?? s.scenario;
  const includeDraft = opts.includeDraft ?? s.purchasePreview;
  const end = addDays(SNAPSHOT, 90);
  const lines: CashLine[] = [];
  const late = scenario === "late" ? 30 : 0;
  for (const e of CASH_EVENTS) {
    let amount = e.amount, date = e.date;
    if (scenario === "slow" && e.category === "Online payouts") amount = Math.round(amount * 0.85);
    if (scenario === "slow" && e.category === "Predicted wholesale") amount = Math.round(amount * 0.5);
    if (e.category === "Predicted wholesale") date = addDays(date, late);
    // an approved trim of the November ad plan takes €1,000 off each seasonal payment
    if (e.label === "Seasonal advertising" && s.adChanges && s.adChanges["nov-trim"] === "approved") amount += 1000;
    lines.push({ ...e, amount, date, source: e.category === "Predicted wholesale" ? "Predicted, not an order" : "Seeded demo cash item" });
  }
  for (const i of s.invoices) {
    const bal = invoiceBalance(i);
    if (bal <= 0) continue;
    let date = i.expected < SNAPSHOT ? addDays(SNAPSHOT, 7) : i.expected;
    date = addDays(date, late);
    lines.push({ id: "inv-" + i.id, date, amount: bal, label: i.id + " · " + retailer(i.retailerId).name, category: "Invoice collections", certainty: "known", kind: "receipt", link: { kind: "invoice", id: i.id }, source: "Open invoice balance" });
  }
  for (const r of orderRows(s)) {
    if (!r.isOpen || r.o.stage === "Draft") continue;
    // undispatched value is invoiced on dispatch; dispatched value already has an invoice above
    const ship = r.o.promiseDate || r.o.requestedDispatch;
    const date = addDays(addDays(ship < SNAPSHOT ? SNAPSHOT : ship, retailer(r.o.retailerId).terms), late);
    lines.push({ id: "ord-" + r.o.id, date, amount: r.openValue, label: r.o.id + " · " + r.retailerName, category: "Open wholesale orders", certainty: "known", kind: "receipt", link: { kind: "order", id: r.o.id }, source: "Confirmed order, invoiced on dispatch" });
  }
  for (const b of s.bills) {
    const bal = billBalance(b);
    if (bal <= 0) continue;
    lines.push({ id: "bill-" + b.id, date: b.expected < SNAPSHOT ? SNAPSHOT : b.expected, amount: -bal, label: b.id + " · " + b.payee, category: "Supplier bills", certainty: "known", kind: "payment", link: { kind: "bill", id: b.id }, source: "Open bill" });
  }
  for (const p of s.pos) {
    // received orders can still owe a balance
    const committed = p.status === "Confirmed" || p.status === "Approved" || p.status === "Received";
    const draft = p.status === "Draft" && includeDraft;
    if (!committed && !draft) continue;
    for (const pay of poPayments(p)) {
      if (pay.paid) continue;
      lines.push({ id: "po-" + p.id + "-" + pay.label, date: pay.date, amount: -pay.amount, label: p.id + " " + pay.label.toLowerCase() + " · " + supplier(p.supplierId).name, category: draft ? "Draft purchase (preview)" : "Supplier deposits and balances", certainty: draft ? "estimated" : "known", kind: "payment", link: { kind: "po", id: p.id }, source: draft ? "Draft, not approved" : "Committed purchase order" });
    }
  }
  return lines.filter((l) => l.date > SNAPSHOT && l.date <= end).sort((a, b) => a.date.localeCompare(b.date));
}

export interface CashOutlook {
  opening: number; lines: CashLine[]; series: { date: string; day: number; balance: number }[];
  horizons: { day: number; date: string; receipts: number; payments: number; closing: number }[];
  low: { balance: number; date: string; day: number }; breach: { date: string; day: number } | null; buffer: number;
}

export function cashOutlook(s: JodzState, opts: { includeDraft?: boolean; scenario?: JodzState["scenario"] } = {}): CashOutlook {
  const opening = bankCash(s);
  const lines = cashLines(s, opts);
  const series: CashOutlook["series"] = [];
  let bal = opening;
  let low = { balance: opening, date: SNAPSHOT, day: 0 };
  let breach: CashOutlook["breach"] = null;
  const buffer = s.assumptions.buffer;
  for (let d = 1; d <= 90; d++) {
    const date = addDays(SNAPSHOT, d);
    for (const l of lines) if (l.date === date) bal += l.amount;
    series.push({ date, day: d, balance: bal });
    if (bal < low.balance) low = { balance: bal, date, day: d };
    if (!breach && bal < buffer) breach = { date, day: d };
  }
  const horizons = [30, 60, 90].map((day) => {
    const date = addDays(SNAPSHOT, day);
    const upTo = lines.filter((l) => l.date <= date);
    const receipts = upTo.filter((l) => l.amount > 0).reduce((a, l) => a + l.amount, 0);
    const payments = -upTo.filter((l) => l.amount < 0).reduce((a, l) => a + l.amount, 0);
    return { day, date, receipts, payments, closing: opening + receipts - payments };
  });
  return { opening, lines, series, horizons, low, breach, buffer };
}

/* ---------------- forecasting ---------------- */

function monthMult(s: JodzState, date: string) {
  const m = date.slice(5, 7);
  if (m === "11") return 1 + s.assumptions.novUpliftPct / 100;
  if (m === "12") return 1 + s.assumptions.decUpliftPct / 100;
  return 1;
}

export function demandUnits(s: JodzState, v: Variant, days: number) {
  const r = rateFor(s, v);
  let n = 0;
  for (let d = 1; d <= days; d++) n += r * monthMult(s, addDays(SNAPSHOT, d));
  return n;
}

export function confidence(v: Variant) {
  if (productOfSku(v.sku).family === "Jockeys") return { label: "Low", spread: 0.4, why: "New range, under 60 days of sales" };
  if (v.stockoutDays > 0) return { label: "Medium", spread: 0.25, why: "Stockout in the period; rate adjusted for days available" };
  if (v.s28 < 10) return { label: "Medium", spread: 0.3, why: "Few sales to learn from" };
  return { label: "High", spread: 0.15, why: "Steady sales, stock available all period" };
}

export function predictedReorders(s: JodzState) {
  return RETAILERS.map((r) => {
    const next = addDays(r.lastOrder, r.intervalDays);
    const hasOpen = s.orders.some((o) => o.retailerId === r.id && orderRow(s, o).isOpen);
    const overdue = s.invoices.some((i) => i.retailerId === r.id && invoiceBalance(i) > 0 && i.due < SNAPSHOT);
    const inHorizon = next <= addDays(SNAPSHOT, 90);
    let status = inHorizon ? "Likely" : "Outside 90 days";
    if (overdue) status = "On hold: overdue invoice";
    return { r, next, windowFrom: addDays(next, -10), windowTo: addDays(next, 10), hasOpen, overdue, inHorizon, status, includedInCash: inHorizon && !overdue };
  });
}

export function demandSummary(s: JodzState) {
  return [30, 60, 90].map((days) => {
    let online = 0, lo = 0, hi = 0;
    for (const v of s.variants) {
      const u = demandUnits(s, v, days);
      const c = confidence(v);
      online += u; lo += u * (1 - c.spread); hi += u * (1 + c.spread);
    }
    const end = addDays(SNAPSHOT, days);
    const confirmed = openOrderBook(s).rows.reduce((a, r) => a + r.openUnits, 0);
    const predicted = predictedReorders(s).filter((p) => p.includedInCash && p.next <= end).reduce((a, p) => a + p.r.typicalUnits, 0);
    return { days, online: Math.round(online), onlineLo: Math.round(lo), onlineHi: Math.round(hi), onlineOrders: Math.round(online / 1.25), confirmedWholesale: confirmed, predictedWholesale: predicted };
  });
}

/** Day-by-day usable stock: available now, plus arrivals, less forecast online demand.
    Open-order commitments are already out of "available", so they are not taken again. */
export function projection(s: JodzState, sku: string, days = 90, includeDraft = false) {
  const v = s.variants.find((x) => x.sku === sku)!;
  const avail = v.onHand - reservedFor(s, sku) - v.unavailable;
  const inc = incomingFor(s, sku, includeDraft);
  const rate = rateFor(s, v);
  let stock = avail;
  let stockoutDate: string | null = avail <= 0 && rate > 0 ? SNAPSHOT : null;
  let unmet = 0;
  const pts: { date: string; day: number; stock: number }[] = [{ date: SNAPSHOT, day: 0, stock: avail }];
  for (let d = 1; d <= days; d++) {
    const date = addDays(SNAPSHOT, d);
    for (const x of inc) if (x.date === date) stock += x.qty;
    const want = rate * monthMult(s, date);
    if (stock >= want) stock -= want;
    else {
      unmet += want - Math.max(0, stock);
      stock = 0;
      if (!stockoutDate) stockoutDate = date;
    }
    pts.push({ date, day: d, stock });
  }
  const nextArrival = inc[0];
  return { pts, stockoutDate, unmet: Math.round(unmet), nextArrival, rate, avail };
}

export function suggestedQty(s: JodzState, r: VariantRow) {
  if (r.flags.includes("Overstock")) return 0;
  const lead = r.p.family === "Jockeys" ? 42 : 35;
  const need = demandUnits(s, r.v, lead + s.assumptions.coverTargetDays);
  const gap = need - (Math.max(0, r.available) + r.incoming);
  return gap > 0 ? Math.ceil(gap / 10) * 10 : 0;
}

/* ---------------- links ---------------- */

const extraLabels: Partial<Record<RecordLink["kind"], (id: string) => string>> = {};
/** Lets other modules (marketing.ts) name their own record kinds without a circular import. */
export function registerLinkLabel(kind: RecordLink["kind"], fn: (id: string) => string) {
  extraLabels[kind] = fn;
}

export function linkLabel(l: RecordLink) {
  const extra = extraLabels[l.kind];
  if (extra) return extra(l.id);
  if (l.kind === "variant") return variantName(l.id);
  if (l.kind === "retailer") return retailer(l.id).name;
  if (l.kind === "supplier") return supplier(l.id).name;
  return l.id;
}

export function sumBy<T>(xs: T[], f: (x: T) => number) {
  return xs.reduce((a, x) => a + f(x), 0);
}
