/* Reconciliation check for the Jod-Z demo figures: npx vite-node scripts/check-figures.ts */
import { getState } from "../src/jodz/store";
import { cashOutlook, salesSummary, openOrderBook, variantRows, receivables, eur } from "../src/jodz/derive";
const s = getState();
const ss = salesSummary(s);
console.log("net", ss.net, "online", ss.online, "wholesale", ss.wholesale, "orders", ss.orders, "margin", ss.margin.toFixed(3));
const ob = openOrderBook(s);
console.log("open", ob.count, ob.value, ob.rows.map(r => r.o.id + ":" + r.openValue + ":short" + r.short));
for (const draft of [false, true]) {
  const c = cashOutlook(s, { includeDraft: draft });
  console.log(draft ? "WITH PURCHASE" : "BASE", c.horizons.map(h => `d${h.day} R${h.receipts} P${h.payments} C${h.closing}`).join(" | "), "low", eur(c.low.balance), c.low.date, "breach", c.breach?.date);
}
for (const sc of ["slow", "late"] as const) {
  const c = cashOutlook(s, { scenario: sc });
  console.log(sc, c.horizons.map(h => h.closing).join(" "), "low", c.low.balance, c.low.date);
}
const rows = variantRows(s);
for (const sku of ["JZ-AN-S", "JZ-MB-M", "JZ-CF-L"]) { const r = rows.find(x => x.sku === sku)!; console.log(sku, "on", r.onHand, "res", r.reserved, "un", r.unavailable, "av", r.available, "rate", r.rate.toFixed(2), "cover", r.cover?.toFixed(1), "value", r.valueAtCost, r.flags); }
console.log("AR", receivables(s));
console.log("flags", rows.filter(r => r.flags.length && !r.lowHistory).map(r => r.sku + ":" + r.flags.join("/")));
