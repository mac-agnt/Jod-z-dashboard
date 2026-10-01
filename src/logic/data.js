/* Demo data and pure helpers for the Pulse prototype (Jod-Z demo). */

const INK="var(--ink)", BODY="var(--body)", DIM="var(--dim)", FAINT="var(--faint)";
const LIME="var(--accent)", GREEN="var(--ok)", AMBER="var(--warn)", RED="var(--bad)", NEUTRAL="var(--neutral)";
const MONO="var(--mono)";

const ICONS = {
  navHome:"M12 3.2 3.6 9.1v10a1.5 1.5 0 0 0 1.5 1.5h13.8a1.5 1.5 0 0 0 1.5-1.5v-10L12 3.2Z M8.9 13.1h2l1-2.6 1.5 5 1.1-2.4h1.6",
  navAgents:"M12 2.4v2.3 M12 2.4a.9.9 0 1 0 0-.02 M8.2 6.5h7.6A2.2 2.2 0 0 1 18 8.7v5.1a2.2 2.2 0 0 1-2.2 2.2H8.2A2.2 2.2 0 0 1 6 13.8V8.7a2.2 2.2 0 0 1 2.2-2.2Z M9.9 10.6v1.4 M14.1 10.6v1.4 M6 10h-1.9 M18 10h1.9 M9.2 18.6h5.6 M9.2 21.2h5.6",
  navSales:"M4 19.5h16 M6.5 16V11 M11 16V7.5 M15.5 16v-5.5 M20 5l-4.6 4.3-3.2-2.6L6 11.6",
  navStock:"M4 8.2 12 4l8 4.2v8.6L12 21l-8-4.2V8.2Z M4 8.2l8 4.2 8-4.2 M12 12.4V21 M8 6.1l8 4.2",
  navBooks:"M5 4.5h10.5A3.5 3.5 0 0 1 19 8v11.5H8.5A3.5 3.5 0 0 1 5 16V4.5Z M5 16a3.5 3.5 0 0 1 3.5-3.5H19 M9 8.5h6",
  navForecast:"M3.5 18.5 9 12.5l3.5 3 4-5 M16.5 10.5l4-4.5 M4 5v14.5h16.5 M17.5 6h3v3",
  navTrends:"M3.5 17.5 9.2 11.8l3.6 3.6 7.7-7.7 M15.6 7.7h4.9v4.9 M4 21h16",
  navAds:"M4 10.2v3.6c0 .6.4 1 1 1h2.4l5.6 4V5.2l-5.6 4H5c-.6 0-1 .4-1 1Z M16.2 9.3a3.8 3.8 0 0 1 0 5.4 M18.8 6.8a7.3 7.3 0 0 1 0 10.4 M7.6 14.8l1.2 4.7",
  navReport:"M6.4 3.6h7.4l4.2 4.2v12.6H6.4V3.6Z M13.4 3.8v4.2h4.2 M9.2 17v-3 M12 17v-5 M14.8 17v-2",
  navDash:"M4 5.6h7.2v5.1H4V5.6Z M13.6 5.6H20v8.6h-6.4V5.6Z M4 13.1h7.2v5.3H4v-5.3Z M13.6 16.6H20v1.8h-6.4v-1.8Z",
  navWork:"M9.4 4.4h5.2a1.4 1.4 0 0 1 1.4 1.4v1.1h2.4A1.6 1.6 0 0 1 20 8.5v9.1a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 17.6V8.5a1.6 1.6 0 0 1 1.6-1.6H8V5.8a1.4 1.4 0 0 1 1.4-1.4Z M8 6.9h8 M9.6 13.3l1.8 1.8 3.4-3.6",
  navRecords:"M12 3.6c3.9 0 7 1.1 7 2.5S15.9 8.6 12 8.6 5 7.5 5 6.1 8.1 3.6 12 3.6Z M5 6.1v5.7c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6.1 M5 11.8v5.7c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-5.7",
  navActivity:"M4.6 4.6h14.8A1.6 1.6 0 0 1 21 6.2v11.6a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 17.8V6.2a1.6 1.6 0 0 1 1.6-1.6Z M6 12.4h2.2l1.5-4.1 2.3 8 1.9-5.4 1.2 1.5H18",
  navAdmin:"M12 2.9 5 5.6v5.9c0 4 2.8 7.1 7 8.6 4.2-1.5 7-4.6 7-8.6V5.6L12 2.9Z M12 8.6a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z M8.8 16.3a3.6 3.6 0 0 1 6.4 0",
  helios:"M21 11.5a8.4 8.4 0 0 1-9 8.4 9.9 9.9 0 0 1-4-.8L3 21l1.9-4.9A8.3 8.3 0 0 1 4 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z M8 12h1.6l1.2-2.6 1.6 5 1.4-2.4H16",
  inbox:"M3 13h4l1.5 3h7l1.5-3h4 M3 13l2.4-7A2 2 0 0 1 7.3 4.6h9.4a2 2 0 0 1 1.9 1.4L21 13v4.4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V13Z",
  work:"M6 4.6h12a1.6 1.6 0 0 1 1.6 1.6v12.2A1.6 1.6 0 0 1 18 20H6a1.6 1.6 0 0 1-1.6-1.6V6.2A1.6 1.6 0 0 1 6 4.6Z M8.4 10.4l1.9 1.9 3.9-3.9 M8.4 15.6h7.2",
  approvals:"M12 3.6 19.5 6v6.1c0 4-3.1 6.9-7.5 8.3-4.4-1.4-7.5-4.3-7.5-8.3V6L12 3.6Z M9.2 12.2l2 2 3.6-3.7",
  insights:"M4.5 19.5V13 M9.7 19.5V7.5 M14.9 19.5v-8 M20 19.5V5",
  people:"M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9",
  orgs:"M4.5 20V6.4A1.4 1.4 0 0 1 5.9 5h6.2a1.4 1.4 0 0 1 1.4 1.4V20 M13.5 10.5h4.6A1.4 1.4 0 0 1 19.5 12v8 M3 20h18 M7.5 8.5h2.5 M7.5 12h2.5 M7.5 15.5h2.5",
  teams:"M9 12a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 12Z M16.5 12.5a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z M2.6 19.6c.8-2.8 3.2-4.4 6.4-4.4s5.6 1.6 6.4 4.4 M17 15.4c2.2.4 3.7 1.8 4.3 4.2",
  locations:"M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z M12 12.8a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z",
  visits:"M8 4v3 M16 4v3 M4.5 9.5h15 M6.4 6h11.2A1.9 1.9 0 0 1 19.5 8v10a1.9 1.9 0 0 1-1.9 1.9H6.4A1.9 1.9 0 0 1 4.5 18V8A1.9 1.9 0 0 1 6.4 6Z M9 13.5l1.6 1.6 3.4-3.4",
  autos:"M18.5 8.5A5 5 0 0 0 8.9 7.3 3.8 3.8 0 0 0 6 14.6 M8 17.5l3.2 3.2 M11.2 20.7l3.2-3.2 M11.2 20.7V9.6",
  health:"M3 12.5h3.4l2-5 3 10 2.2-5H21",
  modules:"M6.6 4.4h10.8a2.2 2.2 0 0 1 2.2 2.2v10.8a2.2 2.2 0 0 1-2.2 2.2H6.6a2.2 2.2 0 0 1-2.2-2.2V6.6a2.2 2.2 0 0 1 2.2-2.2Z M4.4 9.6h15.2 M9.6 19.6V9.6",
  agents:"M8.5 3.6h7A2.4 2.4 0 0 1 17.9 6v5.6a2.4 2.4 0 0 1-2.4 2.4h-7A2.4 2.4 0 0 1 6.1 11.6V6a2.4 2.4 0 0 1 2.4-2.4Z M9.6 8.2h.01 M14.4 8.2h.01 M12 14v2.6 M7.6 20.4h8.8 M12 16.6c-2.4 0-4.4 1.7-4.4 3.8h8.8c0-2.1-2-3.8-4.4-3.8Z",
  dash:"M4.4 4.4h6v6h-6v-6Z M13.6 4.4h6v3.6h-6V4.4Z M13.6 11.6h6v8h-6v-8Z M4.4 14h6v5.6h-6V14Z",
  files:"M5 7.2a1.8 1.8 0 0 1 1.8-1.8h3l1.8 2.2h5.6A1.8 1.8 0 0 1 19 9.4v7.4a1.8 1.8 0 0 1-1.8 1.8H6.8A1.8 1.8 0 0 1 5 16.8V7.2Z",
  pulseLine:"M2.5 12.5h3.6l2.1-6.4 3.2 12.2 2.6-8.4 1.8 2.6h5.7",
  records:"M6.4 3.6h7.4l4.2 4.2v12.6H6.4V3.6Z M13.4 3.8v4.2h4.2 M9 12.4h6 M9 16h4",
  tree:"M4.5 6h5 M4.5 12h5 M4.5 18h5 M12.5 6h7 M12.5 12h7 M12.5 18h7",
  graph:"M7 7.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M17.6 10.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M9.4 21.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M8.6 6.4l7.6 2.6 M15.8 11.4l-5.6 5.2",
  bell:"M6 8.5a6 6 0 0 1 12 0c0 6.5 2.6 8.5 2.6 8.5H3.4S6 15 6 8.5Z M10.3 20.5a1.94 1.94 0 0 0 3.4 0"
};

const REC_SECTIONS = [
  {id:"contacts", label:"Contacts", blurb:"The Jod-Z team, retailer buyers and supplier contacts. All demo profiles."},
  {id:"files", label:"Files", blurb:"Trade terms, supplier documents, size guides and finance files, indexed so agents can read them."},
  {id:"ontology", label:"Ontology", blurb:"How products, stock, orders, invoices and purchases connect, and the paths between them."}
];

const CONTACTS = [
  ["Aoibhe Dunleavy","Owner","owner@demo.invalid","Jod-Z","staff","var(--accent)"],
  ["Rory Kinsella","Operations","ops@demo.invalid","Jod-Z","staff","#9fd6f0"],
  ["Maeve Breslin","Stock","stock@demo.invalid","Jod-Z","staff","#e6c78a"],
  ["Declan Whelan","Finance","finance@demo.invalid","Jod-Z","staff","#c8b4f0"],
  ["Buyer","Retailer, Co. Kildare","buyer@meadowtack.demo.invalid","Meadow Tack (Demo)","customer","#9fd6f0"],
  ["Owner","Retailer, Co. Meath","shop@oakfield.demo.invalid","Oakfield Saddlery (Demo)","customer","#a8e0c0"],
  ["Buyer","Retailer, Co. Wicklow","orders@riverbend.demo.invalid","Riverbend Tack Room (Demo)","customer","#e6c78a"],
  ["Manager","Retailer, Co. Cork","hello@saddlestirrup.demo.invalid","Saddle & Stirrup (Demo)","customer","#c8b4f0"],
  ["Buyer","Retailer, Co. Galway","buying@hillcrest.demo.invalid","Hillcrest Equestrian (Demo)","customer","#9fd6f0"],
  ["Owner","Retailer, Co. Tipperary","accounts@paddockco.demo.invalid","Paddock & Co (Demo)","watch","#e2a08c"],
  ["Buyer","Retailer, Co. Wexford","orders@bridlelane.demo.invalid","Bridle Lane (Demo)","customer","#a8e0c0"],
  ["Manager","Retailer, Co. Louth","shop@fetlockfield.demo.invalid","Fetlock & Field (Demo)","customer","#e6c78a"],
  ["Account desk","Supplier, Young Rider leggings","orders@northgate.demo.invalid","Northgate Knitwear (Demo)","supplier","#c8b4f0"],
  ["Trade sales","Supplier, Jockeys breeches and trims","trade@carrow.demo.invalid","Carrow Textiles (Demo)","supplier","#9fd6f0"]
];

const FILE_TREE = [
  {type:"folder", id:"f-whole", name:"Wholesale agreements", depth:0},
  {type:"file", id:"fl-1", name:"Meadow Tack trade terms.pdf", depth:1, parent:"f-whole", indexed:true,
   path:"Wholesale agreements / Meadow Tack (Demo)", title:"Meadow Tack trade terms",
   facts:[["TYPE","PDF, 3 pages (demo)"],["TERMS","30 days"],["INDEXED","All 3 pages"],["OWNER","Rory Kinsella"]],
   body:["Demo trade terms for Meadow Tack (Demo): Young Rider leggings at a trade price of €30 per unit excluding tax, payment within 30 days of invoice.",
     "Their typical order is around 120 units, roughly every 120 days. The current order, JOD-W1041, is €3,600 and 12 units short on Midnight Black M.",
     "The buyer asked for one delivery if possible, so a partial dispatch needs agreeing with them first."],
   links:[["Meadow Tack (Demo)","org"],["JOD-W1041","order"]]},
  {type:"file", id:"fl-2", name:"Paddock & Co trade terms.pdf", depth:1, parent:"f-whole", indexed:true,
   path:"Wholesale agreements / Paddock & Co (Demo)", title:"Paddock & Co trade terms",
   facts:[["TYPE","PDF, 3 pages (demo)"],["TERMS","30 days"],["INDEXED","All 3 pages"],["OWNER","Declan Whelan"]],
   body:["Demo trade terms for Paddock & Co (Demo) at 30 days. Their last order, JOD-W1029, was dispatched on 9 Aug.",
     "Invoice JOD-INV2031 for €1,800 was due on 8 Sep and is unpaid. A reminder is drafted and has not been sent."],
   links:[["Paddock & Co (Demo)","org"],["JOD-INV2031","invoice"]]},
  {type:"folder", id:"f-sup", name:"Supplier documents", depth:0},
  {type:"file", id:"fl-3", name:"Northgate Knitwear supplier terms.pdf", depth:1, parent:"f-sup", indexed:true,
   path:"Supplier documents / Northgate Knitwear (Demo)", title:"Northgate Knitwear supplier terms",
   facts:[["TYPE","PDF, 4 pages (demo)"],["LEAD TIME","35 days"],["INDEXED","All 4 pages"],["OWNER","Maeve Breslin"]],
   body:["Northgate Knitwear (Demo) makes the Young Rider leggings. Lead time is 35 days from a confirmed order.",
     "Minimum order is 50 units per colour. A 30% deposit is due on order, with the balance 20 days after delivery.",
     "PO-0187 is confirmed and due on 24 Oct. PO-D193 is a draft only and has not been sent."],
   links:[["Northgate Knitwear (Demo)","org"],["PO-0187","order"],["PO-D193","order"]]},
  {type:"file", id:"fl-4", name:"Carrow Textiles supplier terms.pdf", depth:1, parent:"f-sup", indexed:false,
   path:"Supplier documents / Carrow Textiles (Demo)", title:"Carrow Textiles supplier terms",
   facts:[["TYPE","PDF, 4 pages (demo)"],["LEAD TIME","42 days"],["INDEXED","Not indexed"],["OWNER","Maeve Breslin"]],
   body:["Carrow Textiles (Demo) makes the Jockeys breeches and trims. Lead time 42 days, minimum 60 units per style, 30% deposit, balance on delivery.",
     "Not indexed yet, so agents cannot answer questions from it. PO-0190 for the winter Jockeys run is due on 18 Nov."],
   links:[["Carrow Textiles (Demo)","org"],["PO-0190","order"]]},
  {type:"folder", id:"f-size", name:"Size guides", depth:0},
  {type:"file", id:"fl-5", name:"Young Rider size guide.pdf", depth:1, parent:"f-size", indexed:true,
   path:"Size guides / Young Rider", title:"Young Rider size guide",
   facts:[["TYPE","PDF, 1 page"],["SOURCE","Published on jod-z.com"],["INDEXED","Whole page"],["OWNER","Maeve Breslin"]],
   body:["Young Rider leggings sizes by age: 2XS fits 6-7 yrs, XS fits 8-9 yrs, S fits 10-11 yrs, M fits 12-13 yrs, L fits 14-15 yrs.",
     "Three recent returns (RET-314, RET-315, RET-317) were for Admiral Navy sizes that came up small, so this guide is worth linking in order confirmations."],
   links:[["Admiral Navy","product"],["RET-314","return"]]},
  {type:"folder", id:"f-fin", name:"Finance", depth:0},
  {type:"file", id:"fl-6", name:"JOD-INV2031.pdf", depth:1, parent:"f-fin", indexed:true,
   path:"Finance / Invoices", title:"JOD-INV2031",
   facts:[["TYPE","PDF, 1 page (demo)"],["VALUE","€1,800"],["DUE","8 Sep"],["OWNER","Declan Whelan"]],
   body:["Invoice for JOD-W1029, Paddock & Co (Demo), 60 units at €30. Overdue since 8 Sep.",
     "A reminder has been drafted and is waiting on Finance. Nothing has been sent; there is no email connection in this demo."],
   links:[["Paddock & Co (Demo)","org"],["JOD-W1029","order"]]},
  {type:"file", id:"fl-7", name:"PO-D193 draft.xlsx", depth:1, parent:"f-fin", indexed:false,
   path:"Finance / Purchase orders", title:"PO-D193 draft",
   facts:[["TYPE","XLSX, 2 sheets (demo)"],["VALUE","€10,800"],["STATUS","Draft, not approved"],["OWNER","Maeve Breslin"]],
   body:["Draft replenishment from Northgate Knitwear (Demo): 600 units at €18, €10,800 in total. Prepared by the Stock & Demand agent.",
     "It needs owner approval. A 30% deposit of €3,240 would fall in the next 30 days. Not sent to the supplier."],
   links:[["Northgate Knitwear (Demo)","org"],["PO-D193","order"]]}
];

const ONTO_NODES = [
  ["Product","entity",500,300,1,"A style and colour, such as Midnight Black. Holds the price and cost for every size."],
  ["Variant","entity",300,190,1,"One size of a product, such as Midnight Black M. Stock and demand are tracked here."],
  ["Wholesale order","entity",700,190,1,"A retailer order with lines, allocations and dispatches."],
  ["Stock","entity",250,430,1,"On hand, reserved and unavailable units for each variant."],
  ["Purchase order","entity",690,430,1,"Supplier order with deposit, balance and expected delivery."],
  ["Retailer","entity",850,320,0,"A tack shop that buys wholesale on agreed terms."],
  ["Invoice","ledger",390,95,0,"Billed for a wholesale order. Demo data, provider to confirm."],
  ["Payment","ledger",620,95,0,"Money received against an invoice. Simulated in the demo."],
  ["Supplier","entity",860,470,0,"Makes the products. Lead time, minimum order and deposit terms."],
  ["Return","entity",140,300,0,"A returned item: sellable goes back to stock, damaged is held as unavailable."],
  ["has variant","predicate",395,240,0,"Product to Variant."],
  ["placed by","predicate",605,240,0,"Wholesale order to Retailer."],
  ["held as","predicate",360,370,0,"Variant to Stock."],
  ["supplied by","predicate",600,370,0,"Purchase order to Supplier."],
  ["received as","predicate",140,372,0,"Return to Stock."]
];

const ONTO_EDGES = [
  [500,300,300,190],[500,300,700,190],[500,300,250,430],[500,300,690,430],
  [500,300,850,320],[500,300,390,95],[500,300,620,95],[500,300,140,300],
  [300,190,250,430],[700,190,850,320],[690,430,860,470],[690,430,250,430],
  [140,300,250,430],[390,95,620,95]
];

const REC_TEMPLATES = [
  ["Field sheet","Records","Labelled fields in a grid, the default for a retailer, supplier or product.",
   "M5 5.5h14v13H5v-13Z M5 10h14 M12 10v8.5","grid"],
  ["Contact card","Records","Key fields and every linked order, invoice and return in one compact panel.",
   "M12 11.5a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z M5.5 19c.8-3 3.3-4.7 6.5-4.7s5.7 1.7 6.5 4.7","card"],
  ["Directory","Records","A sortable table of many records at once, such as every variant or retailer.",
   "M4.5 6.5h15 M4.5 12h15 M4.5 17.5h15 M4.5 6.5h.01 M4.5 12h.01 M4.5 17.5h.01","rows"],
  ["Timeline","Case work","Ordered events with who did what and when. Good for an order or a return.",
   "M12 3.5v17 M12 7.5h6 M12 13h-6 M12 18h6","timeline"],
  ["Kanban board","Case work","Cards in columns by stage: draft, confirmed, allocated, dispatched, complete.",
   "M5 5h4.5v14H5V5Z M9.75 5h4.5v9h-4.5V5Z M14.5 5H19v6h-4.5V5Z","kanban"],
  ["Checklist","Case work","Ticked steps in order, with an owner and a due date on each.",
   "M5 6.5h2l1.4 1.4L11 5.5 M5 12.5h2l1.4 1.4 2.6-2.4 M5 18.5h2l1.4 1.4 2.6-2.4 M15 6.5h4 M15 12.5h4 M15 18.5h4","checklist"],
  ["Ledger","Finance","Rows and running totals for invoices, bills and purchase orders.",
   "M4 6h16 M4 12h16 M4 18h16 M9 3.5v17","ledger"],
  ["Invoice","Finance","Line items, totals and a status. Drafts only in the demo.",
   "M7 3.5h10v17H7v-17Z M9.5 8h5 M9.5 11.5h5 M9.5 15h3","invoice"],
  ["Document","Notes","Long-form text, such as trade terms, with linked records down the side.",
   "M7 3.5h7l5 5v12H7v-17Z M14 3.7v5h5 M10 13h6 M10 16.5h4","document"],
  ["Gallery","Notes","A wall of product images with a caption on each colour.",
   "M4.5 6h6v6h-6V6Z M13.5 6h6v6h-6V6Z M4.5 14h6v4h-6v-4Z M13.5 14h6v4h-6v-4Z","gallery"],
  ["Size matrix","Ops","Stock and demand by colour and size in one grid.",
   "M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z M12 12.8a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z","map"],
  ["Schedule","Ops","A calendar of dispatches and deliveries against this record.",
   "M8 4v3 M16 4v3 M4.5 9.5h15 M6.4 6h11.2A1.9 1.9 0 0 1 19.5 8v10a1.9 1.9 0 0 1-1.9 1.9H6.4A1.9 1.9 0 0 1 4.5 18V8A1.9 1.9 0 0 1 6.4 6Z","schedule"]
];
const REC_TEMPLATE_CATS = ["All","Records","Case work","Finance","Notes","Ops"];

/* ---- admin hub ---- */
/* ---- admin hub: settings areas in five groups ---- */
const PEOPLE = [
  ["Aoibhe Dunleavy","Owner","owner@demo.invalid","Office (Demo)","active","Owner","2 min ago"],
  ["Rory Kinsella","Operations","ops@demo.invalid","Storage unit (Demo)","active","Operations","34 min ago"],
  ["Maeve Breslin","Stock","stock@demo.invalid","Storage unit (Demo)","active","Stock","1 h ago"],
  ["Declan Whelan","Finance","finance@demo.invalid","Office (Demo)","active","Finance","3 h ago"]
];
const ROLE_LEVELS = ["Owner","Operations","Stock","Finance","Standard"];
const PERM_KEYS = [["view","View records"],["edit","Edit records"],["approve","Approve purchases"]];
const GRANT_DEFS = [
  ["view","View records","Read anything in scope"],
  ["edit","Edit records","Create and change records"],
  ["approve","Approve purchases","Say yes to purchase orders"],
  ["adjust","Approve stock adjustments","Write-offs and corrections"],
  ["dispatch","Approve partial dispatch","Send part of a wholesale order"],
  ["export","Export data","Download and share out"],
  ["agents","Manage agents","Create and grant agents"],
  ["settings","Change settings","Users, assumptions, integrations"]
];
const ROLE_SCOPES = ["All records","Their area","Assigned only"];
const DEFAULT_PERMS = {Owner:{view:true,edit:true,approve:true}, Operations:{view:true,edit:true,approve:false},
  Stock:{view:true,edit:true,approve:false}, Finance:{view:true,edit:true,approve:false}, Standard:{view:true,edit:false,approve:false}};
const INTEGRATIONS = [
  {name:"Shopify", blurb:"Online orders, payouts and stock levels from the storefront. Demo connection, simulated data.", tint:"#95bf47", status:"demo", statusKind:"ok",
   glyph:"M6 7.5h12l-1 12.5H7L6 7.5Z M9 7.5V6a3 3 0 0 1 6 0v1.5",
   lastSync:"Simulated", usage:"Simulated data", auth:"Demo", scopes:["Read"]},
  {name:"Accounting system", blurb:"Invoices, bills and payments. Provider to confirm, demo data until then.", tint:"#6ad0f0", status:"provider to confirm", statusKind:"warn",
   glyph:"M4.5 12a7.5 7.5 0 0 1 12.8-5.3 M19.5 12a7.5 7.5 0 0 1-12.8 5.3 M17.3 4v3.3h-3.3 M6.7 20v-3.3H10",
   lastSync:"Not connected", usage:"Demo data", auth:"Not set", scopes:[]},
  {name:"CSV import: wholesale orders", blurb:"Upload a wholesale order export and check the mapping before anything is written.", tint:"#e6c78a", status:"preview only", statusKind:"warn",
   glyph:"M7 3.5h7l5 5v12H7v-17Z M14 3.7v5h5 M10 13h6 M10 16.5h4",
   lastSync:"Preview only", usage:"Mock preview", auth:"File upload", scopes:["Preview"]},
  {name:"CSV import: opening stock", blurb:"Load on-hand stock by variant. Preview only in the demo.", tint:"#e6c78a", status:"preview only", statusKind:"warn",
   glyph:"M7 3.5h7l5 5v12H7v-17Z M14 3.7v5h5 M10 13h6 M10 16.5h4",
   lastSync:"Preview only", usage:"Mock preview", auth:"File upload", scopes:["Preview"]},
  {name:"CSV import: supplier list", blurb:"Load suppliers with lead times, minimum orders and deposit terms. Preview only.", tint:"#e6c78a", status:"preview only", statusKind:"warn",
   glyph:"M7 3.5h7l5 5v12H7v-17Z M14 3.7v5h5 M10 13h6 M10 16.5h4",
   lastSync:"Preview only", usage:"Mock preview", auth:"File upload", scopes:["Preview"]},
  {name:"Meta Ads", blurb:"Campaign spend, reach and reported purchases for Facebook and Instagram. Demo connection, simulated data. Pulse never changes a live campaign.", tint:"#6d8df0", status:"demo", statusKind:"ok",
   glyph:"M4 10.2v3.6c0 .6.4 1 1 1h2.4l5.6 4V5.2l-5.6 4H5c-.6 0-1 .4-1 1Z M16.2 9.3a3.8 3.8 0 0 1 0 5.4",
   lastSync:"Simulated", usage:"Simulated data", auth:"Demo", scopes:["Read"]},
  {name:"Google Ads", blurb:"Search, Shopping and Performance Max spend, clicks and reported conversions. Demo connection, simulated data.", tint:"#e6b34f", status:"demo", statusKind:"ok",
   glyph:"M12 3.5 20 18H4L12 3.5Z M8.6 12.2h6.8",
   lastSync:"Simulated", usage:"Simulated data", auth:"Demo", scopes:["Read"]},
  {name:"Search and social trends", blurb:"Search interest and hashtag volume for the Trends page. Not connected: the figures are a simulated index, not Google Trends.", tint:DIM, status:"simulated", statusKind:"warn",
   glyph:"M3.5 17.5 9.2 11.8l3.6 3.6 7.7-7.7 M15.6 7.7h4.9v4.9",
   lastSync:"Not connected", usage:"Simulated index", auth:"Not set", scopes:[]},
  {name:"Email", blurb:"Sending reminders and order updates. Not connected: drafts stay in Pulse.", tint:DIM, status:"not connected", statusKind:"off",
   glyph:"M4 7.2 12 13 20 7.2 M4 7.2v10.6h16V7.2 M4 7.2 8.5 4h7L20 7.2",
   lastSync:"Not connected", usage:"Not connected", auth:"Not set", scopes:[]}
];
/* Background catalogue. Each entry is pure CSS so a tile is the real thing at
   thumbnail size, not a picture of it. */
const BG_DEFS = [
  {id:"bloom", name:"Bloom", cat:"Signature",
   css:"background:radial-gradient(60% 48% at 50% 34%, var(--accent-faint), transparent 72%), radial-gradient(44% 38% at 16% 84%, rgba(255,255,255,.05), transparent 70%)",
   thumb:"background:radial-gradient(62% 58% at 46% 34%, var(--accent-soft), transparent 74%), radial-gradient(50% 46% at 82% 84%, rgba(255,255,255,.08), transparent 72%), var(--surface-2)"},
  {id:"mist", name:"Mist", cat:"Signature",
   css:"background:radial-gradient(52% 44% at 24% 22%, rgba(255,255,255,.07), transparent 70%), radial-gradient(56% 46% at 80% 76%, rgba(255,255,255,.05), transparent 72%)",
   thumb:"background:radial-gradient(58% 52% at 24% 22%, rgba(255,255,255,.16), transparent 72%), radial-gradient(60% 54% at 82% 78%, rgba(255,255,255,.10), transparent 74%), var(--surface-2)"},
  {id:"grid", name:"Grid", cat:"Signature",
   css:"background-image:linear-gradient(var(--border) 1px, transparent 1px),linear-gradient(90deg, var(--border) 1px, transparent 1px);background-size:56px 56px;mask-image:radial-gradient(62% 56% at 50% 46%, #000, transparent 78%);-webkit-mask-image:radial-gradient(62% 56% at 50% 46%, #000, transparent 78%)",
   thumb:"background-color:var(--surface-2);background-image:linear-gradient(var(--border-strong) 1px, transparent 1px),linear-gradient(90deg, var(--border-strong) 1px, transparent 1px);background-size:14px 14px"},
  {id:"none", name:"None", cat:"Signature", css:"", thumb:"background:var(--surface-2)"},

  {id:"aurora", name:"Aurora", cat:"Gradient",
   css:"background:radial-gradient(70% 52% at 18% 8%, var(--bloom-a), transparent 66%), radial-gradient(64% 48% at 84% 22%, var(--bloom-b), transparent 68%), radial-gradient(70% 60% at 50% 104%, var(--bloom-c), transparent 70%);filter:blur(24px)",
   thumb:"background:radial-gradient(72% 60% at 16% 6%, var(--bloom-a), transparent 68%), radial-gradient(66% 54% at 86% 24%, var(--bloom-b), transparent 70%), radial-gradient(74% 66% at 50% 108%, var(--bloom-c), transparent 72%), var(--surface-2)"},
  {id:"horizon", name:"Horizon", cat:"Gradient",
   css:"background:linear-gradient(180deg, transparent 0%, var(--accent-faint) 58%, transparent 100%), radial-gradient(90% 40% at 50% 72%, var(--accent-soft), transparent 70%)",
   thumb:"background:linear-gradient(180deg, var(--surface-2) 0%, var(--accent-faint) 58%, var(--surface-2) 100%), radial-gradient(90% 44% at 50% 74%, var(--accent-soft), transparent 70%)"},
  {id:"dusk", name:"Dusk", cat:"Gradient",
   css:"background:linear-gradient(200deg, var(--bloom-c) -10%, transparent 46%), linear-gradient(20deg, var(--bloom-b) -10%, transparent 52%);opacity:.5",
   thumb:"background:linear-gradient(200deg, var(--bloom-c) -12%, transparent 48%), linear-gradient(20deg, var(--bloom-b) -12%, transparent 54%), var(--surface-2)"},
  {id:"ember", name:"Ember", cat:"Gradient",
   css:"background:radial-gradient(60% 70% at 84% 96%, var(--bloom-a), transparent 64%), radial-gradient(50% 60% at 10% 96%, var(--bloom-c), transparent 66%)",
   thumb:"background:radial-gradient(64% 76% at 84% 100%, var(--bloom-a), transparent 66%), radial-gradient(54% 66% at 8% 100%, var(--bloom-c), transparent 68%), var(--surface-2)"},

  {id:"mesh", name:"Mesh", cat:"Abstract",
   css:"background-image:radial-gradient(var(--border-strong) 1px, transparent 1px);background-size:22px 22px;mask-image:radial-gradient(70% 62% at 50% 46%, #000, transparent 76%);-webkit-mask-image:radial-gradient(70% 62% at 50% 46%, #000, transparent 76%)",
   thumb:"background-color:var(--surface-2);background-image:radial-gradient(var(--border-strong) 1px, transparent 1px);background-size:8px 8px"},
  {id:"contour", name:"Contour", cat:"Abstract",
   css:"background:repeating-radial-gradient(circle at 30% 110%, transparent 0 22px, var(--border) 22px 23px);mask-image:radial-gradient(80% 70% at 40% 80%, #000, transparent 78%);-webkit-mask-image:radial-gradient(80% 70% at 40% 80%, #000, transparent 78%)",
   thumb:"background:repeating-radial-gradient(circle at 26% 116%, var(--surface-2) 0 9px, var(--border-strong) 9px 10px)"},
  {id:"weave", name:"Weave", cat:"Abstract",
   css:"background:repeating-linear-gradient(48deg, transparent 0 16px, var(--border) 16px 17px), repeating-linear-gradient(-48deg, transparent 0 16px, var(--border) 16px 17px);opacity:.7",
   thumb:"background-color:var(--surface-2);background-image:repeating-linear-gradient(48deg, transparent 0 7px, var(--border-strong) 7px 8px), repeating-linear-gradient(-48deg, transparent 0 7px, var(--border-strong) 7px 8px)"},
  {id:"halo", name:"Halo", cat:"Abstract",
   css:"background:repeating-radial-gradient(circle at 50% 50%, transparent 0 46px, var(--accent-line) 46px 47px);mask-image:radial-gradient(60% 60% at 50% 50%, #000, transparent 72%);-webkit-mask-image:radial-gradient(60% 60% at 50% 50%, #000, transparent 72%)",
   thumb:"background:repeating-radial-gradient(circle at 50% 50%, var(--surface-2) 0 11px, var(--accent-line) 11px 12px)"},
  {id:"drift", name:"Drift", cat:"Abstract",
   css:"background:conic-gradient(from 210deg at 32% 38%, var(--bloom-b), transparent 38%), conic-gradient(from 20deg at 76% 70%, var(--bloom-a), transparent 34%);filter:blur(30px);opacity:.6",
   thumb:"background:conic-gradient(from 210deg at 32% 38%, var(--bloom-b), transparent 38%), conic-gradient(from 20deg at 76% 70%, var(--bloom-a), transparent 34%), var(--surface-2)"},
  {id:"scan", name:"Scanlines", cat:"Abstract",
   css:"background:repeating-linear-gradient(0deg, var(--border) 0 1px, transparent 1px 7px);mask-image:linear-gradient(180deg, #000, transparent 88%);-webkit-mask-image:linear-gradient(180deg, #000, transparent 88%)",
   thumb:"background-color:var(--surface-2);background-image:repeating-linear-gradient(0deg, var(--border-strong) 0 1px, transparent 1px 5px)"}
];

const THEMES = [
  {id:"jodz", label:"Jod-Z Cream", group:"Dark", bg:"#0c0b0a", surface:"#1a1917", ink:"#f4efe4", accent:"#ece4d3"},
  {id:"dark", label:"Dark", group:"Dark", bg:"#0b0c0b", surface:"#1a1c19", ink:"#f2f3ef", accent:"#c8f04b"},
  {id:"indigo", label:"Indigo", group:"Dark", bg:"#0a0b13", surface:"#1a1b26", ink:"#f0f1fa", accent:"#8b93ff"},
  {id:"slate", label:"Slate", group:"Dark", bg:"#100e0c", surface:"#211c17", ink:"#f4f0ea", accent:"#e8a14a"},
  {id:"plum", label:"Plum", group:"Dark", bg:"#100a10", surface:"#20151f", ink:"#f6eef4", accent:"#f077b0"},
  {id:"ember", label:"Ember", group:"Dark", bg:"#0b0b0b", surface:"#1c1714", ink:"#f7f3ef", accent:"#f4561a"},
  {id:"harbour", label:"Harbour", group:"Dark", bg:"#0b0e10", surface:"#13171a", ink:"#f3f5f4", accent:"#5ee79a"},
  {id:"cargo", label:"Cargo", group:"Dark", bg:"#0a0a0a", surface:"#1a1c1a", ink:"#f2f5f2", accent:"#4ade80"},
  {id:"ocean", label:"Ocean", group:"Dark", bg:"#080e12", surface:"#141f25", ink:"#eaf4f8", accent:"#4fd4d0"},
  {id:"graphite", label:"Graphite", group:"Dark", bg:"#111112", surface:"#212124", ink:"#f4f4f5", accent:"#f4f4f5"},
  {id:"light", label:"Cream", group:"Light", bg:"#efebe2", surface:"#fdfcf8", ink:"#141210", accent:"#1a1714"},
  {id:"warm", label:"Warm paper", group:"Light", bg:"#faf5ec", surface:"#fffdf9", ink:"#2a2016", accent:"#c9683f"},
  {id:"mist", label:"Mist", group:"Light", bg:"#eef1f4", surface:"#ffffff", ink:"#141e20", accent:"#0e9f6e"},
  {id:"sand", label:"Sand", group:"Light", bg:"#f6f1e6", surface:"#fffdf7", ink:"#221d12", accent:"#7d5fd6"}
];

const ADMIN_ICONS = {
  people:"M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9",
  teams:"M9 12a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 12Z M16.5 12.5a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z M2.6 19.6c.8-2.8 3.2-4.4 6.4-4.4s5.6 1.6 6.4 4.4 M17 15.4c2.2.4 3.7 1.8 4.3 4.2",
  structure:"M4.5 20V6.4A1.4 1.4 0 0 1 5.9 5h6.2a1.4 1.4 0 0 1 1.4 1.4V20 M13.5 10.5h4.6A1.4 1.4 0 0 1 19.5 12v8 M3 20h18 M7.5 8.5h2.5 M7.5 12h2.5",
  shield:"M12 3.6 19.5 6v6.1c0 4-3.1 6.9-7.5 8.3-4.4-1.4-7.5-4.3-7.5-8.3V6L12 3.6Z M9.2 12.2l2 2 3.6-3.7",
  agent:"M2 12h4l2.5-6 3.5 12 3-8 2 2h5",
  flow:"M18.5 8.5A5 5 0 0 0 8.9 7.3 3.8 3.8 0 0 0 6 14.6 M8 17.5l3.2 3.2 M11.2 20.7l3.2-3.2 M11.2 20.7V9.6",
  plug:"M9 3.5v5 M15 3.5v5 M6.5 8.5h11v3a5.5 5.5 0 0 1-11 0v-3Z M12 17v3.5",
  modules:"M6.6 4.4h10.8a2.2 2.2 0 0 1 2.2 2.2v10.8a2.2 2.2 0 0 1-2.2 2.2H6.6a2.2 2.2 0 0 1-2.2-2.2V6.6a2.2 2.2 0 0 1 2.2-2.2Z M4.4 9.6h15.2 M9.6 19.6V9.6",
  health:"M3 12.5h3.4l2-5 3 10 2.2-5H21",
  lock:"M6.5 10.5h11a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19v-7a1.5 1.5 0 0 1 1.5-1.5Z M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3",
  audit:"M8 3.5h8l3.5 3.5v13a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 6 3.5h2Z M9 12h6 M9 16h4",
  brand:"M12 3.5 14.6 9l6.4.6-4.8 4.2 1.4 6.2-5.6-3.3-5.6 3.3 1.4-6.2L3 9.6 9.4 9 12 3.5Z",
  bell:"M6 8.5a6 6 0 0 1 12 0c0 6.5 2.6 8.5 2.6 8.5H3.4S6 15 6 8.5Z M10.3 20.5a1.94 1.94 0 0 0 3.4 0",
  data:"M4.5 7.5c0-1.7 3.4-3 7.5-3s7.5 1.3 7.5 3-3.4 3-7.5 3-7.5-1.3-7.5-3Z M4.5 7.5v9c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-9 M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"
};

const ADMIN_CARDS = [
  {id:"people", group:"ORGANISATION", title:"Users & access", icon:"people", tint:"#6ad0f0",
   blurb:"The four demo users who work in Pulse, and what each can reach.",
   tags:["4 demo users","4 roles","Demo profiles"],
   footer:"Demo profiles, @demo.invalid addresses", action:"Review users",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Add, invite or remove users","",""],["Owner","Aoibhe Dunleavy"],["Operations","Rory Kinsella"],
     ["Stock","Maeve Breslin"],["Finance","Declan Whelan"],["View last login","4 users tracked"]]},
  {id:"teams", group:"ORGANISATION", title:"Roles & permissions", icon:"shield", tint:"var(--accent)",
   blurb:"Role templates, and exactly what each person can approve.",
   tags:["4 roles","8 permissions","3 scopes"],
   heroLabel:"THE QUESTION THIS ANSWERS", heroAction:"Show me what someone can access",
   heroText:"Pick a person and see every record and approval they can reach, resolved through their role rather than guessed from the menus.",
   footer:"Only the owner approves in the demo", action:"Open preview",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Approve purchases","Owner only"],["Approve stock adjustments","Owner only"],
     ["Approve partial dispatch","Owner only"],["Restrict by area or assigned records","3 scopes"],["Preview Pulse as another user",""]]},
  {id:"structure", group:"ORGANISATION", title:"Organisation", icon:"structure", tint:"#f0c04b",
   blurb:"Jod-Z: equestrian clothing, designed in Ireland by riders.",
   tags:["Jod-Z","Europe/Dublin","EUR"],
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Business","Jod-Z"],["Website","https://jod-z.com/"],["About","Designed in Ireland by riders"],
     ["Sales channels","Online (Shopify) and wholesale"],["Locations","Office (Demo), Storage unit (Demo)"],
     ["Registered details","Not set in demo"],["Default currency and timezone","EUR, Europe/Dublin"]]},

  {id:"agents", group:"CONTROL", title:"Agents & AI controls", icon:"agent", tint:"var(--accent)",
   blurb:"What agents may read, what they may do, and where they must stop.",
   tags:["4 agents","Drafts only","No external sends"],
   heroLabel:"GLOBAL CONTROL", heroAction:"Pause every agent",
   heroText:"One switch stops every agent. Anything mid-run finishes its current step and then holds.",
   footer:"Agents prepare drafts. People approve.", action:"Review limits",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Approved agent roles","4 in demo"],["Data agents can read","by permission"],
     ["Actions agents can take","read, draft"],["Approval before any change","all write tools", true],
     ["External tools","not connected in demo"],["Agent memory and retention","90 days"]]},
  {id:"wf", group:"CONTROL", title:"Approval controls", icon:"flow", tint:"#9d8cf5",
   blurb:"What needs a yes before it changes anything. In the demo, the owner approves all of it.",
   tags:["Owner approves","3 approval types","Demo only"],
   footer:"Building workflows happens in Work", action:"Open Work",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["All purchases","owner approval", true],["Stock adjustments","owner approval", true],
     ["Partial dispatches","owner approval", true],["Maximum autonomy","drafts, never sends", true],
     ["Cash buffer","€20,000"],["Failure handling","retry once, then notify"]]},
  {id:"notif", group:"CONTROL", title:"Forecast assumptions", icon:"bell", tint:"#f0994b",
   blurb:"The assumptions behind stock cover and the cash outlook.",
   tags:["Growth 0%","Cover 60 days","Buffer €20,000"],
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Underlying growth","0%"],["November uplift","+10%"],["December uplift","+30%"],
     ["Stock cover target","60 days"],["Low cover alert","under 14 days"],["Cash buffer","€20,000"]]},

  {id:"integrations", group:"SYSTEMS", title:"Integrations", icon:"plug", tint:"#6ad0f0",
   blurb:"Where data comes from, and what is simulated in the demo.",
   tags:["Shopify demo","Accounting to confirm","3 CSV previews"],
   footer:"No live connections in this demo", action:"View",
   listLabel:"CONNECTIONS",
   rows:[["Shopify","demo connection, simulated data"],["Accounting system","provider to confirm, demo data"],
     ["CSV import: wholesale orders","preview only"],["CSV import: opening stock","preview only"],
     ["CSV import: supplier list","preview only"],["Email","not connected"]]},
  {id:"modules", group:"SYSTEMS", title:"Modules & configuration", icon:"modules", tint:"#f0c04b",
   blurb:"Turn modules on, and make Pulse use Jod-Z's own words.",
   tags:["6 modules","Sizes by age","Demo data"],
   heroLabel:"TERMINOLOGY", heroAction:"Edit terminology",
   heroText:"Organisation reads as Retailer, and Item reads as Variant, everywhere in the interface, including what agents say back to you.",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Enabled modules","Sales, Inventory, Accounting, Forecasting, Reporting, Agents"],["Rename business terminology","2 overridden"],
     ["Young Rider sizes","2XS to L, ages 6 to 15"],["Order stages","Draft to Complete"],["Record types","12 types"]]},
  {id:"health", group:"SYSTEMS", title:"Data health", icon:"health", tint:"#e2705c",
   blurb:"What needs tidying in the demo data before real data is imported.",
   tags:["4 issue types","9 records affected"], badge:"2 unavailable units", badgeKind:"warn",
   footer:"Checked against the demo dataset", action:"Review",
   listLabel:"ISSUES FOUND",
   trend:[16,15,14,12,11,10,9],
   bySeverity:[["High","2",RED],["Medium","4",AMBER],["Low","3",DIM]],
   issues:[["Damaged stock held on hand","2","high","Midnight Black M from RET-311 and RET-312","Review"],
     ["Returns awaiting a decision","3","medium","RET-314, RET-316 and RET-317","Review"],
     ["Order not yet allocated","1","medium","JOD-W1043 has nothing reserved","Review"],
     ["Accounting provider not set","1","low","Invoices and bills are demo data","Review"],
     ["Unindexed files","2","low","Supplier terms not readable by agents","Review"]],
   rows:[]},

  {id:"security", group:"GOVERNANCE", title:"Security", icon:"lock", tint:"#8fa6ff",
   blurb:"Sign-in, sessions and access for the demo.",
   tags:["Demo profiles","No live keys"],
   footer:"Demo environment", action:"Review",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Single sign-on","not set", false],["Two-factor authentication","not set", false],
     ["Login policies","30-day session"],["Active sessions","4"],["API keys","none"],
     ["Data retention rules","to confirm"]]},
  {id:"audit", group:"GOVERNANCE", title:"Audit log", icon:"audit", tint:"#9d8cf5",
   blurb:"A history of who changed what. Searchable, exportable, never editable.",
   tags:["Append-only","Demo actions"],
   footer:"Every approval is written as the person who made it", action:"Export",
   listLabel:"WHAT IS RECORDED",
   rows:[["Approvals","owner decisions"],["Stock adjustments","write-offs and restocks"],["Drafts prepared","by agents"],
     ["Settings changes","assumptions and roles"],["Imports","CSV previews"]]},
  {id:"datamgmt", group:"GOVERNANCE", title:"Data management", icon:"data", tint:"#5fe0a8",
   blurb:"Import, export and reset the demo data.",
   tags:["CSV previews","Reset available"],
   footer:"Demo data can be reset at any time", action:"Reset demo",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Import data","CSV preview only"],["Export data","full or per module"],["Reset demo data","restores the snapshot"],
     ["Snapshot date","26 Sep 2026"],["Delete company data","not available in demo"]]},

  {id:"brand", group:"EXPERIENCE", title:"Branding", icon:"brand", tint:"var(--accent)",
   blurb:"Logo, accent colour and how agents appear.",
   tags:["Jod-Z","Monochrome"],
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Company logo","Jod-Z wordmark"],["Pulse accent colour","oklch(0.86 0.19 118)"],
     ["Email templates","drafts only"],["Agent appearance","12 faces, 6 shells"]]},
  {id:"appearance", group:"EXPERIENCE", title:"Appearance & themes", icon:"brand", tint:"#6ad0f0",
   blurb:"Pick a light or dark theme for how Pulse looks to you.",
   tags:["13 themes","9 dark","4 light"],
   listLabel:"THEMES", rows:[]}
];

const ADMIN_GROUPS = [
  ["ORGANISATION", "repeat(3,1fr)"],
  ["CONTROL", "repeat(3,1fr)"],
  ["SYSTEMS", "repeat(3,1fr)"],
  ["GOVERNANCE", "repeat(3,1fr)"],
  ["EXPERIENCE", "repeat(3,1fr)"]
];

/* ---- activity feeds ---- */
const SRC_TINT = {"Shopify (demo)":"#95bf47", Pulse:"var(--accent)", Agent:"var(--accent)", "CSV import":"#e6c78a"};
const SRC_ABBR = {"Shopify (demo)":"SH", Pulse:"PL", Agent:"AI", "CSV import":"CSV"};

const DATA_EVENTS = [
  ["Shopify order sync","Online orders for the last hour imported. Simulated.","Shopify sync","Online store","Shopify (demo)","completed"],
  ["Shopify payout recorded","Weekly payout of €4,100 expected on 29 Sep. Simulated.","Shopify sync","Cash outlook","Shopify (demo)","completed"],
  ["Wholesale order confirmed","JOD-W1043 for Riverbend Tack Room (Demo), 80 units. Not yet allocated.","Rory Kinsella","Riverbend Tack Room (Demo)","Pulse","completed"],
  ["Return received","RET-316: Candy Floss Pink L, colour not as expected. Awaiting decision.","Online store","JZ-CF-L","Shopify (demo)","awaiting"],
  ["Delivery received","PO-0184 received in full on 20 Aug. Simulated.","Maeve Breslin","Northgate Knitwear (Demo)","Pulse","completed"],
  ["CSV import previewed","Wholesale orders file mapped. Preview only, nothing written.","CSV import","Wholesale orders","CSV import","completed"],
  ["Payment recorded","JOD-INV2034 €2,400 from Saddle & Stirrup (Demo). Simulated.","Declan Whelan","Saddle & Stirrup (Demo)","Pulse","completed"],
  ["Stock count updated","Midnight Black M: 2 damaged units held as unavailable.","Maeve Breslin","JZ-MB-M","Pulse","completed"]
];

const PEOPLE_EVENTS = [
  ["Rory allocated JOD-W1042","All 80 units reserved for Oakfield Saddlery (Demo). Packing booked for 1 Oct.","Rory Kinsella","Oakfield Saddlery (Demo)","Pulse","completed"],
  ["Maeve restocked a return","RET-315 Admiral Navy S back in available stock. Sellable.","Maeve Breslin","JZ-AN-S","Pulse","completed"],
  ["Maeve requested a write-off","2 damaged Midnight Black M. Awaiting approval.","Maeve Breslin","JZ-MB-M","Pulse","awaiting"],
  ["Declan reviewing a reminder","JOD-INV2031 €1,800 for Paddock & Co (Demo). Drafted, not sent.","Declan Whelan","Paddock & Co (Demo)","Pulse","awaiting"],
  ["Aoibhe reviewing PO-D193","Draft replenishment, 600 units, €10,800. Awaiting approval.","Aoibhe Dunleavy","Northgate Knitwear (Demo)","Pulse","awaiting"],
  ["Rory created a task","Agree partial dispatch or new date for JOD-W1041.","Rory Kinsella","Meadow Tack (Demo)","Pulse","completed"],
  ["Purchase approved in demo","PO-0187 confirmed by supplier 4 Sep, due 24 Oct. Demo record only.","Aoibhe Dunleavy","Northgate Knitwear (Demo)","Pulse","completed"]
];

const AI_EVENTS = [
  ["Shortage detected","JOD-W1041 is 12 short on Midnight Black M. Task created for Rory.","Ops Watchdog","Meadow Tack (Demo)","Agent","working"],
  ["Low cover detected","Admiral Navy S: 6 available, about 2 days of cover.","Stock & Demand","JZ-AN-S","Agent","working"],
  ["Stock reserved","JOD-W1042 fully allocated. Detected, no action needed.","Ops Watchdog","Oakfield Saddlery (Demo)","Agent","completed"],
  ["Reminder drafted","JOD-INV2031 is overdue since 8 Sep. Draft prepared, not sent.","Finance & Cash","Paddock & Co (Demo)","Agent","awaiting"],
  ["Draft purchase prepared","PO-D193, 600 units, €10,800. Awaiting approval, not sent to the supplier.","Stock & Demand","Northgate Knitwear (Demo)","Agent","awaiting"],
  ["Overstock detected","Candy Floss Pink L: 96 on hand, about 5 sold in 30 days.","Stock & Demand","JZ-CF-L","Agent","working"],
  ["Cash outlook refreshed","Lowest point stays above the €20,000 buffer in the base case. Simulated.","Finance & Cash","Cash outlook","Agent","completed"],
  ["Morning briefing posted","Four decisions today, each linked to its record.","Briefing","Home","Agent","completed"]
];

const STREAM_DEFS = [
  {id:"data", title:"New data", sub:"Orders, stock and payments entering Pulse", pool:DATA_EVENTS, every:3200,
   tint:"#6ad0f0", icon:"M4.5 7.5c0-1.7 3.4-3 7.5-3s7.5 1.3 7.5 3-3.4 3-7.5 3-7.5-1.3-7.5-3Z M4.5 7.5v9c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-9 M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"},
  {id:"people", title:"Team activity", sub:"Decisions people made", pool:PEOPLE_EVENTS, every:6400,
   tint:"#f0c04b", icon:"M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9"},
  {id:"ai", title:"AI activity", sub:"Agents detecting and drafting", pool:AI_EVENTS, every:4600,
   tint:"var(--accent)", icon:"M2 12h4l2.5-6 3.5 12 3-8 2 2h5"}
];
const NAV = [
  {label:"Home", icon:"helios", page:"Home"},
  {label:"Agents", icon:"navAgents", page:"Agents"},
  {label:"Sales & Wholesale", icon:"navSales", page:"Dashboard", dot:true},
  {label:"Inventory", icon:"navStock", page:"Inventory"},
  {label:"Accounting", icon:"navBooks", page:"Accounting"},
  {label:"Forecasting", icon:"navForecast", page:"Forecasting"},
  {label:"Trends", icon:"navTrends", page:"Trends"},
  {label:"Advertising", icon:"navAds", page:"Advertising"},
  {label:"Reporting", icon:"navReport", page:"Reporting"},
  {divider:true},
  {label:"Work", icon:"navWork", page:"Work", quiet:true},
  {label:"Records", icon:"navRecords", page:"Records", quiet:true},
  {label:"Activity", icon:"pulseLine", page:"Activity", dot:true, quiet:true}
];

/* Inbox items follow the real InboxItem shape: what happened, why it matters, what I can do.
   The five Jod-Z story threads: A stock gap, B wholesale shortage, C overdue invoice, D overstock, E replenishment. */
const ITEMS = {
  po:{kind:"Approval", importance:"high", icon:ICONS.approvals, age:"18h",
    title:"Draft replenishment PO-D193, €10,800",
    why:"Prepared by the Stock & Demand agent. All purchases need owner approval in the demo.",
    detail:"600 units from Northgate Knitwear (Demo) at €18. Covers Admiral Navy S and Midnight Black M. A €3,240 deposit falls in the next 30 days and €7,560 in days 31 to 60. Approving changes demo records only; nothing is sent to the supplier.",
    actionLabel:"Review", secondaryLabel:"Request changes", group:"Approvals",
    fields:[{k:"Supplier",v:"Northgate Knitwear (Demo)"},{k:"Prepared by",v:"Stock & Demand"},{k:"Value",v:"€10,800"},{k:"Record",v:"PO-D193"}],
    history:[{when:"25 Sep 17:10",text:"Draft prepared by the Stock & Demand agent"},{when:"25 Sep 17:10",text:"Awaiting approval from Aoibhe Dunleavy"}]},
  sync:{kind:"Alert", importance:"critical", icon:ICONS.health, age:"6h",
    title:"Admiral Navy S has about 2 days of cover",
    why:"6 available against 84 sold online in 30 days. It ran out for 2 days in the last 28.",
    detail:"40 more arrive on PO-0187 on 24 Oct, which is too late on its own. PO-D193 would add 120 if approved. Detected by the low cover check.",
    actionLabel:"Open variant", secondaryLabel:"Snooze", group:"Alerts",
    fields:[{k:"Variant",v:"JZ-AN-S"},{k:"Available",v:"6"},{k:"Sold 30 days",v:"84 online"},{k:"Status",v:"Detected"}],
    history:[{when:"Today 06:40",text:"Low cover detected"},{when:"Today 06:40",text:"Task T-101 created for Maeve Breslin"}]},
  visit:{kind:"Task", importance:"high", icon:ICONS.visits, age:"2h",
    title:"JOD-W1041 for Meadow Tack is 12 units short",
    why:"Midnight Black M: 24 requested, 12 allocated. Requested dispatch is 14 Oct.",
    detail:"40 Midnight Black M arrive on PO-0187 on 24 Oct. The buyer asked for one delivery if possible, so agree a partial dispatch or a new date first. A partial dispatch needs owner approval.",
    actionLabel:"Open order", secondaryLabel:"Propose partial dispatch", group:"Work",
    fields:[{k:"Retailer",v:"Meadow Tack (Demo)"},{k:"Value",v:"€3,600"},{k:"Short",v:"12 units"},{k:"Owner",v:"Rory Kinsella"}],
    history:[{when:"Today 06:41",text:"Shortage detected by Ops Watchdog"},{when:"Today 06:41",text:"Task T-102 created for Rory Kinsella"}]},
  auto:{kind:"Alert", importance:"normal", icon:ICONS.autos, age:"3h",
    title:"Reminder drafted for JOD-INV2031",
    why:"€1,800 from Paddock & Co (Demo), overdue since 8 Sep.",
    detail:"The reminder is drafted and waiting on Finance. Nothing has been sent; there is no email connection in this demo.",
    actionLabel:"Review draft", secondaryLabel:"Snooze", group:"Automations",
    fields:[{k:"Invoice",v:"JOD-INV2031"},{k:"Value",v:"€1,800"},{k:"Due",v:"8 Sep"},{k:"Status",v:"Draft prepared"}],
    history:[{when:"Today 06:45",text:"Reminder drafted by Finance & Cash"},{when:"Today 06:45",text:"Task T-103 created for Declan Whelan"}]},
  task:{kind:"Task", importance:"normal", icon:ICONS.work, age:"1d",
    title:"Candy Floss Pink L is overstocked",
    why:"96 on hand against about 5 sold online in 30 days.",
    detail:"That is well over the 60-day cover target and ties up stock at cost. A targeted clearance is worth reviewing before the November uplift.",
    actionLabel:"Open record", secondaryLabel:"Assign", group:"Work",
    fields:[{k:"Variant",v:"JZ-CF-L"},{k:"On hand",v:"96"},{k:"Assignee",v:"Maeve Breslin"},{k:"Due",v:"3 Oct"}],
    history:[{when:"20 Aug",text:"90 received on PO-0184"},{when:"Today 06:40",text:"Overstock detected"}]}
};
const ORDER = ["sync","po","visit","auto","task"];

const ANSWERS = {
  credit:{tool:"core_search", effect:"read",
    text:"One wholesale invoice is overdue: JOD-INV2031, €1,800 from Paddock & Co (Demo), due 8 Sep. A reminder is drafted and has not been sent. JOD-INV2036 for €3,600 is not due until 20 Oct.",
    cols:["Invoice","Retailer","Value","Due"],
    rows:[["JOD-INV2031","Paddock & Co (Demo)","€1,800","8 Sep"],["JOD-INV2036","Hillcrest Equestrian (Demo)","€3,600","20 Oct"],["JOD-INV2034","Saddle & Stirrup (Demo)","€2,400","Paid"]],
    actions:[["Review the drafted reminder",1],["Open Paddock & Co",0]]},
  jobs:{tool:"core_tasks_find", effect:"read",
    text:"Seven tasks are open. The three high priority ones are the Admiral Navy S gap, the Meadow Tack shortage and the JOD-INV2031 reminder.",
    cols:["Task","Record","Due","Owner"],
    rows:[["Cover the Admiral Navy S gap","JZ-AN-S","27 Sep","M. Breslin"],["Partial dispatch or new date","JOD-W1041","28 Sep","R. Kinsella"],["Review drafted reminder","JOD-INV2031","26 Sep","D. Whelan"]],
    actions:[["Open Work",1],["Show due soon",0]]},
  chase:{tool:"core_email_draft", effect:"write", confirm:true,
    confirmSummary:"Mark the reminder for JOD-INV2031 (€1,800, Paddock & Co (Demo), due 8 Sep) as approved in demo.",
    text:"The reminder is drafted. There is no email connection in this demo, so approving marks it ready; nothing is sent.",
    actions:[["Approve in demo",1],["Edit draft",0]]},
  sync:{tool:"core_operations_health", effect:"read",
    text:"Shopify is a demo connection with simulated data. The accounting provider is still to confirm, so invoices and bills are demo data. There are no live bank, courier or accounting connections.",
    actions:[["Open Integrations",1],["Assign to Declan",0]]},
  visits:{tool:"core_orders_find", effect:"read",
    text:"Three wholesale orders are open. JOD-W1041 is 12 short on Midnight Black M, JOD-W1042 is fully allocated and JOD-W1043 has nothing reserved yet.",
    cols:["Order","Retailer","Dispatch","Status"],
    rows:[["JOD-W1041","Meadow Tack (Demo)","14 Oct","12 short"],["JOD-W1042","Oakfield Saddlery (Demo)","2 Oct","Allocated"],["JOD-W1043","Riverbend Tack Room (Demo)","9 Oct","Not allocated"]],
    actions:[["Open JOD-W1041",1],["Open Sales & Wholesale",0]]},
  fallback:{tool:"core_search", effect:"read",
    text:"I can answer that from the Jod-Z demo records you have access to. Everything is demo data; nothing I do sends, pays or orders anything for real.",
    actions:[["Show me what you can do",0]]}
};

// Turns a plain-English filter name into a full dashboard area: no real backend,
// just a seeded generator so the same phrase always produces the same numbers,
// with direction and vocabulary nudged by keywords in the text.
function synthesizeCustomArea(name){
  const trimmed = (name || "").trim();
  if (!trimmed) return null;
  let seed = 0;
  for (let i = 0; i < trimmed.length; i++) seed = (seed * 31 + trimmed.charCodeAt(i)) >>> 0;
  const rnd = (n) => (((seed >>> (n % 24)) ^ (seed << ((n * 7) % 13))) >>> 0) % 997 / 997;
  const low = trimmed.toLowerCase();
  const has = (...words) => words.some(w => low.indexOf(w) > -1);
  const growth = has("expansion","growth","launch","scale","pilot","new colour","new size","open","opening","grow");
  const risk = has("risk","issue","delay","problem","complaint","fault","return","churn","decline");
  const dir = risk ? -1 : (growth ? 1 : (rnd(2) > 0.45 ? 1 : -1));

  let vocab = "generic";
  if (has("county","co.","region","dublin","cork","galway","kildare","meath","wicklow","wexford","tipperary","louth","ireland","uk"))
    vocab = "region";
  else if (has("cost","spend","budget","saving","margin")) vocab = "cost";
  else if (has("staff","hiring","team","recruit","headcount")) vocab = "people";
  else if (has("supplier","stock","inventory","size","colour","leggings","breech")) vocab = "ops";
  else if (has("retailer","tack","customer","wholesale","account")) vocab = "customer";

  const V = {
    region:   {labels:["Online orders","Wholesale orders","Revenue","Retailers active"], unit:"EUR, 30 DAYS"},
    cost:     {labels:["Spend","Cost per unit","Savings found","Budget used"], unit:"EUR, 30 DAYS"},
    people:   {labels:["Headcount","Open roles","Time to hire","Retention"], unit:"PEOPLE"},
    ops:      {labels:["Stock cover","Lead time","Stockout days","Reorders drafted"], unit:"DAYS"},
    customer: {labels:["Active retailers","Reorder rate","Lapsed","Average order"], unit:"RETAILERS"},
    generic:  {labels:["Volume","Rate","Cost","Coverage"], unit:"ACTIVITY, 30 DAYS"}
  }[vocab];

  const months = ["Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug"];
  let v0 = 40 + Math.floor(rnd(1) * 220);
  const chart = months.map((m, i) => {
    v0 = Math.max(8, Math.round(v0 * (1 + dir * (0.03 + rnd(i + 3) * 0.07))));
    return [m, v0, String(v0)];
  });
  const metrics = V.labels.map((label, i) => {
    const val = 20 + Math.floor(rnd(i + 5) * 400);
    const pct = 2 + Math.round(rnd(i + 9) * 18);
    const up = dir > 0 ? rnd(i + 12) > 0.25 : rnd(i + 12) > 0.7;
    const bars = [0,1,2,3,4,5,6,7,8].map(k => 0.3 + rnd(i * 3 + k) * 0.7);
    return [label, i === 1 ? pct + "%" : String(val), (up ? "+" : "−") + pct + (i === 1 ? "pt" : "%"), up ? "up" : "down", "vs last month", bars];
  });
  const capName = trimmed.replace(/\b\w/g, c => c.toUpperCase());
  const split = [
    [capName + ", direct", String(Math.round(v0 * 0.5)), "48%", 1],
    ["Existing orders", String(Math.round(v0 * 0.3)), "31%", 0],
    ["Everything else", String(Math.round(v0 * 0.2)), "21%", 0]
  ];
  const table = [1,2,3].map(w => [capName + ", week " + w, String(20 + Math.floor(rnd(20 + w) * 200)),
    (dir > 0 ? "+" : "−") + (3 + Math.floor(rnd(23 + w) * 14)) + "%", "Auto-tagged from records mentioning “" + low + "”"]);
  table.push(["Everything else", String(20 + Math.floor(rnd(30) * 200)), "-", "Baseline"]);
  return {
    id: trimmed, label: capName, color: "var(--accent)", owner: "CUSTOM FILTER",
    description: "Generated from “" + trimmed + "”, a plain-English filter over demo data, not a registered metric set.",
    kind: "columns", chartTitle: capName + " over time", chartUnit: V.unit,
    chart, splitTitle: "Where “" + low + "” shows up", split,
    tableCols: ["Item","Value","Change","Note"], table,
    metrics, legend: [capName, "Existing", "Other"]
  };
}

function pickAnswer(q){
  const s = q.toLowerCase();
  if (/order|wholesale|dispatch|meadow|short/.test(s)) return ANSWERS.visits;
  if (/chase|email|draft|send|reminder/.test(s)) return ANSWERS.chase;
  if (/invoice|debtor|owe|outstanding|overdue|paddock/.test(s)) return ANSWERS.credit;
  if (/task|late|slip|work/.test(s)) return ANSWERS.jobs;
  if (/sync|shopify|integration|accounting|connect|health/.test(s)) return ANSWERS.sync;
  return ANSWERS.fallback;
}

const ORGS = [
  ["Meadow Tack (Demo)","Retailer","€3,600","Open order","active"],
  ["Paddock & Co (Demo)","Retailer","€1,800","Overdue since 8 Sep","watch"],
  ["Hillcrest Equestrian (Demo)","Retailer","€3,600","Due 20 Oct","active"],
  ["Oakfield Saddlery (Demo)","Retailer","€2,400","Open order","active"],
  ["Riverbend Tack Room (Demo)","Retailer","€2,400","Open order","active"],
  ["Northgate Knitwear (Demo)","Supplier","-","-","active"],
  ["Carrow Textiles (Demo)","Supplier","-","-","active"]
];
const TEAMS = [
  ["Owner","1 member","Aoibhe Dunleavy","approves purchases, adjustments, dispatch"],
  ["Operations","1 member","Rory Kinsella","wholesale orders and dispatch"],
  ["Stock","1 member","Maeve Breslin","stock, returns and purchasing drafts"],
  ["Finance","1 member","Declan Whelan","invoices, bills and cash"]
];
const LOCATIONS = [
  ["Office (Demo)","Address not set in demo","2 staff","active"],
  ["Storage unit (Demo)","Address not set in demo","2 staff","active"]
];
const AGENT_DEFS = [
  {id:"briefing", name:"Briefing", shape:"crown-pebble", tint:"#191c1f", state:"complete",
   role:"Summarises sales, stock, wholesale and cash each morning, highlights decisions and links to the records",
   when:"07:02", preview:"four decisions today. all linked.",
   thread:[
     {kind:"stamp", text:"Today 07:00"},
     {kind:"routine", text:"Ran routine", routine:"Morning briefing"},
     {kind:"agent", text:"morning briefing, from the demo data:", lines:[
       {k:"Sales", v:"€24,000 net in 30 days · €18,000 online, €6,000 wholesale"},
       {k:"Stock", v:"Admiral Navy S: 6 available, about 2 days of cover"},
       {k:"Wholesale", v:"JOD-W1041 for Meadow Tack is 12 units short"},
       {k:"Cash", v:"JOD-INV2031 €1,800 overdue · PO-D193 would take day 60 to €12,500"}]},
     {kind:"agent", text:"four things need a decision today. each one opens from Home. nothing has been sent or approved."},
     {kind:"user", text:"which one first"},
     {kind:"agent", text:"the purchase. it decides whether the Admiral Navy S gap gets covered and whether cash stays above the €20,000 buffer. the invoice and the Meadow Tack call can happen in parallel."}
   ]},
  {id:"ops", name:"Ops Watchdog", shape:"shield", tint:"#2b1b1e", state:"attention",
   role:"Flags unallocated orders, missed dispatch dates, stock conflicts and unresolved returns, and creates linked tasks",
   when:"06:41", preview:"JOD-W1041 is 12 short. task created for rory.",
   thread:[
     {kind:"stamp", text:"Today 06:41"},
     {kind:"agent", text:"detected: JOD-W1041 (Meadow Tack) has 108 of 120 units allocated. the short line is Midnight Black M: 24 requested, 12 allocated. the other 2 on hand are damaged returns held as unavailable."},
     {kind:"agent", text:"task T-102 created for Rory: agree a partial dispatch or a new date. 40 Midnight Black M arrive on PO-0187 on 24 Oct."},
     {kind:"user", text:"what else is open"},
     {kind:"agent", text:"JOD-W1043 is confirmed but has nothing reserved yet (task T-106). two sellable returns are waiting on a restock decision. JOD-W1042 is fully allocated for 2 Oct."}
   ]},
  {id:"stock", name:"Stock & Demand", shape:"control-cube", tint:"#16241f", state:"thinking",
   role:"Explains forecasts, spots demand trends, finds size and colour shortages and overstock, and prepares replenishment proposals",
   when:"Fri", preview:"PO-D193 drafted. awaiting approval.",
   thread:[
     {kind:"stamp", text:"Friday 16:30"},
     {kind:"agent", text:"detected: Candy Floss Pink L has 96 available and sold 5 in 28 days, €1,728 at cost. the other pink sizes sell normally, so the fix is size L only: pause replenishment and review a targeted clearance."},
     {kind:"stamp", text:"Friday 17:10"},
     {kind:"agent", text:"draft prepared: PO-D193, 600 units across 10 variants, €10,800. it leads with Admiral Navy S (120) and Midnight Black M (90). it is not approved, not sent, and not counted as incoming stock."},
     {kind:"user", text:"why does admiral navy S run out if 60 are coming"},
     {kind:"agent", text:"timing. 6 are available and demand runs at about 3 a day, so it is gone by 28 Sep. the 60 land on 24 Oct. options for the gap: ask the supplier to expedite part of PO-0187, or hold wholesale promises on that size until it lands."}
   ]},
  {id:"finance", name:"Finance & Cash", shape:"executive-capsule", tint:"#2a2118", state:"waiting",
   role:"Monitors receivables, commitments and ad spend, drafts reminders and explains how purchases or late payments move cash",
   when:"06:45", preview:"reminder drafted for JOD-INV2031. not sent.",
   thread:[
     {kind:"stamp", text:"Today 06:45"},
     {kind:"agent", text:"JOD-INV2031 (Paddock & Co) has €1,800 outstanding, due 8 Sep, 18 days overdue. draft prepared: a polite reminder. it has not been sent; this demo has no email connection."},
     {kind:"user", text:"can we afford PO-D193"},
     {kind:"agent", text:"it breaks the buffer. with receipts unchanged, day 30 goes €28,800 to €25,560, day 60 €23,300 to €12,500 and day 90 €34,600 to €23,800. the €20,000 buffer is breached from 20 Nov. approving adds it to commitments; no money leaves the bank until the deposit is paid."}
   ]}
];

const KPI_DEFS = {
  revenue:{label:"Net sales", value:"€24,000", delta:"+1.7%", dir:"up", hint:"30 days", hero:true},
  cash:{label:"Bank cash", value:"€32,500", delta:"demo", dir:"up", hint:"opening balance"},
  overdue:{label:"Overdue invoices", value:"€1,800", delta:"1 invoice", dir:"down", hint:"since 8 Sep"},
  margin:{label:"Online sales", value:"€18,000", delta:"+9.8%", dir:"up", hint:"30 days"},
  jobs:{label:"Wholesale sales", value:"€6,000", delta:"−€1,200", dir:"down", hint:"30 days"},
  nps:{label:"Open wholesale", value:"€8,400", delta:"3 orders", dir:"up", hint:"not yet dispatched"},
  pipeline:{label:"Draft purchases", value:"€10,800", delta:"PO-D193", dir:"up", hint:"awaiting approval"},
  utilisation:{label:"Returns open", value:"3", delta:"awaiting decision", dir:"down", hint:"RET-314, 316, 317"}
};

const ASPECT_DEFS = [
  {id:"sales", label:"Sales", color:"var(--accent)", owner:"RORY KINSELLA", description:"Online and wholesale sales, demo data.",
   kind:"columns", chartTitle:"Net sales by month", chartUnit:"EUR",
   chart:[["Oct",19,"€19k"],["Nov",22,"€22k"],["Dec",29,"€29k"],["Jan",15,"€15k"],["Feb",16,"€16k"],["Mar",20,"€20k"],["Apr",22,"€22k"],["May",23,"€23k"],["Jun",21,"€21k"],["Jul",22,"€22k"],["Aug",23,"€23k"],["Sep",24,"€24k"]],
   splitTitle:"Where it came from",
   split:[["Online (Shopify, simulated)","€18,000","75%",1],["Wholesale","€6,000","25%",0]],
   tableCols:["Retailer","Order","Value","Owner"],
   table:[["Meadow Tack (Demo)","JOD-W1041","€3,600","Rory Kinsella"],["Oakfield Saddlery (Demo)","JOD-W1042","€2,400","Rory Kinsella"],["Riverbend Tack Room (Demo)","JOD-W1043","€2,400","Declan Whelan"],["Hillcrest Equestrian (Demo)","JOD-W1038","€3,600","Declan Whelan"]],
   metrics:[["Net sales","€24,000","+1.7%","up","30 days",[.4,.55,.44,.62,.5,.7,.6,.78,1]],
     ["Online orders","300","+19","up","30 days",[.5,.6,.44,.7,.55,.75,.62,.8,.9]],
     ["Online sales","€18,000","+9.8%","up","30 days",[.6,.58,.62,.6,.66,.64,.7,.68,.74]],
     ["Wholesale sales","€6,000","−€1,200","down","30 days",[.7,.66,.7,.6,.62,.55,.58,.5,.48]]]},
  {id:"development", label:"Products", color:"#9fd6f0", owner:"MAEVE BRESLIN", description:"Sales by product, 30 days, online units.",
   kind:"rows", rows:[["Admiral Navy","128 units",128],["Midnight Black","74 units",74],["Petrol Blue","44 units",44],["Merry Berry","36 units",36],["Candy Floss Pink","33 units",33]], chartTitle:"Online units by product", chartUnit:"UNITS, 30 DAYS",
   chart:[["Oct",260,"260"],["Nov",290,"290"],["Dec",380,"380"],["Jan",200,"200"],["Feb",210,"210"],["Mar",260,"260"],["Apr",280,"280"],["May",290,"290"],["Jun",270,"270"],["Jul",280,"280"],["Aug",290,"290"],["Sep",300,"300"]],
   splitTitle:"By range",
   split:[["Young Rider leggings","€16,800","93%",1],["Jockeys breeches","€1,200","7%",0]],
   tableCols:["Product","Sizes","Trade price","Family"],
   table:[["Admiral Navy","2XS to L","€30","Young Rider"],["Midnight Black","2XS to L","€30","Young Rider"],["The Monarch Breech (Navy)","XS to XL","€45","Jockeys"],["The Eclipse Breech (Black)","XS to XL","€45","Jockeys"]],
   metrics:[["Products","8","0","up","in range",[.2,.2,.4,.4,.4,.6,.6,.6,1]],
     ["Variants","40","0","up","sizes and colours",[.4,.44,.5,.5,.6,.6,.7,.8,.9]],
     ["Low cover","1","Admiral Navy S","down","under 14 days",[.5,.55,.6,.58,.66,.7,.72,.8,.86]],
     ["Overstock","1","Candy Floss Pink L","down","over 180 days",[.8,.74,.7,.62,.6,.5,.44,.4,.32]]]},
  {id:"marketing", label:"Retailers", color:"#e6c78a", owner:"RORY KINSELLA", description:"Wholesale retailers and when they usually reorder.",
   kind:"funnel", funnel:[["Retailers","8","-",8],["Ordered in 90 days","6","75% of retailers",6],["Open orders","3","50% of those",3],["Overdue invoice","1","Paddock & Co",1]], chartTitle:"Wholesale orders by month", chartUnit:"ORDERS",
   chart:[["Oct",2,"2"],["Nov",3,"3"],["Dec",2,"2"],["Jan",1,"1"],["Feb",2,"2"],["Mar",3,"3"],["Apr",2,"2"],["May",3,"3"],["Jun",2,"2"],["Jul",2,"2"],["Aug",3,"3"],["Sep",4,"4"]],
   splitTitle:"By county",
   split:[["Co. Kildare","1","13%",1],["Co. Meath","1","13%",0],["Co. Cork","1","13%",0],["Other counties","5","61%",0]],
   tableCols:["Retailer","Last order","Terms","Typical order"],
   table:[["Meadow Tack (Demo)","12 Sep","30 days","€3,600"],["Hillcrest Equestrian (Demo)","4 Sep","30 days","€3,600"],["Saddle & Stirrup (Demo)","29 Aug","30 days","€2,400"],["Fetlock & Field (Demo)","30 Jun","45 days","€1,800"]],
   metrics:[["Retailers","8","0","up","active accounts",[.3,.4,.36,.5,.46,.6,.58,.7,.86]],
     ["Open orders","3","+2","up","not dispatched",[.2,.3,.24,.4,.36,.5,.44,.6,.7]],
     ["Open value","€8,400","+€5,400","up","wholesale",[.4,.46,.5,.56,.6,.66,.7,.76,.8]],
     ["Predicted reorders","3","December","up","estimated",[.5,.54,.58,.56,.62,.64,.66,.7,.74]]]},
  {id:"operations", label:"Stock", color:"#dcded6", owner:"MAEVE BRESLIN", description:"Stock on hand, reserved and incoming.",
   kind:"stacked", legend:["Available","Reserved","Unavailable"], stacked:[["Oct",[980,90,0]],["Nov",[940,120,0]],["Dec",[820,160,1]],["Jan",[900,60,0]],["Feb",[960,40,0]],["Mar",[1000,80,0]],["Apr",[1020,90,0]],["May",[1000,100,0]],["Jun",[980,110,0]],["Jul",[940,120,0]],["Aug",[1050,90,0]],["Sep",[940,176,2]]], chartTitle:"Units on hand by month", chartUnit:"UNITS",
   chart:[["Oct",1070,"1070"],["Nov",1060,"1060"],["Dec",981,"981"],["Jan",960,"960"],["Feb",1000,"1000"],["Mar",1080,"1080"],["Apr",1110,"1110"],["May",1100,"1100"],["Jun",1090,"1090"],["Jul",1060,"1060"],["Aug",1140,"1140"],["Sep",1118,"1118"]],
   splitTitle:"Incoming",
   split:[["PO-0187, due 24 Oct","240","50%",1],["PO-0190, due 18 Nov","120","25%",0],["PO-D193, draft","600","not approved",0]],
   tableCols:["Variant","Available","Sold 30 days","Status"],
   table:[["Admiral Navy S","6","84","Low cover"],["Midnight Black M","0","26","Short on JOD-W1041"],["Candy Floss Pink L","96","5","Overstock"],["Admiral Navy M","28","20","Healthy"]],
   metrics:[["Variants low","1","Admiral Navy S","down","under 14 days",[.5,.6,.5,.66,.6,.7,.66,.76,.84]],
     ["Short lines","1","JOD-W1041","down","wholesale",[.3,.36,.3,.44,.4,.5,.56,.7,.85]],
     ["Returns open","3","awaiting decision","down","restock queue",[.4,.5,.6,.5,.66,.6,.72,.8,.9]],
     ["Cover target","60 days","assumption","up","per variant",[.8,.78,.8,.76,.78,.74,.76,.72,.7]]]},
  {id:"finance", label:"Finance", color:"#7fd8a4", owner:"DECLAN WHELAN", description:"Cash, invoices and commitments. Demo data, accounting provider to confirm.",
   kind:"area", chartTitle:"Bank cash by month", chartUnit:"EUR",
   chart:[["Oct",30,"€30k"],["Nov",28,"€28k"],["Dec",34,"€34k"],["Jan",31,"€31k"],["Feb",29,"€29k"],["Mar",30,"€30k"],["Apr",31,"€31k"],["May",32,"€32k"],["Jun",31,"€31k"],["Jul",32,"€32k"],["Aug",33,"€33k"],["Sep",33,"€32.5k"]],
   splitTitle:"Invoices by status",
   split:[["Overdue","€1,800","33%",1],["Not yet due","€3,600","67%",0]],
   tableCols:["Invoice","Retailer","Value","Due"],
   table:[["JOD-INV2031","Paddock & Co (Demo)","€1,800","8 Sep"],["JOD-INV2036","Hillcrest Equestrian (Demo)","€3,600","20 Oct"],["JOD-INV2034","Saddle & Stirrup (Demo)","€2,400","Paid 24 Sep"]],
   metrics:[["Bank cash","€32,500","opening","up","demo",[.5,.56,.5,.62,.58,.68,.66,.74,.8]],
     ["Overdue","€1,800","1 invoice","down","since 8 Sep",[.3,.34,.4,.38,.46,.5,.6,.7,.84]],
     ["Cash buffer","€20,000","target","up","minimum balance",[.7,.72,.7,.68,.68,.66,.64,.62,.6]],
     ["Draft purchases","€10,800","PO-D193","down","not approved",[.4,.44,.42,.5,.52,.6,.62,.7,.76]]]},
  {id:"support", label:"Returns", color:"#e2705c", owner:"MAEVE BRESLIN", description:"Returns, reasons and restock decisions.",
   kind:"dots", target:8, targetLabel:"Target: 8 returns a month or fewer", chartTitle:"Returns by month", chartUnit:"COUNT",
   chart:[["Oct",5,"5"],["Nov",6,"6"],["Dec",9,"9"],["Jan",7,"7"],["Feb",4,"4"],["Mar",5,"5"],["Apr",5,"5"],["May",6,"6"],["Jun",5,"5"],["Jul",4,"4"],["Aug",5,"5"],["Sep",6,"6"]],
   splitTitle:"By reason",
   split:[["Size related","3","50%",1],["Damaged","2","33%",0],["Colour","1","17%",0]],
   tableCols:["Return","Variant","Reason","Status"],
   table:[["RET-314","Admiral Navy S","Too small","Awaiting decision"],["RET-316","Candy Floss Pink L","Colour","Awaiting decision"],["RET-317","Admiral Navy XS","Too small","Awaiting decision"],["RET-311","Midnight Black M","Seam fault","Refunded"]],
   metrics:[["Open returns","3","awaiting","down","decision",[.6,.58,.54,.5,.48,.44,.4,.38,.34]],
     ["Size related","3","of 6","down","this month",[.5,.54,.56,.6,.6,.66,.7,.74,.8]],
     ["Quarantined","2","Midnight Black M","down","unavailable",[.7,.66,.62,.6,.54,.5,.46,.44,.4]],
     ["Restocked","1","RET-315","up","sellable",[.5,.5,.46,.4,.4,.36,.3,.3,.26]]]}
];

const FILTER_GROUPS = [
  {title:"AREA", items:["Sales","Products","Retailers","Stock","Finance","Returns"]},
  {title:"SPINE", items:["Product","Variant","Retailer","Supplier","Order"]},
  {title:"TIME", items:["This week","This month","This quarter","Year to date"]}
];
const OPS_DEFS = [
  {id:"o1", name:"Morning briefing", kind:"routine", owner:"Briefing", ownerKind:"agent", initials:"BR",
   trigger:"Weekdays, 07:00", triggerKind:"schedule", next:"Mon 07:00", last:"Delivered 07:02", status:"healthy", rate:100, on:true,
   what:"Reads sales, stock, wholesale and cash from the demo dataset and writes the four things that need a decision, each linked to its record.",
   why:"Decisions were scattered across the storefront, spreadsheets and the inbox.",
   saved:"Demo estimate: 5 hours a month",
   steps:[["Trigger","Every weekday at 07:00"],["Find","Overnight changes in stock, orders, invoices and commitments"],["Check","Drop anything already decided"],["Draft","Write the briefing with links"],["Update","Post to Home"]],
   runs:[["Today 07:00","14s","ok","4 decisions","Simulated"],["Fri 07:00","12s","ok","3 decisions","Simulated"],["Thu 07:00","13s","ok","3 decisions","Simulated"]]},
  {id:"o2", name:"Wholesale shortage watch", kind:"automation", owner:"Ops Watchdog", ownerKind:"agent", initials:"OW",
   trigger:"Order confirmed or stock changed", triggerKind:"event", next:"Event-based", last:"JOD-W1041 flagged", status:"healthy", rate:98, on:true,
   what:"Checks every confirmed wholesale order against available stock, flags lines that cannot be allocated and creates a linked task.",
   why:"Short lines were found at packing time, after the retailer had been promised a date.",
   saved:"Demo estimate: 4 hours a month",
   steps:[["Trigger","A wholesale order is confirmed or stock moves"],["Find","Lines with less allocated than requested"],["Check","Incoming deliveries that could cover the gap"],["Update","Create a task for the order owner"]],
   runs:[["Today 06:41","3s","ok","1 shortage","Simulated"],["Tue 09:02","2s","ok","0 shortages","Simulated"]]},
  {id:"o3", name:"Low cover check", kind:"routine", owner:"Stock & Demand", ownerKind:"agent", initials:"SD",
   trigger:"Daily, 06:30", triggerKind:"schedule", next:"Tomorrow 06:30", last:"2 variants flagged", status:"healthy", rate:100, on:true,
   what:"Compares available stock with forecast demand for every size and colour and flags anything under 14 days of cover or tying up stock.",
   why:"Whole products looked healthy while a single popular size ran out.",
   saved:"Demo estimate: 3 hours a month",
   steps:[["Trigger","Every day at 06:30"],["Find","Variants under 14 days of cover"],["Find","Variants with more than 180 days of cover"],["Draft","Replenishment or clearance proposal"],["Approval","Owner reviews any purchase","gate"]],
   runs:[["Today 06:40","9s","ok","2 flagged","Simulated"],["Yesterday 06:30","8s","ok","2 flagged","Simulated"]]},
  {id:"o4", name:"Overdue invoice reminder", kind:"automation", owner:"Finance & Cash", ownerKind:"agent", initials:"FC",
   trigger:"Daily, 09:00", triggerKind:"schedule", next:"Tomorrow 09:00", last:"1 draft waiting", status:"approval", rate:100, on:true,
   what:"Finds invoices past due, drafts a reminder and parks it for Finance. Nothing is sent from the demo.",
   why:"Chasing happened in bursts, so the oldest balances got the least attention.",
   saved:"Demo estimate: 2 hours a month",
   steps:[["Trigger","Every weekday at 09:00"],["Find","Invoices past their due date"],["Draft","Write the reminder"],["Approval","Finance reviews","gate"],["Send","Email the retailer (not connected in demo)","external"]],
   runs:[["Today 06:45","4s","partial","1 drafted, 0 sent","Simulated"]]},
  {id:"o5", name:"Shopify order sync", kind:"automation", owner:"Ops Watchdog", ownerKind:"agent", initials:"OW",
   trigger:"Hourly", triggerKind:"schedule", next:"Demo only", last:"Simulated data", status:"healthy", rate:100, on:true,
   what:"Demo connection. Imports online orders and payouts as simulated data; no live store is connected.",
   why:"Online sales and stock need to agree without manual export.",
   saved:"Demo estimate",
   steps:[["Trigger","Every hour"],["Find","New online orders (simulated)"],["Update","Online sales and stock movements"]],
   runs:[["Today 06:00","2s","ok","Simulated","Simulated"]]},
  {id:"o6", name:"Cash outlook refresh", kind:"report", owner:"Finance & Cash", ownerKind:"agent", initials:"FC",
   trigger:"Daily, 07:30", triggerKind:"schedule", next:"Tomorrow 07:30", last:"Low point €21,000 on 14 Dec", status:"healthy", rate:100, on:true,
   what:"Recalculates the 30, 60 and 90 day expected bank balance and flags any breach of the cash buffer.",
   why:"A buying decision needs its cash effect before approval, not after.",
   saved:"Demo estimate: 3 hours a month",
   steps:[["Trigger","Every day at 07:30"],["Find","Known commitments and estimated trading"],["Check","Lowest balance against the buffer"],["Update","Cash Outlook"]],
   runs:[["Today 07:30","5s","ok","No breach in base case","Simulated"]]},
  {id:"o7", name:"Returns restock queue", kind:"task", owner:"Stock", ownerKind:"person", initials:"MB",
   trigger:"Return received", triggerKind:"event", next:"Event-based", last:"3 waiting", status:"approval", rate:100, on:true,
   what:"Queues each return for a restock decision. Only sellable returns go back to available stock.",
   why:"Damaged returns were being counted as sellable.",
   saved:"Demo estimate: 1 hour a month",
   steps:[["Trigger","A return is received"],["Check","Condition: sellable or damaged"],["Approval","Stock decides restock","gate"],["Update","Available or quarantined stock"]],
   runs:[["Thu 15:02","1s","ok","Queued","Simulated"]]}
];

const OPS_FILTERS = [
  ["all","All"], ["routine","Agent routines"], ["automation","Automations"],
  ["report","Scheduled reports"], ["task","Recurring tasks"], ["approval","Needs approval"], ["failed","Failed"]
];

const WORK_SECTIONS = [
  {id:"tasks", label:"Tasks", blurb:"Everything assigned to the team, each linked to the record it is about.",
   views:["Open","Due soon","High priority","Done"], filters:["Due date","Any status","Anyone"]},
  {id:"approvals", label:"Approvals", blurb:"Purchases, stock adjustments and partial dispatches. Approving changes demo records only.",
   views:["Awaiting you","Decided"], filters:["Raised date","Any value"]},
  {id:"workflows", label:"Workflows", blurb:"Agent routines and automations: what runs on its own, and who owns it.",
   views:[], filters:[]},
  {id:"schedules", label:"Schedules", blurb:"When recurring work fires across the week.",
   views:[], filters:[]}
];

const WORK_TASKS = [];

const WORKFLOWS = [];

const SCHEDULES = [
  {id:"s1", name:"Morning briefing", cadence:"Every weekday · 07:00", next:"Mon 07:00", owner:"Briefing", on:true, day:1},
  {id:"s2", name:"Low cover check", cadence:"Daily · 06:30", next:"Tomorrow 06:30", owner:"Stock & Demand", on:true, day:1},
  {id:"s3", name:"Overdue invoice reminder", cadence:"Weekdays · 09:00", next:"Mon 09:00", owner:"Finance & Cash", on:true, day:1},
  {id:"s4", name:"Cash outlook refresh", cadence:"Daily · 07:30", next:"Tomorrow 07:30", owner:"Finance & Cash", on:true, day:2},
  {id:"s5", name:"Wholesale dispatch review", cadence:"Thursdays · 10:00", next:"Thu 10:00", owner:"Operations", on:true, day:3}
];

const WIDGET_DEFS = [["inbox","Decisions"],["work","My work"],["activity","Activity"],["kpi","Today's numbers"],["visits","Dispatches and payments"]];
const WORK_WIDGETS = [
  {id:"queue", label:"Open tasks", value:"7", hint:"across the team", icon:"work", queue:"mine"},
  {id:"late", label:"Due soon", value:"4", hint:"by 28 Sep", icon:"health", queue:"overdue"},
  {id:"unassigned", label:"Approvals", value:"2", hint:"awaiting you", icon:"teams", queue:"unassigned"},
  {id:"week", label:"Next 7 days", value:"7", hint:"due this week", icon:"visits", queue:"upcoming"}
];
const PERSONALITIES = ["Straight-talking","Warm","Formal","Dry"];
const ANSWER_STYLES = ["Short answers","Show the working","Ask before acting"];
/* Every context source and every registered tool the agent could be granted:
   the builder shows the whole catalogue, grouped, rather than a sample. */
const CONTEXT_DEFS = [
  ["Products & variants","records","Colours, sizes, prices and costs"],
  ["Stock","records","On hand, reserved, unavailable and incoming"],
  ["Retailers","records","Tack shops, terms and reorder patterns"],
  ["Wholesale orders","records","Lines, allocations and dispatches"],
  ["Returns","records","Reasons, condition and restock decisions"],
  ["Tasks","work","Owners, due dates, linked records"],
  ["Approvals","work","Purchases, adjustments and partial dispatches"],
  ["Invoices","money","Issued, paid, overdue (demo data)"],
  ["Bills","money","Supplier and operating bills (demo data)"],
  ["Purchase orders","money","Drafts, deposits and balances"],
  ["Activity log","system","Every event, agent and human"],
  ["Forecast assumptions","system","Growth, seasonal uplift, cover target, cash buffer"]
];
const CONTEXT_SOURCES = CONTEXT_DEFS.map(c => c[0]);
const SKILL_DEFS = [
  ["Search records","read"],["Summarise activity","read"],["Read stock and demand","read"],
  ["Read invoices","read"],["Read cash outlook","read"],
  ["Draft reminder","write"],["Create task","write"],["Draft purchase order","write"],
  ["Reserve stock","write"],["Raise approval","write"],
  ["Send email (not connected)","external"],["Send to supplier (not connected)","external"],["Post to accounting (not connected)","external"]
];
/* The two questions the agent asks back once it knows the job. */
const TRAIN_PHASES = [
  ["Reading the whole ontology", "demo dataset"],
  ["Learning how Jod-Z words things", "organisation to retailer"],
  ["Researching equestrian clothing wholesale", "demo sources"],
  ["Writing its own system prompt", "draft"]
];
const BRIEF_QUESTIONS = [
  {title:"What should it cover?", sub:"Pick as many as you like. You can refine later.",
   options:[["Stock","Low cover, overstock and incoming deliveries"],["Wholesale","Open orders, shortages and dispatch dates"],
            ["Money","Cash, overdue invoices and commitments"],["Returns","What is waiting on a restock decision"],
            ["Something else","Tell me in the next message"]]},
  {title:"When should it land?", sub:"One is enough to start.",
   options:[["Every morning 07:00","Before packing starts"],["Weekdays 08:00","Monday to Friday only"],
            ["Only when something changes","Event-driven, no noise"],["On demand","When you ask for it"]]}
];
/* The words under a name, keyed to the same state the face lights with. */
const STATE_LABELS = {working:"working", thinking:"thinking", waiting:"waiting on you",
  complete:"up to date", attention:"needs you", idle:"idle"};

const FACE_SHAPES = [
  ["crown-pebble","Crown pebble"],["executive-capsule","Executive capsule"],["shield","Shield"],
  ["glass-visor","Glass visor"],["control-cube","Control cube"],["low-dome","Low dome"],
  ["offset-pebble","Offset pebble"],["rim-capsule","Rim capsule"],["wide-eyed","Wide-eyed"],
  ["precision-brow","Precision brow"],["tall-unit","Tall unit"],["soft-asymmetric","Soft asymmetric"]
];
/* Shell colours only, deliberately desaturated so none of them reads as a
   state. The eyes, rim and dots always carry the state colour. */
const FACE_TINTS = [
  ["#191c1f","Graphite"],["#1b2430","Slate"],["#241b2e","Aubergine"],
  ["#2a2118","Bronze"],["#16241f","Pine"],["#2b1b1e","Oxblood"]
];

/* ---- ontology graph: generation, Dijkstra traversal, canvas render ---- */
const CLUSTERS = [
  ["Products",        "#c8f04b", 0.00, 0.62, 46],
  ["Variants",        "#6ad0f0", 0.90, 0.70, 52],
  ["Retailers",       "#b06cf0", 1.75, 0.66, 58],
  ["Orders",          "#f0c04b", 2.55, 0.72, 44],
  ["Invoices",        "#f0567f", 3.35, 0.60, 38],
  ["Purchase orders", "#5fe0a8", 4.15, 0.70, 40],
  ["Returns",         "#f0803a", 4.95, 0.64, 30],
  ["Tasks",           "#5f7cf0", 5.65, 0.72, 34]
];
function mulberry(seed){
  return function(){
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* Hub-and-spoke clusters around a dense phyllotaxis core, in unit space
   (-1..1 on both axes) so the layout is resolution independent. */
const _hexCache = {};
function hexRGB(hex){
  if (_hexCache[hex]) return _hexCache[hex];
  const h = hex.replace("#", "");
  const v = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  _hexCache[hex] = v;
  return v;
}


function buildGraph(){
  const rnd = mulberry(20260902);
  const nodes = [], edges = [], adj = [];
  const add = (x, y, z, r, cluster, kind) => {
    nodes.push({x, y, z, r, cluster, kind}); adj.push([]); return nodes.length - 1;
  };
  const link = (a, b) => {
    const dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y, dz = nodes[a].z - nodes[b].z;
    const w = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.004;
    const id = edges.length;
    edges.push({a, b, w});
    adj[a].push([b, w, id]); adj[b].push([a, w, id]);
  };

  // the core is a filled sphere on a Fibonacci lattice, not a disc
  const CORE = 880, coreIds = [];
  for (let i = 0; i < CORE; i++){
    const t = (i + 0.5) / CORE;
    const phi = Math.acos(1 - 2 * t);
    const theta = i * 2.39996;
    const shell = 0.16 + 0.28 * Math.pow(rnd(), 0.5);
    const grade = rnd();
    coreIds.push(add(
      Math.sin(phi) * Math.cos(theta) * shell * 1.04,
      Math.cos(phi) * shell * 0.96,
      Math.sin(phi) * Math.sin(theta) * shell,
      grade < 0.06 ? 3.4 + rnd() * 1.4 : grade < 0.3 ? 2.1 + rnd() * 0.7 : 1.0 + rnd() * 0.8, 0, "core"));
  }
  // lattice neighbours plus a mesh of chords, so the sphere reads as a volume
  for (let i = 1; i < coreIds.length; i++){
    link(coreIds[i], coreIds[i - 1]);
    if (i >= 13) link(coreIds[i], coreIds[i - 13]);
    if (i >= 21 && i % 2 === 0) link(coreIds[i], coreIds[i - 21]);
    if (i >= 34 && i % 3 === 0) link(coreIds[i], coreIds[i - 34]);
    if (i >= 55 && i % 4 === 0) link(coreIds[i], coreIds[i - 55]);
    if (i >= 89 && i % 5 === 0) link(coreIds[i], coreIds[i - 89]);
    if (i % 6 === 0) link(coreIds[i], coreIds[Math.floor(rnd() * coreIds.length)]);
  }

  // a mid shell between the nucleus and the lobes: the layer that makes it
  // read as a network rather than a ball with satellites
  const MID = 560, midIds = [];
  for (let i = 0; i < MID; i++){
    const t = (i + 0.5) / MID;
    const phi = Math.acos(1 - 2 * t), theta = i * 2.39996 + 0.7;
    const d = 0.52 + 0.16 * Math.pow(rnd(), 0.6);
    const g2 = rnd();
    midIds.push(add(
      Math.sin(phi) * Math.cos(theta) * d * 1.02,
      Math.cos(phi) * d * 0.96,
      Math.sin(phi) * Math.sin(theta) * d,
      g2 < 0.05 ? 2.6 + rnd() * 1.0 : g2 < 0.3 ? 1.6 + rnd() * 0.6 : 0.8 + rnd() * 0.7, 0, "core"));
  }
  for (let i = 0; i < midIds.length; i++){
    if (i >= 1) link(midIds[i], midIds[i - 1]);
    if (i >= 17) link(midIds[i], midIds[i - 17]);
    if (i >= 29 && i % 2 === 0) link(midIds[i], midIds[i - 29]);
    // radial spokes tying the shell to the nucleus
    if (i % 2 === 0) link(midIds[i], coreIds[Math.floor(rnd() * coreIds.length)]);
    if (i % 9 === 0) link(midIds[i], coreIds[Math.floor(rnd() * coreIds.length)]);
  }

  // clusters ride a sphere: each hub gets its own latitude as well as longitude
  const hubs = [], clusterLeaves = [];
  const onSphere = (lon, lat, d0) => { const d = d0 * 1.22;
    return [Math.cos(lat) * Math.cos(lon) * d * 1.02, Math.sin(lat) * d * 0.96, Math.cos(lat) * Math.sin(lon) * d]; };
  CLUSTERS.forEach((c, ci) => {
    const [, , ang, dist, leaves] = c;
    const lat = (ci % 2 ? 1 : -1) * (0.26 + rnd() * 0.5);
    const wob = 1.06 + rnd() * 0.16;
    const hp = onSphere(ang, lat, dist * wob);
    const hub = add(hp[0], hp[1], hp[2], 5.4, ci, "hub");
    hubs.push(hub);
    const mine = [];
    clusterLeaves.push(mine);
    for (let k = 0; k < 3; k++) link(hub, coreIds[Math.floor(rnd() * coreIds.length)]);
    for (let k = 0; k < 5; k++) link(hub, midIds[Math.floor(rnd() * midIds.length)]);

    const subs = 5 + Math.floor(rnd() * 4);
    const subIds = [];
    for (let s = 0; s < subs; s++){
      const sa = ang + (rnd() - 0.5) * 0.52, sl = lat + (rnd() - 0.5) * 0.3;
      const sd = dist + 0.08 + rnd() * 0.18;
      const sp = onSphere(sa, sl, sd);
      const sub = add(sp[0], sp[1], sp[2], 3.2, ci, "sub");
      subIds.push(sub);
      link(sub, hub);
      if (s > 0 && rnd() < 0.7) link(sub, subIds[s - 1]);
      const fan = Math.floor((leaves * 7.4) / subs);
      const spread = 0.17 + rnd() * 0.2;
      let prev = -1;
      for (let l = 0; l < fan; l++){
        const la = sa + (rnd() - 0.5) * spread * 2 + (rnd() - 0.5) * 0.06;
        const ll = sl + (rnd() - 0.5) * spread * 1.1;
        const ld = sd + 0.03 + Math.pow(rnd(), 0.8) * 0.17;
        const lp = onSphere(la, ll, ld);
        const lg = rnd();
        const leaf = add(lp[0], lp[1], lp[2],
          lg < 0.08 ? 2.8 + rnd() * 1.2 : lg < 0.34 ? 1.8 + rnd() * 0.6 : 1.0 + rnd() * 0.7, ci, "leaf");
        link(leaf, sub);
        mine.push(leaf);
        if (rnd() < 0.14) link(leaf, hub);
        if (prev >= 0 && rnd() < 0.34) link(leaf, prev);
        if (rnd() < 0.16) link(leaf, midIds[Math.floor(rnd() * midIds.length)]);
        prev = leaf;
      }
    }
  });
  // far satellites hanging off the outer leaves
  CLUSTERS.forEach((c, ci) => {
    const [, , ang, dist] = c;
    for (let s = 0; s < 7; s++){
      const sa = ang + (rnd() - 0.5) * 1.5, sl = (rnd() - 0.5) * 1.3;
      const sd = dist + 0.42 + rnd() * 0.22;
      const ap = onSphere(sa, sl, sd);
      const anchor = add(ap[0], ap[1], ap[2], 2.4, ci, "sub");
      link(anchor, hubs[ci]);
      const n = 14 + Math.floor(rnd() * 18);
      for (let l = 0; l < n; l++){
        const la = sa + (rnd() - 0.5) * 0.9, ll = sl + (rnd() - 0.5) * 0.7;
        const ld = sd + 0.02 + Math.pow(rnd(), 0.8) * 0.18;
        const p = onSphere(la, ll, ld);
        const leaf = add(p[0], p[1], p[2], 0.8 + rnd() * 0.9, ci, "leaf");
        link(leaf, anchor);
        clusterLeaves[ci].push(leaf);
      }
    }
  });

  // two hub rings and long chords across the sphere
  hubs.forEach((h, i) => {
    link(h, hubs[(i + 1) % hubs.length]);
    link(h, hubs[(i + 2) % hubs.length]);
    if (i % 3 === 0) link(h, hubs[(i + 4) % hubs.length]);
  });
  // neighbouring clusters share records, so their leaves cross-link
  for (let ci = 0; ci < clusterLeaves.length; ci++){
    const a = clusterLeaves[ci], b = clusterLeaves[(ci + 1) % clusterLeaves.length];
    const n = 26 + Math.floor(rnd() * 16);
    for (let k = 0; k < n; k++){
      link(a[Math.floor(rnd() * a.length)], b[Math.floor(rnd() * b.length)]);
    }
    // and a good number reach right across to the far side
    for (let k = 0; k < 12; k++){
      const far = clusterLeaves[(ci + 3) % clusterLeaves.length];
      link(a[Math.floor(rnd() * a.length)], far[Math.floor(rnd() * far.length)]);
    }
    for (let k = 0; k < 8; k++){
      const far = clusterLeaves[(ci + 4) % clusterLeaves.length];
      link(a[Math.floor(rnd() * a.length)], far[Math.floor(rnd() * far.length)]);
    }
  }

  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, minZ = 1e9, maxZ = -1e9;
  for (const n of nodes){
    if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y;
    if (n.z < minZ) minZ = n.z; if (n.z > maxZ) maxZ = n.z;
  }
  const bounds = {minX, maxX, minY, maxY, cx:(minX + maxX) / 2, cy:(minY + maxY) / 2,
    cz:(minZ + maxZ) / 2, w:maxX - minX, h:maxY - minY, d:maxZ - minZ,
    radius: Math.max(maxX - minX, maxY - minY, maxZ - minZ) / 2,
    reach: nodes.reduce((m, n) => Math.max(m, Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z)), 0)};
  return {nodes, edges, adj, hubs, coreIds, bounds};
}

export {
  INK,
  BODY,
  DIM,
  FAINT,
  LIME,
  GREEN,
  AMBER,
  RED,
  NEUTRAL,
  MONO,
  ICONS,
  REC_SECTIONS,
  CONTACTS,
  FILE_TREE,
  ONTO_NODES,
  ONTO_EDGES,
  REC_TEMPLATES,
  REC_TEMPLATE_CATS,
  PEOPLE,
  ROLE_LEVELS,
  PERM_KEYS,
  GRANT_DEFS,
  ROLE_SCOPES,
  DEFAULT_PERMS,
  INTEGRATIONS,
  BG_DEFS,
  THEMES,
  ADMIN_ICONS,
  ADMIN_CARDS,
  ADMIN_GROUPS,
  SRC_TINT,
  SRC_ABBR,
  DATA_EVENTS,
  PEOPLE_EVENTS,
  AI_EVENTS,
  STREAM_DEFS,
  NAV,
  ITEMS,
  ORDER,
  ANSWERS,
  synthesizeCustomArea,
  pickAnswer,
  ORGS,
  TEAMS,
  LOCATIONS,
  AGENT_DEFS,
  KPI_DEFS,
  ASPECT_DEFS,
  FILTER_GROUPS,
  OPS_DEFS,
  OPS_FILTERS,
  WORK_SECTIONS,
  WORK_TASKS,
  WORKFLOWS,
  SCHEDULES,
  WIDGET_DEFS,
  WORK_WIDGETS,
  PERSONALITIES,
  ANSWER_STYLES,
  CONTEXT_DEFS,
  CONTEXT_SOURCES,
  SKILL_DEFS,
  TRAIN_PHASES,
  BRIEF_QUESTIONS,
  STATE_LABELS,
  FACE_SHAPES,
  FACE_TINTS,
  CLUSTERS,
  mulberry,
  _hexCache,
  hexRGB,
  buildGraph
};
