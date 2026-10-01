import { Drawer, Section, KV, Note, Pill, Btn, RecLink, Table, type Tone } from "../ui";
import { closeDrawer, useJodz, draftReminder, approveReminder, recordPayment } from "../store";
import { eur, fmtDate, retailer, invoiceBalance, invoiceStatus, daysOverdue } from "../derive";

export const statusTone = (st: string): Tone => (st === "Paid" ? "ok" : st === "Overdue" ? "bad" : st === "Part paid" ? "warn" : "outline");

export default function InvoiceDrawer({ id }: { id: string }) {
  const s = useJodz();
  const inv = s.invoices.find((i) => i.id === id);
  if (!inv) {
    return <Drawer title={id} onClose={closeDrawer}><Note>Invoice not found in the demo data.</Note></Drawer>;
  }
  const r = retailer(inv.retailerId);
  const bal = invoiceBalance(inv);
  const status = invoiceStatus(inv);
  const late = daysOverdue(inv);
  const firstName = r.contact.split(" ")[0];
  const reminderLabel = inv.reminder === "approved" ? "Approved in demo (not sent)" : inv.reminder === "drafted" ? "Draft prepared, not sent" : "No reminder";

  const draftText = [
    `Subject: ${inv.id}, ${eur(bal)} due ${fmtDate(inv.due)}`,
    "",
    `Hi ${firstName},`,
    "",
    `Hope the autumn season is going well at ${r.name}. A quick note that invoice ${inv.id} for ${eur(bal)} (order ${inv.orderId}) was due on ${fmtDate(inv.due)}${late > 0 ? ` and is now ${late} days past due` : ""}.`,
    "",
    "If it has already gone through, thank you, and please ignore this. If anything on the invoice needs a look, just reply and we will sort it out.",
    "",
    "Many thanks,",
    "Declan",
    "Jod-Z",
  ].join("\n");

  return (
    <Drawer
      eyebrow="Customer invoice"
      title={inv.id}
      sub={<span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><Pill tone={statusTone(status)}>{status}</Pill>{late > 0 && bal > 0 && <span>{late} days overdue</span>}</span>}
      onClose={closeDrawer}
      foot={
        bal > 0 ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: "100%" }}>
            {inv.reminder === "none" && <Btn onClick={() => draftReminder(inv.id)}>Draft reminder</Btn>}
            {inv.reminder === "drafted" && <Btn onClick={() => approveReminder(inv.id)}>Approve in demo (not sent)</Btn>}
            <span style={{ flex: 1 }} />
            <Btn kind="primary" onClick={() => recordPayment(inv.id)}>Record simulated payment</Btn>
          </div>
        ) : undefined
      }
    >
      <Section title="Details">
        <KV items={[
          ["Customer", <RecLink key="r" link={{ kind: "retailer", id: r.id }}>{r.name}</RecLink>],
          ["Linked order", <RecLink key="o" link={{ kind: "order", id: inv.orderId }} />],
          ["Issued", fmtDate(inv.issued)],
          ["Due", fmtDate(inv.due)],
          ["Terms", r.terms + " days"],
          ["Expected payment", fmtDate(inv.expected)],
          ["Amount (net)", eur(inv.net)],
          ["Tax", <span key="t" title="Synthetic tax field, treatment to confirm">{eur(inv.tax)} <span className="jz-faint" style={{ fontSize: 11 }}>synthetic</span></span>],
          ["Balance", <span key="b" className={bal > 0 ? "jz-strong" : ""}>{eur(bal)}</span>],
        ]} />
        <div className="jz-faint" style={{ fontSize: 11.5, marginTop: 10 }}>Tax is a synthetic tax field, treatment to confirm. Accounting system: provider to confirm, demo data.</div>
      </Section>

      <Section title="Payment history">
        <Table
          rowKey={(p) => p.date + p.amount}
          rows={inv.payments}
          empty="No payments recorded"
          cols={[
            { key: "d", label: "Date", render: (p) => fmtDate(p.date) },
            { key: "n", label: "Note", render: (p) => p.note },
            { key: "a", label: "Amount", right: true, num: true, render: (p) => eur(p.amount) },
          ]}
        />
      </Section>

      {bal > 0 && (
        <Section title="Reminder" right={<Pill tone={inv.reminder === "approved" ? "ok" : inv.reminder === "drafted" ? "warn" : "outline"}>{reminderLabel}</Pill>}>
          {inv.reminder === "none" ? (
            <Note>No reminder drafted yet. Drafting one saves the text below for review. Nothing is sent.</Note>
          ) : (
            <>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "var(--ui)", fontSize: 12.5, lineHeight: 1.55, padding: "12px 14px", borderRadius: 12, border: "1px dashed var(--border)", color: "var(--body)" }}>{draftText}</pre>
              <div className="jz-faint" style={{ fontSize: 11.5, marginTop: 8 }}>
                {inv.reminder === "approved" ? "Approved in demo. Not sent: there is no email connection in this demo." : "Draft, not sent. Approving marks it ready; it still does not send."}
              </div>
            </>
          )}
        </Section>
      )}

      {bal > 0 && (
        <Note>Recording a simulated payment adds {eur(bal)} to bank cash, logs it in Activity and removes the expected receipt from the Cash Outlook so it is not counted twice. No real payment is involved.</Note>
      )}
    </Drawer>
  );
}
