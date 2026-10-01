import { Drawer, KV, Note, Btn, Pill, RecLink, Section, VariantName } from "../ui";
import { useJodz, closeDrawer, decideReturn } from "../store";
import { variantRows, sizeOfSku, eur, fmtDate, num } from "../derive";

export default function ReturnDrawer({ id }: { id: string }) {
  const s = useJodz();
  const r = s.returns.find((x) => x.id === id);
  if (!r) return null;
  const pending = r.restock === "Pending";
  const row = variantRows(s).find((v) => v.sku === r.sku);
  const exch = r.exchangeSku ? variantRows(s).find((v) => v.sku === r.exchangeSku) : undefined;
  const effect = r.condition === "Sellable"
    ? "Restocking adds 1 unit to on hand and 1 to available."
    : "Quarantining adds 1 unit to on hand and 1 to unavailable. Available stock does not change until it is written off or repaired.";

  return (
    <Drawer
      eyebrow={"Return · " + r.id}
      title={<VariantName sku={r.sku} />}
      sub={r.channel + " order " + r.orderRef + " · received " + fmtDate(r.received)}
      onClose={closeDrawer}
      foot={pending ? (
        <>
          <Btn kind="primary" onClick={() => decideReturn(r.id)}>{r.condition === "Sellable" ? "Restock as sellable" : "Hold as unavailable"}</Btn>
          <span className="jz-faint" style={{ fontSize: 12, alignSelf: "center" }}>Simulated. Refund status is not changed.</span>
        </>
      ) : <Btn kind="ghost" onClick={closeDrawer}>Close</Btn>}
    >
      <KV items={[
        ["Reason", r.reason],
        ["Condition", <Pill tone={r.condition === "Sellable" ? "ok" : "bad"}>{r.condition}</Pill>],
        ["Resolution", r.resolution === "Exchange" && r.exchangeSku ? "Exchange for size " + sizeOfSku(r.exchangeSku) : "Refund " + eur(r.refund)],
        ["Status", r.status],
        ["Restock", <Pill tone={pending ? "warn" : r.restock === "Restocked" ? "ok" : "outline"}>{r.restock}</Pill>],
        ["Size related", r.sizeRelated ? "Yes" : "No"],
      ]} />

      <Section title="Restock decision">
        <Note tone={pending ? "warn" : ""}>{pending ? effect : "Decision recorded. " + effect}</Note>
        {r.resolution === "Exchange" && r.exchangeSku && (
          <div style={{ marginTop: 8 }}>
            <Note>
              The replacement {sizeOfSku(r.exchangeSku)} leaves stock ({exch ? num(exch.available) + " available now" : ""}). An exchange is not a second sale, so online sales and revenue are unchanged.
            </Note>
          </div>
        )}
      </Section>

      {row && (
        <Section title="Variant now">
          <KV items={[["On hand", num(row.onHand)], ["Unavailable", num(row.unavailable)], ["Available", num(row.available)]]} />
          <div style={{ marginTop: 8 }}><RecLink link={{ kind: "variant", id: r.sku }}>Open {r.sku}</RecLink></div>
        </Section>
      )}

      {r.sizeRelated && (
        <Section title="Signal">
          <div className="jz-dim" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
            Size-related returns are counted per product and passed to forecasting and reporting. Repeated "too small" returns suggest the range runs small.
          </div>
        </Section>
      )}
    </Drawer>
  );
}
