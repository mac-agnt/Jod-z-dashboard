import { Drawer, KV, Note, Btn, Pill, RecLink, Section, Swatch } from "../ui";
import { useJodz, closeDrawer, receivePO } from "../store";
import { supplier, poTotal, poUnits, poPayments, orderRows, productOfSku, sizeOfSku, eur, num, fmtDate } from "../derive";
import { PRODUCTS } from "../data";
import { poStatusTone } from "../pages/Inventory";

export default function PoDrawer({ id }: { id: string }) {
  const s = useJodz();
  const po = s.pos.find((p) => p.id === id);
  if (!po) return null;
  const sup = supplier(po.supplierId);
  const open = po.status === "Confirmed" || po.status === "Approved";
  const received = po.lines.reduce((a, l) => a + l.received, 0);
  const pays = poPayments(po);
  const prods = PRODUCTS.filter((p) => po.lines.some((l) => productOfSku(l.sku).id === p.id));
  const sizes = prods[0]?.sizes ?? [];
  const benefit = orderRows(s).filter((r) => r.isOpen && r.o.stage !== "Draft" && r.o.lines.some((l) => l.qty > l.allocated && po.lines.some((pl) => pl.sku === l.sku)));

  return (
    <Drawer
      wide
      eyebrow={"Purchase order · " + po.id}
      title={sup.name}
      sub={num(poUnits(po)) + " units · " + eur(poTotal(po)) + " at " + eur(po.unitCost) + " a unit · expected " + fmtDate(po.expected)}
      onClose={closeDrawer}
      foot={
        open ? (
          <>
            <Btn kind="primary" onClick={() => receivePO(po.id)}>Receive delivery (simulated)</Btn>
            <span className="jz-faint" style={{ fontSize: 12, alignSelf: "center" }}>Adds the units to on-hand stock. Nothing is sent to the supplier.</span>
          </>
        ) : <Btn kind="ghost" onClick={closeDrawer}>Close</Btn>
      }
    >
      <KV items={[
        ["Status", <Pill tone={poStatusTone(po.status)}>{po.status}</Pill>],
        ["Ordered", po.ordered ? fmtDate(po.ordered) : "Not ordered"],
        ["Expected", fmtDate(po.expected)],
        ["Received", num(received) + " of " + num(poUnits(po))],
      ]} />
      {po.note && <Note>{po.note}</Note>}

      <Section title="Supplier terms">
        <KV items={[["Makes", sup.makes], ["Lead time", sup.leadDays + " days"], ["Minimum order", sup.moq], ["Deposit", sup.depositPct + "% on order"], ["Balance", sup.balanceTerms]]} />
      </Section>

      <Section title="Lines by colour and size">
        <div style={{ overflowX: "auto" }}>
          <div className="jz-matrix" style={{ gridTemplateColumns: `minmax(160px,1.4fr) repeat(${sizes.length}, minmax(52px,1fr)) minmax(60px,.8fr)`, minWidth: 480 }}>
            <div />
            {sizes.map((z) => <div key={z} className="jz-label" style={{ textAlign: "center" }}>{z}</div>)}
            <div className="jz-label" style={{ textAlign: "right" }}>Total</div>
            {prods.map((p) => {
              const ls = po.lines.filter((l) => productOfSku(l.sku).id === p.id);
              return [
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}><Swatch productId={p.id} />{p.name}</div>,
                ...sizes.map((z) => {
                  const l = ls.find((x) => sizeOfSku(x.sku) === z);
                  return (
                    <div key={p.id + z} className={"jz-cell" + (l ? "" : " mute")} style={{ cursor: "default", height: 40 }}>
                      {l ? l.qty : "-"}
                      {l && l.received > 0 && <small>{l.received} in</small>}
                    </div>
                  );
                }),
                <div key={p.id + "t"} className="jz-mono" style={{ textAlign: "right", alignSelf: "center", fontWeight: 600 }}>{ls.reduce((a, l) => a + l.qty, 0)}</div>,
              ];
            })}
          </div>
        </div>
      </Section>

      <Section title="Payments">
        <div className="jz-list">
          {pays.map((p) => (
            <div key={p.label}>
              <span style={{ flex: 1 }}>{p.label}<span className="jz-faint" style={{ marginLeft: 6, fontSize: 11.5 }}>{fmtDate(p.date)}</span></span>
              <span className="jz-mono">{eur(p.amount)}</span>
              <Pill tone={p.paid ? "ok" : "outline"}>{p.paid ? "Paid" : "Scheduled"}</Pill>
            </div>
          ))}
        </div>
        <div className="jz-faint" style={{ fontSize: 11.5, marginTop: 8 }}>Scheduled payments appear in the cash outlook. Marking them paid happens in Accounting; no money moves in the demo.</div>
      </Section>

      <Section title="Open orders that benefit">
        {benefit.length === 0 ? <div className="jz-faint" style={{ fontSize: 12.5 }}>{open ? "No open wholesale orders are short on these variants" : "None"}</div> : (
          <div className="jz-list">
            {benefit.map((r) => {
              const shortLines = r.o.lines.filter((l) => l.qty > l.allocated && po.lines.some((pl) => pl.sku === l.sku));
              return (
                <div key={r.o.id}>
                  <RecLink link={{ kind: "order", id: r.o.id }} />
                  <span style={{ flex: 1 }} className="jz-dim">{r.retailerName}</span>
                  <span style={{ fontSize: 12 }}>{shortLines.map((l) => productOfSku(l.sku).name + " " + sizeOfSku(l.sku) + " " + (l.qty - l.allocated) + " short").join(", ")}</span>
                </div>
              );
            })}
          </div>
        )}
        {open && benefit.length > 0 && <Note tone="warn">After receiving, open the order and reserve stock to cover the shortfall.</Note>}
      </Section>
    </Drawer>
  );
}
