import { Fragment, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

/* Header tabs with a sliding glass lens over the active tab.
   A web approximation of Apple's Liquid Glass (Apple ships it for its own platforms
   only): a translucent droplet with a specular rim, and a magnified copy of the
   labels underneath it, so text passing under the glass swells like it would
   through a lens. Hand-written; the design import does not regenerate this file. */

type Tab = { label: string; go: () => void; active: boolean; count?: string; showCount?: boolean };
type Box = { x: number; w: number };

const MAGNIFY = 1.12;

export default function LiquidTabs({ items, baseStyle, pad }: { items: Tab[]; baseStyle?: CSSProperties; pad?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [rowW, setRowW] = useState(0);
  const [overflow, setOverflow] = useState(false);
  const [seq, setSeq] = useState(0);
  const lastIdx = useRef(-1);
  // -1 when no tab is selected (Settings starts that way): then there is no glass.
  const idx = items.findIndex((t) => t.active);
  const labels = items.map((t) => t.label + (t.showCount && t.count ? "·" + t.count : "")).join("|");

  useLayoutEffect(() => {
    const w = wrap.current;
    if (!w) return;
    const measure = () => {
      const next = btns.current.slice(0, items.length).map((b) => (b ? { x: b.offsetLeft, w: b.offsetWidth } : { x: 0, w: 0 }));
      setBoxes((prev) => (prev.length === next.length && prev.every((p, i) => p.x === next[i].x && p.w === next[i].w) ? prev : next));
      setRowW(w.scrollWidth);
      setOverflow(w.scrollWidth > w.clientWidth + 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(w);
    btns.current.forEach((b) => b && ro.observe(b));
    return () => ro.disconnect();
  }, [labels, items.length]);

  // A new active tab starts the droplet's stretch; the first paint does not.
  useLayoutEffect(() => {
    if (idx !== -1 && lastIdx.current !== -1 && lastIdx.current !== idx) {
      setSeq((n) => n + 1);
      const el = btns.current[idx];
      if (el && overflow) el.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
    lastIdx.current = idx;
  }, [idx, overflow]);

  const box = idx === -1 ? undefined : boxes[idx];
  const style: CSSProperties = {
    ...baseStyle,
    // Each tab is as wide as its label, so one long label doesn't widen every tab
    // and squeeze the search next to it.
    gridAutoColumns: "max-content",
    // The search next door shrinks far faster (see .hs-wrap), so the tabs keep
    // their full width until it is down to an icon, and only then scroll.
    flex: "0 1 auto",
    minWidth: 0,
    overflowX: overflow ? "auto" : "visible",
    overflowY: overflow ? "hidden" : "visible",
    maskImage: overflow ? baseStyle?.maskImage : "none",
    WebkitMaskImage: overflow ? baseStyle?.WebkitMaskImage : "none",
  };

  return (
    <div ref={wrap} style={style} className="lg-tabs">
      {box && box.w > 0 && (
        <span className="lg-thumb" aria-hidden="true" style={{ width: box.w, transform: `translateX(${box.x}px)` }}>
          <span className="lg-glass" style={{ animationName: seq ? (seq % 2 ? "lgStretchA" : "lgStretchB") : "none" }}>
            <span className="lg-lens">
              <span className="lg-lens-row" style={{ width: rowW, transform: `translateX(${-box.x}px)` }}>
                <span className="lg-lens-mag" style={{ transformOrigin: `${box.x + box.w / 2}px 50%`, transform: `scale(${MAGNIFY})` }}>
                  {items.map((t, i) => {
                    const b = boxes[i];
                    if (!b) return null;
                    return (
                      <span key={i} className="lg-lens-label" style={{ left: b.x, width: b.w }}>
                        {t.label}
                        {t.showCount && t.count ? <span className="lg-count">{t.count}</span> : null}
                      </span>
                    );
                  })}
                </span>
              </span>
            </span>
          </span>
        </span>
      )}
      {items.map((t, i) => (
        <Fragment key={i}>
          <button
            ref={(el) => { btns.current[i] = el; }}
            onClick={t.go}
            data-nav-active={t.active ? "1" : undefined}
            className={"lg-tab" + (t.active ? " on" : "")}
            style={{ padding: pad }}
            aria-current={t.active ? "page" : undefined}
          >
            {t.label}
            {t.showCount && t.count ? <span className="lg-count">{t.count}</span> : null}
          </button>
        </Fragment>
      ))}
    </div>
  );
}
