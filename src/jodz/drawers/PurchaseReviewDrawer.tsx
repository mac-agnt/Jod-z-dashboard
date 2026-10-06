/* Review a draft purchase: mix, supplier terms, payments and the before-and-after cash outlook. Nothing is sent to the supplier. */
import { PRODUCTS } from "../data";
import { useJodz, closeDrawer, decideApproval, requestPurchaseApproval, getState, type JodzState } from "../store";
import { cashOutlook, poPayments, poTotal, poUnits, supplier, eur, num, fmtDate, productOfSku, sizeOfSku } from "../derive";
import { Drawer, KV, Note, Btn, Pill, Section, Swatch, LineChart, Legend, Table } from "../ui";

export default function PurchaseReviewDrawer({ id }: { id: string }) {
  const s = useJodz();
  const po = s.pos.find((p) => p.id === id);
  if (!po) return null;
  const sup = supplier(po.supplierId);
  const pays = poPayments(po);
  const approved = po.status !== "Draft";
  const awaiting = s.approvals.find((a) => a.link.id === id && a.status === "Awaiting approval");
  const declined = !awaiting && s.approvals.some((a) => a.link.id === id && a.status === "Declined");

  // Compare with and without this purchase, whatever its current status.
  const asDraft: JodzState = { ...s, pos: s.pos.map((p) => (p.id === id ? { ...p, status: "Draft" } : p)) };
  const before = cashOutlook(asDraft, { includeDraft: false });
  const after = cashOutlook(asDraft, { includeDraft: true });

  const sizes = Array.from(new Set(po.lines.map((l) => sizeOfSku(l.sku))));
  const order = ["2XS", "XS", "S", "M", "L", "XL"];
  sizes.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const prods = PRODUCTS.filter((p) => po.lines.some((l) => productOfSku(l.sku).id === p.id));
  const qty = (pid: string, sz: string) => po.lines.find((l) => productOfSku(l.sku).id === pid && sizeOfSku(l.sku) === sz)?.qty ?? 0;

  const approve = () => {
    let ap = getState().approvals.find((a) => a.link.id === id && a.status === "Awaiting approval");
    if (!ap) {
      requestPurchaseApproval(id);
      ap = getState().approvals.find((a) => a.link.id === id && a.status === "Awaiting approval");
    }
    if (ap) decideApproval(ap.id, true);
  };
  const decline = () => {
    if (awaiting) decideApproval(awaiting.id, false);
  };

  const horizonRows = [0, 1, 2].map((i) => ({ b: before.horizons[i], a: after.horizons[i] }));

  return (
    <Drawer
      wide
      eyebrow={"Purchase review · " + po.id}
      title={num(poUnits(po)) + " units from " + sup.name}
      sub={approved ? "Approved in demo. Nothing has been sent to the supplier." : "Draft prepared by the Stock & Demand agent. Not approved, not sent to the supplier."}
      onClose={closeDrawer}
      foot={
        approved ? (
          <>
            <Pill tone="ok">Approved in demo</Pill>
          </>
        ) : (
          <>
            <Btn kind="primary" onClick={approve}>Approve in demo</Btn>
            <Btn kind="ghost" onClick={decline} disabled={!awaiting}>Decline</Btn>
          </>
        )
      }
    >
      <Note tone={approved ? "ok" : ""}>
        {approved
          ? "This purchase is now in cash commitments and incoming stock. Nothing has been sent to the supplier and no money has left the bank."
          : "Approving adds this purchase to cash commitments and incoming stock. Nothing is sent to the supplier and money has not left the bank."}
        {declined && " An earlier approval request was declined."}
      </Note>

      <Section title="Size and colour mix">
        <div className="jz-matrix" style={{ gridTemplateColumns: `minmax(160px,1.5fr) repeat(${sizes.length}, minmax(56px,1fr)) minmax(64px,.8fr)` }}>
          <div />
          {sizes.map((sz) => <div key={sz} className="jz-label" style={{ textAlign: "center" }}>{sz}</div>)}
          <div className="jz-label" style={{ textAlign: "center" }}>Total</div>
          {prods.map((p) => (
            <Row key={p.id} p={p}>
              {sizes.map((sz) => {
                const q = qty(p.id, sz);
                return <div key={sz} className={"jz-cell" + (q ? "" : " mute")} style={{ cursor: "default", height: 40 }}>{q || "·"}</div>;
              })}
              <div className="jz-cell" style={{ cursor: "default", height: 40, fontWeight: 600 }}>{sizes.reduce((a, sz) => a + qty(p.id, sz), 0)}</div>
            </Row>
          ))}
        </div>
      </Section>

      <Section title="Supplier terms">
        <KV items={[
          ["Supplier", sup.name],
          ["Lead time", sup.leadDays + " days"],
          ["Minimum order", sup.moq],
          ["Unit cost", eur(po.unitCost)],
          ["Expected arrival", fmtDate(po.expected)],
          ["Total", eur(poTotal(po))],
        ]} />
      </Section>

      <Section title="Payment schedule">
        <Table
          rowKey={(p) => p.label}
          rows={pays}
          cols={[
            { key: "l", label: "Payment", strong: true, render: (p) => p.label + " (" + (p.label === "Deposit" ? po.depositPct + "%" : sup.balanceTerms.toLowerCase()) + ")" },
            { key: "d", label: "Date", render: (p) => fmtDate(p.date) },
            { key: "a", label: "Amount", right: true, num: true, render: (p) => eur(p.amount) },
            { key: "s", label: "Status", render: (p) => <Pill>{p.paid ? "Paid" : approved ? "Committed, not paid" : "Not committed"}</Pill> },
          ]}
        />
      </Section>

      <Section title="Cash outlook before and after" right={<Legend items={[{ name: "Without this purchase", color: "var(--dim)" }, { name: "With this purchase", color: "var(--accent)" }]} />}>
        <Table
          rowKey={(r) => String(r.b.day)}
          rows={horizonRows}
          cols={[
            { key: "d", label: "Horizon", render: (r) => "Day " + r.b.day + " · " + fmtDate(r.b.date) },
            { key: "b", label: "Without", right: true, num: true, render: (r) => eur(r.b.closing) },
            { key: "a", label: "With", right: true, num: true, strong: true, render: (r) => <span className={r.a.closing < after.buffer ? "jz-bad" : ""}>{eur(r.a.closing)}</span> },
            { key: "c", label: "Change", right: true, num: true, render: (r) => eur(r.a.closing - r.b.closing) },
          ]}
        />
        <KV items={[
          ["Lowest balance without", eur(before.low.balance) + " on " + fmtDate(before.low.date)],
          ["Lowest balance with", eur(after.low.balance) + " on " + fmtDate(after.low.date)],
          ["Cash buffer", eur(after.buffer)],
          ["Buffer breach", after.breach ? "From " + fmtDate(after.breach.date) : "None"],
        ]} />
        <LineChart
          labels={after.series.map((p) => fmtDate(p.date))}
          series={[
            { name: "Without this purchase", color: "var(--dim)", values: before.series.map((p) => p.balance) },
            { name: "With this purchase", color: "var(--accent)", values: after.series.map((p) => p.balance) },
          ]}
          refLine={{ value: after.buffer, label: "Buffer " + eur(after.buffer) }}
          height={200}
        />
        {after.breach && !before.breach && (
          <Note tone="bad">
            With this purchase the balance falls below the {eur(after.buffer)} buffer from {fmtDate(after.breach.date)}, reaching {eur(after.low.balance)} on {fmtDate(after.low.date)}. Options: split the order, ask for a later balance date, or reduce slower sizes.
          </Note>
        )}
      </Section>
    </Drawer>
  );
}

function Row({ p, children }: { p: (typeof PRODUCTS)[number]; children: React.ReactNode }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
        <Swatch productId={p.id} />
        {p.name}
      </div>
      {children}
    </>
  );
}
