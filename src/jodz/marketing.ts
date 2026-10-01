/* Advertising (Meta Ads, Google Ads) and trend spotting for Jod-Z.
   Every figure here is fictional demo data. Meta Ads and Google Ads are demo connections
   with simulated data; the search and social indexes are simulated, not Google Trends.
   Nothing in this module changes a live campaign, budget or price. */
import { DAILY_ONLINE, CASH_EVENTS, SNAPSHOT, type RecordLink } from "./data";
import { type JodzState, getState, setAdChange, setTrendStatus, applyTrendUplift, type AdChangeStatus, type TrendStatus } from "./store";
import {
  variantRows, salesSummary, predictedReorders, cashOutlook, registerLinkLabel, fmtDate, eur, product, type VariantRow,
} from "./derive";

export type Platform = "Meta" | "Google";

/* ---------------- campaigns ---------------- */

export interface Campaign {
  id: string; platform: Platform; name: string; type: string; objective: string;
  /** Live campaigns run now; the draft only exists in Pulse. */
  status: "Live" | "Draft";
  budgetDay: number; spend: number; impressions: number; reach?: number; clicks: number;
  /** Platform-reported purchases and purchase value, excluding tax. Platforms over-claim; see attribution. */
  conv: number; value: number;
  impressionShare?: number;
  products: string[]; skus?: string[]; note: string;
}

const YR = ["an", "mbk", "bb", "cfp", "mby", "pb"];

export const CAMPAIGNS: Campaign[] = [
  { id: "m1", platform: "Meta", name: "Prospecting · Young Rider core", type: "Advantage+ audience", objective: "Sales", status: "Live", budgetDay: 32,
    spend: 960, impressions: 118400, reach: 52100, clicks: 1540, conv: 32, value: 1920, products: YR, note: "Broad parents-of-riders audience, all six colours." },
  { id: "m2", platform: "Meta", name: "Retargeting · product viewers (7 days)", type: "Custom audience", objective: "Sales", status: "Live", budgetDay: 18,
    spend: 520, impressions: 36200, reach: 8800, clicks: 820, conv: 42, value: 2520, products: YR, note: "People who viewed a product in the last 7 days." },
  { id: "m3", platform: "Meta", name: "Advantage+ catalogue", type: "Advantage+ shopping", objective: "Sales", status: "Live", budgetDay: 17,
    spend: 520, impressions: 64900, reach: 31200, clicks: 1010, conv: 26, value: 1560, products: [...YR, "mon", "ecl"], note: "Dynamic ads from the Shopify catalogue (demo feed)." },
  { id: "m4", platform: "Meta", name: "Hero · Admiral Navy", type: "Single product", objective: "Sales", status: "Live", budgetDay: 15,
    spend: 460, impressions: 51300, reach: 24600, clicks: 690, conv: 18, value: 1080, products: ["an"], skus: ["JZ-AN-S", "JZ-AN-M", "JZ-AN-L"], note: "Arena warm-up reel. Most clicks land on size S." },
  { id: "m5", platform: "Meta", name: "Clearance · Candy Floss Pink L", type: "Single variant", objective: "Sales", status: "Draft", budgetDay: 10,
    spend: 0, impressions: 0, clicks: 0, conv: 0, value: 0, products: ["cfp"], skus: ["JZ-CF-L"], note: "Proposed: €10 a day for 14 days, size L (14-15 yrs) only. Not live." },
  { id: "g1", platform: "Google", name: "Search · Brand", type: "Search", objective: "Sales", status: "Live", budgetDay: 6,
    spend: 180, impressions: 4100, clicks: 1120, conv: 58, value: 3480, impressionShare: 94, products: YR, note: "People searching for Jod-Z by name." },
  { id: "g2", platform: "Google", name: "Search · Non-brand riding leggings", type: "Search", objective: "Sales", status: "Live", budgetDay: 24,
    spend: 720, impressions: 38600, clicks: 1450, conv: 29, value: 1740, impressionShare: 38, products: ["an", "mbk", "pb"], note: "Generic searches such as kids riding leggings." },
  { id: "g3", platform: "Google", name: "Performance Max · Shopping feed", type: "Performance Max", objective: "Sales", status: "Live", budgetDay: 34,
    spend: 1020, impressions: 96400, clicks: 1380, conv: 44, value: 2640, products: [...YR, "mon", "ecl"], note: "Shopping, YouTube and Display from the product feed (demo feed)." },
];

/* Shopify last-click attribution for the same 30 days (demo). Sums to the 300 online orders and €18,000. */
export const ATTRIBUTION = [
  { channel: "Meta Ads", orders: 88, revenue: 5280 },
  { channel: "Google Ads", orders: 116, revenue: 6960 },
  { channel: "Organic, direct and email", orders: 96, revenue: 5760 },
];

export const BUDGETS = { month: "Sep 2026", Meta: 2600, Google: 2000 };

export interface Creative { id: string; campaignId: string; name: string; format: string; spend: number; impressions: number; clicks: number; conv: number; product: string }
export const CREATIVES: Creative[] = [
  { id: "c1", campaignId: "m4", name: "Arena warm-up reel", format: "Reel", spend: 610, impressions: 64200, clicks: 1220, conv: 21, product: "an" },
  { id: "c2", campaignId: "m1", name: "All six colours", format: "Carousel", spend: 820, impressions: 98400, clicks: 1380, conv: 31, product: "an" },
  { id: "c3", campaignId: "m2", name: "Pony club rally, customer video (demo)", format: "UGC video", spend: 560, impressions: 40100, clicks: 880, conv: 38, product: "mbk" },
  { id: "c4", campaignId: "m3", name: "Midnight Black flat lay", format: "Static image", spend: 470, impressions: 68100, clicks: 580, conv: 28, product: "mbk" },
];

export const SEARCH_TERMS = [
  { term: "jod-z", campaignId: "g1", clicks: 820, cost: 96, conv: 44, trend: "flat" },
  { term: "kids riding leggings", campaignId: "g2", clicks: 410, cost: 196, conv: 9, trend: "up" },
  { term: "girls jodhpurs", campaignId: "g2", clicks: 260, cost: 128, conv: 5, trend: "up" },
  { term: "riding leggings with grip", campaignId: "g2", clicks: 190, cost: 102, conv: 4, trend: "flat" },
  { term: "navy riding leggings kids", campaignId: "g2", clicks: 170, cost: 81, conv: 6, trend: "up" },
  { term: "childrens horse riding clothes", campaignId: "g3", clicks: 140, cost: 77, conv: 2, trend: "flat" },
  { term: "pink riding leggings", campaignId: "g3", clicks: 120, cost: 58, conv: 1, trend: "down" },
  { term: "pony club leggings", campaignId: "g2", clicks: 95, cost: 44, conv: 2, trend: "up" },
];

/* ---------------- proposed changes (drafts only) ---------------- */

export interface AdChange { id: string; platform: Platform | "Both"; campaignId?: string; title: string; detail: string; why: string }
export const AD_CHANGES: AdChange[] = [
  { id: "an-hero-shift", platform: "Meta", campaignId: "m4", title: "Move Admiral Navy hero budget to colours with stock",
    detail: "Cut 'Hero · Admiral Navy' from €15 to €5 a day until PO-0187 lands on 24 Oct, and put €10 a day behind Petrol Blue and Midnight Black S and L. Total spend is unchanged.",
    why: "Most hero clicks land on Admiral Navy S, which has about 2 days of cover. Paying for demand that cannot be filled." },
  { id: "cfp-clearance", platform: "Meta", campaignId: "m5", title: "Clearance · Candy Floss Pink L",
    detail: "€10 a day for 14 days, size L (14-15 yrs) only. No price change is made in the demo; any offer is decided separately.",
    why: "96 available, 5 sold in 28 days, €1,728 at cost. Other pink sizes sell normally, so the rest of the range stays out of it." },
  { id: "retarget-cap", platform: "Meta", campaignId: "m2", title: "Refresh retargeting creative and cap frequency",
    detail: "Swap in the pony club customer video and cap frequency at 3 a week.",
    why: "The same 8,800 people saw these ads about 4 times each in 30 days." },
  { id: "nonbrand-navy", platform: "Google", campaignId: "g2", title: "Add 'navy riding leggings kids' as exact match",
    detail: "Point it at Admiral Navy M and L and Midnight Black S until size S is back in stock.",
    why: "Search interest for the term is rising (see Trends) and it converts better than the broad terms." },
  { id: "nov-trim", platform: "Both", title: "Trim the November seasonal plan by €2,000",
    detail: "Takes €1,000 off each of the two seasonal advertising payments on 9 and 23 Nov in the cash outlook.",
    why: "If PO-D193 is approved, cash falls below the buffer from 20 Nov. This keeps more of it in the bank." },
];

export function adChangeStatus(s: JodzState, id: string): AdChangeStatus {
  return (s.adChanges && s.adChanges[id]) || "none";
}
export function draftAdChange(id: string) {
  const c = AD_CHANGES.find((x) => x.id === id);
  if (c) setAdChange(id, "drafted", c.title, c.platform, c.campaignId);
}
export function approveAdChange(id: string) {
  const c = AD_CHANGES.find((x) => x.id === id);
  if (c) setAdChange(id, "approved", c.title, c.platform, c.campaignId);
}
export function withdrawAdChange(id: string) {
  const c = AD_CHANGES.find((x) => x.id === id);
  if (c) setAdChange(id, "none", c.title, c.platform, c.campaignId);
}

/* ---------------- ad selectors ---------------- */

const sum = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((a, x) => a + f(x), 0);
const live = (p?: Platform) => CAMPAIGNS.filter((c) => c.status === "Live" && (!p || c.platform === p));

export function platformTotals(p?: Platform) {
  const cs = live(p);
  const spend = sum(cs, (c) => c.spend), clicks = sum(cs, (c) => c.clicks), impressions = sum(cs, (c) => c.impressions);
  const conv = sum(cs, (c) => c.conv), value = sum(cs, (c) => c.value);
  const reach = sum(cs, (c) => c.reach || 0);
  return { spend, clicks, impressions, conv, value, reach, ctr: impressions ? clicks / impressions : 0, cpc: clicks ? spend / clicks : 0,
    cpm: impressions ? (spend / impressions) * 1000 : 0, roas: spend ? value / spend : 0, cpa: conv ? spend / conv : 0, frequency: reach ? impressions / reach : 0 };
}

/** The honest view: Shopify revenue against total ad spend, next to what each platform claims. */
export function adsSummary(s: JodzState) {
  const all = platformTotals(), meta = platformTotals("Meta"), google = platformTotals("Google");
  const online = salesSummary(s, "online");
  const attributed = { Meta: ATTRIBUTION[0], Google: ATTRIBUTION[1], Organic: ATTRIBUTION[2] };
  return {
    all, meta, google, online: online.online, onlineOrders: online.onlineOrders,
    mer: all.spend ? online.online / all.spend : 0,
    claimed: all.value, claimedOrders: all.conv,
    overClaim: all.value - (attributed.Meta.revenue + attributed.Google.revenue),
    attributed,
    paidOrders: attributed.Meta.orders + attributed.Google.orders,
    costPerPaidOrder: all.spend / (attributed.Meta.orders + attributed.Google.orders),
    shopifyRoas: { Meta: attributed.Meta.revenue / meta.spend, Google: attributed.Google.revenue / google.spend },
    adShareOfRevenue: online.online ? all.spend / online.online : 0,
  };
}

/** Daily spend and Shopify-attributed revenue per platform, on the same 30 days as the sales page. */
export function adsDaily() {
  const n = DAILY_ONLINE.length;
  const totalRev = sum(DAILY_ONLINE, (d) => d.revenue);
  const shape = (i: number) => 1 + 0.12 * Math.sin(i * 0.9) + 0.06 * Math.cos(i * 2.3);
  const shapeSum = Array.from({ length: n }, (_, i) => shape(i)).reduce((a, b) => a + b, 0);
  const spread = (total: number, w: (i: number) => number, wSum: number) => {
    let left = total;
    return Array.from({ length: n }, (_, i) => {
      if (i === n - 1) return Math.round(left);
      const v = Math.round((total * w(i)) / wSum);
      left -= v;
      return v;
    });
  };
  const metaSpend = spread(platformTotals("Meta").spend, shape, shapeSum);
  const googleSpend = spread(platformTotals("Google").spend, (i) => shape(i + 3), Array.from({ length: n }, (_, i) => shape(i + 3)).reduce((a, b) => a + b, 0));
  const metaRev = spread(ATTRIBUTION[0].revenue, (i) => DAILY_ONLINE[i].revenue, totalRev);
  const googleRev = spread(ATTRIBUTION[1].revenue, (i) => DAILY_ONLINE[i].revenue, totalRev);
  return DAILY_ONLINE.map((d, i) => ({ date: d.date, metaSpend: metaSpend[i], googleSpend: googleSpend[i], metaRev: metaRev[i], googleRev: googleRev[i], online: d.revenue }));
}

export function budgetPacing() {
  const days = adsDaily().filter((d) => d.date >= "2026-09-01");
  const metaMtd = sum(days, (d) => d.metaSpend), googleMtd = sum(days, (d) => d.googleSpend);
  const dayOfMonth = Number(SNAPSHOT.slice(8, 10)), daysInMonth = 30;
  const pace = (mtd: number, budget: number) => ({ mtd, budget, projected: Math.round((mtd / dayOfMonth) * daysInMonth), expectedByNow: Math.round((budget * dayOfMonth) / daysInMonth) });
  return { month: BUDGETS.month, Meta: pace(metaMtd, BUDGETS.Meta), Google: pace(googleMtd, BUDGETS.Google), dayOfMonth, daysInMonth };
}

/** Planned advertising payments already in the cash outlook, by month. */
export function plannedAdSpend(s: JodzState) {
  const trim = adChangeStatus(s, "nov-trim") === "approved";
  const months: Record<string, number> = {};
  for (const e of CASH_EVENTS) {
    if (!/advertising/i.test(e.label)) continue;
    let amt = -e.amount;
    if (trim && e.label === "Seasonal advertising") amt -= 1000;
    const m = e.date.slice(0, 7);
    months[m] = (months[m] || 0) + amt;
  }
  return Object.keys(months).sort().map((m) => ({ month: m, label: fmtDate(m + "-01").split(" ")[1], amount: months[m] }));
}

export interface CampaignRow extends Campaign {
  ctr: number; cpc: number; roas: number; cpa: number; frequency?: number; stock: { label: string; tone: "ok" | "warn" | "bad" }; flags: string[];
  change?: AdChange; changeStatus: AdChangeStatus;
}

function stockNote(rows: VariantRow[], c: Campaign): CampaignRow["stock"] {
  const keys = c.skus && c.skus.length ? rows.filter((r) => c.skus!.includes(r.sku)) : rows.filter((r) => c.products.includes(r.p.id));
  const low = keys.filter((r) => r.rate > 0 && (r.available <= 0 || (r.cover !== null && r.cover < 7)));
  const over = keys.filter((r) => r.flags.includes("Overstock"));
  if (low.length && c.products.length === 1) return { label: low.map((r) => r.size).join(", ") + " under 7 days of cover", tone: "bad" };
  if (low.length) return { label: low.length + " featured variant" + (low.length > 1 ? "s" : "") + " under 7 days", tone: "warn" };
  if (over.length) return { label: "Overstock to clear", tone: "ok" };
  return { label: "In stock", tone: "ok" };
}

export function campaignRows(s: JodzState, p?: Platform): CampaignRow[] {
  const rows = variantRows(s);
  return CAMPAIGNS.filter((c) => !p || c.platform === p).map((c) => {
    const change = AD_CHANGES.find((x) => x.campaignId === c.id);
    const flags: string[] = [];
    const stock = stockNote(rows, c);
    if (stock.tone === "bad" && c.status === "Live") flags.push("Spending on low stock");
    const frequency = c.reach ? c.impressions / c.reach : undefined;
    if (frequency && frequency > 3.5) flags.push("High frequency");
    if (c.id === "g1") flags.push("Brand demand");
    return {
      ...c, ctr: c.impressions ? c.clicks / c.impressions : 0, cpc: c.clicks ? c.spend / c.clicks : 0, roas: c.spend ? c.value / c.spend : 0,
      cpa: c.conv ? c.spend / c.conv : 0, frequency, stock, flags, change, changeStatus: change ? adChangeStatus(s, change.id) : "none",
    };
  });
}

export interface AdAlert { id: string; tone: "bad" | "warn" | "ok"; title: string; detail: string; link?: RecordLink; changeId?: string }

export function adAlerts(s: JodzState): AdAlert[] {
  const out: AdAlert[] = [];
  const rows = variantRows(s);
  const anS = rows.find((r) => r.sku === "JZ-AN-S")!;
  if (anS.cover !== null && anS.cover < 7 && adChangeStatus(s, "an-hero-shift") !== "approved")
    out.push({ id: "an", tone: "bad", title: "Paying for demand that cannot be filled", detail: "'Hero · Admiral Navy' spends about €15 a day. Admiral Navy S has " + anS.available + " available, about " + Math.max(0, Math.round(anS.cover)) + " days of cover, until PO-0187 lands on 24 Oct.", link: { kind: "variant", id: "JZ-AN-S" }, changeId: "an-hero-shift" });
  const cfp = rows.find((r) => r.sku === "JZ-CF-L")!;
  if (cfp.flags.includes("Overstock") && adChangeStatus(s, "cfp-clearance") !== "approved")
    out.push({ id: "cfp", tone: "warn", title: "Overstock with no ads behind it", detail: "Candy Floss Pink L: " + cfp.available + " available, " + cfp.s28 + " sold in 28 days, " + eur(cfp.valueAtCost) + " at cost. A size-L clearance campaign is drafted, not live.", link: { kind: "variant", id: "JZ-CF-L" }, changeId: "cfp-clearance" });
  if (adChangeStatus(s, "retarget-cap") !== "approved")
    out.push({ id: "freq", tone: "warn", title: "Retargeting is wearing thin", detail: "8,800 people saw the retargeting ads about 4 times each in 30 days. Fresh creative usually lifts click-through.", changeId: "retarget-cap" });
  const po = s.pos.find((x) => x.id === "PO-D193");
  const seasonal = -CASH_EVENTS.filter((e) => e.label === "Seasonal advertising").reduce((a, e) => a + e.amount, 0);
  const withPurchase = cashOutlook(s, { includeDraft: po?.status === "Draft" });
  if (withPurchase.breach && adChangeStatus(s, "nov-trim") !== "approved")
    out.push({ id: "cash", tone: "warn", title: "November ad plan meets a tight cash month", detail: (po?.status === "Draft" ? "If PO-D193 is approved, cash" : "Cash") + " falls below the " + eur(s.assumptions.buffer) + " buffer from " + fmtDate(withPurchase.breach.date) + ". The two seasonal ad payments in November add up to " + eur(seasonal) + ".", changeId: "nov-trim" });
  out.push({ id: "brand", tone: "ok", title: "Brand search looks better than it is", detail: "58 of Google's 131 reported conversions came from people already searching for Jod-Z. Judge Google on non-brand and Shopping, and the business on total return (Shopify revenue ÷ ad spend)." });
  return out;
}

/* ---------------- trend spotting ---------------- */

export type SignalKind = "Search" | "Social" | "Own sales" | "Returns" | "Wholesale" | "Calendar" | "Market";
export interface Signal {
  id: string; kind: SignalKind; source: string; title: string; direction: "up" | "down" | "flat"; change: string; window: string;
  confidence: "High" | "Medium" | "Low"; products: string[]; impact: string; detected: string;
  action?: { type: "uplift"; productId: string; pct: number } | { type: "link"; label: string; page: string; section?: string; link?: RecordLink } | { type: "ad"; changeId: string };
}

const SIM_SEARCH = "Search interest (simulated index)";
const SIM_SOCIAL = "Social listening (simulated)";

function computedSignals(s: JodzState): Signal[] {
  const yr = s.variants.filter((v) => product(v.productId).family === "Young Rider");
  const total = yr.reduce((a, v) => a + v.s30o, 0);
  const sUnits = yr.filter((v) => v.size === "S").reduce((a, v) => a + v.s30o, 0);
  const sShare = total ? Math.round((sUnits / total) * 100) : 0;
  const anReturns = s.returns.filter((r) => r.sku.startsWith("JZ-AN-"));
  const anSize = anReturns.filter((r) => r.sizeRelated).length;
  const reorders = predictedReorders(s).filter((p) => p.includedInCash);
  return [
    { id: "sig-size-s", kind: "Own sales", source: "Shopify orders (demo data)", title: "Size S (10-11 yrs) is " + sShare + "% of Young Rider online units", direction: "up", change: "from 36%", window: "30 days vs previous 30",
      confidence: "High", products: YR, impact: "Buy deeper in S. Admiral Navy S and Midnight Black M are the pinch points today.", detected: "26 Sep",
      action: { type: "link", label: "Open buying plan", page: "Forecasting", section: "buying" } },
    { id: "sig-an-small", kind: "Returns", source: "Returns log", title: "Admiral Navy is running small", direction: "up", change: anSize + " of " + anReturns.length + " returns", window: "last 10 days",
      confidence: anReturns.length >= 3 ? "Medium" : "Low", products: ["an"], impact: "Expect exchanges into the next size up. A size note on the product page could cut them.", detected: "25 Sep",
      action: { type: "link", label: "Open returns", page: "Inventory", section: "returns" } },
    { id: "sig-reorders", kind: "Wholesale", source: "Wholesale order history", title: reorders.length + " retailers are due to reorder before Christmas", direction: "up", change: reorders.length + " accounts", window: "next 90 days",
      confidence: "High", products: YR, impact: "Hold stock for " + reorders.map((r) => r.r.name.replace(" (Demo)", "")).join(", ") + ". These are predictions, not orders.", detected: "26 Sep",
      action: { type: "link", label: "Open demand forecast", page: "Forecasting", section: "demand" } },
  ];
}

export const STATIC_SIGNALS: Signal[] = [
  { id: "sig-navy", kind: "Search", source: SIM_SEARCH, title: "Searches for navy riding leggings for kids are rising", direction: "up", change: "+34%", window: "8 weeks",
    confidence: "High", products: ["an"], impact: "More pressure on Admiral Navy, where size S already has about 2 days of cover. Applying it lifts the Admiral Navy forecast by 10%.", detected: "26 Sep",
    action: { type: "uplift", productId: "an", pct: 10 } },
  { id: "sig-pink", kind: "Search", source: SIM_SEARCH, title: "Interest in pastel pink riding leggings is easing", direction: "down", change: "−21%", window: "since July",
    confidence: "High", products: ["cfp"], impact: "Supports clearing Candy Floss Pink L on its own. The other pink sizes still sell normally, so no range-wide discount.", detected: "24 Sep",
    action: { type: "ad", changeId: "cfp-clearance" } },
  { id: "sig-ponyclub", kind: "Social", source: SIM_SOCIAL, title: "#ponyclub posts are up since the school return", direction: "up", change: "+22%", window: "4 weeks",
    confidence: "Medium", products: ["an", "mbk", "pb"], impact: "Autumn rally season. Rally and arena content earns the best click-through in the ads (customer video, 2.2%).", detected: "23 Sep",
    action: { type: "ad", changeId: "retarget-cap" } },
  { id: "sig-berry", kind: "Search", source: SIM_SEARCH, title: "Berry and burgundy tones are rising for autumn", direction: "up", change: "+18%", window: "6 weeks",
    confidence: "Medium", products: ["mby"], impact: "Merry Berry has healthy stock in XS to M. Applying it lifts the Merry Berry forecast by 8%.", detected: "22 Sep",
    action: { type: "uplift", productId: "mby", pct: 8 } },
  { id: "sig-blackfriday", kind: "Calendar", source: "Retail calendar", title: "Black Friday falls on 27 Nov", direction: "flat", change: "62 days", window: "away",
    confidence: "High", products: YR, impact: "Decide promotion scope early and leave out anything under 14 days of cover. The last supplier order that lands in time is due by 18 Oct.", detected: "26 Sep",
    action: { type: "link", label: "Open calendar", page: "Trends", section: "calendar" } },
  { id: "sig-fleece", kind: "Market", source: "Market scan (simulated)", title: "Fleece-lined winter riding leggings are being pushed hard", direction: "up", change: "Several retailers", window: "this month",
    confidence: "Low", products: [], impact: "A possible winter product gap. Not enough on its own to buy into; worth watching.", detected: "21 Sep" },
  { id: "sig-pocket", kind: "Search", source: SIM_SEARCH, title: "Searches for riding leggings with a phone pocket", direction: "up", change: "+41%", window: "8 weeks, low volume",
    confidence: "Low", products: [], impact: "A feature trend. Check the product details before promoting any feature in ads.", detected: "20 Sep" },
];

export interface SignalRow extends Signal { status: TrendStatus }

export function signalRows(s: JodzState): SignalRow[] {
  const all = [...STATIC_SIGNALS.slice(0, 2), ...computedSignals(s), ...STATIC_SIGNALS.slice(2)];
  return all.map((x) => ({ ...x, status: (s.trendStatus && s.trendStatus[x.id]) || "New" }));
}

export function watchSignal(id: string) {
  const x = signalRows(getState()).find((r) => r.id === id);
  if (x) setTrendStatus(id, "Watching", x.title);
}
export function dismissSignal(id: string) {
  const x = signalRows(getState()).find((r) => r.id === id);
  if (x) setTrendStatus(id, "Dismissed", x.title);
}
export function applySignal(id: string) {
  const x = signalRows(getState()).find((r) => r.id === id);
  if (x && x.action && x.action.type === "uplift" && x.status !== "Applied") applyTrendUplift(id, x.action.productId, x.action.pct, x.title);
}
export function removeSignal(id: string) {
  const x = signalRows(getState()).find((r) => r.id === id);
  if (x && x.action && x.action.type === "uplift" && x.status === "Applied") applyTrendUplift(id, x.action.productId, -x.action.pct, x.title);
}

/* Weekly search interest, 0-100, simulated. Weeks end on the Monday shown. */
export const SEARCH_WEEKS = ["6 Jul", "13 Jul", "20 Jul", "27 Jul", "3 Aug", "10 Aug", "17 Aug", "24 Aug", "31 Aug", "7 Sep", "14 Sep", "21 Sep"];
export const SEARCH_SERIES = [
  { term: "kids riding leggings", values: [52, 50, 49, 51, 55, 58, 61, 63, 66, 70, 72, 74] },
  { term: "navy riding leggings kids", values: [40, 41, 42, 43, 44, 45, 47, 49, 52, 55, 57, 59] },
  { term: "girls jodhpurs", values: [45, 46, 44, 47, 48, 50, 52, 53, 55, 57, 58, 60] },
  { term: "pink riding leggings", values: [62, 63, 61, 58, 56, 54, 52, 50, 49, 48, 48, 49] },
];

export const HASHTAGS = [
  { tag: "#ponyclub", values: [820, 790, 760, 780, 840, 900, 950, 1010, 1080, 1120, 1150, 1180] },
  { tag: "#youngrider", values: [610, 600, 620, 640, 650, 660, 690, 700, 720, 740, 750, 770] },
  { tag: "#equestrianstyle", values: [1400, 1420, 1380, 1360, 1390, 1410, 1430, 1450, 1440, 1470, 1490, 1500] },
];

/* Colour interest (simulated, change over 8 weeks) next to Jod-Z's own sales and stock. */
const COLOUR_SEARCH: Record<string, number> = { an: 34, mbk: 12, bb: 3, cfp: -21, mby: 18, pb: 9 };

export function colourTrends(s: JodzState) {
  const rows = variantRows(s);
  const yrRows = rows.filter((r) => r.p.family === "Young Rider");
  const total = yrRows.reduce((a, r) => a + r.s30o, 0);
  return YR.map((pid) => {
    const pr = yrRows.filter((r) => r.p.id === pid);
    const units = pr.reduce((a, r) => a + r.s30o, 0);
    const avail = pr.reduce((a, r) => a + Math.max(0, r.available), 0);
    const tight = pr.filter((r) => r.rate > 0 && (r.available <= 0 || (r.cover !== null && r.cover < 14)));
    const over = pr.filter((r) => r.flags.includes("Overstock"));
    const change = COLOUR_SEARCH[pid];
    let verdict: string, tone: "bad" | "warn" | "ok";
    if (change > 10 && tight.length) { verdict = "Demand rising, " + tight.map((r) => r.size).join(" and ") + " short"; tone = "bad"; }
    else if (change < -10 && over.length) { verdict = "Demand easing, clear " + over.map((r) => r.size).join(" and ") + " only"; tone = "warn"; }
    else if (change > 10) { verdict = "Demand rising, stock healthy"; tone = "ok"; }
    else if (tight.length) { verdict = tight.map((r) => r.size).join(" and ") + " short"; tone = "warn"; }
    else { verdict = "Steady"; tone = "ok"; }
    return { productId: pid, name: product(pid).name, swatch: product(pid).swatch, searchChange: change, salesShare: total ? units / total : 0, units, available: avail, verdict, tone };
  });
}

/* ---------------- calendar ---------------- */

const LEAD = 35, BUFFER = 5;
const minus = (iso: string, n: number) => {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};

export const MOMENTS = [
  { id: "midterm", name: "Mid-term break pony camps", start: "2026-10-24", end: "2026-11-01", effect: "Kids riding wear up about 10% (demo assumption)", focus: "Navy and black, sizes S and M" },
  { id: "blackfriday", name: "Black Friday and Cyber Monday", start: "2026-11-27", end: "2026-11-30", effect: "Online orders up sharply for 4 days; margin pressure if discounting", focus: "Leave out variants under 14 days of cover" },
  { id: "christmas", name: "Christmas gifting", start: "2026-12-01", end: "2026-12-18", effect: "December demand +30% in the forecast", focus: "Gift-friendly colours and wholesale restocks" },
  { id: "cutoff", name: "Christmas delivery cut-off (demo date)", start: "2026-12-18", end: "2026-12-18", effect: "Orders after this date arrive after Christmas", focus: "Say it clearly on the site and in ads", noStock: true },
  { id: "january", name: "January sale window", start: "2026-12-26", end: "2027-01-15", effect: "Good moment to clear slow movers", focus: "Candy Floss Pink L if still overstocked", noStock: true },
  { id: "spring", name: "Spring show season", start: "2027-03-01", end: "2027-05-31", effect: "Competition and rally wear picks up", focus: "Plan the spring buy in January" },
];

export function calendarRows() {
  return MOMENTS.map((m) => {
    const orderBy = minus(m.start, LEAD + BUFFER);
    const passed = orderBy < SNAPSHOT;
    const draftArrives = "2026-10-31";
    const draftInTime = draftArrives <= m.start;
    const days = Math.round((Date.parse(m.start + "T00:00:00Z") - Date.parse(SNAPSHOT + "T00:00:00Z")) / 86400000);
    const note = "noStock" in m && m.noStock ? "No new stock needed. Uses what is on hand."
      : passed ? (m.id === "midterm" ? "Too late for a new order. PO-0187 lands 24 Oct." : "Too late for a new supplier order.")
      : "Order by " + fmtDate(orderBy) + " (35-day lead time plus 5 days)";
    return { ...m, days, orderBy, orderByPassed: passed, draftInTime, note };
  });
}

/* ---------------- record labels ---------------- */

registerLinkLabel("campaign", (id) => CAMPAIGNS.find((c) => c.id === id)?.name || "Advertising");
registerLinkLabel("signal", (id) => {
  const all = [...STATIC_SIGNALS];
  const hit = all.find((x) => x.id === id);
  if (hit) return hit.title;
  return id === "sig-size-s" ? "Size S share rising" : id === "sig-an-small" ? "Admiral Navy running small" : id === "sig-reorders" ? "Wholesale reorders due" : "Trend";
});
