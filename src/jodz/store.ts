/* One shared Jod-Z state. Every module reads it through the selectors in derive.ts,
   and every demo action goes through the functions below, so a change made on one
   screen shows up on every other screen without being counted twice. */
import { useSyncExternalStore } from "react";
import { PRODUCTS } from "./data";
import {
  VARIANTS, ORDERS, INVOICES, BILLS, PURCHASE_ORDERS, RETURNS, MOVEMENTS, TASKS_SEED, DEFAULT_BUFFER, SNAPSHOT, SNAPSHOT_LABEL,
  type Variant, type WholesaleOrder, type Invoice, type Bill, type PurchaseOrder, type ReturnRec, type Movement,
  type RecordLink, type Stage,
} from "./data";

export type Outcome = "Detected" | "Draft prepared" | "Awaiting approval" | "Approved in demo" | "Simulated" | "Declined";

export interface ActivityEvent {
  id: string; at: string; actor: string; actorKind: "agent" | "person" | "system"; title: string; detail: string;
  outcome: Outcome; link?: RecordLink; stream: "people" | "agents" | "data";
}

export interface Approval {
  id: string; kind: "Purchase" | "Stock adjustment" | "Partial dispatch"; title: string; detail: string; value: string;
  requestedBy: string; approver: string; raised: string; status: "Awaiting approval" | "Approved in demo" | "Declined";
  link: RecordLink;
}

export interface Task {
  id: string; title: string; owner: string; due: string; priority: string; status: string; link: RecordLink; thread: string;
}

export interface Assumptions {
  growthPct: number; novUpliftPct: number; decUpliftPct: number; buffer: number; coverTargetDays: number;
  /** Extra demand per product, in percent, from trend signals applied in the demo. */
  productUplift: Record<string, number>;
}

export type TrendStatus = "New" | "Watching" | "Applied" | "Dismissed";
export type AdChangeStatus = "none" | "drafted" | "approved";

export type Scenario = "base" | "slow" | "late";

export interface DrawerRef { kind: RecordLink["kind"]; id: string }

export interface JodzState {
  variants: Variant[];
  orders: WholesaleOrder[];
  invoices: Invoice[];
  bills: Bill[];
  pos: PurchaseOrder[];
  returns: ReturnRec[];
  movements: Movement[];
  tasks: Task[];
  approvals: Approval[];
  activity: ActivityEvent[];
  assumptions: Assumptions;
  bankAdjust: number;
  simulatedCash: { date: string; amount: number; label: string; link?: RecordLink }[];
  purchasePreview: boolean;
  scenario: Scenario;
  clearanceReview: boolean;
  drawer: DrawerRef | null;
  toast: string | null;
  seq: number;
  sections: Record<string, string>;
  trendStatus: Record<string, TrendStatus>;
  adChanges: Record<string, AdChangeStatus>;
}

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

const SEED_ACTIVITY: ActivityEvent[] = [
  { id: "a1", at: "2026-09-26 07:02", actor: "Briefing", actorKind: "agent", title: "Morning briefing prepared", detail: "Four items need a decision: Admiral Navy S cover, JOD-W1041 shortage, JOD-INV2031 overdue, PO-D193 cash impact.", outcome: "Draft prepared", stream: "agents" },
  { id: "a2", at: "2026-09-26 06:40", actor: "Stock & Demand", actorKind: "agent", title: "Low cover detected on Admiral Navy S", detail: "6 available against about 3 a day. Next confirmed delivery (PO-0187) is 24 Oct.", outcome: "Detected", link: { kind: "variant", id: "JZ-AN-S" }, stream: "agents" },
  { id: "a3", at: "2026-09-26 06:41", actor: "Ops Watchdog", actorKind: "agent", title: "Shortage detected on JOD-W1041", detail: "Midnight Black M: 24 requested, 12 allocated, 12 short. Task T-102 created for Rory.", outcome: "Detected", link: { kind: "order", id: "JOD-W1041" }, stream: "agents" },
  { id: "a4", at: "2026-09-26 06:45", actor: "Finance & Cash", actorKind: "agent", title: "Reminder drafted for JOD-INV2031", detail: "€1,800 is 18 days overdue. Draft saved, not sent.", outcome: "Draft prepared", link: { kind: "invoice", id: "JOD-INV2031" }, stream: "agents" },
  { id: "a5", at: "2026-09-25 17:10", actor: "Stock & Demand", actorKind: "agent", title: "Draft replenishment PO-D193 prepared", detail: "600 units, €10,800. Awaiting approval. Not sent to the supplier.", outcome: "Awaiting approval", link: { kind: "po", id: "PO-D193" }, stream: "agents" },
  { id: "a6", at: "2026-09-25 16:30", actor: "Stock & Demand", actorKind: "agent", title: "Slow mover flagged: Candy Floss Pink L", detail: "96 available, 5 sold in 28 days, €1,728 at cost. Recommend pausing replenishment.", outcome: "Detected", link: { kind: "variant", id: "JZ-CF-L" }, stream: "agents" },
  { id: "a7", at: "2026-09-25 15:02", actor: "Maeve Breslin", actorKind: "person", title: "Return RET-316 received", detail: "Candy Floss Pink L, sellable. Restock decision pending.", outcome: "Simulated", link: { kind: "return", id: "RET-316" }, stream: "people" },
  { id: "a8", at: "2026-09-24 11:20", actor: "Declan Whelan", actorKind: "person", title: "Payment recorded on JOD-INV2034", detail: "€2,400 from Saddle & Stirrup (simulated bank transfer).", outcome: "Simulated", link: { kind: "invoice", id: "JOD-INV2034" }, stream: "people" },
  { id: "a9", at: "2026-09-22 09:12", actor: "Shopify (demo connection)", actorKind: "system", title: "Order data synced", detail: "Simulated data. 11 online orders imported.", outcome: "Simulated", stream: "data" },
  { id: "a13", at: "2026-09-26 06:30", actor: "Meta Ads and Google Ads (demo connections)", actorKind: "system", title: "Ad performance synced", detail: "Simulated data. 30 days of spend, clicks and reported conversions for 7 campaigns.", outcome: "Simulated", stream: "data" },
  { id: "a14", at: "2026-09-26 06:48", actor: "Stock & Demand", actorKind: "agent", title: "Trend detected: navy riding leggings for kids", detail: "Search interest up 34% in 8 weeks (simulated index). Admiral Navy S already has about 2 days of cover.", outcome: "Detected", link: { kind: "signal", id: "sig-navy" }, stream: "agents" },
  { id: "a15", at: "2026-09-26 06:52", actor: "Finance & Cash", actorKind: "agent", title: "Ad spend on a low-cover variant", detail: "'Hero · Admiral Navy' spends about €15 a day while size S has about 2 days of cover.", outcome: "Detected", link: { kind: "campaign", id: "m4" }, stream: "agents" },
  { id: "a16", at: "2026-09-25 16:40", actor: "Stock & Demand", actorKind: "agent", title: "Ad change drafted: Clearance · Candy Floss Pink L", detail: "Draft only. €10 a day for 14 days, size L only. Nothing has been changed in Meta.", outcome: "Draft prepared", link: { kind: "campaign", id: "m5" }, stream: "agents" },
  { id: "a10", at: "2026-09-22 09:00", actor: "Rory Kinsella", actorKind: "person", title: "JOD-W1043 confirmed", detail: "Riverbend Tack Room, 80 units, €2,400. Not yet allocated.", outcome: "Simulated", link: { kind: "order", id: "JOD-W1043" }, stream: "people" },
  { id: "a11", at: "2026-09-19 14:30", actor: "Rory Kinsella", actorKind: "person", title: "JOD-W1038 dispatched", detail: "120 units to Hillcrest Equestrian. Invoice JOD-INV2036 raised.", outcome: "Simulated", link: { kind: "order", id: "JOD-W1038" }, stream: "people" },
  { id: "a12", at: "2026-09-19 10:05", actor: "Maeve Breslin", actorKind: "person", title: "Damaged return quarantined", detail: "RET-312, Midnight Black M. Held as unavailable.", outcome: "Simulated", link: { kind: "return", id: "RET-312" }, stream: "people" },
];

const SEED_APPROVALS: Approval[] = [
  { id: "AP-31", kind: "Purchase", title: "Replenishment PO-D193", detail: "600 units from Northgate Knitwear (Demo). €3,240 deposit within 30 days, €7,560 in days 31-60.", value: "€10,800", requestedBy: "Stock & Demand", approver: "ad", raised: "2026-09-25", status: "Awaiting approval", link: { kind: "po", id: "PO-D193" } },
  { id: "AP-32", kind: "Stock adjustment", title: "Write off 2 damaged Midnight Black M", detail: "RET-311 and RET-312 are quarantined. Writing off removes them from on-hand stock.", value: "2 units · €36 at cost", requestedBy: "Maeve Breslin", approver: "ad", raised: "2026-09-24", status: "Awaiting approval", link: { kind: "variant", id: "JZ-MB-M" } },
];

function initial(): JodzState {
  return {
    variants: clone(VARIANTS),
    orders: clone(ORDERS),
    invoices: clone(INVOICES).map((i) => (i.id === "JOD-INV2031" ? { ...i, reminder: "drafted" as const } : i)),
    bills: clone(BILLS),
    pos: clone(PURCHASE_ORDERS),
    returns: clone(RETURNS),
    movements: clone(MOVEMENTS),
    tasks: clone(TASKS_SEED),
    approvals: clone(SEED_APPROVALS),
    activity: clone(SEED_ACTIVITY),
    assumptions: { growthPct: 0, novUpliftPct: 10, decUpliftPct: 30, buffer: DEFAULT_BUFFER, coverTargetDays: 60, productUplift: {} },
    bankAdjust: 0,
    simulatedCash: [],
    purchasePreview: false,
    scenario: "base",
    clearanceReview: false,
    drawer: null,
    toast: null,
    seq: 100,
    sections: { Inventory: "stock", Accounting: "overview", Forecasting: "demand", Reporting: "summary", Trends: "signals", Advertising: "overview" },
    trendStatus: {},
    adChanges: { "cfp-clearance": "drafted" },
  };
}

let state: JodzState = initial();
const listeners = new Set<() => void>();

export function getState(): JodzState {
  return state;
}

function set(patch: Partial<JodzState> | ((s: JodzState) => Partial<JodzState>)) {
  const p = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...p };
  listeners.forEach((l) => l());
}

export function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useJodz(): JodzState {
  return useSyncExternalStore(subscribe, getState, getState);
}

/* ---------------- navigation bridge ----------------
   Pulse owns the page; the store owns which record is open. */
let navigator: ((page: string) => void) | null = null;
export function registerNavigator(fn: (page: string) => void) {
  navigator = fn;
}

export const PAGE_FOR: Record<RecordLink["kind"], [string, string?]> = {
  variant: ["Inventory", "stock"],
  order: ["Dashboard"],
  invoice: ["Accounting", "invoices"],
  bill: ["Accounting", "invoices"],
  po: ["Inventory", "incoming"],
  return: ["Inventory", "returns"],
  retailer: ["Dashboard"],
  supplier: ["Inventory", "incoming"],
  approval: ["Work"],
  task: ["Work"],
  campaign: ["Advertising"],
  signal: ["Trends", "signals"],
};

export function openRecord(link: RecordLink, page?: string, section?: string) {
  const draftPo = link.kind === "po" && state.pos.some((x) => x.id === link.id && x.status === "Draft");
  const [p, sec] = draftPo ? ["Forecasting", "buying"] : PAGE_FOR[link.kind];
  const target = page || p;
  const s = section || sec;
  set((st) => ({ drawer: { kind: link.kind, id: link.id }, sections: s ? { ...st.sections, [target]: s } : st.sections }));
  navigator?.(target);
}

export function goTo(page: string, section?: string) {
  if (section) set((st) => ({ sections: { ...st.sections, [page]: section } }));
  navigator?.(page);
}

export function setSection(page: string, section: string) {
  set((st) => ({ sections: { ...st.sections, [page]: section }, drawer: null }));
}

export function openDrawer(kind: RecordLink["kind"], id: string) {
  set({ drawer: { kind, id } });
}
export function closeDrawer() {
  set({ drawer: null });
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;
export function toast(msg: string) {
  set({ toast: msg });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => set({ toast: null }), 3200);
}

/* ---------------- helpers ---------------- */

const now = () => {
  const d = new Date();
  return SNAPSHOT + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
};

function log(e: Omit<ActivityEvent, "id" | "at">) {
  set((s) => ({ seq: s.seq + 1, activity: [{ ...e, id: "a" + (s.seq + 1), at: now() }, ...s.activity] }));
}

function move(sku: string, qty: number, kind: string, ref: string, note: string) {
  set((s) => ({ seq: s.seq + 1, movements: [{ id: "mv" + (s.seq + 1), sku, date: SNAPSHOT, qty, kind, ref, note }, ...s.movements] }));
}

function patchVariant(sku: string, f: (v: Variant) => Variant) {
  set((s) => ({ variants: s.variants.map((v) => (v.sku === sku ? f(v) : v)) }));
}

function patchOrder(id: string, f: (o: WholesaleOrder) => WholesaleOrder) {
  set((s) => ({ orders: s.orders.map((o) => (o.id === id ? f(o) : o)) }));
}

function doneTasks(link: RecordLink) {
  set((s) => ({ tasks: s.tasks.map((t) => (t.link.kind === link.kind && t.link.id === link.id ? { ...t, status: "Done" } : t)) }));
}

/** Units currently reserved against open wholesale orders. */
export function reservedFor(s: JodzState, sku: string): number {
  let n = 0;
  for (const o of s.orders) {
    if (o.stage === "Draft" || o.stage === "Complete") continue;
    for (const l of o.lines) if (l.sku === sku) n += Math.max(0, l.allocated - l.dispatched);
  }
  return n;
}

export function availableFor(s: JodzState, sku: string): number {
  const v = s.variants.find((x) => x.sku === sku);
  if (!v) return 0;
  return v.onHand - reservedFor(s, sku) - v.unavailable;
}

/* ---------------- wholesale actions ---------------- */

const SKU_PRODUCT: Record<string, string> = { AN: "an", MB: "mbk", BB: "bb", CF: "cfp", MY: "mby", PB: "pb", MON: "mon", ECL: "ecl" };
/** Agreed trade price for a variant, ex tax. */
export function tradeOf(sku: string): number {
  const p = PRODUCTS.find((x) => x.id === SKU_PRODUCT[sku.split("-")[1]]);
  return p ? p.trade : 30;
}

export function createOrder(retailerId: string, lines: { sku: string; qty: number }[], requestedDispatch: string, owner: string) {
  const s = getState();
  const next = 1044 + s.orders.filter((o) => Number(o.id.slice(5)) >= 1044).length;
  const id = "JOD-W" + next;
  const order: WholesaleOrder = {
    id, retailerId, stage: "Draft", created: SNAPSHOT, requestedDispatch, owner, price: 30,
    lines: lines.filter((l) => l.qty > 0).map((l) => ({ sku: l.sku, qty: l.qty, allocated: 0, dispatched: 0, price: tradeOf(l.sku) })),
    dispatches: [], notes: ["Created in the demo. Draft orders are not revenue and do not reserve stock."],
  };
  set((st) => ({ orders: [order, ...st.orders] }));
  log({ actor: "Rory Kinsella", actorKind: "person", title: id + " created as draft", detail: order.lines.reduce((a, l) => a + l.qty, 0) + " units. Not counted as revenue.", outcome: "Simulated", link: { kind: "order", id }, stream: "people" });
  toast(id + " saved as a draft");
  return id;
}

export function confirmOrder(id: string) {
  patchOrder(id, (o) => ({ ...o, stage: o.stage === "Draft" ? "Confirmed" : o.stage }));
  log({ actor: "Rory Kinsella", actorKind: "person", title: id + " confirmed", detail: "Ready to allocate.", outcome: "Simulated", link: { kind: "order", id }, stream: "people" });
}

/** Reserve whatever stock is available against each unallocated line. Never double-reserves. */
export function reserveStock(id: string) {
  const s = getState();
  const o = s.orders.find((x) => x.id === id);
  if (!o || o.stage === "Draft" || o.stage === "Complete") return;
  let reservedNow = 0;
  const lines = o.lines.map((l) => {
    const need = l.qty - l.allocated;
    if (need <= 0) return l;
    const take = Math.max(0, Math.min(need, availableFor(getState(), l.sku)));
    reservedNow += take;
    const nl = { ...l, allocated: l.allocated + take };
    patchOrder(id, (x) => ({ ...x, lines: x.lines.map((y) => (y.sku === l.sku ? nl : y)) }));
    return nl;
  });
  const short = lines.reduce((a, l) => a + (l.qty - l.allocated), 0);
  patchOrder(id, (x) => ({ ...x, stage: short === 0 && x.stage === "Confirmed" ? "Allocated" : x.stage }));
  if (reservedNow > 0) {
    log({ actor: "Rory Kinsella", actorKind: "person", title: "Stock reserved for " + id, detail: reservedNow + " units reserved." + (short ? " " + short + " still short." : " Fully allocated."), outcome: "Simulated", link: { kind: "order", id }, stream: "people" });
    toast(reservedNow + " units reserved" + (short ? ", " + short + " still short" : ""));
    if (!short) doneTasks({ kind: "order", id });
  } else {
    toast(short ? "No available stock to reserve. " + short + " units short." : "Already fully allocated");
  }
}

/** Raise a partial-dispatch proposal for approval. */
export function proposePartialDispatch(id: string) {
  const s = getState();
  if (s.approvals.some((a) => a.kind === "Partial dispatch" && a.link.id === id && a.status === "Awaiting approval")) {
    toast("A partial dispatch proposal is already awaiting approval");
    return;
  }
  const o = s.orders.find((x) => x.id === id);
  if (!o) return;
  const alloc = o.lines.reduce((a, l) => a + l.allocated - l.dispatched, 0);
  const short = o.lines.reduce((a, l) => a + l.qty - l.allocated, 0);
  const allocValue = o.lines.reduce((a, l) => a + (l.allocated - l.dispatched) * (l.price ?? o.price), 0);
  const shortValue = o.lines.reduce((a, l) => a + (l.qty - l.allocated) * (l.price ?? o.price), 0);
  const ap: Approval = {
    id: "AP-" + (s.seq + 1), kind: "Partial dispatch", title: "Partial dispatch of " + id,
    detail: "Send the " + alloc + " allocated units now. " + short + " follow when PO-0187 lands (24 Oct). Needs the retailer's agreement.",
    value: "€" + allocValue.toLocaleString("en-IE") + " now · €" + shortValue.toLocaleString("en-IE") + " later",
    requestedBy: "Rory Kinsella", approver: "ad", raised: SNAPSHOT, status: "Awaiting approval", link: { kind: "order", id },
  };
  set((st) => ({ seq: st.seq + 1, approvals: [ap, ...st.approvals] }));
  log({ actor: "Ops Watchdog", actorKind: "agent", title: "Partial dispatch proposed for " + id, detail: ap.detail, outcome: "Awaiting approval", link: { kind: "order", id }, stream: "agents" });
  toast("Partial dispatch sent for approval");
}

export function setPromiseDate(id: string, date: string) {
  patchOrder(id, (o) => ({ ...o, promiseDate: date, notes: ["New dispatch date proposed: " + date + ". Not yet agreed with the retailer.", ...o.notes] }));
  log({ actor: "Rory Kinsella", actorKind: "person", title: "New delivery date drafted for " + id, detail: "Proposed " + date + ". Message to the retailer not sent.", outcome: "Draft prepared", link: { kind: "order", id }, stream: "people" });
  toast("Updated delivery date drafted");
}

/** Simulated dispatch of every allocated, undispatched unit. Raises an invoice for what shipped. */
export function dispatchOrder(id: string) {
  const s = getState();
  const o = s.orders.find((x) => x.id === id);
  if (!o) return;
  const ship = o.lines.map((l) => ({ sku: l.sku, n: l.allocated - l.dispatched, price: l.price ?? o.price })).filter((x) => x.n > 0);
  const units = ship.reduce((a, x) => a + x.n, 0);
  const value = ship.reduce((a, x) => a + x.n * x.price, 0);
  if (!units) {
    toast("Nothing allocated to dispatch");
    return;
  }
  ship.forEach((x) => {
    patchVariant(x.sku, (v) => ({ ...v, onHand: v.onHand - x.n }));
    move(x.sku, -x.n, "Dispatched", id, "Wholesale dispatch (simulated)");
  });
  const remaining = o.lines.reduce((a, l) => a + l.qty - l.allocated, 0);
  const stage: Stage = remaining ? "Dispatched" : "Complete";
  patchOrder(id, (x) => ({
    ...x, stage, completed: SNAPSHOT,
    lines: x.lines.map((l) => ({ ...l, dispatched: l.allocated })),
    dispatches: [...x.dispatches, { date: SNAPSHOT, units, value, note: remaining ? "Part dispatch, " + remaining + " to follow (simulated)" : "Full dispatch (simulated)" }],
  }));
  const st2 = getState();
  const retailer = o.retailerId;
  const invId = "JOD-INV" + (2040 + st2.invoices.filter((i) => Number(i.id.slice(7)) >= 2040).length);
  const due = addDays(SNAPSHOT, 30);
  set((st) => ({ invoices: [{ id: invId, orderId: id, retailerId: retailer, issued: SNAPSHOT, due, net: value, tax: 0, paid: 0, expected: due, reminder: "none", payments: [] }, ...st.invoices] }));
  log({ actor: "Rory Kinsella", actorKind: "person", title: id + (remaining ? " part-dispatched" : " dispatched"), detail: units + " units shipped (simulated). " + invId + " raised for €" + value.toLocaleString("en-IE") + ". Payment status is tracked separately.", outcome: "Simulated", link: { kind: "order", id }, stream: "people" });
  toast(units + " units dispatched · " + invId + " raised");
  doneTasks({ kind: "order", id });
}

/* ---------------- approvals ---------------- */

export function decideApproval(id: string, approve: boolean) {
  const s = getState();
  const ap = s.approvals.find((a) => a.id === id);
  if (!ap || ap.status !== "Awaiting approval") return;
  set((st) => ({ approvals: st.approvals.map((a) => (a.id === id ? { ...a, status: approve ? "Approved in demo" : "Declined" } : a)) }));
  if (!approve) {
    log({ actor: "Aoibhe Dunleavy", actorKind: "person", title: ap.title + " declined", detail: "No change made.", outcome: "Declined", link: ap.link, stream: "people" });
    toast("Declined");
    return;
  }
  if (ap.kind === "Purchase") {
    set((st) => ({ pos: st.pos.map((p) => (p.id === ap.link.id ? { ...p, status: "Approved", ordered: SNAPSHOT, note: "Approved in demo on " + SNAPSHOT_LABEL + ". Counted in commitments and incoming stock. Not sent to the supplier; no money has left the bank." } : p)), purchasePreview: false }));
    log({ actor: "Aoibhe Dunleavy", actorKind: "person", title: ap.link.id + " approved in demo", detail: "Added to cash commitments and incoming stock. Nothing has been sent to the supplier and no money has left the bank.", outcome: "Approved in demo", link: ap.link, stream: "people" });
    doneTasks(ap.link);
    toast(ap.link.id + " approved in demo. Not sent to the supplier.");
  } else if (ap.kind === "Stock adjustment") {
    patchVariant("JZ-MB-M", (v) => ({ ...v, onHand: v.onHand - 2, unavailable: Math.max(0, v.unavailable - 2) }));
    move("JZ-MB-M", -2, "Written off", ap.id, "Damaged returns written off");
    log({ actor: "Aoibhe Dunleavy", actorKind: "person", title: "Stock adjustment approved", detail: "2 damaged Midnight Black M written off. Available stock unchanged.", outcome: "Approved in demo", link: ap.link, stream: "people" });
    toast("Adjustment approved. Available stock unchanged.");
  } else if (ap.kind === "Partial dispatch") {
    dispatchOrder(ap.link.id);
  }
}

export function requestPurchaseApproval(poId: string) {
  const s = getState();
  if (!s.approvals.some((a) => a.link.id === poId && a.status === "Awaiting approval")) {
    const po = s.pos.find((p) => p.id === poId);
    if (!po) return;
    const total = po.lines.reduce((a, l) => a + l.qty, 0) * po.unitCost;
    set((st) => ({ seq: st.seq + 1, approvals: [{ id: "AP-" + (st.seq + 1), kind: "Purchase", title: "Replenishment " + poId, detail: "Review before anything is sent to the supplier.", value: "€" + total.toLocaleString("en-IE"), requestedBy: "Maeve Breslin", approver: "ad", raised: SNAPSHOT, status: "Awaiting approval", link: { kind: "po", id: poId } }, ...st.approvals] }));
  }
}

/* ---------------- stock ---------------- */

export function receivePO(poId: string) {
  const s = getState();
  const po = s.pos.find((p) => p.id === poId);
  if (!po || (po.status !== "Confirmed" && po.status !== "Approved")) return;
  po.lines.forEach((l) => {
    const n = l.qty - l.received;
    if (n <= 0) return;
    patchVariant(l.sku, (v) => ({ ...v, onHand: v.onHand + n }));
    move(l.sku, n, "Received", poId, "Delivery received (simulated)");
  });
  set((st) => ({ pos: st.pos.map((p) => (p.id === poId ? { ...p, status: "Received", lines: p.lines.map((l) => ({ ...l, received: l.qty })) } : p)) }));
  const units = po.lines.reduce((a, l) => a + l.qty - l.received, 0);
  const helped = getState().orders.filter((o) => o.stage !== "Complete" && o.stage !== "Draft" && o.lines.some((l) => l.qty > l.allocated && po.lines.some((pl) => pl.sku === l.sku)));
  log({ actor: "Maeve Breslin", actorKind: "person", title: poId + " received", detail: units + " units added to on-hand stock (simulated)." + (helped.length ? " Stock now available for " + helped.map((o) => o.id).join(", ") + "." : ""), outcome: "Simulated", link: { kind: "po", id: poId }, stream: "people" });
  toast(units + " units received" + (helped.length ? ". " + helped.map((o) => o.id).join(", ") + " can now be allocated" : ""));
}

export function decideReturn(id: string) {
  const s = getState();
  const r = s.returns.find((x) => x.id === id);
  if (!r || r.restock !== "Pending") return;
  if (r.condition === "Sellable") {
    patchVariant(r.sku, (v) => ({ ...v, onHand: v.onHand + 1 }));
    move(r.sku, 1, "Return restocked", id, "Sellable return back to stock");
  } else {
    patchVariant(r.sku, (v) => ({ ...v, onHand: v.onHand + 1, unavailable: v.unavailable + 1 }));
    move(r.sku, 1, "Return quarantined", id, "Damaged, held as unavailable");
  }
  if (r.resolution === "Exchange" && r.exchangeSku) {
    patchVariant(r.exchangeSku, (v) => ({ ...v, onHand: v.onHand - 1 }));
    move(r.exchangeSku, -1, "Exchange sent", id, "Replacement size. Not a new sale.");
  }
  set((st) => ({ returns: st.returns.map((x) => (x.id === id ? { ...x, restock: r.condition === "Sellable" ? "Restocked" : "Quarantined", status: r.resolution === "Exchange" ? "Exchanged" : "Refunded" } : x)) }));
  log({ actor: "Maeve Breslin", actorKind: "person", title: id + (r.condition === "Sellable" ? " restocked" : " quarantined"), detail: r.resolution === "Exchange" ? "Exchange sent. No second sale recorded." : "Refund status unchanged in demo.", outcome: "Simulated", link: { kind: "return", id }, stream: "people" });
  toast(r.condition === "Sellable" ? "Returned to available stock" : "Held as unavailable");
}

export function setClearanceReview(on: boolean) {
  set({ clearanceReview: on });
  if (on) {
    log({ actor: "Stock & Demand", actorKind: "agent", title: "Clearance option drafted for Candy Floss Pink L", detail: "Targeted offer on size L only. Replenishment paused. No prices changed.", outcome: "Draft prepared", link: { kind: "variant", id: "JZ-CF-L" }, stream: "agents" });
    toast("Clearance option drafted. No prices changed.");
  }
}

/* ---------------- finance ---------------- */

export function draftReminder(invId: string) {
  set((s) => ({ invoices: s.invoices.map((i) => (i.id === invId ? { ...i, reminder: "drafted" } : i)) }));
  log({ actor: "Finance & Cash", actorKind: "agent", title: "Reminder drafted for " + invId, detail: "Saved as a draft. Not sent.", outcome: "Draft prepared", link: { kind: "invoice", id: invId }, stream: "agents" });
  toast("Reminder drafted. Not sent.");
}

export function approveReminder(invId: string) {
  set((s) => ({ invoices: s.invoices.map((i) => (i.id === invId ? { ...i, reminder: "approved" } : i)) }));
  log({ actor: "Declan Whelan", actorKind: "person", title: "Reminder approved in demo for " + invId, detail: "Marked ready to send. No email has been sent; there is no email connection in this demo.", outcome: "Approved in demo", link: { kind: "invoice", id: invId }, stream: "people" });
  toast("Approved in demo. No email sent.");
}

export function recordPayment(invId: string) {
  const s = getState();
  const inv = s.invoices.find((i) => i.id === invId);
  if (!inv) return;
  const bal = inv.net + inv.tax - inv.paid;
  if (bal <= 0) return;
  set((st) => ({
    invoices: st.invoices.map((i) => (i.id === invId ? { ...i, paid: i.paid + bal, payments: [...i.payments, { date: SNAPSHOT, amount: bal, note: "Simulated payment" }] } : i)),
    bankAdjust: st.bankAdjust + bal,
    simulatedCash: [...st.simulatedCash, { date: SNAPSHOT, amount: bal, label: "Simulated receipt " + invId, link: { kind: "invoice", id: invId } }],
  }));
  log({ actor: "Declan Whelan", actorKind: "person", title: "Simulated payment on " + invId, detail: "€" + bal.toLocaleString("en-IE") + " marked received. Bank cash and the cash outlook updated; the expected receipt is removed so it is not counted twice.", outcome: "Simulated", link: { kind: "invoice", id: invId }, stream: "people" });
  toast("€" + bal.toLocaleString("en-IE") + " recorded as received (simulated)");
  doneTasks({ kind: "invoice", id: invId });
}

export function payBill(billId: string) {
  const s = getState();
  const b = s.bills.find((x) => x.id === billId);
  if (!b) return;
  const bal = b.net + b.tax - b.paid;
  if (bal <= 0) return;
  set((st) => ({
    bills: st.bills.map((x) => (x.id === billId ? { ...x, paid: x.paid + bal } : x)),
    bankAdjust: st.bankAdjust - bal,
    simulatedCash: [...st.simulatedCash, { date: SNAPSHOT, amount: -bal, label: "Simulated payment " + billId, link: { kind: "bill", id: billId } }],
  }));
  log({ actor: "Declan Whelan", actorKind: "person", title: "Simulated payment of " + billId, detail: "€" + bal.toLocaleString("en-IE") + " marked paid. No bank payment made.", outcome: "Simulated", link: { kind: "bill", id: billId }, stream: "people" });
  toast("Bill marked paid (simulated)");
}

export function setPurchasePreview(on: boolean) {
  set({ purchasePreview: on });
}
export function setScenario(sc: Scenario) {
  set({ scenario: sc });
}
export function setAssumption<K extends keyof Assumptions>(k: K, val: Assumptions[K]) {
  set((s) => ({ assumptions: { ...s.assumptions, [k]: val } }));
}

export function completeTask(id: string) {
  set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, status: t.status === "Done" ? "Open" : "Done" } : t)) }));
}

/* ---------------- trends + advertising ----------------
   The fixtures live in marketing.ts; these only record decisions, so nothing is
   ever sent to Meta or Google and no forecast changes without an explicit click. */

export function setTrendStatus(id: string, status: TrendStatus, title: string) {
  set((s) => ({ trendStatus: { ...s.trendStatus, [id]: status } }));
  if (status === "Watching" || status === "Dismissed") {
    log({ actor: "Aoibhe Dunleavy", actorKind: "person", title: (status === "Watching" ? "Watching trend: " : "Dismissed trend: ") + title, detail: status === "Watching" ? "Kept on the watch list. No forecast change." : "Removed from the list. No forecast change.", outcome: "Simulated", link: { kind: "signal", id }, stream: "people" });
  }
}

/** Adds (or with a negative pct, removes) a trend's demand uplift for one product. */
export function applyTrendUplift(id: string, productId: string, pct: number, title: string) {
  set((s) => {
    const cur = s.assumptions.productUplift[productId] || 0;
    const next = Math.round((cur + pct) * 10) / 10;
    const productUplift = { ...s.assumptions.productUplift };
    if (next === 0) delete productUplift[productId];
    else productUplift[productId] = next;
    return { assumptions: { ...s.assumptions, productUplift }, trendStatus: { ...s.trendStatus, [id]: pct > 0 ? "Applied" : "Watching" } };
  });
  log({ actor: "Aoibhe Dunleavy", actorKind: "person", title: (pct > 0 ? "Trend applied to forecast: " : "Trend removed from forecast: ") + title,
    detail: (pct > 0 ? "+" : "") + pct + "% demand on this product in Forecasting. Buying plan and days of cover recalculated. Demo assumption only.", outcome: "Simulated", link: { kind: "signal", id }, stream: "people" });
  toast(pct > 0 ? "Applied to the forecast (+" + pct + "%)" : "Removed from the forecast");
}

export function setAdChange(id: string, status: AdChangeStatus, title: string, platform: string, campaignId?: string) {
  set((s) => ({ adChanges: { ...s.adChanges, [id]: status } }));
  const where = platform === "Both" ? "Meta or Google" : platform;
  const link: RecordLink | undefined = campaignId ? { kind: "campaign", id: campaignId } : undefined;
  if (status === "drafted") {
    log({ actor: "Stock & Demand", actorKind: "agent", title: "Ad change drafted: " + title, detail: "Draft only. Nothing has been changed in " + where + ".", outcome: "Draft prepared", link, stream: "agents" });
    toast("Draft prepared. Nothing sent to " + where + ".");
  } else if (status === "approved") {
    log({ actor: "Aoibhe Dunleavy", actorKind: "person", title: "Ad change approved in demo: " + title, detail: "Marked approved. " + where + " is a demo connection, so no campaign or budget was changed.", outcome: "Approved in demo", link, stream: "people" });
    toast("Approved in demo. No change made in " + where + ".");
  } else {
    log({ actor: "Aoibhe Dunleavy", actorKind: "person", title: "Ad change withdrawn: " + title, detail: "Back to the current plan.", outcome: "Declined", link, stream: "people" });
  }
}

export function resetDemo() {
  state = initial();
  listeners.forEach((l) => l());
  toast("Demo data reset");
}

/* ---------------- dates ---------------- */

export function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
}
