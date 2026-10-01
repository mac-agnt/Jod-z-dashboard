import { Drawer, KV, Note, Btn, Pill, RecLink, Section, LineChart, Legend, Table, VariantName } from "../ui";
import { useJodz, closeDrawer, setClearanceReview, openRecord, daysBetween } from "../store";
import { variantRows, incomingFor, orderRows, projection, demandUnits, confidence, sizeAge, eur, num, fmtDate } from "../derive";
import { SNAPSHOT } from "../data";
import { coverText, flagTone } from "../pages/Inventory";

export default function VariantDrawer({ id }: { id: string }) {
  const s = useJodz();
  const r = variantRows(s).find((x) => x.sku === id);
  if (!r) return null;
  const age = sizeAge(r.size, r.p.id);
  const moves = s.movements.filter((m) => m.sku === id).sort((a, b) => b.date.localeCompare(a.date));
  const related = orderRows(s).filter((o) => o.o.lines.some((l) => l.sku === id));
  const holding = related
    .filter((o) => o.o.stage !== "Draft" && o.o.stage !== "Complete")
    .map((o) => ({ o, line: o.o.lines.find((l) => l.sku === id)! }))
    .filter((x) => x.line.allocated - x.line.dispatched > 0 || x.line.qty > x.line.allocated);
  const committed = incomingFor(s, id);
  const draft = incomingFor(s, id, true).filter((x) => x.po.status === "Draft");
  const proj = projection(s, id, 60);
  const conf = confidence(r.v);
  const d30 = demandUnits(s, r.v, 30), d60 = demandUnits(s, r.v, 60), d90 = demandUnits(s, r.v, 90);
  const arrival = proj.nextArrival;
  const gapDays = proj.stockoutDate && arrival && proj.stockoutDate < arrival.date ? daysBetween(proj.stockoutDate, arrival.date) : null;
  const stockoutIdx = proj.stockoutDate ? daysBetween(SNAPSHOT, proj.stockoutDate) : -1;
  const isOver = r.flags.includes("Overstock");

  return (
    <Drawer
      wide
      eyebrow={"Variant · " + r.sku}
      title={<VariantName sku={r.sku} />}
      sub={r.p.family + " · " + r.p.colour + (age ? " · size " + r.size + " fits " + age : "") + " · cost " + eur(r.p.cost) + " a unit"}
      onClose={closeDrawer}
      foot={
        <>
          <Btn onClick={() => openRecord({ kind: "po", id: "PO-D193" })}>Open buying plan (PO-D193)</Btn>
          <span style={{ flex: 1 }} />
          <Btn kind="ghost" onClick={closeDrawer}>Close</Btn>
        </>
      }
    >
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {r.flags.length ? r.flags.map((f) => <Pill key={f} tone={flagTone(f)}>{f}</Pill>) : <Pill tone="ok">Healthy</Pill>}
      </div>

      <Section title="Stock position">
        <KV items={[
          ["On hand", num(r.onHand)], ["Reserved", num(r.reserved)], ["Unavailable", num(r.unavailable)],
          ["Available now", <span className={r.available <= 0 ? "jz-bad" : ""}>{num(r.available)}</span>],
          ["Days of cover", coverText(r.cover)], ["Value at cost", eur(r.valueAtCost)],
        ]} />
        <div className="jz-mono jz-dim" style={{ fontSize: 12, marginTop: 10 }}>
          Available = on hand {r.onHand} − reserved {r.reserved} − unavailable {r.unavailable} = {r.available}
        </div>
      </Section>

      {isOver && (
        <Section title="Recommendation">
          <Note tone="warn">
            {num(r.available)} available, {r.s28} sold in 28 days, {eur(r.valueAtCost)} held at cost. Pause replenishment and review a targeted clearance on size {r.size} only (not the whole range). Other sizes of {r.name} are selling normally.
          </Note>
          <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
            {s.clearanceReview ? (
              <><Pill tone="ok">Draft prepared</Pill><span className="jz-dim" style={{ fontSize: 12.5 }}>Clearance option drafted for size {r.size} only. No prices changed.</span></>
            ) : (
              <Btn kind="primary" onClick={() => setClearanceReview(true)}>Draft clearance option</Btn>
            )}
          </div>
        </Section>
      )}

      <Section title="Usable stock, next 60 days">
        <LineChart
          height={180}
          labels={proj.pts.map((p) => fmtDate(p.date))}
          series={[{ name: "Usable stock", color: "var(--accent)", values: proj.pts.map((p) => Math.round(p.stock)), area: true }]}
          fmt={(n) => num(Math.round(n))}
          yMin={0}
          marker={stockoutIdx >= 0 && stockoutIdx <= 60 ? { index: stockoutIdx, label: "Runs out " + fmtDate(proj.stockoutDate!) } : undefined}
        />
        <div style={{ marginTop: 8 }}><Legend items={[{ name: "Available now plus committed arrivals, less forecast online demand", color: "var(--accent)" }]} /></div>
        <div style={{ marginTop: 10 }}>
          {proj.stockoutDate && gapDays !== null && arrival ? (
            <Note tone="bad">
              Projected to run out around {fmtDate(proj.stockoutDate)}. The next delivery ({num(arrival.qty)} units on {arrival.po.id}) is due {fmtDate(arrival.date)}, so there is a gap of about {gapDays} days with nothing to sell. Around {num(proj.unmet)} units of demand in the next 60 days would go unmet. The delivery refills stock but does not prevent the stockout.
            </Note>
          ) : proj.stockoutDate ? (
            <Note tone="bad">Projected to run out around {fmtDate(proj.stockoutDate)} with no committed delivery in the next 60 days. About {num(proj.unmet)} units of demand unmet.</Note>
          ) : (
            <Note tone="ok">Usable stock stays above zero for the next 60 days at the current rate.</Note>
          )}
        </div>
      </Section>

      <Section title="Forecast demand (online)">
        <KV items={[
          ["Rate", r.rate.toFixed(1) + " a day"],
          ["Next 30 days", num(Math.round(d30))], ["Next 60 days", num(Math.round(d60))], ["Next 90 days", num(Math.round(d90))],
          ["Confidence", <Pill tone={conf.label === "High" ? "ok" : conf.label === "Medium" ? "warn" : "bad"}>{conf.label}</Pill>],
        ]} />
        <div className="jz-faint" style={{ fontSize: 11.5, marginTop: 8 }}>
          {conf.why}. Rate uses {r.s28} units over {28 - r.v.stockoutDays} days with stock. November and December include the seasonal uplift in the assumptions. Wholesale reorders are forecast separately.
        </div>
      </Section>

      <Section title="Reservations and wholesale orders">
        {related.length === 0 ? <div className="jz-faint" style={{ fontSize: 12.5 }}>No wholesale orders include this variant</div> : (
          <Table
            rows={related}
            rowKey={(o) => o.o.id}
            cols={[
              { key: "id", label: "Order", render: (o) => <RecLink link={{ kind: "order", id: o.o.id }} /> },
              { key: "ret", label: "Retailer", render: (o) => o.retailerName },
              { key: "stage", label: "Stage", render: (o) => <Pill tone={o.o.stage === "Complete" ? "outline" : "accent"}>{o.o.stage}</Pill> },
              { key: "q", label: "Ordered", right: true, num: true, render: (o) => o.o.lines.find((l) => l.sku === id)!.qty },
              { key: "h", label: "Reserved", right: true, num: true, render: (o) => { const l = o.o.lines.find((x) => x.sku === id)!; return o.o.stage === "Complete" ? <span className="jz-faint">0</span> : l.allocated - l.dispatched; } },
              { key: "sh", label: "Short", right: true, num: true, render: (o) => { const l = o.o.lines.find((x) => x.sku === id)!; const sh = o.o.stage === "Draft" ? 0 : l.qty - l.allocated; return sh > 0 ? <span className="jz-bad">{sh}</span> : <span className="jz-faint">0</span>; } },
              { key: "d", label: "Dispatch", render: (o) => (o.o.stage === "Complete" ? "Done " + fmtDate(o.o.completed || o.o.requestedDispatch) : "Requested " + fmtDate(o.o.requestedDispatch)) },
            ]}
          />
        )}
        {holding.length > 0 && (
          <div className="jz-dim" style={{ fontSize: 12, marginTop: 8 }}>
            {num(r.reserved)} units are held for {holding.map((h) => h.o.o.id).join(", ")}. Reserved units cannot be sold online.
          </div>
        )}
      </Section>

      <Section title="Incoming deliveries">
        {committed.length === 0 && draft.length === 0 && <div className="jz-faint" style={{ fontSize: 12.5 }}>Nothing on order for this variant</div>}
        <div className="jz-list">
          {committed.map((x) => (
            <div key={x.po.id}>
              <RecLink link={{ kind: "po", id: x.po.id }} />
              <span style={{ flex: 1 }} className="jz-dim">Due {fmtDate(x.date)}</span>
              <span className="jz-mono">{num(x.qty)} units</span>
              <Pill tone="ok">{x.po.status}</Pill>
            </div>
          ))}
          {draft.map((x) => (
            <div key={x.po.id}>
              <RecLink link={{ kind: "po", id: x.po.id }} />
              <span style={{ flex: 1 }} className="jz-dim">Draft recommendation, would land {fmtDate(x.date)}. Not counted as incoming.</span>
              <span className="jz-mono">{num(x.qty)} units</span>
              <Pill tone="warn">Draft</Pill>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Stock movements">
        {moves.length === 0 ? <div className="jz-faint" style={{ fontSize: 12.5 }}>No movements recorded in the demo period</div> : (
          <div className="jz-list">
            {moves.map((m) => (
              <div key={m.id}>
                <span className="jz-mono jz-faint" style={{ width: 52, fontSize: 11.5 }}>{fmtDate(m.date)}</span>
                <span style={{ flex: 1 }}>{m.kind}<span className="jz-faint" style={{ marginLeft: 6, fontSize: 11.5 }}>{m.note}</span></span>
                <span className="jz-mono jz-dim" style={{ fontSize: 11.5 }}>{m.ref}</span>
                <span className={"jz-mono " + (m.qty < 0 ? "jz-bad" : "jz-ok")} style={{ width: 44, textAlign: "right" }}>{m.qty > 0 ? "+" : ""}{m.qty}</span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </Drawer>
  );
}
