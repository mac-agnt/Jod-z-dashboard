import { useJodz, closeDrawer, openRecord } from "../store";
import { eur, num, pct, variantRows } from "../derive";
import { Drawer, KV, Section, Note, Pill, VariantName } from "../ui";
import { campaignRows, signalRows } from "../marketing";
import { ChangeActions } from "../pages/Advertising";

export default function CampaignDrawer({ id }: { id: string }) {
  const s = useJodz();
  const c = campaignRows(s).find((r) => r.id === id);
  if (!c) return null;
  const vr = variantRows(s).filter((r) => (c.skus && c.skus.length ? c.skus.includes(r.sku) : c.products.includes(r.p.id) && r.rate > 0 && (r.cover === null || r.cover < 30)));
  const sigs = signalRows(s).filter((x) => x.products.some((p) => c.products.includes(p)) && x.status !== "Dismissed").slice(0, 3);
  return (
    <Drawer wide eyebrow={c.platform + " · " + c.type} title={c.name} sub={c.note} onClose={closeDrawer}>
      <KV items={[
        ["Status", <Pill tone={c.status === "Live" ? "ok" : "outline"}>{c.status === "Live" ? "Live" : "Draft, not live"}</Pill>],
        ["Budget", eur(c.budgetDay) + " a day"], ["Spend, 30 days", eur(c.spend)], ["Impressions", num(c.impressions)],
        ...(c.reach ? [["Reach · frequency", num(c.reach) + " · " + (c.frequency || 0).toFixed(1)] as [string, string]] : []),
        ["Clicks · CTR", num(c.clicks) + " · " + (c.impressions ? pct(c.ctr, 2) : "-")], ["CPC", c.clicks ? eur(c.cpc, 2) : "-"],
        ["Reported", c.conv + " · " + eur(c.value)], ["Reported ROAS", c.spend ? c.roas.toFixed(1) + "×" : "-"],
      ]} />
      <Section title="Stock behind this campaign">
        {vr.length ? (
          <div className="jz-list">
            {vr.slice(0, 8).map((r) => (
              <div key={r.sku} style={{ cursor: "pointer" }} onClick={() => openRecord({ kind: "variant", id: r.sku })}>
                <span style={{ flex: 1 }}><VariantName sku={r.sku} /></span>
                <span className="jz-mono">{r.available} available</span>
                <Pill tone={r.cover !== null && r.cover < 7 ? "bad" : r.flags.includes("Overstock") ? "warn" : ""}>{r.cover === null ? "no recent sales" : Math.round(r.cover) + " days cover"}</Pill>
              </div>
            ))}
          </div>
        ) : <Note>All featured variants have at least 30 days of cover.</Note>}
      </Section>
      {c.change && (
        <Section title="Proposed change">
          <Note tone="warn"><b>{c.change.title}</b><br />{c.change.detail}<br /><span className="jz-dim">{c.change.why}</span></Note>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 10 }}><ChangeActions id={c.change.id} /></div>
        </Section>
      )}
      {sigs.length > 0 && (
        <Section title="Related trends">
          <div className="jz-list">
            {sigs.map((x) => <div key={x.id} style={{ cursor: "pointer" }} onClick={() => openRecord({ kind: "signal", id: x.id })}><span style={{ flex: 1 }}>{x.title}</span><span className="jz-mono">{x.change}</span></div>)}
          </div>
        </Section>
      )}
      <Note>{c.platform} is a demo connection with simulated data. Nothing here changes a live campaign or budget.</Note>
    </Drawer>
  );
}
