/* Home briefing, widgets and fixture-backed chat answers for Pulse.
   Answers are deterministic and computed from the shared demo dataset. No live AI service is connected. */
import { getState, openRecord, goTo, openDrawer, type JodzState } from "./store";
import {
  variantRows, openOrderBook, orderRows, receivables, cashOutlook, salesSummary, invoiceBalance, daysOverdue,
  poTotal, poUnits, poPayments, eur, fmtDate, variantName, staff, stockTotals, bankCash, cashLines,
} from "./derive";
import { SNAPSHOT, type RecordLink } from "./data";
import { signalRows, adsSummary, adAlerts } from "./marketing";

const v = (s: JodzState, sku: string) => variantRows(s).find((r) => r.sku === sku)!;
const draftPo = (s: JodzState) => s.pos.find((p) => p.id === "PO-D193")!;

export interface BriefItem { key: string; text: string; link: RecordLink; tone: "bad" | "warn" | "ok" }

/** The four things that need a decision today, each linked to its record. */
export function briefing(s: JodzState = getState()): BriefItem[] {
  const out: BriefItem[] = [];
  const an = v(s, "JZ-AN-S");
  const cover = an.cover === null ? "no recent sales" : "around " + Math.max(0, Math.round(an.cover)) + " day" + (Math.round(an.cover) === 1 ? "" : "s") + " of cover";
  out.push({ key: "A", tone: an.cover !== null && an.cover < 7 ? "bad" : "ok", link: { kind: "variant", id: "JZ-AN-S" },
    text: "Admiral Navy S has " + an.available + " unit" + (an.available === 1 ? "" : "s") + " available, " + cover + "." });
  const w = orderRows(s).find((r) => r.o.id === "JOD-W1041")!;
  out.push(w.isOpen && w.short > 0
    ? { key: "B", tone: "bad", link: { kind: "order", id: "JOD-W1041" }, text: "Meadow Tack's " + eur(w.value) + " order is " + w.short + " units short." }
    : { key: "B", tone: "ok", link: { kind: "order", id: "JOD-W1041" }, text: "Meadow Tack's order is " + (w.isOpen ? "fully allocated." : w.fulfilment.toLowerCase() + ".") });
  const inv = s.invoices.find((i) => i.id === "JOD-INV2031")!;
  const bal = invoiceBalance(inv);
  out.push(bal > 0
    ? { key: "C", tone: "warn", link: { kind: "invoice", id: inv.id }, text: "A " + eur(bal) + " invoice is overdue by " + daysOverdue(inv) + " days." + (inv.reminder === "drafted" ? " Reminder drafted, not sent." : "") }
    : { key: "C", tone: "ok", link: { kind: "invoice", id: inv.id }, text: "The overdue " + eur(inv.net) + " invoice is marked paid (simulated)." });
  const po = draftPo(s);
  if (po.status === "Draft") {
    const base = cashOutlook(s, { includeDraft: false, scenario: "base" }).horizons[1].closing;
    const withP = cashOutlook(s, { includeDraft: true, scenario: "base" }).horizons[1].closing;
    out.push({ key: "E", tone: withP < s.assumptions.buffer ? "bad" : "warn", link: { kind: "po", id: po.id },
      text: "Approving the proposed stock purchase would reduce the 60-day cash estimate from " + eur(base) + " to " + eur(withP) + "." });
  } else {
    const now = cashOutlook(s, { includeDraft: false, scenario: "base" }).horizons[1].closing;
    out.push({ key: "E", tone: now < s.assumptions.buffer ? "bad" : "ok", link: { kind: "po", id: po.id },
      text: "PO-D193 is " + po.status.toLowerCase() + " in demo. The 60-day cash estimate is now " + eur(now) + "." });
  }
  return out;
}

export function openBrief(link: RecordLink) {
  openRecord(link);
}

/** Decisions for the Home inbox widget. */
export function decisions(s: JodzState = getState()) {
  const items = briefing(s).filter((b) => b.tone !== "ok");
  const cfp = v(s, "JZ-CF-L");
  if (cfp.flags.includes("Overstock") && !s.clearanceReview)
    items.push({ key: "D", tone: "warn", link: { kind: "variant", id: "JZ-CF-L" }, text: "Candy Floss Pink L holds " + eur(cfp.valueAtCost) + " at cost with " + cfp.s28 + " sold in 28 days." });
  const titles: Record<string, string> = { A: "Admiral Navy S running out", B: "JOD-W1041 cannot ship in full", C: "JOD-INV2031 overdue", D: "Stock tied up in Candy Floss Pink L", E: "Draft purchase squeezes cash" };
  const ages: Record<string, string> = { A: "06:40", B: "06:41", C: "18d", D: "Fri", E: "Fri" };
  return items.map((b) => ({ title: titles[b.key], why: b.text, age: ages[b.key], dot: b.tone === "bad" ? "var(--bad)" : "var(--warn)", open: () => openRecord(b.link) }));
}

export function upcoming(s: JodzState = getState()) {
  const out: { title: string; when: string; dot: string; open: () => void }[] = [];
  for (const r of openOrderBook(s).rows) {
    out.push({ title: "Dispatch " + r.o.id + " · " + r.retailerName.replace(" (Demo)", ""), when: fmtDate(r.o.promiseDate || r.o.requestedDispatch), dot: r.short > 0 ? "var(--bad)" : "var(--accent)", open: () => openRecord({ kind: "order", id: r.o.id }) });
  }
  const pays = cashLines(s, { includeDraft: false }).filter((l) => l.amount < 0 && l.link && l.date <= "2026-10-31").slice(0, 3);
  for (const l of pays) out.push({ title: "Pay " + l.label.replace(" (Demo)", ""), when: fmtDate(l.date), dot: "var(--warn)", open: () => openRecord(l.link!) });
  return out.sort((a, b) => a.when.localeCompare(b.when)).slice(0, 6);
}

export function numbers(s: JodzState = getState()) {
  const ss = salesSummary(s);
  const ob = openOrderBook(s);
  return [
    { label: "Net sales, 30 days", value: eur(ss.net), delta: (ss.change >= 0 ? "+" : "") + (ss.change * 100).toFixed(1) + "% vs prior", deltaColor: ss.change >= 0 ? "var(--ok)" : "var(--bad)", open: () => goTo("Dashboard") },
    { label: "Open wholesale", value: eur(ob.value), delta: ob.count + " orders · " + ob.short + " units short", deltaColor: ob.short ? "var(--bad)" : "var(--dim)", open: () => goTo("Dashboard") },
    { label: "Bank cash", value: eur(bankCash(s)), delta: "Not revenue", deltaColor: "var(--dim)", open: () => goTo("Accounting", "overview") },
    { label: "Overdue", value: eur(receivables(s).overdueTotal), delta: receivables(s).overdue.length + " invoice", deltaColor: "var(--warn)", open: () => goTo("Accounting", "invoices") },
  ];
}

export function homeTasks(s: JodzState = getState()) {
  return s.tasks.map((t) => ({ ...t, whoInitials: staff(t.owner).initials, dueLabel: fmtDate(t.due), late: t.due < SNAPSHOT && t.status !== "Done", open: () => openRecord(t.link) }));
}

export function activityFeed(s: JodzState = getState(), n = 5) {
  return s.activity.slice(0, n).map((a) => ({
    who: a.actor, what: a.title.charAt(0).toLowerCase() + a.title.slice(1), event: a.outcome, when: a.at.slice(11) || a.at,
    dot: a.outcome === "Detected" ? "var(--bad)" : a.outcome === "Awaiting approval" || a.outcome === "Draft prepared" ? "var(--warn)" : "var(--accent)",
    open: a.link ? () => openRecord(a.link!) : undefined,
  }));
}

export function waitingSummary(s: JodzState = getState()) {
  const aw = s.approvals.filter((a) => a.status === "Awaiting approval");
  return aw.length + (aw.length === 1 ? " DECISION" : " DECISIONS") + " WAITING · DEMO DATA";
}

/* ---------------- fixture answers ---------------- */

export interface Answer {
  tool: string; effect: "read" | "draft"; text: string; cols?: string[]; rows?: string[][];
  actions?: [string, number, RecordLink?, (() => void)?][];
}

function reorder(s: JodzState): Answer {
  const po = draftPo(s);
  const an = v(s, "JZ-AN-S");
  const cfp = v(s, "JZ-CF-L");
  const rows = po.lines.slice(0, 5).map((l) => {
    const r = v(s, l.sku);
    return [variantName(l.sku), String(r.available), r.cover === null ? "n/a" : Math.round(r.cover) + "d", String(l.qty)];
  });
  rows.push([variantName("JZ-CF-L"), String(cfp.available), cfp.cover === null ? "n/a" : Math.round(cfp.cover) + "d", "Pause"]);
  return {
    tool: "fixture · stock_and_demand.reorder", effect: "read",
    text: "Admiral Navy S comes first: " + an.available + " available against about " + an.rate.toFixed(1) + " a day, and the next confirmed delivery (60 units) lands " + fmtDate(an.nextArrival || "2026-10-24") + ". That delivery does not close the gap before then. " +
      (po.status === "Draft" ? "The draft PO-D193 covers " + poUnits(po) + " units across " + po.lines.length + " variants for " + eur(poTotal(po)) + ". It is not approved and not sent. " : "PO-D193 is " + po.status.toLowerCase() + " in demo. ") +
      "Candy Floss Pink L should not be reordered: " + cfp.available + " available and " + cfp.s28 + " sold in 28 days.",
    cols: ["Variant", "Available", "Cover", "Buy"], rows,
    actions: [["Review purchase and cash impact", 1, { kind: "po", id: "PO-D193" }], ["Open Admiral Navy S", 0, { kind: "variant", id: "JZ-AN-S" }]],
  };
}

function blocked(s: JodzState): Answer {
  const rows = openOrderBook(s).rows;
  const b = rows.filter((r) => r.short > 0 || r.flags.includes("Payment hold") || r.allocated === 0);
  const text = b.length
    ? b.map((r) => r.o.id + " (" + r.retailerName.replace(" (Demo)", "") + ", " + eur(r.openValue) + ") " + (r.allocated === 0 ? "has no stock reserved yet" : r.short > 0 ? "is " + r.short + " units short" : "is on a payment hold")).join("; ") + ". " +
      (b.some((r) => r.o.id === "JOD-W1041" && r.short > 0) ? "For JOD-W1041 the short line is Midnight Black M: 24 requested, 12 allocated. 40 arrive on PO-0187 on 24 Oct, so the options are a partial dispatch of the 108 allocated units now or a new date after the delivery." : "")
    : "No open wholesale order is blocked right now.";
  return {
    tool: "fixture · ops_watchdog.blocked_orders", effect: "read", text,
    cols: ["Order", "Retailer", "Units", "Status"],
    rows: rows.map((r) => [r.o.id, r.retailerName.replace(" (Demo)", ""), String(r.openUnits), r.short > 0 ? r.allocation + ", " + r.short + " short" : r.allocation]),
    actions: [["Open JOD-W1041", 1, { kind: "order", id: "JOD-W1041" }], ["Open Sales & Wholesale", 0, undefined, () => goTo("Dashboard")]],
  };
}

function afford(s: JodzState): Answer {
  const po = draftPo(s);
  const base = cashOutlook(s, { includeDraft: false, scenario: "base" });
  const withP = cashOutlook(s, { includeDraft: po.status === "Draft", scenario: "base" });
  const pays = poPayments(po);
  const buf = s.assumptions.buffer;
  return {
    tool: "fixture · finance_and_cash.purchase_impact", effect: "read",
    text: po.status !== "Draft"
      ? "PO-D193 is already " + po.status.toLowerCase() + " in demo and counted in commitments. The expected balance is " + eur(base.horizons[0].closing) + " at day 30, " + eur(base.horizons[1].closing) + " at day 60 and " + eur(base.horizons[2].closing) + " at day 90. Nothing has left the bank."
      : "Not comfortably. With receipts otherwise unchanged, the " + eur(poTotal(po)) + " purchase (" + eur(pays[0].amount) + " deposit within 30 days, " + eur(pays[1].amount) + " in days 31 to 60) takes the 60-day estimate from " + eur(base.horizons[1].closing) + " to " + eur(withP.horizons[1].closing) + ", below the " + eur(buf) + " buffer from " + fmtDate(withP.breach?.date || SNAPSHOT) + ". The lowest point would be " + eur(withP.low.balance) + " on " + fmtDate(withP.low.date) + ". Options: split the order so the Admiral Navy and Midnight Black lines go first, or collect JOD-INV2031 before committing.",
    cols: ["Horizon", "Without purchase", "With purchase"],
    rows: base.horizons.map((h, i) => ["Day " + h.day + " · " + fmtDate(h.date), eur(h.closing), eur(withP.horizons[i].closing)]),
    actions: [["Review purchase and cash impact", 1, { kind: "po", id: "PO-D193" }], ["Open Cash Outlook", 0, undefined, () => goTo("Accounting", "cash")]],
  };
}

function overdue(s: JodzState): Answer {
  const r = receivables(s);
  return {
    tool: "fixture · finance_and_cash.receivables", effect: "read",
    text: r.overdue.length
      ? r.overdue.map((i) => i.id + " for " + eur(invoiceBalance(i)) + " was due " + fmtDate(i.due) + ", " + daysOverdue(i) + " days ago").join("; ") + ". A reminder is " + (r.overdue[0].reminder === "approved" ? "approved in demo but not sent" : r.overdue[0].reminder === "drafted" ? "drafted, not sent" : "not drafted yet") + ". Total open customer balances are " + eur(r.total) + "."
      : "Nothing is overdue. Open customer balances total " + eur(r.total) + ".",
    cols: ["Invoice", "Balance", "Due", "Status"],
    rows: r.open.map((i) => [i.id, eur(invoiceBalance(i)), fmtDate(i.due), i.due < SNAPSHOT ? "Overdue" : "Due"]),
    actions: [["Open JOD-INV2031", 1, { kind: "invoice", id: "JOD-INV2031" }]],
  };
}

function selling(s: JodzState): Answer {
  const ss = salesSummary(s);
  const top = variantRows(s).map((r) => ({ r, units: r.s30o + r.s30w })).sort((a, b) => b.units - a.units).slice(0, 5);
  return {
    tool: "fixture · briefing.sales", effect: "read",
    text: "Net sales for the 30 days to " + fmtDate(SNAPSHOT) + " were " + eur(ss.net) + " excluding tax: " + eur(ss.online) + " online and " + eur(ss.wholesale) + " from completed wholesale orders. Open wholesale orders are not included. Admiral Navy S is the strongest single variant.",
    cols: ["Variant", "Online", "Wholesale", "Units"],
    rows: top.map((t) => [variantName(t.r.sku), String(t.r.s30o), String(t.r.s30w), String(t.units)]),
    actions: [["Open Sales & Wholesale", 1, undefined, () => goTo("Dashboard")]],
  };
}

function overstock(s: JodzState): Answer {
  const t = stockTotals(s);
  const cfp = v(s, "JZ-CF-L");
  return {
    tool: "fixture · stock_and_demand.slow_movers", effect: "read",
    text: "Candy Floss Pink L is the one tying up money: " + cfp.available + " available, " + cfp.s28 + " sold in 28 days, " + eur(cfp.valueAtCost) + " at an illustrative €18 landed cost. I would pause replenishment and review a targeted offer on size L only. The other Candy Floss Pink sizes are selling normally, so a range-wide discount is not needed.",
    cols: ["Variant", "Available", "Sold 28d", "At cost"],
    rows: t.overstock.map((r) => [variantName(r.sku), String(r.available), String(r.s28), eur(r.valueAtCost)]),
    actions: [["Open Candy Floss Pink L", 1, { kind: "variant", id: "JZ-CF-L" }]],
  };
}

function trends(s: JodzState): Answer {
  const rows = signalRows(s).filter((x) => x.status !== "Dismissed");
  const applied = rows.filter((x) => x.status === "Applied").length;
  const pick = (id: string) => rows.find((x) => x.id === id);
  const navy = pick("sig-navy"), pink = pick("sig-pink"), size = pick("sig-size-s");
  const an = v(s, "JZ-AN-S");
  const parts: string[] = [];
  if (navy) parts.push("searches for navy riding leggings for kids are up " + navy.change.replace("+", "") + " in " + navy.window + ", which lands on Admiral Navy where size S has about " + Math.max(0, Math.round(an.cover || 0)) + " days of cover");
  if (pink) parts.push("interest in pastel pink is easing (" + pink.change + " " + pink.window + "), which supports clearing Candy Floss Pink L only");
  if (size) parts.push(size.title.charAt(0).toLowerCase() + size.title.slice(1));
  return {
    tool: "fixture · stock_and_demand.trends", effect: "read",
    text: "The strongest signals, from the demo data: " + parts.join("; ") + ". Search and social figures are a simulated index, not Google Trends. " + (applied ? applied + " signal" + (applied > 1 ? "s are" : " is") + " applied to the forecast." : "None are applied to the forecast yet."),
    cols: ["Signal", "Change", "Confidence", "Status"],
    rows: rows.slice(0, 5).map((x) => [x.title.length > 44 ? x.title.slice(0, 43) + "…" : x.title, x.change, x.confidence, x.status]),
    actions: [["Open Trends", 1, undefined, () => goTo("Trends", "signals")], ["Open the navy signal", 0, { kind: "signal", id: "sig-navy" }]],
  };
}

function ads(s: JodzState): Answer {
  const a = adsSummary(s);
  const first = adAlerts(s).find((x) => x.tone === "bad") || adAlerts(s)[0];
  return {
    tool: "fixture · finance_and_cash.ads", effect: "read",
    text: "In the 30 days to " + fmtDate(SNAPSHOT) + ", " + eur(a.all.spend) + " went on ads (Meta " + eur(a.meta.spend) + ", Google " + eur(a.google.spend) + "). Online revenue was " + eur(a.online) + ", so total return is " + a.mer.toFixed(1) + "×. Meta and Google claim " + eur(a.claimed) + " of sales between them; Shopify credits them " + eur(a.claimed - a.overClaim) + ". " + (first ? first.title + ": " + first.detail : "") + " Meta and Google are demo connections with simulated data.",
    cols: ["Platform", "Spend", "Platform ROAS", "Shopify ROAS"],
    rows: [["Meta", eur(a.meta.spend), a.meta.roas.toFixed(1) + "×", a.shopifyRoas.Meta.toFixed(1) + "×"], ["Google", eur(a.google.spend), a.google.roas.toFixed(1) + "×", a.shopifyRoas.Google.toFixed(1) + "×"]],
    actions: [["Open Advertising", 1, undefined, () => goTo("Advertising", "overview")], ["Open Hero · Admiral Navy", 0, { kind: "campaign", id: "m4" }]],
  };
}

function fallback(): Answer {
  return {
    tool: "fixture · demo answers", effect: "read",
    text: "This demo answers from the fixture dataset only; no live AI service is connected. Try asking what to reorder, which wholesale orders are blocked, whether the proposed purchase is affordable, what is overdue, what is selling, where stock is tying up money, what is trending, or how the ads are doing.",
    actions: [["What should we reorder?", 0], ["Which wholesale orders are blocked?", 0], ["Can we afford the proposed stock purchase?", 0]],
  };
}

export function answerFor(q: string, s: JodzState = getState()): Answer {
  const t = q.toLowerCase();
  if (/trend|trending|search interest|social|hashtag|pony club|calendar|black friday/.test(t)) return trends(s);
  if (/\bads?\b|advert|\bmeta\b|google|facebook|instagram|campaign|roas|marketing/.test(t)) return ads(s);
  if (/afford|cash impact|purchase|buffer|po-d193/.test(t)) return afford(s);
  if (/reorder|buy|replenish|restock|running out|admiral/.test(t)) return reorder(s);
  if (/block|short|wholesale|w1041|meadow|dispatch|allocat/.test(t)) return blocked(s);
  if (/overdue|invoice|owe|remind|paid|receivable|inv2031/.test(t)) return overdue(s);
  if (/overstock|slow|tying|candy|clearance|ageing|aging/.test(t)) return overstock(s);
  if (/sell|sales|revenue|best|top/.test(t)) return selling(s);
  if (/cash|bank|balance|money/.test(t)) return afford(s);
  if (/today|brief|changed|summary|morning/.test(t)) {
    return { tool: "fixture · briefing.today", effect: "read", text: briefing(s).map((b) => b.text).join(" "), actions: briefing(s).map((b) => [b.key === "A" ? "Open Admiral Navy S" : b.key === "B" ? "Open JOD-W1041" : b.key === "C" ? "Open JOD-INV2031" : "Review PO-D193", 0, b.link] as [string, number, RecordLink]) };
  }
  return fallback();
}

export function runAction(a: [string, number, RecordLink?, (() => void)?], ask: (q: string) => void) {
  if (a[3]) a[3]();
  else if (a[2]) openRecord(a[2]);
  else ask(a[0]);
}

export { openDrawer };
