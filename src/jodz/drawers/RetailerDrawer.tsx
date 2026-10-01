import { Drawer, Section, KV, Pill, Note, RecLink, Table, type Col } from "../ui";
import { useJodz, closeDrawer, openDrawer, daysBetween } from "../store";
import { retailer, staff, orderRow, predictedReorders, invoiceStatus, invoiceBalance, eur, num, fmtDate, type OrderRow } from "../derive";
import { RETAILERS } from "../data";

export default function RetailerDrawer({ id }: { id: string }) {
  const s = useJodz();
  if (!RETAILERS.some((r) => r.id === id)) return <Drawer title={id} onClose={closeDrawer}><Note>Retailer not found.</Note></Drawer>;
  const r = retailer(id);
  const orders = s.orders.filter((o) => o.retailerId === id).map((o) => orderRow(s, o)).sort((a, b) => b.o.created.localeCompare(a.o.created));
  const invoices = s.invoices.filter((i) => i.retailerId === id).sort((a, b) => b.issued.localeCompare(a.issued));
  const pred = predictedReorders(s).find((p) => p.r.id === id);
  const paidDays = invoices.flatMap((i) => (invoiceBalance(i) <= 0 && i.payments.length ? [daysBetween(i.issued, i.payments[i.payments.length - 1].date)] : []));
  const avgDays = paidDays.length ? Math.round(paidDays.reduce((a, d) => a + d, 0) / paidDays.length) : null;
  const open = invoices.reduce((a, i) => a + Math.max(0, invoiceBalance(i)), 0);
  const overdue = invoices.filter((i) => invoiceStatus(i) === "Overdue");
  const dispatchedValue = orders.reduce((a, o) => a + o.o.lines.reduce((b, l) => b + l.dispatched * (l.price ?? o.o.price), 0), 0);

  const cols: Col<OrderRow>[] = [
    { key: "id", label: "Order", strong: true, render: (x) => <span className="jz-mono">{x.o.id}</span> },
    { key: "c", label: "Created", render: (x) => fmtDate(x.o.created) },
    { key: "u", label: "Units", right: true, num: true, render: (x) => num(x.units) },
    { key: "v", label: "Value", right: true, num: true, render: (x) => eur(x.value) },
    { key: "st", label: "Stage", render: (x) => <Pill tone={x.o.stage === "Complete" ? "ok" : x.o.stage === "Draft" ? "outline" : ""}>{x.o.stage}</Pill> },
    { key: "p", label: "Payment", render: (x) => <span className="jz-dim">{x.payment}</span> },
  ];

  return (
    <Drawer eyebrow="Retailer account" title={r.name} sub={<>{r.town} · account owner {staff(r.owner).name}</>} onClose={closeDrawer}>
      {overdue.length > 0 && (
        <Note tone="bad">
          {overdue.map((i) => i.id).join(", ")} overdue, {eur(overdue.reduce((a, i) => a + invoiceBalance(i), 0))} outstanding. New orders from this account carry a payment hold flag.
        </Note>
      )}

      <Section title="Account">
        <KV items={[
          ["Contact", r.contact],
          ["Email", <span className="jz-mono" style={{ fontSize: 12 }}>{r.email}</span>],
          ["Payment terms", r.terms + " days"],
          ["Typical order", num(r.typicalUnits) + " units, " + eur(r.typicalValue)],
          ["Usual mix", r.typicalMix],
          ["Dispatched to date", eur(dispatchedValue)],
        ]} />
      </Section>

      <Section title="Payment behaviour">
        <KV items={[
          ["Open balance", eur(open)],
          ["Overdue", overdue.length ? <span className="jz-bad">{eur(overdue.reduce((a, i) => a + invoiceBalance(i), 0))}</span> : "None"],
          ["Average days to pay", avgDays === null ? "No paid invoices yet" : avgDays + " days"],
          ["Pattern", r.paysLate ? "Tends to pay late" : "Usually within terms"],
        ]} />
        {invoices.length > 0 && (
          <div className="jz-list" style={{ marginTop: 12 }}>
            {invoices.map((i) => {
              const st = invoiceStatus(i);
              return (
                <div key={i.id}>
                  <RecLink link={{ kind: "invoice", id: i.id }} />
                  <span className="jz-dim" style={{ flex: 1 }}>{i.orderId}, due {fmtDate(i.due)}</span>
                  <span className="jz-mono">{eur(i.net + i.tax)}</span>
                  <Pill tone={st === "Paid" ? "ok" : st === "Overdue" ? "bad" : "warn"}>{st}</Pill>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {pred && (
        <Section title="Predicted reorder">
          <div style={{ display: "flex", gap: 14, alignItems: "baseline", flexWrap: "wrap" }}>
            <b style={{ fontSize: 18, fontWeight: 600 }}>{fmtDate(pred.windowFrom)} to {fmtDate(pred.windowTo)}</b>
            <Pill tone={pred.overdue ? "bad" : pred.inHorizon ? "accent" : "outline"}>{pred.status}</Pill>
          </div>
          <div className="jz-dim" style={{ fontSize: 12.5, marginTop: 6 }}>
            Last ordered {fmtDate(r.lastOrder)}, usually every {r.intervalDays} days. Expect about {num(r.typicalUnits)} units ({eur(r.typicalValue)}).
            {pred.hasOpen ? " An order is already open." : ""} This is a prediction, not an order{pred.includedInCash ? ", and is shown as predicted in the cash outlook." : ", and is left out of the cash outlook."}
          </div>
        </Section>
      )}

      <Section title="Order history">
        <Table<OrderRow> cols={cols} rows={orders} rowKey={(x) => x.o.id} onRow={(x) => openDrawer("order", x.o.id)} empty="No orders in the demo data" />
      </Section>
    </Drawer>
  );
}
