import { useState } from "react";
import { Drawer, Section, Btn, Note, Swatch } from "../ui";
import { useJodz, createOrder, openDrawer, availableFor, addDays, tradeOf } from "../store";
import { eur, num, retailer } from "../derive";
import { PRODUCTS, RETAILERS, SNAPSHOT, skuOf } from "../data";


export default function NewOrderDrawer({ onClose }: { onClose: () => void }) {
  const s = useJodz();
  const [retailerId, setRetailerId] = useState(RETAILERS[0].id);
  const [date, setDate] = useState(addDays(SNAPSHOT, 14));
  const [qty, setQty] = useState<Record<string, number>>({});

  const lines = Object.entries(qty).filter(([, q]) => q > 0).map(([sku, q]) => ({ sku, qty: q }));
  const units = lines.reduce((a, l) => a + l.qty, 0);
  const value = lines.reduce((a, l) => a + l.qty * tradeOf(l.sku), 0);
  const overAvail = lines.filter((l) => l.qty > availableFor(s, l.sku)).length;
  const r = retailer(retailerId);

  const save = () => {
    const id = createOrder(retailerId, lines, date, r.owner);
    onClose();
    openDrawer("order", id);
  };

  return (
    <Drawer
      wide
      eyebrow="Wholesale"
      title="New wholesale order"
      sub="Saved as a draft. Drafts do not reserve stock and are not revenue."
      onClose={onClose}
      foot={
        <div style={{ display: "flex", alignItems: "center", gap: 14, width: "100%" }}>
          <span style={{ flex: 1, fontSize: 13 }}>
            <b className="jz-mono">{num(units)}</b> <span className="jz-dim">units</span>
            <b className="jz-mono" style={{ marginLeft: 14 }}>{eur(value)}</b> <span className="jz-dim">ex tax at trade prices</span>
          </span>
          <Btn kind="ghost" onClick={onClose}>Cancel</Btn>
          <Btn kind="primary" onClick={save} disabled={units === 0 || !date}>Save as draft</Btn>
        </div>
      }
    >
      <Section title="Order details">
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--dim)" }}>
            Retailer
            <select className="jz-select" value={retailerId} onChange={(e) => setRetailerId(e.target.value)}>
              {RETAILERS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--dim)" }}>
            Requested dispatch
            <input className="jz-input" type="date" value={date} min={SNAPSHOT} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>
        <div className="jz-faint" style={{ fontSize: 11.5, marginTop: 8 }}>Usual mix for this account: {r.typicalMix}. Terms {r.terms} days.</div>
      </Section>

      <Section title="Quantities by colour and size">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {PRODUCTS.map((p) => (
            <div key={p.id} style={{ display: "grid", gridTemplateColumns: `170px repeat(${p.sizes.length}, 1fr)`, gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 12.5, display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                <Swatch productId={p.id} />
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
              </span>
              {p.sizes.map((sz) => {
                const sku = skuOf(p.id, sz);
                const avail = availableFor(s, sku);
                const q = qty[sku] || 0;
                return (
                  <div key={sz} style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: 2 }}>
                    <input
                      className="jz-input jz-num-input"
                      style={{ width: "100%", height: 30, borderColor: q > avail ? "var(--warn)" : undefined }}
                      type="number"
                      min={0}
                      step={1}
                      aria-label={`${p.name} ${sz} quantity`}
                      placeholder={sz}
                      value={q || ""}
                      onChange={(e) => {
                        const n = Math.max(0, Math.floor(Number(e.target.value) || 0));
                        setQty((prev) => ({ ...prev, [sku]: n }));
                      }}
                    />
                    <span className="jz-mono" style={{ fontSize: 10, textAlign: "center", color: avail <= 0 ? "var(--bad)" : "var(--faint)" }}>
                      {sz} · {avail} free
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Section>

      {overAvail > 0 && (
        <Note tone="warn">{overAvail} line{overAvail > 1 ? "s ask" : " asks"} for more than is available now. You can still save the draft; the shortage shows when the order is confirmed and stock is reserved.</Note>
      )}
      <Note>Lines are saved at the agreed trade price: {eur(tradeOf("JZ-AN-S"))} for Young Rider leggings, {eur(tradeOf("JZ-MON-S"))} for Jockeys breeches (demo prices). Nothing is sent to the retailer.</Note>
    </Drawer>
  );
}
