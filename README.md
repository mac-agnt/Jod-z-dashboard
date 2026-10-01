# Pulse for Jod-Z (demo)

React build of the **Pulse v5 Harbour** design, set up as a demo operations workspace for Jod-Z (equestrian clothing, online and wholesale). All figures, stock, staff, retailers and suppliers are fictional demo data, fixed at a 26 Sep 2026 snapshot.

Every page, theme and interaction from the design is here. Screens were checked against the original mockup and match pixel for pixel at 1440×900 and 1024×720.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
```

## What's in it

| Area | Where |
| --- | --- |
| Jod-Z modules: Sales & Wholesale, Inventory, Accounting, Forecasting, Trends, Advertising, Reporting, record drawers | `src/jodz/pages/`, `src/jodz/drawers/` |
| Trend signals, Meta Ads and Google Ads data (simulated) and their selectors | `src/jodz/marketing.ts` |
| Shared Jod-Z dataset, store and selectors (every figure comes from here) | `src/jodz/data.ts`, `src/jodz/store.ts`, `src/jodz/derive.ts` |
| Home briefing and fixture chat answers | `src/jodz/home.ts` |
| Pulse pages: Home chat, Agents, Work, Records, Activity, Settings | `src/views/pages/` |
| Overlays: ⌘K palette, agent studio, Helios mini chat, work viewer, new record, background gallery | `src/views/overlays/` |
| App frame: sidebar, top bar, notifications | `src/views/AppShell.tsx` |
| State and behaviour | `src/logic/PulseLogic.js` |
| Pulse demo content (contacts, files, ontology, settings) | `src/logic/data.js` |
| Agent avatar | `src/components/AgentFace.tsx` |
| Theme tokens (Harbour, light and 11 more), animations | `src/styles/pulse.css` |

## How it fits together

- **`PulseLogic`** holds all state. Its `renderVals()` returns one flat object `v`.
- **Views** are plain React components that render from `v`.
- **`LogicHost`** (`src/runtime/logic.tsx`) mounts the logic and re-renders on `setState`.
- **Tweaks** from the design live in `src/App.tsx`:
  - `kpiBackdrop`: the colour of the Dashboard KPI background
  - `kpiBackdropOn`: whether that background shows

## Checking the demo figures

```bash
npx vite-node scripts/check-figures.ts   # headline numbers and cash horizons
npx vite-node scripts/check-threads.ts   # walks the five story threads through the store
npx vite-node scripts/check-marketing.ts # advertising and trend figures, and their effect on forecast and cash
npx vite-node scripts/check-answers.ts   # the fixture chat answers
```

## Updating from Claude Design

Export the new version, replace the file in `design/`, then run:

```bash
npm run import-design
```

This regenerates:

- `src/views/`
- `src/styles/pulse.css`
- `src/styles/interactions.css`
- `src/logic/`

`AgentFace` is hand-written and left alone. Commit before running, because it overwrites hand edits to those files, including the Jod-Z content in `src/logic/` and `src/views/`.

## Fixed from the mockup

In the mockup, the work viewer's wrapper `<div>` was never closed. As a result, the ⌘K palette, agent studio, new record dialog and background gallery could only appear while the work viewer was open. They now open on their own. The fix is applied in `tools/import-design.mjs`.
