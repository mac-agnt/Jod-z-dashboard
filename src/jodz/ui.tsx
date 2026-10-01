/* Small shared building blocks for the Jod-Z modules. Pulse's tokens, spacing and radii. */
import { type ReactNode, useState, Fragment } from "react";
import { productOfSku, sizeOfSku, eur, fmtDate } from "./derive";
import { openRecord } from "./store";
import type { RecordLink } from "./data";

export function Page({ title, sub, right, children }: { title: string; sub?: ReactNode; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="jz-page">
      <div className="jz-head">
        <div className="jz-grow">
          <h1>{title}</h1>
          {sub && <p>{sub}</p>}
        </div>
        {right}
      </div>
      <div className="jz-grid">{children}</div>
    </div>
  );
}

export function Card({ title, sub, right, children, pad = true, style }: { title?: ReactNode; sub?: ReactNode; right?: ReactNode; children?: ReactNode; pad?: boolean; style?: React.CSSProperties }) {
  return (
    <section className="jz-card" style={style}>
      {(title || right) && (
        <div className="jz-card-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            {title && <h3>{title}</h3>}
            {sub && <div className="jz-sub">{sub}</div>}
          </div>
          {right}
        </div>
      )}
      {pad ? <div className="jz-card-body">{children}</div> : children}
    </section>
  );
}

export function Tip({ text, children }: { text: ReactNode; children?: ReactNode }) {
  return (
    <span className="jz-tip" tabIndex={0}>
      {children ?? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-label="Definition">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5 M12 7.5v.01" />
        </svg>
      )}
      <span className="jz-tip-body" role="tooltip">{text}</span>
    </span>
  );
}

export interface Fig { label: string; value: ReactNode; sub?: ReactNode; tip?: ReactNode; tone?: "hero" | "alert"; onClick?: () => void }
export function Figures({ items }: { items: Fig[] }) {
  return (
    <div className="jz-figs">
      {items.map((f, i) => (
        <div key={i} className={"jz-fig" + (f.tone ? " jz-" + f.tone : "") + (f.onClick ? " jz-clickable" : "")} onClick={f.onClick}>
          <div className="jz-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {f.label}
            {f.tip && <Tip text={f.tip} />}
          </div>
          <div className="jz-v">{f.value}</div>
          {f.sub && <div className="jz-s">{f.sub}</div>}
        </div>
      ))}
    </div>
  );
}

export type Tone = "ok" | "warn" | "bad" | "accent" | "outline" | "";
export function Pill({ tone = "", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={"jz-pill " + tone}>{children}</span>;
}

export function Btn({ kind = "", sm, children, onClick, disabled, title }: { kind?: "" | "primary" | "ghost" | "danger"; sm?: boolean; children: ReactNode; onClick?: () => void; disabled?: boolean; title?: string }) {
  return (
    <button className={"jz-btn " + kind + (sm ? " sm" : "")} onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  );
}

export function Seg<T extends string>({ options, value, onChange }: { options: [T, string][]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="jz-seg" role="tablist">
      {options.map(([k, label]) => (
        <button key={k} className={k === value ? "on" : ""} onClick={() => onChange(k)} role="tab" aria-selected={k === value}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function Swatch({ sku, productId }: { sku?: string; productId?: string }) {
  const p = sku ? productOfSku(sku) : productOfSku("JZ-" + ({ an: "AN", mbk: "MB", bb: "BB", cfp: "CF", mby: "MY", pb: "PB", mon: "MON", ecl: "ECL" } as Record<string, string>)[productId || "an"] + "-S");
  return <span className="jz-swatch" style={{ background: p.swatch }} title={p.name} />;
}

export function VariantName({ sku, showSize = true }: { sku: string; showSize?: boolean }) {
  const p = productOfSku(sku);
  return (
    <span className="jz-name">
      <Swatch sku={sku} />
      <span>
        {p.name}
        {showSize && <b style={{ fontWeight: 600, marginLeft: 6 }}>{sizeOfSku(sku)}</b>}
      </span>
    </span>
  );
}

/** A clickable reference to any record; opens it on its home page. */
export function RecLink({ link, children }: { link: RecordLink; children?: ReactNode }) {
  return (
    <button className="jz-link" onClick={(e) => { e.stopPropagation(); openRecord(link); }}>
      {children ?? link.id}
    </button>
  );
}

export interface Col<T> { key: string; label: ReactNode; render: (row: T) => ReactNode; right?: boolean; num?: boolean; strong?: boolean; width?: number | string }
export function Table<T>({ cols, rows, onRow, rowKey, selected, empty, maxHeight }: { cols: Col<T>[]; rows: T[]; onRow?: (r: T) => void; rowKey: (r: T) => string; selected?: string; empty?: ReactNode; maxHeight?: number }) {
  return (
    <div className="jz-table-wrap" style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}>
      <table className="jz-table">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.key} className={c.right ? "jz-r" : ""} style={c.width ? { width: c.width } : undefined}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={cols.length} style={{ padding: "28px 12px", textAlign: "center", color: "var(--faint)" }}>{empty ?? "Nothing here"}</td>
            </tr>
          )}
          {rows.map((r) => {
            const k = rowKey(r);
            return (
              <tr key={k} className={(onRow ? "jz-row" : "") + (selected === k ? " jz-sel" : "")} onClick={onRow ? () => onRow(r) : undefined}>
                {cols.map((c) => (
                  <td key={c.key} className={[c.right ? "jz-r" : "", c.num ? "jz-num" : "", c.strong ? "jz-strong" : ""].join(" ")}>{c.render(r)}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function Drawer({ eyebrow, title, sub, onClose, children, foot, wide }: { eyebrow?: ReactNode; title: ReactNode; sub?: ReactNode; onClose: () => void; children: ReactNode; foot?: ReactNode; wide?: boolean }) {
  return (
    <>
      <div className="jz-scrim" onClick={onClose} />
      <aside className={"jz-drawer" + (wide ? " wide" : "")} role="dialog" aria-modal="true">
        <div className="jz-drawer-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            {eyebrow && <div className="jz-label">{eyebrow}</div>}
            <h2>{title}</h2>
            {sub && <div style={{ marginTop: 6, fontSize: 12.5, color: "var(--dim)" }}>{sub}</div>}
          </div>
          <button className="jz-btn ghost sm" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12 M18 6 6 18" /></svg>
          </button>
        </div>
        <div className="jz-drawer-body">{children}</div>
        {foot && <div className="jz-drawer-foot">{foot}</div>}
      </aside>
    </>
  );
}

export function Section({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="jz-section">
      <div style={{ display: "flex", alignItems: "center" }}>
        <h4 style={{ flex: 1 }}>{title}</h4>
        {right}
      </div>
      {children}
    </div>
  );
}

export function KV({ items }: { items: [string, ReactNode][] }) {
  return (
    <div className="jz-kv">
      {items.map(([k, v]) => (
        <div key={k}>
          <span>{k}</span>
          <b>{v}</b>
        </div>
      ))}
    </div>
  );
}

export function Note({ tone = "", children }: { tone?: "" | "warn" | "bad" | "ok"; children: ReactNode }) {
  return <div className={"jz-note " + tone}>{children}</div>;
}

export function DemoBadge() {
  return (
    <Tip text="All figures, stock, staff, retailers and suppliers are fictional demo data. They are not claims about Jod-Z's business.">
      <span className="jz-demo">Demo data</span>
    </Tip>
  );
}

/* ---------------- charts (inline SVG) ---------------- */

export interface Series { name: string; color: string; values: number[]; dashed?: boolean; area?: boolean }

/** Dated line chart with optional horizontal reference line and marker. */
export function LineChart({ labels, series, height = 220, refLine, marker, fmt = (n: number) => eur(n), yMin }: {
  labels: string[]; series: Series[]; height?: number; refLine?: { value: number; label: string }; marker?: { index: number; label: string }; fmt?: (n: number) => string; yMin?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 1000, H = height, padL = 58, padR = 14, padT = 14, padB = 26;
  const all = series.flatMap((s) => s.values).concat(refLine ? [refLine.value] : []);
  let lo = yMin ?? Math.min(0, ...all), hi = Math.max(...all);
  if (hi === lo) hi = lo + 1;
  const span = hi - lo;
  hi += span * 0.08;
  if (yMin === undefined && lo < 0) lo -= span * 0.05;
  const n = labels.length;
  const x = (i: number) => padL + (i * (W - padL - padR)) / Math.max(1, n - 1);
  const y = (v: number) => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);
  const ticks = 4;
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => lo + ((hi - lo) * i) / ticks);
  const every = Math.max(1, Math.ceil(n / 8));
  return (
    <div style={{ position: "relative" }}>
      <svg className="jz-chart" viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: "block", overflow: "visible" }}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          const i = Math.round(((px - padL) / (W - padL - padR)) * (n - 1));
          setHover(Math.max(0, Math.min(n - 1, i)));
        }}>
        {tickVals.map((t, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="var(--track)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <text x={padL - 8} y={y(t) + 3} textAnchor="end">{fmt(Math.round(t))}</text>
          </g>
        ))}
        {labels.map((l, i) => (i % every === 0 || i === n - 1 ? <text key={i} x={x(i)} y={H - 6} textAnchor="middle">{l}</text> : null))}
        {refLine && (
          <g>
            <line x1={padL} x2={W - padR} y1={y(refLine.value)} y2={y(refLine.value)} stroke="var(--bad)" strokeDasharray="5 5" strokeWidth="1.3" vectorEffect="non-scaling-stroke" />
            <text x={W - padR} y={y(refLine.value) - 6} textAnchor="end" style={{ fill: "var(--bad)" }}>{refLine.label}</text>
          </g>
        )}
        {series.map((s, si) => {
          const d = s.values.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1)).join(" ");
          return (
            <g key={si}>
              {s.area && <path d={d + ` L${x(n - 1)} ${y(lo)} L${x(0)} ${y(lo)} Z`} fill={s.color} opacity=".12" />}
              <path d={d} fill="none" stroke={s.color} strokeWidth="2" strokeDasharray={s.dashed ? "6 5" : undefined} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            </g>
          );
        })}
        {marker && series[0] && (
          <g>
            <circle cx={x(marker.index)} cy={y(series[0].values[marker.index])} r="4.5" fill="var(--bad)" stroke="var(--bg)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </g>
        )}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={padT} y2={H - padB} stroke="var(--border-strong)" vectorEffect="non-scaling-stroke" />}
      </svg>
      {hover !== null && (
        <div style={{ position: "absolute", top: 0, left: `calc(${((x(hover) / W) * 100).toFixed(2)}% + ${hover > n * 0.7 ? -190 : 12}px)`, pointerEvents: "none", padding: "8px 10px", borderRadius: 10, background: "var(--tooltip)", border: "1px solid var(--border)", fontSize: 12, color: "var(--tooltip-ink)", minWidth: 150, boxShadow: "0 10px 26px rgba(0,0,0,.3)", zIndex: 5 }}>
          <div className="jz-label" style={{ marginBottom: 5 }}>{labels[hover]}</div>
          {series.map((s) => (
            <div key={s.name} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ width: 8, height: 2, background: s.color }} />
              <span style={{ flex: 1, color: "var(--dim)" }}>{s.name}</span>
              <b className="jz-mono">{fmt(s.values[hover])}</b>
            </div>
          ))}
        </div>
      )}
      {marker && <div className="jz-faint" style={{ fontSize: 11.5, marginTop: 6 }}>● {marker.label}</div>}
    </div>
  );
}

/** Stacked daily bars. */
export function Bars({ labels, stacks, height = 180, fmt = (n: number) => eur(n) }: { labels: string[]; stacks: { name: string; color: string; values: number[] }[]; height?: number; fmt?: (n: number) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  const n = labels.length;
  const totals = labels.map((_, i) => stacks.reduce((a, s) => a + s.values[i], 0));
  const max = Math.max(1, ...totals) * 1.08;
  const every = Math.max(1, Math.ceil(n / 8));
  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height, paddingBottom: 18, position: "relative" }} onMouseLeave={() => setHover(null)}>
        {labels.map((l, i) => (
          <div key={i} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column-reverse", position: "relative", cursor: "default" }} onMouseEnter={() => setHover(i)}>
            {stacks.map((s) => (
              <div key={s.name} style={{ height: `${(s.values[i] / max) * 100}%`, background: s.color, opacity: hover === null || hover === i ? 1 : 0.45, borderRadius: 3, marginTop: 1, transformOrigin: "bottom", animation: `growBar .5s var(--ease) ${i * 12}ms both` }} />
            ))}
            {(i % every === 0 || i === n - 1) && (
              <span className="jz-mono" style={{ position: "absolute", bottom: -18, left: "50%", transform: "translateX(-50%)", fontSize: 9.5, color: "var(--faint)", whiteSpace: "nowrap" }}>{l}</span>
            )}
          </div>
        ))}
      </div>
      {hover !== null && (
        <div style={{ position: "absolute", top: -6, right: 0, padding: "7px 10px", borderRadius: 10, background: "var(--tooltip)", border: "1px solid var(--border)", fontSize: 12, color: "var(--tooltip-ink)", minWidth: 160, zIndex: 5 }}>
          <div className="jz-label" style={{ marginBottom: 4 }}>{labels[hover]}</div>
          {stacks.map((s) => (
            <div key={s.name} style={{ display: "flex", gap: 8 }}>
              <span style={{ flex: 1, color: "var(--dim)" }}>{s.name}</span>
              <b className="jz-mono">{fmt(s.values[hover])}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Legend({ items }: { items: { name: string; color: string; dashed?: boolean }[] }) {
  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
      {items.map((i) => (
        <span key={i.name} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--dim)" }}>
          <span style={{ width: 14, height: 0, borderTop: `2px ${i.dashed ? "dashed" : "solid"} ${i.color}` }} />
          {i.name}
        </span>
      ))}
    </div>
  );
}

export function Meter({ value, max, tone = "accent" }: { value: number; max: number; tone?: "accent" | "ok" | "warn" | "bad" }) {
  const w = Math.max(0, Math.min(1, value / Math.max(1, max)));
  return <div className="jz-bar" style={{ width: `${w * 100}%`, background: `var(--${tone})`, minWidth: value > 0 ? 3 : 0 }} />;
}

/* ---------------- CSV ---------------- */

export function downloadCSV(filename: string, header: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const text = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const dateLabels = (isoDates: string[]) => isoDates.map(fmtDate);
export { Fragment };
