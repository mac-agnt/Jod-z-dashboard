import { Drawer, Section, KV, Note, Pill, Btn, RecLink } from "../ui";
import { closeDrawer, useJodz, payBill } from "../store";
import { eur, fmtDate, billBalance } from "../derive";
import { SNAPSHOT, type Bill } from "../data";
import { statusTone } from "./InvoiceDrawer";

export function billStatus(b: Bill) {
  const bal = billBalance(b);
  if (bal <= 0) return "Paid";
  if (b.due < SNAPSHOT) return "Overdue";
  return b.paid > 0 ? "Part paid" : "Due";
}

export default function BillDrawer({ id }: { id: string }) {
  const s = useJodz();
  const b = s.bills.find((x) => x.id === id);
  if (!b) {
    return <Drawer title={id} onClose={closeDrawer}><Note>Bill not found in the demo data.</Note></Drawer>;
  }
  const bal = billBalance(b);
  const status = billStatus(b);
  return (
    <Drawer
      eyebrow="Supplier bill"
      title={b.id}
      sub={<span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><Pill tone={statusTone(status)}>{status}</Pill>{b.issued > SNAPSHOT && <span>Expected to be issued {fmtDate(b.issued)}</span>}</span>}
      onClose={closeDrawer}
      foot={bal > 0 ? <div style={{ display: "flex", width: "100%", justifyContent: "flex-end" }}><Btn kind="primary" onClick={() => payBill(b.id)}>Record simulated payment</Btn></div> : undefined}
    >
      <Section title="Details">
        <KV items={[
          ["Payee", b.supplierId ? <RecLink key="s" link={{ kind: "supplier", id: b.supplierId }}>{b.payee}</RecLink> : b.payee],
          ["Linked PO", b.poId ? <RecLink key="p" link={{ kind: "po", id: b.poId }} /> : "None"],
          ["Category", b.category],
          ["Issued", fmtDate(b.issued)],
          ["Due", fmtDate(b.due)],
          ["Expected payment", fmtDate(b.expected)],
          ["Amount (net)", eur(b.net)],
          ["Tax", <span key="t">{eur(b.tax)} <span className="jz-faint" style={{ fontSize: 11 }}>synthetic</span></span>],
          ["Balance", eur(bal)],
        ]} />
        <div className="jz-faint" style={{ fontSize: 11.5, marginTop: 10 }}>Tax is a synthetic tax field, treatment to confirm. Accounting system: provider to confirm, demo data.</div>
      </Section>
      {bal > 0 ? (
        <Note>Recording a simulated payment lowers bank cash by {eur(bal)} and removes this bill from the Cash Outlook. No bank payment is made.</Note>
      ) : (
        <Note tone="ok">Paid. Nothing left to schedule.</Note>
      )}
    </Drawer>
  );
}
