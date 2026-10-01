/* Jod-Z demo dataset.
   Product names, the Young Rider size guide and the €59 Midnight Black list price come from
   jod-z.com. Everything else here (stock, sales, staff, retailers, suppliers, cash) is
   fictional demo data and makes no claim about Jod-Z's actual business. */

export const SNAPSHOT = "2026-09-26";
export const SNAPSHOT_LABEL = "26 Sep 2026";

export type Family = "Young Rider" | "Jockeys";

export interface Product {
  id: string;
  name: string;
  family: Family;
  colour: string;
  swatch: string;
  sizes: string[];
  /** Online selling price excluding tax, used for demo revenue. */
  onlineNet: number;
  /** Agreed trade price per unit, excluding tax. */
  trade: number;
  /** Illustrative landed unit cost. */
  cost: number;
  /** Public retail price reference, where one is published. */
  listPrice?: string;
}

export interface Variant {
  sku: string;
  productId: string;
  size: string;
  onHand: number;
  /** Quarantined or otherwise unsellable units. */
  unavailable: number;
  /** Online units sold in the 30 days to the snapshot. */
  s30o: number;
  /** Online units sold in the 28 days to the snapshot. */
  s28: number;
  /** Days in the last 28 with no available stock. */
  stockoutDays: number;
}

export interface Staff { id: string; name: string; role: string; initials: string; email: string; area: string }
export interface Retailer {
  id: string; name: string; contact: string; email: string; town: string; terms: number; owner: string;
  lastOrder: string; intervalDays: number; typicalUnits: number; typicalValue: number; typicalMix: string;
  paysLate?: boolean;
}
export interface Supplier { id: string; name: string; contact: string; email: string; makes: string; leadDays: number; moq: string; depositPct: number; balanceTerms: string }

export type Stage = "Draft" | "Confirmed" | "Allocated" | "Dispatched" | "Complete";
export interface OrderLine { sku: string; qty: number; allocated: number; dispatched: number; /** Trade price for this line when it differs from the order price. */ price?: number }
export interface Dispatch { date: string; units: number; note: string; /** Value shipped, ex tax. Defaults to units x order price. */ value?: number }
export interface WholesaleOrder {
  id: string; retailerId: string; stage: Stage; created: string; requestedDispatch: string; completed?: string;
  owner: string; price: number; lines: OrderLine[]; dispatches: Dispatch[]; notes: string[];
  paymentHold?: boolean; promiseDate?: string;
}

export interface Invoice {
  id: string; orderId: string; retailerId: string; issued: string; due: string; net: number;
  /** Synthetic tax field. Jod-Z's real tax treatment is not known. */
  tax: number; paid: number; expected: string;
  reminder: "none" | "drafted" | "approved";
  payments: { date: string; amount: number; note: string }[];
}

export interface Bill {
  id: string; payee: string; supplierId?: string; poId?: string; category: string; issued: string; due: string;
  net: number; tax: number; paid: number; expected: string;
}

export type PoStatus = "Draft" | "Approved" | "Confirmed" | "Received";
export interface PoLine { sku: string; qty: number; received: number }
export interface PurchaseOrder {
  id: string; supplierId: string; status: PoStatus; ordered?: string; expected: string; unitCost: number;
  lines: PoLine[]; depositDate: string; depositPaid: boolean; balanceDate: string; balancePaid: boolean;
  depositPct: number; note: string;
}

export interface ReturnRec {
  id: string; orderRef: string; channel: "Online" | "Wholesale"; sku: string; reason: string; sizeRelated: boolean;
  condition: "Sellable" | "Damaged"; resolution: "Refund" | "Exchange"; exchangeSku?: string; refund: number;
  status: "Awaiting decision" | "Refunded" | "Exchanged"; restock: "Pending" | "Restocked" | "Quarantined"; received: string;
}

export interface Movement { id: string; sku: string; date: string; qty: number; kind: string; ref: string; note: string }

export type Certainty = "known" | "estimated";
export interface CashEvent { id: string; date: string; amount: number; label: string; category: string; certainty: Certainty; kind: "receipt" | "payment"; link?: RecordLink }

export type RecordKind = "variant" | "order" | "invoice" | "bill" | "po" | "return" | "retailer" | "supplier" | "approval" | "task" | "campaign" | "signal";
export interface RecordLink { kind: RecordKind; id: string }

/* ---------------- brand + organisation ---------------- */

export const BRAND = {
  name: "Jod-Z",
  site: "https://jod-z.com/",
  line: "Equestrian clothing · designed in Ireland by riders",
  ink: "#111111",
  paper: "#F7F7F5",
  muted: "#71717A",
  storefront: "Shopify",
};

export const YOUNG_RIDER_SIZES = ["2XS", "XS", "S", "M", "L"];
export const SIZE_AGES: Record<string, string> = { "2XS": "6-7 yrs", XS: "8-9 yrs", S: "10-11 yrs", M: "12-13 yrs", L: "14-15 yrs" };
export const JOCKEY_SIZES = ["XS", "S", "M", "L", "XL"];

export const STAFF: Staff[] = [
  { id: "ad", name: "Aoibhe Dunleavy", role: "Owner", initials: "AD", email: "owner@demo.invalid", area: "Owner" },
  { id: "rk", name: "Rory Kinsella", role: "Operations", initials: "RK", email: "ops@demo.invalid", area: "Operations" },
  { id: "mb", name: "Maeve Breslin", role: "Stock", initials: "MB", email: "stock@demo.invalid", area: "Stock" },
  { id: "dw", name: "Declan Whelan", role: "Finance", initials: "DW", email: "finance@demo.invalid", area: "Finance" },
];

export const PRODUCTS: Product[] = [
  { id: "an", name: "Admiral Navy", family: "Young Rider", colour: "Navy", swatch: "#1f2c4c", sizes: YOUNG_RIDER_SIZES, onlineNet: 48, trade: 30, cost: 18 },
  { id: "mbk", name: "Midnight Black", family: "Young Rider", colour: "Black", swatch: "#17171a", sizes: YOUNG_RIDER_SIZES, onlineNet: 48, trade: 30, cost: 18, listPrice: "€59 incl. tax (jod-z.com)" },
  { id: "bb", name: "Buttermilk Beige", family: "Young Rider", colour: "Beige", swatch: "#e9dcbc", sizes: YOUNG_RIDER_SIZES, onlineNet: 48, trade: 30, cost: 18 },
  { id: "cfp", name: "Candy Floss Pink", family: "Young Rider", colour: "Pink", swatch: "#f3b8cb", sizes: YOUNG_RIDER_SIZES, onlineNet: 48, trade: 30, cost: 18 },
  { id: "mby", name: "Merry Berry", family: "Young Rider", colour: "Berry", swatch: "#8c2f5c", sizes: YOUNG_RIDER_SIZES, onlineNet: 48, trade: 30, cost: 18 },
  { id: "pb", name: "Petrol Blue", family: "Young Rider", colour: "Petrol", swatch: "#1f5664", sizes: YOUNG_RIDER_SIZES, onlineNet: 48, trade: 30, cost: 18 },
  { id: "mon", name: "The Monarch Breech (Navy)", family: "Jockeys", colour: "Navy", swatch: "#243353", sizes: JOCKEY_SIZES, onlineNet: 72, trade: 45, cost: 30 },
  { id: "ecl", name: "The Eclipse Breech (Black)", family: "Jockeys", colour: "Black", swatch: "#101012", sizes: JOCKEY_SIZES, onlineNet: 72, trade: 45, cost: 30 },
];

const SKU_CODE: Record<string, string> = { an: "AN", mbk: "MB", bb: "BB", cfp: "CF", mby: "MY", pb: "PB", mon: "MON", ecl: "ECL" };
export const skuOf = (productId: string, size: string) => "JZ-" + SKU_CODE[productId] + "-" + size;

/* onHand, unavailable, s30o per size, in each product's size order */
const STOCK: Record<string, [number[], number[], number[]]> = {
  an:  [[20, 34, 18, 52, 40], [0, 0, 0, 0, 0], [4, 10, 84, 20, 10]],
  mbk: [[18, 30, 44, 14, 38], [0, 0, 0, 2, 0], [4, 10, 22, 26, 12]],
  bb:  [[26, 40, 46, 30, 22], [0, 0, 0, 0, 0], [2, 6, 10, 8, 4]],
  cfp: [[30, 36, 42, 38, 96], [0, 0, 0, 0, 0], [4, 8, 10, 6, 5]],
  mby: [[22, 44, 36, 28, 16], [0, 0, 0, 0, 0], [3, 8, 12, 9, 4]],
  pb:  [[16, 28, 40, 34, 20], [0, 0, 0, 0, 0], [3, 7, 14, 12, 8]],
  mon: [[6, 10, 12, 8, 4], [0, 0, 0, 0, 0], [1, 2, 4, 2, 1]],
  ecl: [[4, 8, 10, 9, 5], [0, 0, 0, 0, 0], [1, 2, 3, 3, 1]],
};
/* Where the 28-day figure or stockout history differs from a straight pro-rata. */
const S28_OVERRIDE: Record<string, { s28: number; stockoutDays: number }> = {
  "JZ-AN-S": { s28: 78, stockoutDays: 2 },
  "JZ-CF-L": { s28: 5, stockoutDays: 0 },
};

export const VARIANTS: Variant[] = PRODUCTS.flatMap((p) =>
  p.sizes.map((size, i) => {
    const sku = skuOf(p.id, size);
    const [on, un, s30] = STOCK[p.id];
    const o = S28_OVERRIDE[sku];
    return {
      sku, productId: p.id, size, onHand: on[i], unavailable: un[i], s30o: s30[i],
      s28: o ? o.s28 : Math.round((s30[i] * 28) / 30), stockoutDays: o ? o.stockoutDays : 0,
    };
  })
);

export const SUPPLIERS: Supplier[] = [
  { id: "sup-ng", name: "Northgate Knitwear (Demo)", contact: "Account desk", email: "orders@northgate.demo.invalid", makes: "Young Rider leggings", leadDays: 35, moq: "50 units per colour", depositPct: 30, balanceTerms: "Balance 20 days after delivery" },
  { id: "sup-ct", name: "Carrow Textiles (Demo)", contact: "Trade sales", email: "trade@carrow.demo.invalid", makes: "Jockeys breeches, trims", leadDays: 42, moq: "60 units per style", depositPct: 30, balanceTerms: "Balance on delivery" },
];

export const RETAILERS: Retailer[] = [
  { id: "r-meadow", name: "Meadow Tack (Demo)", contact: "Buyer", email: "buyer@meadowtack.demo.invalid", town: "Co. Kildare", terms: 30, owner: "rk", lastOrder: "2026-09-12", intervalDays: 120, typicalUnits: 120, typicalValue: 3600, typicalMix: "Midnight Black, Admiral Navy S-L" },
  { id: "r-oak", name: "Oakfield Saddlery (Demo)", contact: "Owner", email: "shop@oakfield.demo.invalid", town: "Co. Meath", terms: 30, owner: "rk", lastOrder: "2026-09-18", intervalDays: 120, typicalUnits: 80, typicalValue: 2400, typicalMix: "Admiral Navy S, pastels" },
  { id: "r-river", name: "Riverbend Tack Room (Demo)", contact: "Buyer", email: "orders@riverbend.demo.invalid", town: "Co. Wicklow", terms: 30, owner: "dw", lastOrder: "2026-09-22", intervalDays: 120, typicalUnits: 80, typicalValue: 2400, typicalMix: "Petrol Blue, Merry Berry" },
  { id: "r-saddle", name: "Saddle & Stirrup (Demo)", contact: "Manager", email: "hello@saddlestirrup.demo.invalid", town: "Co. Cork", terms: 30, owner: "rk", lastOrder: "2026-08-29", intervalDays: 70, typicalUnits: 80, typicalValue: 2400, typicalMix: "Admiral Navy, Midnight Black" },
  { id: "r-hill", name: "Hillcrest Equestrian (Demo)", contact: "Buyer", email: "buying@hillcrest.demo.invalid", town: "Co. Galway", terms: 30, owner: "dw", lastOrder: "2026-09-04", intervalDays: 72, typicalUnits: 120, typicalValue: 3600, typicalMix: "Core navy and black, all sizes" },
  { id: "r-paddock", name: "Paddock & Co (Demo)", contact: "Owner", email: "accounts@paddockco.demo.invalid", town: "Co. Tipperary", terms: 30, owner: "dw", lastOrder: "2026-08-02", intervalDays: 84, typicalUnits: 60, typicalValue: 1800, typicalMix: "Black and navy, S-M", paysLate: true },
  { id: "r-bridle", name: "Bridle Lane (Demo)", contact: "Buyer", email: "orders@bridlelane.demo.invalid", town: "Co. Wexford", terms: 30, owner: "rk", lastOrder: "2026-07-20", intervalDays: 122, typicalUnits: 66, typicalValue: 2000, typicalMix: "Mixed colours, XS-M" },
  { id: "r-fetlock", name: "Fetlock & Field (Demo)", contact: "Manager", email: "shop@fetlockfield.demo.invalid", town: "Co. Louth", terms: 45, owner: "rk", lastOrder: "2026-06-30", intervalDays: 180, typicalUnits: 60, typicalValue: 1800, typicalMix: "Breeches trial, Young Rider core" },
];

const L = (productId: string, size: string, qty: number, allocated: number, dispatched = 0): OrderLine => ({ sku: skuOf(productId, size), qty, allocated, dispatched });

export const ORDERS: WholesaleOrder[] = [
  { id: "JOD-W1041", retailerId: "r-meadow", stage: "Confirmed", created: "2026-09-12", requestedDispatch: "2026-10-14", owner: "rk", price: 30,
    lines: [L("mbk", "M", 24, 12), L("mbk", "S", 24, 24), L("an", "M", 24, 24), L("an", "L", 24, 24), L("pb", "S", 24, 24)],
    dispatches: [], notes: ["Autumn restock. Buyer asked for one delivery if possible.", "Midnight Black M is 12 short. 40 due on PO-0187, 24 Oct."] },
  { id: "JOD-W1042", retailerId: "r-oak", stage: "Allocated", created: "2026-09-18", requestedDispatch: "2026-10-02", owner: "rk", price: 30,
    lines: [L("an", "S", 12, 12), L("bb", "S", 20, 20), L("mby", "XS", 24, 24), L("cfp", "M", 24, 24)],
    dispatches: [], notes: ["Fully allocated. Packing booked for 1 Oct."] },
  { id: "JOD-W1043", retailerId: "r-river", stage: "Confirmed", created: "2026-09-22", requestedDispatch: "2026-10-09", owner: "dw", price: 30,
    lines: [L("pb", "M", 20, 0), L("mby", "S", 20, 0), L("mbk", "L", 20, 0), L("bb", "XS", 20, 0)],
    dispatches: [], notes: ["Confirmed by email 22 Sep. Not yet allocated."] },
  { id: "JOD-W1038", retailerId: "r-hill", stage: "Complete", created: "2026-09-04", requestedDispatch: "2026-09-19", completed: "2026-09-19", owner: "dw", price: 30,
    lines: [L("an", "S", 24, 24, 24), L("mbk", "M", 24, 24, 24), L("bb", "S", 24, 24, 24), L("an", "L", 24, 24, 24), L("pb", "M", 24, 24, 24)],
    dispatches: [{ date: "2026-09-19", units: 120, note: "Full dispatch, courier (simulated)" }], notes: ["Delivered 22 Sep."] },
  { id: "JOD-W1036", retailerId: "r-saddle", stage: "Complete", created: "2026-08-29", requestedDispatch: "2026-09-08", completed: "2026-09-08", owner: "rk", price: 30,
    lines: [L("an", "M", 20, 20, 20), L("mbk", "S", 20, 20, 20), L("pb", "S", 20, 20, 20), L("mby", "XS", 20, 20, 20)],
    dispatches: [{ date: "2026-09-08", units: 80, note: "Full dispatch, courier (simulated)" }], notes: [] },
  { id: "JOD-W1029", retailerId: "r-paddock", stage: "Complete", created: "2026-08-02", requestedDispatch: "2026-08-09", completed: "2026-08-09", owner: "dw", price: 30,
    lines: [L("mbk", "S", 30, 30, 30), L("an", "M", 30, 30, 30)],
    dispatches: [{ date: "2026-08-09", units: 60, note: "Full dispatch, courier (simulated)" }], notes: ["Invoice JOD-INV2031 unpaid."] },
  { id: "JOD-W1024", retailerId: "r-bridle", stage: "Complete", created: "2026-07-20", requestedDispatch: "2026-07-24", completed: "2026-07-24", owner: "rk", price: 30,
    lines: [L("mby", "S", 22, 22, 22), L("pb", "XS", 22, 22, 22), L("bb", "M", 22, 22, 22)],
    dispatches: [{ date: "2026-07-24", units: 66, note: "Full dispatch" }], notes: [] },
];

export const INVOICES: Invoice[] = [
  { id: "JOD-INV2031", orderId: "JOD-W1029", retailerId: "r-paddock", issued: "2026-08-09", due: "2026-09-08", net: 1800, tax: 0, paid: 0, expected: "2026-10-03", reminder: "none", payments: [] },
  { id: "JOD-INV2034", orderId: "JOD-W1036", retailerId: "r-saddle", issued: "2026-09-08", due: "2026-10-08", net: 2400, tax: 0, paid: 2400, expected: "2026-09-24", reminder: "none", payments: [{ date: "2026-09-24", amount: 2400, note: "Bank transfer (simulated)" }] },
  { id: "JOD-INV2036", orderId: "JOD-W1038", retailerId: "r-hill", issued: "2026-09-20", due: "2026-10-20", net: 3600, tax: 0, paid: 0, expected: "2026-10-20", reminder: "none", payments: [] },
  { id: "JOD-INV2027", orderId: "JOD-W1024", retailerId: "r-bridle", issued: "2026-07-24", due: "2026-08-23", net: 1980, tax: 0, paid: 1980, expected: "2026-08-21", reminder: "none", payments: [{ date: "2026-08-21", amount: 1980, note: "Bank transfer (simulated)" }] },
];

export const PURCHASE_ORDERS: PurchaseOrder[] = [
  { id: "PO-0187", supplierId: "sup-ng", status: "Confirmed", ordered: "2026-09-02", expected: "2026-10-24", unitCost: 18, depositPct: 30,
    lines: [{ sku: "JZ-AN-S", qty: 60, received: 0 }, { sku: "JZ-AN-M", qty: 40, received: 0 }, { sku: "JZ-MB-S", qty: 40, received: 0 }, { sku: "JZ-MB-M", qty: 40, received: 0 }, { sku: "JZ-PB-S", qty: 30, received: 0 }, { sku: "JZ-BB-XS", qty: 30, received: 0 }],
    depositDate: "2026-09-03", depositPaid: true, balanceDate: "2026-10-24", balancePaid: false, note: "Autumn top-up. Confirmed by supplier 4 Sep." },
  { id: "PO-0190", supplierId: "sup-ct", status: "Confirmed", ordered: "2026-09-15", expected: "2026-11-18", unitCost: 30, depositPct: 30,
    lines: [{ sku: "JZ-MON-S", qty: 20, received: 0 }, { sku: "JZ-MON-M", qty: 20, received: 0 }, { sku: "JZ-MON-L", qty: 20, received: 0 }, { sku: "JZ-ECL-S", qty: 20, received: 0 }, { sku: "JZ-ECL-M", qty: 20, received: 0 }, { sku: "JZ-ECL-L", qty: 20, received: 0 }],
    depositDate: "2026-09-16", depositPaid: true, balanceDate: "2026-11-20", balancePaid: false, note: "Jockeys winter run." },
  { id: "PO-D193", supplierId: "sup-ng", status: "Draft", expected: "2026-10-31", unitCost: 18, depositPct: 30,
    lines: [{ sku: "JZ-AN-S", qty: 120, received: 0 }, { sku: "JZ-AN-M", qty: 60, received: 0 }, { sku: "JZ-AN-XS", qty: 30, received: 0 }, { sku: "JZ-MB-M", qty: 90, received: 0 }, { sku: "JZ-MB-S", qty: 60, received: 0 }, { sku: "JZ-MB-L", qty: 40, received: 0 }, { sku: "JZ-PB-S", qty: 60, received: 0 }, { sku: "JZ-PB-M", qty: 50, received: 0 }, { sku: "JZ-MY-S", qty: 50, received: 0 }, { sku: "JZ-BB-S", qty: 40, received: 0 }],
    depositDate: "2026-10-03", depositPaid: false, balanceDate: "2026-11-20", balancePaid: false, note: "Draft replenishment prepared by the Stock & Demand agent. Not approved, not sent to the supplier." },
  { id: "PO-0184", supplierId: "sup-ng", status: "Received", ordered: "2026-07-14", expected: "2026-08-20", unitCost: 18, depositPct: 30,
    lines: [{ sku: "JZ-CF-L", qty: 90, received: 90 }, { sku: "JZ-AN-M", qty: 60, received: 60 }, { sku: "JZ-MB-L", qty: 50, received: 50 }],
    depositDate: "2026-07-15", depositPaid: true, balanceDate: "2026-09-09", balancePaid: true, note: "Received in full 20 Aug." },
];

export const BILLS: Bill[] = [
  { id: "BILL-0412", payee: "Carrow Textiles (Demo)", supplierId: "sup-ct", category: "Trims and labels", issued: "2026-09-10", due: "2026-10-10", net: 2976, tax: 0, paid: 0, expected: "2026-10-10" },
  { id: "BILL-0415", payee: "Fulfilment partner (Demo)", category: "Fulfilment", issued: "2026-09-15", due: "2026-10-15", net: 1200, tax: 0, paid: 0, expected: "2026-10-15" },
  { id: "BILL-0409", payee: "Packaging supplier (Demo)", category: "Packaging", issued: "2026-09-01", due: "2026-09-20", net: 860, tax: 0, paid: 860, expected: "2026-09-20" },
];

export const RETURNS: ReturnRec[] = [
  { id: "RET-311", orderRef: "#JZ5122", channel: "Online", sku: "JZ-MB-M", reason: "Seam fault on arrival", sizeRelated: false, condition: "Damaged", resolution: "Refund", refund: 48, status: "Refunded", restock: "Quarantined", received: "2026-09-17" },
  { id: "RET-312", orderRef: "#JZ5140", channel: "Online", sku: "JZ-MB-M", reason: "Snagged in transit", sizeRelated: false, condition: "Damaged", resolution: "Refund", refund: 48, status: "Refunded", restock: "Quarantined", received: "2026-09-19" },
  { id: "RET-314", orderRef: "#JZ5188", channel: "Online", sku: "JZ-AN-S", reason: "Too small, exchange for M", sizeRelated: true, condition: "Sellable", resolution: "Exchange", exchangeSku: "JZ-AN-M", refund: 0, status: "Awaiting decision", restock: "Pending", received: "2026-09-24" },
  { id: "RET-315", orderRef: "#JZ5171", channel: "Online", sku: "JZ-AN-S", reason: "Too small", sizeRelated: true, condition: "Sellable", resolution: "Refund", refund: 48, status: "Refunded", restock: "Restocked", received: "2026-09-21" },
  { id: "RET-316", orderRef: "#JZ5203", channel: "Online", sku: "JZ-CF-L", reason: "Colour not as expected", sizeRelated: false, condition: "Sellable", resolution: "Refund", refund: 48, status: "Awaiting decision", restock: "Pending", received: "2026-09-25" },
  { id: "RET-317", orderRef: "#JZ5196", channel: "Online", sku: "JZ-AN-XS", reason: "Too small, exchange for S", sizeRelated: true, condition: "Sellable", resolution: "Exchange", exchangeSku: "JZ-AN-S", refund: 0, status: "Awaiting decision", restock: "Pending", received: "2026-09-25" },
];

export const MOVEMENTS: Movement[] = [
  { id: "mv1", sku: "JZ-CF-L", date: "2026-08-20", qty: 90, kind: "Received", ref: "PO-0184", note: "Delivery received in full" },
  { id: "mv2", sku: "JZ-AN-M", date: "2026-08-20", qty: 60, kind: "Received", ref: "PO-0184", note: "Delivery received in full" },
  { id: "mv3", sku: "JZ-MB-L", date: "2026-08-20", qty: 50, kind: "Received", ref: "PO-0184", note: "Delivery received in full" },
  { id: "mv4", sku: "JZ-AN-S", date: "2026-09-19", qty: -24, kind: "Dispatched", ref: "JOD-W1038", note: "Wholesale dispatch" },
  { id: "mv5", sku: "JZ-MB-M", date: "2026-09-19", qty: -24, kind: "Dispatched", ref: "JOD-W1038", note: "Wholesale dispatch" },
  { id: "mv6", sku: "JZ-MB-M", date: "2026-09-17", qty: 1, kind: "Return quarantined", ref: "RET-311", note: "Damaged, held as unavailable" },
  { id: "mv7", sku: "JZ-MB-M", date: "2026-09-19", qty: 1, kind: "Return quarantined", ref: "RET-312", note: "Damaged, held as unavailable" },
  { id: "mv8", sku: "JZ-AN-S", date: "2026-09-21", qty: 1, kind: "Return restocked", ref: "RET-315", note: "Sellable return" },
  { id: "mv9", sku: "JZ-AN-S", date: "2026-09-24", qty: -84, kind: "Online sales (30d)", ref: "Shopify", note: "Aggregated online sales, simulated" },
  { id: "mv10", sku: "JZ-CF-L", date: "2026-09-24", qty: -5, kind: "Online sales (30d)", ref: "Shopify", note: "Aggregated online sales, simulated" },
];

/* Recurring cash items that are not invoices, bills or purchase orders.
   Invoice, bill, open-order and PO cash is derived from those records so nothing is counted twice. */
const E = (id: string, date: string, amount: number, label: string, category: string, certainty: Certainty): CashEvent =>
  ({ id, date, amount, label, category, certainty, kind: amount >= 0 ? "receipt" : "payment" });

export const CASH_EVENTS: CashEvent[] = [
  /* online payouts, estimated from trading */
  E("po-0929", "2026-09-29", 4100, "Shopify payout (simulated)", "Online payouts", "estimated"),
  E("po-1006", "2026-10-06", 4200, "Shopify payout (simulated)", "Online payouts", "estimated"),
  E("po-1013", "2026-10-13", 4100, "Shopify payout (simulated)", "Online payouts", "estimated"),
  E("po-1020", "2026-10-20", 4200, "Shopify payout (simulated)", "Online payouts", "estimated"),
  E("po-1027", "2026-10-27", 3400, "Shopify payout (simulated)", "Online payouts", "estimated"),
  E("po-1103", "2026-11-03", 3500, "Shopify payout (simulated)", "Online payouts", "estimated"),
  E("po-1110", "2026-11-10", 3500, "Shopify payout (simulated)", "Online payouts", "estimated"),
  E("po-1117", "2026-11-17", 3600, "Shopify payout (simulated)", "Online payouts", "estimated"),
  E("po-1124", "2026-11-24", 3600, "Shopify payout (simulated)", "Online payouts", "estimated"),
  E("po-1201", "2026-12-01", 6800, "Shopify payout (simulated)", "Online payouts", "estimated"),
  E("po-1208", "2026-12-08", 6000, "Shopify payout (simulated)", "Online payouts", "estimated"),
  E("po-1215", "2026-12-15", 5600, "Shopify payout (simulated)", "Online payouts", "estimated"),
  E("po-1222", "2026-12-22", 5100, "Shopify payout (simulated)", "Online payouts", "estimated"),
  /* predicted wholesale reorders: not customer orders */
  E("pr-saddle", "2026-12-10", 2400, "Predicted reorder, Saddle & Stirrup", "Predicted wholesale", "estimated"),
  E("pr-hill", "2026-12-18", 3600, "Predicted reorder, Hillcrest Equestrian", "Predicted wholesale", "estimated"),
  E("pr-bridle", "2026-12-22", 2000, "Predicted reorder, Bridle Lane", "Predicted wholesale", "estimated"),
  /* operating expenses */
  E("st-1001", "2026-10-01", -6500, "Staff costs", "Operating expenses", "known"),
  E("st-1102", "2026-11-02", -6500, "Staff costs", "Operating expenses", "known"),
  E("st-1201", "2026-12-01", -6500, "Staff costs", "Operating expenses", "known"),
  E("rent-1001", "2026-10-01", -1800, "Storage unit rent", "Operating expenses", "known"),
  E("rent-1101", "2026-11-01", -1800, "Storage unit rent", "Operating expenses", "known"),
  E("rent-1201", "2026-12-01", -1800, "Storage unit rent", "Operating expenses", "known"),
  E("sub-1001", "2026-10-01", -420, "Software subscriptions", "Operating expenses", "known"),
  E("sub-1101", "2026-11-01", -420, "Software subscriptions", "Operating expenses", "known"),
  E("sub-1201", "2026-12-01", -420, "Software subscriptions", "Operating expenses", "known"),
  E("ads-1005", "2026-10-05", -2100, "Online advertising", "Operating expenses", "estimated"),
  E("ads-1019", "2026-10-19", -2100, "Online advertising", "Operating expenses", "estimated"),
  E("ads-1102", "2026-11-02", -2300, "Online advertising", "Operating expenses", "estimated"),
  E("ads-1109", "2026-11-09", -2500, "Seasonal advertising", "Operating expenses", "estimated"),
  E("ads-1116", "2026-11-16", -2300, "Online advertising", "Operating expenses", "estimated"),
  E("ads-1123", "2026-11-23", -2500, "Seasonal advertising", "Operating expenses", "estimated"),
  E("ads-1209", "2026-12-09", -2400, "Online advertising", "Operating expenses", "estimated"),
  E("ads-1214", "2026-12-14", -2400, "Online advertising", "Operating expenses", "estimated"),
  E("pack-1008", "2026-10-08", -900, "Packaging", "Operating expenses", "estimated"),
  E("pack-1112", "2026-11-12", -900, "Packaging", "Operating expenses", "estimated"),
  E("pack-1210", "2026-12-10", -900, "Packaging", "Operating expenses", "estimated"),
  E("cour-1115", "2026-11-15", -1300, "Courier and fulfilment", "Operating expenses", "estimated"),
  E("cour-1215", "2026-12-15", -1600, "Courier and fulfilment", "Operating expenses", "estimated"),
  E("prof-1020", "2026-10-20", -1100, "Bookkeeping and professional fees", "Operating expenses", "known"),
  E("prof-1120", "2026-11-20", -1100, "Bookkeeping and professional fees", "Operating expenses", "known"),
  E("prof-1220", "2026-12-20", -1100, "Bookkeeping and professional fees", "Operating expenses", "known"),
  E("show-1118", "2026-11-18", -2000, "Trade show stand", "Operating expenses", "known"),
  /* supplier costs ordered but not yet billed */
  E("sup-1105", "2026-11-05", -1540, "Samples and trims, Carrow Textiles (Demo), not yet billed", "Supplier bills", "known"),
  E("sup-1208", "2026-12-08", -2480, "Trims and packaging, Northgate Knitwear (Demo), not yet billed", "Supplier bills", "known"),
  /* refunds */
  E("ref-1015", "2026-10-15", -380, "Online refunds", "Refunds", "estimated"),
  E("ref-1114", "2026-11-14", -420, "Online refunds", "Refunds", "estimated"),
  E("ref-1212", "2026-12-12", -600, "Online refunds", "Refunds", "estimated"),
  /* synthetic, explicitly seeded tax payments */
  E("tax-1023", "2026-10-23", -3200, "Tax payment (synthetic seed)", "Tax", "known"),
  E("tax-1124", "2026-11-24", -3400, "Tax payment (synthetic seed)", "Tax", "known"),
];

export const OPENING_CASH = 32500;
export const DEFAULT_BUFFER = 20000;

/* Previous 30-day period, for comparisons. */
export const PREV_PERIOD = { online: 16400, wholesale: 7200, onlineOrders: 281, wholesaleOrders: 3, cogs: 10040 };

/* Online revenue, excluding tax, per day for the 30 days to the snapshot. Sums to €18,000. */
const DAILY_WEIGHTS = [0.9, 1.1, 0.8, 1.0, 1.3, 1.4, 0.9, 0.8, 1.0, 0.9, 1.1, 1.5, 1.6, 1.0, 0.9, 1.0, 0.8, 1.2, 1.4, 1.3, 0.9, 1.0, 0.9, 1.1, 1.2, 1.5, 1.4, 0.8, 1.0, 1.1];
export const DAILY_ONLINE: { date: string; revenue: number; orders: number }[] = (() => {
  const total = DAILY_WEIGHTS.reduce((a, b) => a + b, 0);
  let left = 18000, ordersLeft = 300;
  return DAILY_WEIGHTS.map((w, i) => {
    const d = new Date(Date.UTC(2026, 7, 28 + i));
    const date = d.toISOString().slice(0, 10);
    const last = i === DAILY_WEIGHTS.length - 1;
    const rev = last ? left : Math.round((18000 * w) / total / 48) * 48;
    const ord = last ? ordersLeft : Math.round((300 * w) / total);
    left -= rev; ordersLeft -= ord;
    return { date, revenue: rev, orders: ord };
  });
})();

export const TASKS_SEED = [
  { id: "T-101", title: "Decide how to cover the Admiral Navy S gap", owner: "mb", due: "2026-09-27", priority: "High", status: "Open", link: { kind: "variant", id: "JZ-AN-S" } as RecordLink, thread: "A" },
  { id: "T-102", title: "Agree partial dispatch or new date with Meadow Tack", owner: "rk", due: "2026-09-28", priority: "High", status: "Open", link: { kind: "order", id: "JOD-W1041" } as RecordLink, thread: "B" },
  { id: "T-103", title: "Review drafted reminder for JOD-INV2031", owner: "dw", due: "2026-09-26", priority: "High", status: "Open", link: { kind: "invoice", id: "JOD-INV2031" } as RecordLink, thread: "C" },
  { id: "T-104", title: "Review targeted clearance for Candy Floss Pink L", owner: "mb", due: "2026-10-03", priority: "Medium", status: "Open", link: { kind: "variant", id: "JZ-CF-L" } as RecordLink, thread: "D" },
  { id: "T-105", title: "Approve or revise draft replenishment PO-D193", owner: "ad", due: "2026-09-30", priority: "High", status: "Open", link: { kind: "po", id: "PO-D193" } as RecordLink, thread: "E" },
  { id: "T-106", title: "Allocate stock to JOD-W1043", owner: "rk", due: "2026-10-01", priority: "Medium", status: "Open", link: { kind: "order", id: "JOD-W1043" } as RecordLink, thread: "B" },
  { id: "T-107", title: "Decide restock for RET-316 and RET-314", owner: "mb", due: "2026-09-29", priority: "Low", status: "Open", link: { kind: "return", id: "RET-316" } as RecordLink, thread: "D" },
];
