import { Drawer, Section, KV, Pill, Btn, Note, RecLink, Table, VariantName, Swatch, type Col } from "../ui";
import {
  useJodz, closeDrawer, openDrawer, confirmOrder, reserveStock, proposePartialDispatch, setPromiseDate, dispatchOrder,
  availableFor, addDays, type JodzState,
} from "../store";
import { orderRow, eur, num, fmtDate, staff, productOfSku, sizeOfSku, incomingFor, invoiceStatus, invoiceBalance } from "../derive";
import type { OrderLine, Stage } from "../data";

const STAGES: Stage[] = ["Draft", "Confirmed", "Allocated", "Dispatched", "Complete"];

function StageSequence({ stage }: { stage: Stage }) {
  const at = STAGES.indexOf(stage);
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`, gap: 4 }}>
      {STAGES.map((st, i) => {
        const done = i < at, cur = i === at;
        return (
          <div key={st}>
            <div style={{ height: 4, borderRadius: 99, background: done || cur ? "var(--accent)" : "var(--track)", opacity: done ? 0.55 : 1 }} />
            <div style={{ marginTop: 7, fontSize: 11.5, color: cur ? "var(--ink)" : done ? "var(--dim)" : "var(--faint)", fontWeight: cur ? 600 : 400 }}>{st}</div>
          </div>
        );
      })}
    </div>
  );
}

/** Colours down, sizes across; each cell shows allocated of requested. */
function QtyGrid({ lines }: { lines: OrderLine[] }) {
  const groups = new Map<string, OrderLine[]>();
  for (const l of lines) {
    const p = productOfSku(l.sku);
    groups.set(p.id, [...(groups.get(p.id) || []), l]);
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[...groups.entries()].map(([pid, ls]) => {
        const p = productOfSku(ls[0].sku);
        return (
          <div key={pid} style={{ display: "grid", gridTemplateColumns: `150px repeat(${p.sizes.length}, 1fr)`, gap: 4, alignItems: "center" }}>
            <span style={{ fontSize: 12.5, display: "flex", alignItems: "center", gap: 7 }}><Swatch productId={pid} /> {p.name}</span>
            {p.sizes.map((sz) => {
              const l = ls.find((x) => sizeOfSku(x.sku) === sz);
              if (!l) return <div key={sz} className="jz-cell mute" style={{ height: 42, cursor: "default" }}>·<small>{sz}</small></div>;
              const short = l.qty - l.allocated;
              return (
                <div key={sz} className={"jz-cell" + (short > 0 ? " warn" : "")} style={{ height: 42 }} onClick={() => openDrawer("variant", l.sku)} title={`${p.name} ${sz}: ${l.allocated} allocated of ${l.qty} requested`}>
                  <span>{l.allocated}/{l.qty}</span>
                  <small>{sz}</small>
                </div>
              );
            })}
          </div>
        );
      })}
      <div className="jz-faint" style={{ fontSize: 11.5 }}>Allocated / requested units per size. Amber cells are short.</div>
    </div>
  );
}

interface LineRow { l: OrderLine; avail: number; incoming: { id: string; qty: number; date: string } | null }

export default function OrderDrawer({ id }: { id: string }) {
  const s: JodzState = useJodz();
  const o = s.orders.find((x) => x.id === id);
  if (!o) return <Drawer title={id} onClose={closeDrawer}><Note>Order not found.</Note></Drawer>;
  const r = orderRow(s, o);
  const draft = o.stage === "Draft";
  const active = !draft && o.stage !== "Complete";
  const toDispatch = r.allocated - r.dispatched;
  const pendingPartial = s.approvals.find((a) => a.kind === "Partial dispatch" && a.link.id === id && a.status === "Awaiting approval");
  const canReserve = active && o.lines.some((l) => l.qty > l.allocated && availableFor(s, l.sku) > 0);

  const po187 = s.pos.find((p) => p.id === "PO-0187");
  const lineRows: LineRow[] = o.lines.map((l) => {
    const inc = incomingFor(s, l.sku)[0];
    return { l, avail: availableFor(s, l.sku), incoming: inc ? { id: inc.po.id, qty: inc.qty, date: inc.date } : null };
  });
  const shortLines = lineRows.filter((x) => x.l.qty > x.l.allocated);
  const latestArrival = shortLines.map((x) => x.incoming?.date).filter((d): d is string => !!d).sort().pop() || po187?.expected;
  const newDate = latestArrival ? addDays(latestArrival, 3) : addDays(o.requestedDispatch, 14);

  const cols: Col<LineRow>[] = [
    { key: "v", label: "Variant", render: (x) => <VariantName sku={x.l.sku} /> },
    { key: "q", label: "Requested", right: true, num: true, render: (x) => x.l.qty },
    { key: "a", label: "Allocated", right: true, num: true, render: (x) => x.l.allocated },
    { key: "d", label: "Dispatched", right: true, num: true, render: (x) => x.l.dispatched },
    { key: "s", label: "Short", right: true, num: true, render: (x) => (x.l.qty - x.l.allocated > 0 && !draft ? <span className="jz-warn">{x.l.qty - x.l.allocated}</span> : <span className="jz-faint">0</span>) },
    { key: "av", label: "Available now", right: true, num: true, render: (x) => <span className={x.avail <= 0 ? "jz-bad" : ""}>{x.avail}</span> },
    { key: "in", label: "Incoming", render: (x) => (x.incoming ? <span style={{ fontSize: 12 }}><RecLink link={{ kind: "po", id: x.incoming.id }} /> <span className="jz-dim">{x.incoming.qty} on {fmtDate(x.incoming.date)}</span></span> : <span className="jz-faint">None</span>) },
  ];

  const foot = (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: "100%" }}>
      {draft && <Btn kind="primary" onClick={() => confirmOrder(id)}>Confirm order</Btn>}
      {active && r.unallocated > 0 && (
        <Btn kind={canReserve ? "primary" : ""} onClick={() => reserveStock(id)} disabled={!canReserve} title={canReserve ? "Reserve available stock against unallocated lines" : "No available stock for the short lines"}>
          Reserve stock
        </Btn>
      )}
      {active && r.unallocated > 0 && toDispatch > 0 && (
        <Btn onClick={() => proposePartialDispatch(id)} disabled={!!pendingPartial} title={pendingPartial ? "Already awaiting approval" : undefined}>
          {pendingPartial ? "Partial dispatch awaiting approval" : "Propose partial dispatch"}
        </Btn>
      )}
      {active && r.short > 0 && (
        <Btn onClick={() => setPromiseDate(id, newDate)} disabled={o.promiseDate === newDate}>
          {o.promiseDate === newDate ? "Date proposed: " + fmtDate(newDate) : "Propose new date: " + fmtDate(newDate)}
        </Btn>
      )}
      {active && r.unallocated === 0 && toDispatch > 0 && (
        <Btn kind="primary" onClick={() => dispatchOrder(id)}>Mark simulated dispatch complete</Btn>
      )}
      {o.stage === "Complete" && <span className="jz-dim" style={{ fontSize: 12.5, alignSelf: "center" }}>Fully dispatched. Payment is tracked on the invoice.</span>}
    </div>
  );

  return (
    <Drawer
      wide
      eyebrow="Wholesale order"
      title={<span className="jz-mono">{o.id}</span>}
      sub={
        <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button className="jz-link" onClick={() => openDrawer("retailer", o.retailerId)}>{r.retailerName}</button>
          <span>{num(r.units)} units · {eur(r.value)} ex tax</span>
          {r.flags.map((f) => <Pill key={f} tone={f === "Payment hold" ? "bad" : "warn"}>{f}</Pill>)}
        </span>
      }
      onClose={closeDrawer}
      foot={foot}
    >
      <Section title="Stage">
        <StageSequence stage={o.stage} />
        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          <Pill>Allocation: {r.allocation}</Pill>
          <Pill>Fulfilment: {r.fulfilment}</Pill>
          <Pill tone={r.payment === "Overdue" ? "bad" : r.payment === "Paid" ? "ok" : "outline"}>Payment: {r.payment}</Pill>
        </div>
      </Section>

      <Section title="Terms">
        <KV items={[
          ["Agreed trade price", o.lines.some((l) => l.price !== undefined && l.price !== o.price) ? "Per line, see below" : eur(o.price) + " per unit ex tax"],
          ["Requested dispatch", fmtDate(o.requestedDispatch)],
          ["Proposed dispatch", o.promiseDate ? fmtDate(o.promiseDate) + " (not yet agreed)" : "None"],
          ["Owner", staff(o.owner).name],
          ["Created", fmtDate(o.created)],
          ["Open value", r.isOpen ? eur(r.openValue) : draft ? "Draft, not revenue" : eur(0)],
        ]} />
      </Section>

      {draft && <Note>Draft orders do not reserve stock and are not counted as revenue. Confirm the order to allocate stock.</Note>}

      {!draft && r.unallocated > 0 && (
        <Note tone={r.short > 0 ? "warn" : ""}>
          {num(r.allocated)} allocated, {num(r.unallocated)} unallocated{r.short > 0 ? ", " + num(r.short) + " of them cannot be covered from stock today" : ", and available stock covers them"}.{" "}
          {shortLines.map((x) => `${productOfSku(x.l.sku).name} ${sizeOfSku(x.l.sku)}: ${x.l.qty} requested, ${x.l.allocated} allocated, ${x.l.qty - x.l.allocated} unallocated.`).join(" ")}{" "}
          {shortLines.some((x) => x.incoming)
            ? shortLines.filter((x) => x.incoming).map((x) => `${x.incoming!.id} brings ${x.incoming!.qty} ${variantShort(x.l.sku)} on ${fmtDate(x.incoming!.date)}.`).join(" ")
            : "No confirmed delivery covers the gap."}
        </Note>
      )}

      {pendingPartial && <Note>Partial dispatch {pendingPartial.id} is awaiting approval. Nothing ships until it is approved.</Note>}

      <Section title="Size and colour grid">
        <QtyGrid lines={o.lines} />
      </Section>

      <Section title="Stock allocation per line">
        <Table<LineRow> cols={cols} rows={lineRows} rowKey={(x) => x.l.sku} onRow={(x) => openDrawer("variant", x.l.sku)} />
      </Section>

      <Section title="Dispatch history">
        {o.dispatches.length === 0 ? (
          <div className="jz-faint" style={{ fontSize: 12.5 }}>Nothing dispatched yet.</div>
        ) : (
          <div className="jz-list">
            {o.dispatches.map((d, i) => (
              <div key={i}>
                <span className="jz-mono" style={{ width: 60 }}>{fmtDate(d.date)}</span>
                <span style={{ flex: 1 }}>{d.note}</span>
                <b className="jz-mono">{num(d.units)} units</b>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Invoices">
        {r.invoices.length === 0 ? (
          <div className="jz-faint" style={{ fontSize: 12.5 }}>No invoice yet. An invoice is raised for what ships, on dispatch.</div>
        ) : (
          <div className="jz-list">
            {r.invoices.map((i) => {
              const st = invoiceStatus(i);
              return (
                <div key={i.id}>
                  <RecLink link={{ kind: "invoice", id: i.id }} />
                  <span className="jz-dim" style={{ flex: 1 }}>Issued {fmtDate(i.issued)}, due {fmtDate(i.due)}</span>
                  <span className="jz-mono">{eur(i.net + i.tax)}</span>
                  <Pill tone={st === "Paid" ? "ok" : st === "Overdue" ? "bad" : "warn"}>{st === "Paid" ? "Paid" : st + " · " + eur(invoiceBalance(i)) + " open"}</Pill>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Section title="Notes">
        {o.notes.length === 0 ? <div className="jz-faint" style={{ fontSize: 12.5 }}>No notes.</div> : (
          <div className="jz-list">{o.notes.map((n, i) => <div key={i} className="jz-dim">{n}</div>)}</div>
        )}
      </Section>

      <div className="jz-faint" style={{ fontSize: 11.5 }}>Demo records only. Dispatches are simulated and nothing is sent to the retailer.</div>
    </Drawer>
  );
}

function variantShort(sku: string) {
  return productOfSku(sku).name + " " + sizeOfSku(sku);
}
