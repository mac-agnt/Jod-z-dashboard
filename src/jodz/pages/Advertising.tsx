import { useJodz, openDrawer, openRecord, goTo } from "../store";
import { eur, num, pct, fmtDate } from "../derive";
import { Page, Card, Figures, Table, Pill, Btn, DemoBadge, Bars, LineChart, Legend, Meter, Note, type Col } from "../ui";
import {
  adsSummary, adsDaily, budgetPacing, plannedAdSpend, campaignRows, adAlerts, platformTotals, CREATIVES, SEARCH_TERMS, AD_CHANGES,
  adChangeStatus, draftAdChange, approveAdChange, withdrawAdChange, type CampaignRow, type Platform,
} from "../marketing";

const x = (n: number) => n.toFixed(1) + "×";

export function ChangeActions({ id }: { id: string }) {
  const s = useJodz();
  const st = adChangeStatus(s, id);
  if (st === "approved") return (<><Pill tone="ok">Approved in demo, not sent</Pill><Btn sm kind="ghost" onClick={() => withdrawAdChange(id)}>Withdraw</Btn></>);
  if (st === "drafted") return (<><Pill tone="warn">Draft prepared</Pill><Btn sm kind="primary" onClick={() => approveAdChange(id)}>Approve in demo</Btn><Btn sm kind="ghost" onClick={() => withdrawAdChange(id)}>Withdraw</Btn></>);
  return <Btn sm onClick={() => draftAdChange(id)}>Draft change</Btn>;
}

function campaignCols(google: boolean): Col<CampaignRow>[] {
  return [
    { key: "n", label: "Campaign", strong: true, render: (c) => <span>{c.name}{c.status === "Draft" && <> <Pill tone="outline">Draft, not live</Pill></>}</span> },
    { key: "t", label: "Type", render: (c) => c.type },
    { key: "b", label: "€/day", right: true, num: true, render: (c) => eur(c.budgetDay) },
    { key: "s", label: "Spend", right: true, num: true, render: (c) => eur(c.spend) },
    { key: "c", label: "Clicks", right: true, num: true, render: (c) => num(c.clicks) },
    { key: "ctr", label: "CTR", right: true, num: true, render: (c) => (c.impressions ? pct(c.ctr, 2) : "-") },
    google
      ? { key: "is", label: "Impr. share", right: true, num: true, render: (c) => (c.impressionShare ? c.impressionShare + "%" : "-") }
      : { key: "f", label: "Frequency", right: true, num: true, render: (c) => (c.frequency ? c.frequency.toFixed(1) : "-") },
    { key: "v", label: "Reported", right: true, num: true, render: (c) => (c.conv ? c.conv + " · " + eur(c.value) : "-") },
    { key: "r", label: "ROAS", right: true, num: true, render: (c) => (c.spend ? x(c.roas) : "-") },
    { key: "st", label: "Stock", render: (c) => <Pill tone={c.stock.tone === "ok" ? "" : c.stock.tone}>{c.stock.label}</Pill> },
    { key: "fl", label: "Flags", render: (c) => c.flags.map((f) => <Pill key={f} tone={f === "Spending on low stock" ? "bad" : "warn"}>{f}</Pill>) },
  ];
}

function Overview() {
  const s = useJodz();
  const a = adsSummary(s);
  const d = adsDaily();
  const pace = budgetPacing();
  const plan = plannedAdSpend(s);
  const alerts = adAlerts(s);
  const labels = d.map((r) => fmtDate(r.date));
  const tot = a.attributed.Meta.revenue + a.attributed.Google.revenue + a.attributed.Organic.revenue;
  return (
    <>
      <Figures items={[
        { label: "Ad spend, 30 days", value: eur(a.all.spend), sub: "Meta " + eur(a.meta.spend) + " · Google " + eur(a.google.spend), tone: "hero" },
        { label: "Total return", value: x(a.mer), sub: eur(a.online) + " online revenue", tip: "Shopify online revenue ÷ total ad spend. The honest measure, because both platforms claim some of the same sales." },
        { label: "Cost per paid order", value: eur(a.costPerPaidOrder, 2), sub: a.paidOrders + " orders credited to ads by Shopify" },
        { label: "Platforms claim", value: eur(a.claimed), sub: "Shopify credits " + eur(a.claimed - a.overClaim), tip: "Meta and Google each count sales they touched. Together they claim " + eur(a.overClaim) + " more than Shopify credits to them." },
        { label: "Ad spend share", value: pct(a.adShareOfRevenue), sub: "of online revenue" },
      ]} />
      <div className="jz-grid" style={{ gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr)" }}>
        <Card title="Needs a decision" sub="Checked against live stock and the cash outlook">
          <div className="jz-list">
            {alerts.map((al) => (
              <div key={al.id} style={{ alignItems: "flex-start", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", width: "100%" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 3, background: `var(--${al.tone === "ok" ? "ok" : al.tone})` }} />
                  <b style={{ flex: 1, fontWeight: 600 }}>{al.title}</b>
                  {al.link && <Btn sm kind="ghost" onClick={() => openRecord(al.link!)}>Open</Btn>}
                </div>
                <span className="jz-dim">{al.detail}</span>
                {al.changeId && <div style={{ display: "flex", gap: 6, alignItems: "center" }}><span className="jz-faint" style={{ fontSize: 12 }}>{AD_CHANGES.find((c) => c.id === al.changeId)?.title}</span><ChangeActions id={al.changeId} /></div>}
              </div>
            ))}
          </div>
        </Card>
        <div className="jz-grid">
          <Card title="Meta vs Google" sub="Platform-reported vs Shopify-credited return">
            <Table rowKey={(r) => r.p} rows={[{ p: "Meta" as Platform, t: a.meta }, { p: "Google" as Platform, t: a.google }]} cols={[
              { key: "p", label: "", strong: true, render: (r) => r.p },
              { key: "s", label: "Spend", right: true, num: true, render: (r) => eur(r.t.spend) },
              { key: "c", label: "CPC", right: true, num: true, render: (r) => eur(r.t.cpc, 2) },
              { key: "r", label: "Reported", right: true, num: true, render: (r) => x(r.t.roas) },
              { key: "sh", label: "Shopify", right: true, num: true, render: (r) => <b>{x(a.shopifyRoas[r.p])}</b> },
            ]} />
          </Card>
          <Card title={"Budget pacing, " + pace.month} sub={"Day " + pace.dayOfMonth + " of " + pace.daysInMonth}>
            {(["Meta", "Google"] as const).map((p) => (
              <div key={p} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", fontSize: 12.5, marginBottom: 5 }}><b style={{ flex: 1 }}>{p}</b><span className="jz-mono">{eur(pace[p].mtd)} of {eur(pace[p].budget)}</span></div>
                <Meter value={pace[p].mtd} max={pace[p].budget} tone={pace[p].projected > pace[p].budget ? "warn" : "accent"} />
                <div className="jz-faint" style={{ fontSize: 11.5, marginTop: 4 }}>Projected month end {eur(pace[p].projected)}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
      <Card title="Daily spend and what it brought in" sub="Spend by platform, and Shopify-credited revenue" right={<Legend items={[{ name: "Meta", color: "var(--ink)" }, { name: "Google", color: "var(--faint)" }]} />}>
        <Bars labels={labels} stacks={[{ name: "Meta", color: "var(--ink)", values: d.map((r) => r.metaSpend) }, { name: "Google", color: "var(--faint)", values: d.map((r) => r.googleSpend) }]} height={130} />
        <div style={{ marginTop: 18 }}>
          <LineChart labels={labels} height={170} series={[
            { name: "Online revenue", color: "var(--ink)", values: d.map((r) => r.online) },
            { name: "Credited to Google", color: "var(--warn)", values: d.map((r) => r.googleRev) },
            { name: "Credited to Meta", color: "var(--ok)", values: d.map((r) => r.metaRev) },
          ]} />
        </div>
      </Card>
      <div className="jz-grid" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
        <Card title="Where the 300 online orders came from" sub="Shopify last click. Platforms claim 249 between them.">
          <div style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden", margin: "6px 0 12px" }}>
            {[["Meta", a.attributed.Meta, "var(--ink)"], ["Google", a.attributed.Google, "var(--mid)"], ["Organic", a.attributed.Organic, "var(--track)"]].map(([k, v, c]) => (
              <span key={k as string} style={{ width: ((v as { revenue: number }).revenue / tot) * 100 + "%", background: c as string }} />
            ))}
          </div>
          <div className="jz-list">
            {[a.attributed.Meta, a.attributed.Google, a.attributed.Organic].map((r) => (
              <div key={r.channel}><span style={{ flex: 1 }}>{r.channel}</span><span className="jz-mono">{r.orders} orders</span><b className="jz-mono" style={{ width: 70, textAlign: "right" }}>{eur(r.revenue)}</b></div>
            ))}
          </div>
        </Card>
        <Card title="Planned ad spend in the cash outlook">
          <div className="jz-list">
            {plan.map((p) => <div key={p.month}><span style={{ flex: 1 }}>{p.label}</span><b className="jz-mono">{eur(p.amount)}</b></div>)}
          </div>
          <Note>November includes two seasonal payments. Trimming them is one of the proposed changes above.</Note>
        </Card>
      </div>
    </>
  );
}

function PlatformPage({ p }: { p: Platform }) {
  const s = useJodz();
  const a = adsSummary(s);
  const t = platformTotals(p);
  const rows = campaignRows(s, p);
  const figs = p === "Meta"
    ? [
        { label: "Spend", value: eur(t.spend), tone: "hero" as const },
        { label: "Reach", value: num(t.reach), sub: "Frequency " + t.frequency.toFixed(1) },
        { label: "CTR", value: pct(t.ctr, 2), sub: num(t.clicks) + " clicks" },
        { label: "CPC · CPM", value: eur(t.cpc, 2), sub: "CPM " + eur(t.cpm, 2) },
        { label: "Reported ROAS", value: x(t.roas), sub: t.conv + " purchases claimed" },
        { label: "Shopify ROAS", value: x(a.shopifyRoas.Meta), sub: a.attributed.Meta.orders + " orders credited", tip: "Revenue Shopify credits to Meta on last click ÷ Meta spend." },
      ]
    : [
        { label: "Spend", value: eur(t.spend), tone: "hero" as const },
        { label: "Clicks", value: num(t.clicks), sub: pct(t.ctr, 2) + " CTR" },
        { label: "CPC", value: eur(t.cpc, 2) },
        { label: "Conversions", value: String(t.conv), sub: "58 from brand search" },
        { label: "Reported ROAS", value: x(t.roas) },
        { label: "Shopify ROAS", value: x(a.shopifyRoas.Google), sub: a.attributed.Google.orders + " orders credited" },
      ];
  return (
    <>
      <Figures items={figs} />
      <Card title="Campaigns" sub="Click a campaign for stock, changes and trends" pad={false}>
        <Table rowKey={(c) => c.id} rows={rows} cols={campaignCols(p === "Google")} onRow={(c) => openDrawer("campaign", c.id)} />
      </Card>
      {p === "Meta" ? (
        <Card title="Creatives" sub="What earns the click">
          <div className="jz-list">
            {CREATIVES.map((c) => {
              const ctr = c.clicks / c.impressions;
              return (
                <div key={c.id}>
                  <Pill tone="outline">{c.format}</Pill>
                  <span style={{ flex: 1 }}>{c.name}</span>
                  <span style={{ width: 140 }}><Meter value={ctr * 1000} max={25} /></span>
                  <span className="jz-mono" style={{ width: 60, textAlign: "right" }}>{pct(ctr, 1)}</span>
                  <span className="jz-mono jz-dim" style={{ width: 110, textAlign: "right" }}>{eur(c.spend / c.conv, 2)} / purchase</span>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <Card title="Search terms" sub="Brand terms find people already looking for Jod-Z. Judge Google on the rest." pad={false}>
          <Table rowKey={(r) => r.term} rows={SEARCH_TERMS} cols={[
            { key: "t", label: "Search term", strong: true, render: (r) => r.term },
            { key: "c", label: "Clicks", right: true, num: true, render: (r) => num(r.clicks) },
            { key: "cost", label: "Cost", right: true, num: true, render: (r) => eur(r.cost) },
            { key: "cv", label: "Conv.", right: true, num: true, render: (r) => r.conv },
            { key: "cpa", label: "Cost / conv.", right: true, num: true, render: (r) => eur(r.cost / Math.max(1, r.conv), 2) },
            { key: "tr", label: "Trend", render: (r) => {
              const sig = /navy/.test(r.term) ? "sig-navy" : /pink/.test(r.term) ? "sig-pink" : null;
              const arrow = r.trend === "up" ? "↑ rising" : r.trend === "down" ? "↓ easing" : "flat";
              return sig ? <button className="jz-link" onClick={() => openRecord({ kind: "signal", id: sig })}>{arrow}</button> : <span className="jz-dim">{arrow}</span>;
            } },
          ]} />
        </Card>
      )}
    </>
  );
}

export default function Advertising() {
  const s = useJodz();
  const sec = s.sections.Advertising || "overview";
  return (
    <Page title="Advertising" sub="Meta Ads and Google Ads, checked against Shopify revenue and live stock. Last 30 days to 26 Sep 2026."
      right={<div style={{ display: "flex", gap: 8, alignItems: "center" }}><Pill tone="outline">Demo connections, simulated data</Pill><DemoBadge /></div>}>
      {sec === "meta" ? <PlatformPage p="Meta" /> : sec === "google" ? <PlatformPage p="Google" /> : <Overview />}
    </Page>
  );
}
