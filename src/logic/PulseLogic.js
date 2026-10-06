import React from "react";
import { DCLogic } from "../runtime/logic";
import {
  INK,
  BODY,
  DIM,
  FAINT,
  LIME,
  GREEN,
  AMBER,
  RED,
  NEUTRAL,
  MONO,
  ICONS,
  PEOPLE,
  ROLE_LEVELS,
  PERM_KEYS,
  GRANT_DEFS,
  ROLE_SCOPES,
  DEFAULT_PERMS,
  INTEGRATIONS,
  BG_DEFS,
  THEMES,
  ADMIN_ICONS,
  ADMIN_CARDS,
  ADMIN_GROUPS,
  STREAM_DEFS,
  NAV,
  ITEMS,
  ORDER,
  synthesizeCustomArea,
  pickAnswer,
  AGENT_DEFS,
  KPI_DEFS,
  ASPECT_DEFS,
  FILTER_GROUPS,
  WORK_TASKS,
  WORKFLOWS,
  SCHEDULES,
  WIDGET_DEFS,
  WORK_WIDGETS,
  SKILL_DEFS
} from "./data";
import { answerFor, runAction, decisions as jodzDecisions, upcoming as jodzUpcoming, numbers as jodzNumbers, homeTasks as jodzTasks, activityFeed as jodzActivity, waitingSummary as jodzWaiting } from "../jodz/home";
import { linkLabel as linkLabelOf, staff as jodzStaff } from "../jodz/derive";
import { goTo as jodzGoTo, openRecord as jodzOpenRecord } from "../jodz/store";
import { completeTask as jodzCompleteTask, openDrawer as jodzOpenDrawer, decideApproval as jodzDecide } from "../jodz/store";
import { subscribe as jodzSubscribe, registerNavigator, getState as jodzState, setSection as jodzSetSection } from "../jodz/store";

/* All state and behaviour for Pulse. renderVals() returns the flat object the views render from. */
export default class PulseLogic extends DCLogic {
  state = { w: typeof window === "undefined" ? 1440 : window.innerWidth, theme:"light", page:"Home", draft:"", query:"", thread:[], typed:0, paletteOpen:false, showNotifs:false, palScope:"All", palSel:0, palRecent:["JOD-W1041","Stock & Demand"],
            done:{}, resolved:{}, approved:{}, inboxFilter:"All", approvalFilter:"Awaiting you", open:null, range:"30d",
            workDoc:null, workDocTab:"work",
            queue:"mine", recordTab:"Overview", record:"person", hovered:null, hoverLabel:"", hoverHint:"", hoverTop:0,
            flags:{approvals:true, automations:true, insights:true, customEntities:false, whatsapp:false, composio:false},
            workSection:"tasks", workViews:{}, addedTasks:[], newTask:"", newPriority:"Medium",
            timerRunning:false, timerTask:null, timerPreset:null, scheduleOff:{},
            adminCard:null, adminFlags:{},
            adminOpen:null, adminFlags:{}, adminGroup:null,
            actPaused:false, actHover:null, actKpi:"all", actQuery:"", actOpen:null, actTick:0,
            recSection:"contacts", recAsk:"", treeOpen:true, treeExpanded:{}, treeFile:"fl-1", treeQuery:"",
            ontoNode:"Organisation", ontoHover:null, ontoLayout:"Force",
            newRecOpen:false, newRecName:"", newRecTemplate:"Field sheet", newRecCat:"All",
            opsFilter:"all", opsOff:{}, opsOpen:null, opsScope:"week", opsDay:26, opsOrder:null, opsDrag:null,
            opsBuilderOpen:false, opsBuilderMode:"workflow", builderText:"", builderGenerated:false,
            railOpen:true, barOpen:true, chatRailPinned:false, widgetEdit:false, widgets:["inbox","visits","work","activity"],
            kpiEdit:false, kpiKeys:["revenue","cash","overdue","margin","jobs"],
            aspect:"sales", filterMenuOpen:false, customFilter:"", extraFilters:[],
            workWidget:"queue", miniOpen:false, miniThread:[], miniDraft:"", miniTab:"chat", miniTone:"plain", miniWorkOpen:"tasks",
            agents:AGENT_DEFS, agentId:"briefing", groupNames:{}, agentQuery:"", agentDraft:"", agentExtra:{},
            builderOpen:false, builderMode:"new", trained:false, training:false, trainPhase:0,
            briefThread:[], briefDraft:"", briefPicks:{},
            agentSpec:{name:"", shape:"crown-pebble", tint:"#191c1f", persona:"", personality:"Straight-talking",
                   answer:"Short answers", context:["Organisations","Tasks"], skills:["Search records","Summarise activity"], tasks:[]} };

  /* One event per stream on its own cadence, so the three columns never move in
     lockstep. A hovered column and a paused view are both simply skipped. */
  seedActivity(){
    const now = Date.now();
    this._actId = 0;
    const seed = (def, count) => def.pool.slice(0, count).map((e, i) => this.mkEvent(def, e, now - (i + 1) * def.every * 1.4));
    this.feeds = {};
    STREAM_DEFS.forEach(d => { this.feeds[d.id] = seed(d, 5); this._actCursor = 0; });
    this._nextPush = {};
    STREAM_DEFS.forEach(d => { this._nextPush[d.id] = now + d.every * (0.4 + Math.random() * 0.6); });
  }

  mkEvent(def, tpl, at){
    const status = tpl[5];
    return {id: "e" + (++this._actId), stream: def.id, title: tpl[0], note: tpl[1],
      actor: tpl[2], rel: tpl[3], src: tpl[4], status,
      progress: status === "working" ? 8 + Math.random() * 22 : 100,
      at: at === undefined ? Date.now() : at, fresh: at === undefined};
  }

  // Split-flap board. Each tile keeps the character it last showed, so a change
  // (the minute rolling over, or the boot scramble settling) drops the old
  // character down and swings the new one up. Results are cached per stamp so
  // repeat renders inside one tick don't cancel a flip mid-air.
  buildFlipUnits(BODY, INK, LIME){
    const now = new Date();
    const DAY = ["SUN","MON","TUE","WED","THU","FRI","SAT"][now.getDay()];
    const MON = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][now.getMonth()];
    const target = (DAY + String(now.getDate()).padStart(2,"0") + MON
      + String(now.getHours()).padStart(2,"0") + String(now.getMinutes()).padStart(2,"0")).split("");
    if (!this._flapMount) this._flapMount = Date.now();
    const el = Date.now() - this._flapMount;
    const settleAt = i => 200 + i * 75 + 200;
    const scrambling = el < settleAt(target.length - 1);
    const stamp = scrambling ? "s" + Math.floor(el / 75) : target.join("");
    if (this._flapStamp === stamp && this._flapCache) return this._flapCache;
    this._flapStamp = stamp;
    const NUM = "0123456789", ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const prev = this._flapPrev || (this._flapPrev = []);
    const seq = this._flapSeq || (this._flapSeq = []);
    const faces = target.map((c, i) => {
      if (scrambling && el < settleAt(i)) {
        const pool = /[0-9]/.test(c) ? NUM : ALPHA;
        return pool[Math.floor(Math.random() * pool.length)];
      }
      return c;
    }).map((v, i) => {
      const p = prev[i];
      const changed = p !== undefined && p !== v;
      if (changed) seq[i] = (seq[i] || 0) + 1;
      prev[i] = v;
      const k = (seq[i] || 0) % 2 ? "B" : "A";
      return {isTile:true, isColon:false, v, prev: changed ? p : v,
        flapShow: changed ? "block" : "none",
        topAnim: changed ? "flapDown" + k + " .16s cubic-bezier(.5,.05,.9,.4) both" : "none",
        botAnim: changed ? "flapUp" + k + " .24s cubic-bezier(.2,.85,.3,1) .16s both" : "none"};
    });
    const base = {w:"21px", h:"30px", size:"13px", cornerW:"17px", cornerSize:"11px", color:BODY};
    const big = {w:"22px", h:"31px", size:"14px", cornerW:"18px", cornerSize:"12px", color:INK};
    const time = {w:"22px", h:"31px", size:"14px", cornerW:"18px", cornerSize:"12px", color:LIME};
    const mk = (i, opts) => Object.assign({}, base, faces[i], opts || {});
    const out = [
      {tiles:[mk(0), mk(1), mk(2)]},
      {tiles:[mk(3, big), mk(4, big)]},
      {tiles:[mk(5), mk(6), mk(7)]},
      {tiles:[mk(8, time), mk(9, time), {isTile:false, isColon:true}, mk(10, time), mk(11, time)]}
    ];
    this._flapCache = out;
    return out;
  }

  /* Tuning by prompt: the change is described in words and lands on the pinned
     prompt, so the agent's behaviour and its prompt never drift apart. */
  /* KPI figures count in from zero whenever the filter changes, so a switch
     between aspects reads as the numbers moving rather than swapping. */
  countValue(raw, i){
    const t = this.state.kpiT;
    if (t === undefined || t >= 1) return raw;
    const m = String(raw).match(/^([^0-9-]*)(-?[\d,]+(?:\.\d+)?)(.*)$/);
    if (!m) return raw;
    const dec = (m[2].split(".")[1] || "").length;
    const target = parseFloat(m[2].replace(/,/g, ""));
    const e = 1 - Math.pow(1 - Math.min(1, t + i * 0.04), 3);
    const now = (target * e).toFixed(dec);
    const [whole, frac] = now.split(".");
    return m[1] + whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (frac ? "." + frac : "") + m[3];
  }
  goPage(page, extra){
    this.setState(Object.assign({page}, extra || {}));
    if (page === "Dashboard") this.startKpiCount();
  }
  /* A timer, not rAF: background/hidden frames throttle rAF to nothing and the
     count would freeze part-way through. */
  /* Shared by the picker, drag-and-drop and paste — the file dialog can be
     blocked in an embedded frame, so there is always another way in. */
  readBgFile(f){
    if (!f || !/^image\//.test(f.type || "")) return;
    const fr = new FileReader();
    fr.onload = () => this.setState(p => {
      const list = (p.bgUploads || []).concat([fr.result]);
      return {bgUploads:list, bgCat:"Your photos", bgGalleryOpen:true,
        homeBg:"up" + (list.length - 1),
        homeBgCss:"background:url(" + fr.result + ") center/cover"};
    });
    fr.readAsDataURL(f);
  }
  startKpiCount(){
    clearInterval(this._kpiTimer);
    const t0 = Date.now();
    this.setState({kpiT:0});
    this._kpiTimer = setInterval(() => {
      const t = Math.min(1, (Date.now() - t0) / 900);
      this.setState({kpiT:t});
      if (t >= 1) clearInterval(this._kpiTimer);
    }, 40);
  }
  systemPrompt(st){
    const s = st || this.state;
    if (s.sysPrompt !== undefined && s.sysPrompt !== null) return s.sysPrompt;
    return "You are " + (s.agentSpec.name || "this agent") + " inside Pulse.\n"
      + "Voice: " + s.agentSpec.personality.toLowerCase() + ". " + s.agentSpec.answer.toLowerCase() + ".\n"
      + "You read the whole ontology through registered tools only, filtered by the grants of whoever is asking.\n"
      + "This client says merchant, not organisation, and job, not task. Money is in euro.\n"
      + "Never act on anything with an effect. Propose it and wait for a yes.";
  }
  sendTune(){
    const text = (this.state.tuneDraft || "").trim();
    if (!text) return;
    this.setState(prev => ({
      tuneDraft:"",
      tuneThread: (prev.tuneThread || []).concat([
        {role:"you", text},
        {role:"agent", text:"Done. I pinned that to my prompt. It takes effect on the next run."}
      ]),
      sysPrompt: this.systemPrompt(prev) + "\n" + text
    }));
  }

  openPalette(){
    this._palOpenedAt = Date.now();
    this.setState({paletteOpen:true, showNotifs:false, query:"", palSel:0, palScope:"All"});
  }

  componentDidMount(){
    registerNavigator((p) => this.go(p));
    this._jodzUnsub = jodzSubscribe(() => this.forceUpdate());
    requestAnimationFrame(() => this.syncRailThumb());
    setTimeout(() => this.syncRailThumb(), 700);
    setTimeout(() => { const nav = document.querySelector('nav[data-rail-nav]');
      if (nav && window.ResizeObserver){ this._railRO = new ResizeObserver(() => this.syncRailThumb()); this._railRO.observe(nav); } }, 50);
    this.seedActivity();
    if (this.state.page === "Dashboard") this.startKpiCount();
    this._clockTimer = setInterval(() => { if (this.state.page === "Home") this.forceUpdate(); }, 1000);
    this._flapBoot = setInterval(() => this.forceUpdate(), 70);
    setTimeout(() => clearInterval(this._flapBoot), 1500);
    this._resize = () => this.setState({w: window.innerWidth});
    window.addEventListener("resize", this._resize);
    this._key = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"){
        e.preventDefault();
        if (this.state.paletteOpen) this.setState({paletteOpen:false, query:"", palSel:0}); else this.openPalette();
      }
      if (e.key === "Escape") this.setState({paletteOpen:false, showNotifs:false});
    };
    window.addEventListener("keydown", this._key);
    this._paste = (e) => {
      if (!this.state.bgGalleryOpen) return;
      const items = (e.clipboardData && e.clipboardData.items) || [];
      for (let i = 0; i < items.length; i++){
        if (items[i].type && items[i].type.indexOf("image") === 0){ this.readBgFile(items[i].getAsFile()); break; }
      }
    };
    window.addEventListener("paste", this._paste);
  }
  componentWillUnmount(){ if (this._jodzUnsub) this._jodzUnsub(); window.removeEventListener("paste", this._paste); window.removeEventListener("resize", this._resize); window.removeEventListener("keydown", this._key); clearInterval(this._t); clearInterval(this._clockTimer); clearInterval(this._flapBoot); clearInterval(this._kpiTimer); }

  ask(q){
    const a = answerFor(q);
    const words = a.text.split(" ").length;
    const thread = this.state.thread.concat([
      {role:"user", text:q},
      {role:"helios", full:a.text, words, tool:a.tool, effect:a.effect, cols:a.cols, rows:a.rows, actions:a.actions, confirm:a.confirm, confirmSummary:a.confirmSummary}
    ]);
    this.setState({thread, draft:"", query:"", paletteOpen:false, page:"Home", open:null});
  }

  hover(key, label, hint, e){
    const r = e && e.currentTarget ? e.currentTarget.getBoundingClientRect() : null;
    this.setState(prev => ({hovered:key, hoverLabel:label, hoverHint:hint,
      hoverTop: r ? Math.round(r.top + r.height / 2) : prev.hoverTop}));
  }
  unhover(key){ this.setState(prev => (prev.hovered === key ? {hovered:null} : null)); }

  syncRailThumb(){
    const nav = document.querySelector('nav[data-rail-nav]');
    const btn = nav && nav.querySelector('[data-rail="active"]');
    const prev = this.state.railThumb;
    if (!btn){ if (prev) this.setState({railThumb:null}); return; }
    const n = nav.getBoundingClientRect(), b = btn.getBoundingClientRect();
    const next = {t: Math.round(b.top - n.top + nav.scrollTop), l: Math.round(b.left - n.left), w: Math.round(b.width), h: Math.round(b.height)};
    if (!prev || prev.t !== next.t || prev.l !== next.l || prev.w !== next.w || prev.h !== next.h){
      this.setState({railThumb: next});
      if (!this._railLive){ this._railLive = true; setTimeout(() => this.setState({railThumbLive:true}), 60); }
    }
  }
  componentDidUpdate(){ this.syncRailThumb(); }

  go(page){
    const order = NAV.filter(n => !n.divider).map(n => n.page).concat(["Settings"]);
    const from = order.indexOf(this.state.page), to = order.indexOf(page);
    if (from > -1 && to > -1 && from !== to) this.setState(p => ({navDir: to > from ? 1 : -1, navSeq:(p.navSeq || 0) + 1}));
    this.setState({page, open:null, showNotifs:false, filterMenuOpen:false});
    if (page === "Dashboard") this.startKpiCount();
  }
  toggleIn(key, value){
    this.setState(prev => {
      const list = prev[key].slice(), i = list.indexOf(value);
      if (i > -1) list.splice(i, 1); else list.push(value);
      return {[key]: list};
    });
  }
  toggleSpecList(key, value){
    this.setState(prev => {
      const list = prev.agentSpec[key].slice(), i = list.indexOf(value);
      if (i > -1) list.splice(i, 1); else list.push(value);
      return {agentSpec: Object.assign({}, prev.agentSpec, {[key]: list})};
    });
  }
  askMini(q){
    const a = answerFor(q);
    this.setState(prev => ({
      miniThread: prev.miniThread.concat([{role:"user", text:q}, {role:"helios", text:a.text}]),
      miniDraft: ""
    }));
  }
  addCustom(){
    this.setState(prev => {
      const name = prev.customFilter.trim();
      if (!name) return {customFilter:""};
      if (prev.extraFilters.indexOf(name) > -1) return {customFilter:"", aspect:name, filterMenuOpen:false};
      return {extraFilters: prev.extraFilters.concat([name]), customFilter:"", aspect:name, filterMenuOpen:false};
    });
  }
  sendToAgent(q){
    const id = this.state.agentId;
    this.setState(prev => {
      const extra = (prev.agentExtra[id] || []).concat([
        {kind:"user", text:q},
        {kind:"agent", text:answerFor(q).text}
      ]);
      return {agentExtra: Object.assign({}, prev.agentExtra, {[id]: extra}), agentDraft:""};
    });
  }

  renderVals(){
    const st = this.state, page = st.page;
    const openKeys = ORDER.filter(k => !st.resolved[k]);

    // Equal grid columns (width:max-content + 1fr) let a single thumb glide by
    // translateX(index * 100%) — no measurement, and identical motion everywhere.
    const SLIDE = "transform .46s cubic-bezier(.22,.9,.16,1),background .3s var(--ease)";
    const segTrack = (extra) => "position:relative;display:inline-grid;grid-auto-flow:column;grid-auto-columns:1fr;;border-radius:999px"
      + "width:max-content;max-width:100%;align-items:center;padding:4px;background:var(--surface-faint);"
      + "border:1px solid var(--border);border-radius:var(--r-sm,9px);backdrop-filter:blur(24px);"
      + "box-shadow:inset 0 1px 3px rgba(0,0,0,.36),inset 0 -1px 0 var(--glass-highlight);" + (extra || "");
    const segThumb = (count, index, fill) => {
      const n = Math.max(1, count), i = Math.max(0, index);
      const lift = "box-shadow:0 2px 5px rgba(0,0,0,.34),0 6px 16px rgba(0,0,0,.24),inset 0 1px 0 rgba(255,255,255,.5),inset 0 -1px 0 rgba(0,0,0,.08);";
      const glow = fill === "var(--accent)"
        ? "box-shadow:0 2px 6px rgba(0,0,0,.3),0 4px 18px var(--accent-line),inset 0 1px 0 rgba(255,255,255,.34);background-image:linear-gradient(180deg,rgba(255,255,255,.22),rgba(255,255,255,0) 55%);background-blend-mode:overlay;"
        : lift;
      return "position:absolute;left:4px;top:4px;bottom:4px;z-index:0;pointer-events:none;"
        + "width:calc((100% - 8px) / " + n + ");transform:translateX(" + (i * 100) + "%);"
        + "border-radius:var(--r-seg,7px);background-color:" + fill + ";transition:" + SLIDE + ";" + glow;
    };
    const railStyle = (active, quiet) => "position:relative;width:" + (st.railOpen ? "100%" : "44px") + ";height:" + (quiet ? "36px" : "42px") + ";flex:none;display:flex;align-items:center;"
      + (st.railOpen ? "gap:13px;justify-content:flex-start;padding:0 14px;font-size:14px;" : "gap:0;justify-content:center;")
      + "border:0;border-radius:14px;cursor:pointer;overflow:visible;"
      + "transition:background .42s var(--ease),color .35s var(--ease),box-shadow .42s var(--ease),transform .3s cubic-bezier(.16,1.4,.3,1);"
      + (active ? "background:none;color:var(--rail-active-ink,var(--accent))"
                : "background:none;color:" + (quiet ? "var(--faint)" : "var(--mid)"));
    // Hover: the icon springs up to 1.3× with a small lift and tilt, a soft accent
    // glow blooms behind it, and an accent stroke re-draws the icon's outline.
    const glyphStyle = (active, hovered) => "position:relative;z-index:1;flex:none;overflow:visible;"
      + "transition:transform .6s cubic-bezier(.2,1.6,.35,1),opacity .22s var(--ease);"
      + "transform:" + (hovered && !active ? "scale(1.3)" : active ? "scale(1.08)" : "none");
    const haloStyle = (active, hovered) => "position:absolute;left:50%;top:50%;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:999px;pointer-events:none;"
      + "background:radial-gradient(closest-side,var(--accent-soft),transparent);"
      + "transition:transform .7s cubic-bezier(.2,1.2,.3,1),opacity .45s var(--ease);"
      + (hovered && !active ? "opacity:1;transform:scale(1)" : "opacity:0;transform:scale(.3)");
    const drawStyle = (active, hovered) => "stroke-dasharray:1;"
      + (hovered && !active
          ? "stroke-dashoffset:0;opacity:1;transition:stroke-dashoffset .75s cubic-bezier(.5,0,.2,1) .05s,opacity .2s"
          : "stroke-dashoffset:1;opacity:0;transition:stroke-dashoffset 0s .3s,opacity .3s");
    const labelStyle = (shown, top) => "position:fixed;left:46px;top:" + top + "px;z-index:90;display:flex;align-items:center;gap:9px;padding:9px 15px;border-radius:var(--r-sm,10px);"
      + "background:var(--tooltip);border:1px solid var(--border);box-shadow:0 16px 38px rgba(0,0,0,.4);"
      + "font-size:13px;font-weight:500;color:var(--tooltip-ink);white-space:nowrap;pointer-events:none;"
      + "transform-origin:left center;opacity:1;transform:translate(0,-50%) scale(1);"
      + "transition:opacity .2s ease,transform .38s cubic-bezier(.16,1.5,.3,1),visibility .2s;"
      + (shown ? "visibility:visible" : "visibility:hidden;opacity:0;transform:translate(-12px,-50%) scale(.92)")

    // Open rail shows labels inline; collapsed rail shows them as the hover pill — never both.
    const railOpen = st.railOpen;
    // Collapsed: the label leaves the flex row entirely — otherwise its gap decentres the icon.
    const inlineStyle = (hov, act) => railOpen
      ? "flex:1;min-width:0;font-size:13px;text-align:left;white-space:nowrap;overflow:hidden;opacity:1;"
        + "font-weight:" + (act ? "600" : "500") + ";"
        + "transform:translateX(" + (hov && !act ? "3px" : "0") + ");"
        + "transition:transform .5s cubic-bezier(.22,1.2,.36,1),font-weight .2s var(--ease)"
      : "display:none";
    const nav = NAV.map((n, idx) => n.divider
      ? {isDivider:true, isItem:false}
      : {isItem:true, isDivider:false, label:n.label, hint: railOpen ? (n.hint || "") : "", d:ICONS[n.icon],
         dot: n.dot === true && openKeys.length > 0,
         dotStyle: "position:absolute;top:5px;" + (railOpen ? "left:30px" : "right:6px")
           + ";width:5px;height:5px;border-radius:50%;background:var(--accent)",
         inlineStyle: inlineStyle(st.railHov === idx, n.page === page),
         hintStyle: "flex:none;font-family:" + MONO + ";font-size:9.5px;color:var(--faint);white-space:nowrap",
         active: n.page === page,
         railKey: n.page === page ? "active" : "idle",
         glyphStyle: glyphStyle(n.page === page, st.hovered === idx || st.railHov === idx),
         haloStyle: haloStyle(n.page === page, st.hovered === idx || st.railHov === idx),
         drawStyle: drawStyle(n.page === page, st.hovered === idx || st.railHov === idx),
         style: railStyle(n.page === page, n.quiet) + ";animation:railIn .42s var(--ease) " + (idx * 45) + "ms both",
         enter: (e) => { if (!railOpen) this.hover(idx, n.label, n.hint || "", e); else this.setState({railHov:idx}); },
         leave: () => { if (this.state.railHov === idx) this.setState({railHov:null}); this.unhover(idx); },
         go: () => this.go(n.page)});

    const allWorkTasks = st.addedTasks.concat(jodzTasks().map(t => ({id:t.id, title:t.title, status: t.status === "Done" ? "Done" : t.priority === "High" ? "In progress" : "Not started",
      priority:t.priority, who:t.whoInitials, due:(t.late ? "Overdue · " : "Due ") + t.dueLabel, late:t.late, client:linkLabelOf(t.link), day:"Thread " + t.thread,
      mins:jodzStaff(t.owner).name, view: t.due <= "2026-09-28" ? "Due soon" : "Open", high: t.priority === "High", done: t.status === "Done", open:t.open, jodz:true})));
    const isDoneW = (t) => t.jodz ? !!t.done : !!(st.done[t.id] !== undefined ? st.done[t.id] : t.done);
    const openWork = allWorkTasks.filter(t => !isDoneW(t));

    /* ---- admin ---- */
    const SEV = {high:RED, medium:AMBER, low:DIM};
    const adminCard = ADMIN_CARDS.find(c => c.id === st.adminOpen) || ADMIN_CARDS[0];
    const badgeTint = (kind) => kind === "bad" ? "background:var(--bad-soft);color:" + RED
      : kind === "warn" ? "background:var(--warn-soft);color:" + AMBER
      : "background:var(--chip);color:" + BODY;
    const adminRows = (card) => (card.rows || []).map((r, i) => {
      const key = card.id + ":" + i;
      const isToggle = r.length > 2;
      const on = st.adminFlags[key] !== undefined ? st.adminFlags[key] : r[2] === true;
      return {label:r[0], note:r[1] || "", hasNote: !!r[1] && isToggle,
        isValue: !isToggle && !!r[1], value:r[1] || "",
        isToggle,
        trackBg: on ? "var(--accent)" : "var(--track)",
        knobLeft: on ? "19px" : "3px",
        knobBg: on ? "var(--on-accent)" : DIM,
        toggle: () => this.setState(p => ({adminFlags: Object.assign({}, p.adminFlags, {[key]: !on})}))};
    });

    const roster = PEOPLE.concat(st.peopleExtra || []);
    const statusTint = {active:[GREEN,"var(--ok-soft)"], external:["#f0c04b","var(--warn-soft)"], inactive:[DIM,"var(--track)"], suspended:[RED,"var(--bad-soft)"]};
    const peopleModel = {
      total: roster.length,
      active: roster.filter(p => p[4] === "active").length,
      external: roster.filter(p => p[4] === "external").length,
      suspended: roster.filter((p, i) => (st.peopleSuspended || {})[p[2]]).length,
      addOpen: !!st.peopleAddOpen,
      toggleAdd: () => this.setState(p => ({peopleAddOpen: !p.peopleAddOpen, peopleForm: {name:"", email:"", role:"Standard"}})),
      form: st.peopleForm || {name:"", email:"", role:"Standard"},
      setName: (e) => this.setState(p => ({peopleForm: Object.assign({}, p.peopleForm, {name:e.target.value})})),
      setEmail: (e) => this.setState(p => ({peopleForm: Object.assign({}, p.peopleForm, {email:e.target.value})})),
      /* Custom account types live alongside the four built-ins. */
      roleChoices: ROLE_LEVELS.concat((st.customRoles || []).map(r => r.name)).map(r => ({label:r,
        style: "height:28px;padding:0 12px;border-radius:var(--r-ctl,9px);font-size:11.5px;cursor:pointer;border:1px solid var(--border);"
          + ((st.peopleForm || {}).role === r ? "background:var(--pill-bg);color:var(--pill-ink);box-shadow:0 2px 5px rgba(0,0,0,.34),0 6px 16px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.5);" : "background:var(--surface-2);color:var(--body)"),
        pick: () => this.setState(p => ({peopleForm: Object.assign({}, p.peopleForm, {role:r})}))})),
      newRoleOpen: !!st.roleBuilderOpen,
      openNewRole: () => this.setState({roleBuilderOpen:true,
        roleDraft:{name:"", scope:"All records", grants:{view:true}}}),
      closeNewRole: () => this.setState({roleBuilderOpen:false}),
      roleDraft: st.roleDraft || {name:"", scope:"All records", grants:{view:true}},
      setRoleName: (e) => this.setState(p => ({roleDraft: Object.assign({}, p.roleDraft, {name:e.target.value})})),
      roleScopes: ROLE_SCOPES.map(sc => ({label:sc,
        style: "height:28px;padding:0 12px;border-radius:var(--r-ctl,9px);font-size:11.5px;cursor:pointer;border:1px solid var(--border);"
          + (((st.roleDraft || {}).scope || "All records") === sc
              ? "background:var(--accent);border-color:var(--accent);color:var(--on-accent)"
              : "background:var(--surface-2);color:var(--body)"),
        pick: () => this.setState(p => ({roleDraft: Object.assign({}, p.roleDraft, {scope:sc})}))})),
      roleGrants: GRANT_DEFS.map(g => {
        const on = !!(((st.roleDraft || {}).grants) || {})[g[0]];
        return {label:g[1], meta:g[2],
          style: "display:flex;align-items:center;gap:10px;width:100%;padding:9px 11px;border-radius:var(--r-md,12px);cursor:pointer;text-align:left;"
            + "transition:background .18s var(--ease),border-color .18s var(--ease);"
            + (on ? "background:var(--accent-faint);border:1px solid var(--accent-line)"
                  : "background:var(--surface-2);border:1px solid var(--border)"),
          boxStyle: "width:16px;height:16px;flex:none;border-radius:5px;display:flex;align-items:center;justify-content:center;"
            + (on ? "background:var(--accent-fill,var(--accent));color:var(--on-accent);box-shadow:var(--accent-glow,none)" : "background:var(--track);color:transparent"),
          on,
          toggle: () => this.setState(p => {
            const gr = Object.assign({}, (p.roleDraft || {}).grants);
            if (gr[g[0]]) delete gr[g[0]]; else gr[g[0]] = true;
            return {roleDraft: Object.assign({}, p.roleDraft, {grants:gr})};
          })};
      }),
      grantCount: String(Object.keys(((st.roleDraft || {}).grants) || {}).length) + " of " + GRANT_DEFS.length + " granted",
      canSaveRole: !!(((st.roleDraft || {}).name) || "").trim(),
      saveRole: () => {
        const d = st.roleDraft || {};
        if (!(d.name || "").trim()) return;
        this.setState(p => ({
          customRoles: (p.customRoles || []).concat([{name:d.name.trim(), scope:d.scope, grants:d.grants || {}}]),
          roleBuilderOpen:false,
          peopleForm: Object.assign({}, p.peopleForm, {role:d.name.trim()})
        }));
      },
      customRoles: (st.customRoles || []).map((r, i) => ({
        name:r.name, scope:r.scope,
        grants: Object.keys(r.grants || {}).length + " grants",
        remove: () => this.setState(p => ({customRoles: (p.customRoles || []).filter((_, k) => k !== i)}))
      })),
      hasCustomRoles: (st.customRoles || []).length > 0,
      canAdd: !!((st.peopleForm || {}).name || "").trim() && !!((st.peopleForm || {}).email || "").trim(),
      addAccount: () => {
        const f = st.peopleForm || {};
        if (!f.name || !f.email) return;
        const entry = [f.name, "Invited", f.email, "-", "active", f.role || "Standard", "Just invited"];
        this.setState(p => ({peopleExtra: (p.peopleExtra || []).concat([entry]), peopleAddOpen:false, peopleForm:{name:"",email:"",role:"Standard"}}));
      },
      rows: roster.map((p, i) => {
        const key = p[2], suspended = !!(st.peopleSuspended || {})[key];
        const status = suspended ? "suspended" : p[4];
        const t = statusTint[status] || statusTint.active;
        const role = (st.peopleRole || {})[key] || p[5];
        const perms = Object.assign({}, DEFAULT_PERMS[role], (st.peoplePerm || {})[key]);
        const expanded = st.peopleExpanded === key;
        const initials = p[0].split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase();
        return {
          key, name:p[0], jobTitle:p[1], email:p[2], location:p[3], lastActive:p[6], initials,
          statusLabel: suspended ? "Suspended" : status.charAt(0).toUpperCase() + status.slice(1),
          statusStyle: "flex:none;padding:3px 9px;border-radius:var(--chip-r,6px);font-size:10.5px;font-weight:500;background:" + t[1] + ";color:" + t[0],
          role,
          cycleRole: () => {
            const idx = ROLE_LEVELS.indexOf(role);
            const next = ROLE_LEVELS[(idx + 1) % ROLE_LEVELS.length];
            this.setState(p2 => ({peopleRole: Object.assign({}, p2.peopleRole, {[key]:next}),
              peoplePerm: Object.assign({}, p2.peoplePerm, {[key]: DEFAULT_PERMS[next]})}));
          },
          expanded, chevronStyle: "transition:transform .2s var(--ease);transform:rotate(" + (expanded ? "180deg" : "0deg") + ")",
          toggleExpand: () => this.setState(p2 => ({peopleExpanded: p2.peopleExpanded === key ? null : key})),
          perms: PERM_KEYS.map(pk => ({label:pk[1], on: !!perms[pk[0]],
            trackBg: perms[pk[0]] ? "var(--accent)" : "var(--track)", knobLeft: perms[pk[0]] ? "18px" : "3px", knobBg: perms[pk[0]] ? "var(--on-accent)" : "var(--dim)",
            toggle: () => this.setState(p2 => ({peoplePerm: Object.assign({}, p2.peoplePerm,
              {[key]: Object.assign({}, perms, {[pk[0]]: !perms[pk[0]]})})}))})),
          suspendLabel: suspended ? "Restore access" : "Suspend",
          toggleSuspend: () => this.setState(p2 => ({peopleSuspended: Object.assign({}, p2.peopleSuspended, {[key]: !suspended})}))
        };
      })
    };

    /* Each connection reads as a pairing — Pulse on the left, the system on the
       right, joined by a live link whose colour carries the status. */
    const integrationsModel = {
      cards: INTEGRATIONS.map((it, idx) => {
        const kindTint = {ok:[GREEN,"var(--ok-soft)"], warn:[AMBER,"var(--warn-soft)"], bad:[RED,"var(--bad-soft)"], off:[DIM,"var(--track)"]}[it.statusKind];
        const live = it.statusKind === "ok" || it.statusKind === "warn";
        const link = it.statusKind === "ok" ? "var(--accent)" : it.statusKind === "bad" ? RED : it.statusKind === "off" ? "var(--track)" : AMBER;
        const on = (st.intOff || {})[it.name] ? false : it.statusKind !== "off";
        const tint = it.tint === "var(--accent)" ? "var(--accent)" : it.tint;
        const alpha = (hex, a) => hex.charAt(0) === "#" ? hex + a : hex;
        return {name:it.name, glyph:it.glyph, blurb:it.blurb,
          pairTitle: "Pulse + " + it.name,
          status:it.status,
          statusStyle:"flex:none;padding:3px 10px;border-radius:var(--chip-r,7px);font-size:10.5px;font-weight:500;background:" + kindTint[1] + ";color:" + kindTint[0],
          lastSync:it.lastSync, usage:it.usage, auth:it.auth,
          hasScopes: it.scopes.length > 0,
          scopes: it.scopes.map(sc => ({label:sc})),
          /* header art: dotted mesh + a bloom behind the two tiles */
          artStyle: "position:relative;height:124px;display:flex;align-items:center;justify-content:center;gap:0;overflow:hidden;"
            + "background:radial-gradient(120% 140% at 50% 120%, " + alpha(link, "26") + " 0%, transparent 62%),"
            + "radial-gradient(90% 120% at 50% -20%, rgba(255,255,255,.05) 0%, transparent 60%), var(--surface-2);"
            + "border-bottom:1px solid var(--border)",
          meshStyle: "position:absolute;inset:0;pointer-events:none;opacity:.5;"
            + "background-image:radial-gradient(" + alpha(link, "55") + " 1px, transparent 1px);"
            + "background-size:9px 9px;"
            + "-webkit-mask-image:radial-gradient(120% 130% at 50% 118%, #000 0%, transparent 66%);"
            + "mask-image:radial-gradient(120% 130% at 50% 118%, #000 0%, transparent 66%)",
          pulseTileStyle: "position:relative;z-index:1;width:58px;height:58px;flex:none;border-radius:var(--card-r,18px);display:flex;align-items:center;justify-content:center;"
            + "background:var(--surface-strong);border:1px solid var(--border-strong);color:var(--accent);box-shadow:0 10px 26px rgba(0,0,0,.4)",
          appTileStyle: "position:relative;z-index:1;width:58px;height:58px;flex:none;border-radius:var(--card-r,18px);display:flex;align-items:center;justify-content:center;"
            + "background:linear-gradient(160deg," + alpha(tint, "3a") + "," + alpha(tint, "14") + "), var(--surface-strong);"
            + "border:1px solid " + alpha(tint, "66") + ";color:" + tint
            + ";box-shadow:0 10px 26px rgba(0,0,0,.4),inset 0 1px 0 " + alpha(tint, "33"),
          wireStyle: "position:relative;z-index:0;width:58px;height:2px;flex:none;border-radius:2px;background:linear-gradient(90deg,"
            + alpha(link, "00") + "," + link + "," + alpha(link, "00") + ");box-shadow:0 0 12px " + link,
          sparkStyle: "position:absolute;top:-2px;left:0;width:14px;height:6px;border-radius:3px;background:" + link
            + ";filter:blur(2px);" + (live ? "animation:wireRun 2.6s var(--ease) " + (idx * 240) + "ms infinite" : "opacity:0"),
          toggleTrackStyle: "position:relative;width:46px;height:26px;flex:none;border-radius:var(--r-ctl,13px);cursor:pointer;border:1px solid "
            + (on ? "var(--accent)" : "var(--border)") + ";background:" + (on ? "var(--accent)" : "var(--track)")
            + ";transition:background .24s var(--ease),border-color .24s var(--ease)",
          toggleKnobStyle: "position:absolute;top:2px;left:" + (on ? "22px" : "2px") + ";width:20px;height:20px;border-radius:var(--r-sm,10px);"
            + "background:" + (on ? "var(--on-accent)" : "var(--dim)") + ";transition:left .24s var(--ease),background .24s var(--ease)",
          toggle: () => this.setState(p => ({intOff: Object.assign({}, p.intOff, {[it.name]: on})})),
          actionLabel: it.statusKind === "bad" ? "Reconnect" : it.statusKind === "off" ? "Connect" : "View integration",
          actionStyle: "height:32px;padding:0 14px;border-radius:var(--r-ctl,10px);font-size:12.5px;cursor:pointer;transition:border-color .2s var(--ease),color .2s var(--ease);"
            + (it.statusKind === "bad"
                ? "background:var(--bad-soft);border:1px solid " + RED + ";color:" + RED
                : "background:var(--surface-2);border:1px solid var(--border);color:var(--body)")};
      })
    };

    const appearanceModel = {
      groups: ["Dark","Light"].map(g => ({
        label: g,
        cards: THEMES.filter(t => t.group === g).map(t => {
          const on = st.theme === t.id;
          return {label:t.label, on,
            cardStyle: "text-align:left;padding:12px;border-radius:var(--card-r,18px);cursor:pointer;background:var(--chip);"
              + "transition:border-color .2s var(--ease),transform .18s var(--ease);"
              + "border:1.5px solid " + (on ? "var(--accent)" : "var(--chip-border)"),
            mockStyle: "position:relative;height:74px;border-radius:var(--r-md,14px);overflow:hidden;background:" + t.bg + ";border:1px solid rgba(127,127,127,.18)",
            barStyle: "position:absolute;left:0;top:0;bottom:0;width:20%;background:" + t.surface,
            cardMockStyle: "position:absolute;left:26%;top:14%;right:8%;height:34%;border-radius:var(--r-sm,9px);background:" + t.surface,
            dotStyle: "position:absolute;left:31%;top:60%;width:9px;height:9px;border-radius:2px;background:" + t.accent,
            lineStyle: "position:absolute;left:45%;top:62%;right:12%;height:5px;border-radius:2px;background:" + t.ink + ";opacity:.16",
            pick: () => this.setState({theme:t.id})};
        })
      }))
    };

    const adminModel = {
      company: "Jod-Z",
      urgent: [
        [String(jodzState().approvals.filter(a => a.status === "Awaiting approval").length), "approvals awaiting the owner", AMBER, "var(--warn-soft)", "wf"],
        ["0", "live integrations, all data simulated", AMBER, "var(--warn-soft)", "integrations"],
        ["1", "accounting provider to confirm", AMBER, "var(--warn-soft)", "integrations"],
        ["4", "demo users with access", GREEN, "var(--ok-soft)", "people"]
      ].map(u => ({count:u[0], label:u[1], dot:u[2], border:u[3],
        go: () => this.setState({adminOpen:u[4]})})),
      panelAnim: "animation:" + ((st.adminTick || 0) ? "panelSwapB" : "panelSwapA")
        + " .46s cubic-bezier(.16,1,.28,1) both",
      groups: ADMIN_GROUPS.filter(grp => !st.adminGroup || grp[0] === st.adminGroup).map(grp => ({
        label: grp[0], cols: grp[1], count: String(ADMIN_CARDS.filter(c => c.group === grp[0]).length),
        thumbStyle: (() => {
          const list = ADMIN_CARDS.filter(c => c.group === grp[0]);
          const at = list.findIndex(c => c.id === adminCard.id);
          const y = at < 0 ? 0 : at * 43;
          return "position:absolute;left:0;right:0;top:0;height:40px;border-radius:var(--r-md,14px);pointer-events:none;"
            + "background:var(--accent-faint);box-shadow:inset 3px 0 0 var(--accent),inset 0 0 0 1px var(--accent-line);"
            + "transform:translateY(" + y + "px);opacity:" + (at < 0 ? "0" : "1")
            + ";transition:transform .42s cubic-bezier(.22,.9,.16,1),opacity .24s var(--ease)";
        })(),
        cards: ADMIN_CARDS.filter(c => c.group === grp[0]).map((c, ci) => {
          const on = c.id === adminCard.id;
          return {
          delay: (ci * 60) + "ms",
          title:c.title, blurb:c.blurb, icon:ADMIN_ICONS[c.icon], tint:c.tint, tags:c.tags,
          hasBadge: !!c.badge, badge: c.badge || "",
          badgeStyle: "flex:none;padding:3px 9px;border-radius:var(--chip-r,6px);font-size:10.5px;font-weight:500;white-space:nowrap;" + badgeTint(c.badgeKind),
          navStyle: "position:relative;z-index:1;display:flex;align-items:center;gap:10px;width:100%;height:40px;padding:0 12px 0 " + (on ? "14px" : "12px")
            + ";border:0;border-radius:var(--r-md,14px);cursor:pointer;font-size:13px;text-align:left;background:none;"
            + "transition:color .22s var(--ease),padding-left .38s cubic-bezier(.22,.9,.16,1);"
            + (on ? "color:var(--ink);font-weight:600" : "color:var(--dim)"),
          navIconWrap: "flex:none;width:26px;height:26px;border-radius:var(--r-sm,9px);display:flex;align-items:center;justify-content:center;color:" + (on ? c.tint : "var(--faint)"),
          navBadgeStyle: "flex:none;padding:2px 7px;border-radius:var(--chip-r,6px);font-size:9.5px;font-weight:500;white-space:nowrap;" + badgeTint(c.badgeKind),
          hasFooter: !!c.footer, footer: c.footer || "", action: c.action || "",
          open: () => this.setState(p => ({adminOpen:c.id, adminTick:((p.adminTick || 0) + 1) % 2}))
        };})
      })),
      panelOpen: !!adminCard,
      close: () => this.setState({adminOpen:null}),
      panel: adminCard ? {
        group: adminCard.group, title: adminCard.title,
        icon: ADMIN_ICONS[adminCard.icon], tint: adminCard.tint, blurb: adminCard.blurb,
        hasHero: !!adminCard.heroText, heroLabel: adminCard.heroLabel || "",
        heroText: adminCard.heroText || "", heroAction: adminCard.heroAction || "",
        hasIssues: !!adminCard.issues,
        isDataHealth: adminCard.id === "health",
        health: adminCard.trend ? (() => {
          const peak = Math.max.apply(null, adminCard.trend);
          const first = adminCard.trend[0], last = adminCard.trend[adminCard.trend.length - 1];
          const pctDown = Math.round(100 * (first - last) / first);
          return {
            summary: "Open issues fallen " + pctDown + "% over the last 7 scans",
            bars: adminCard.trend.map((v, i, arr) => ({
              h: Math.max(6, Math.round(100 * v / peak)) + "%",
              bg: i === arr.length - 1 ? "var(--accent)" : "var(--track)",
              value: v
            })),
            severity: adminCard.bySeverity.map(s => ({
              label:s[0], count:s[1],
              pct: Math.round(100 * Number(s[1]) / adminCard.bySeverity.reduce((n, x) => n + Number(x[1]), 0)) + "%",
              bg: s[2]
            }))
          };
        })() : null,
        issues: (adminCard.issues || []).map(it => ({title:it[0], count:it[1],
          dot: SEV[it[2]] || DIM, fix:it[3], action:it[4]})),
        listLabel: adminCard.listLabel || "SETTINGS",
        rows: adminRows(adminCard),
        audit: "Every change here is written to the audit log as you",
        isPeople: adminCard.id === "people", isIntegrations: adminCard.id === "integrations",
        isAppearance: adminCard.id === "appearance",
        showGenericRows: adminCard.id !== "people" && adminCard.id !== "integrations" && adminCard.id !== "appearance" && adminRows(adminCard).length > 0,
        people: adminCard.id === "people" ? peopleModel : null,
        integrations: adminCard.id === "integrations" ? integrationsModel : null,
        appearance: adminCard.id === "appearance" ? appearanceModel : null
      } : {rows:[], issues:[]}
    };

    const ago = (at) => {
      const s = Math.max(1, Math.round((Date.now() - at) / 1000));
      return s < 60 ? s + " seconds ago" : s < 3600 ? Math.round(s / 60) + " min ago" : Math.round(s / 3600) + " h ago";
    };

    const g = this.graph, live = this.searches || [];

    const oq = st.ontoQuery || "", ontoSearchRes = st.ontoResult;

    const areaDef = ASPECT_DEFS.find(x => x.id === st.aspect);
    const areaLabel = areaDef ? areaDef.label : st.aspect;
    const chip = (on) => "height:31px;padding:0 14px;border-radius:var(--r-ctl,9px);cursor:pointer;font-size:12.5px;white-space:nowrap;"
      + "transition:background .2s var(--ease),border-color .2s var(--ease),color .2s var(--ease),transform .18s var(--ease);"
      + (on ? "background:var(--accent-faint);border:1px solid var(--accent-line);color:var(--ink)"
            : "background:var(--surface);border:1px solid var(--border);color:var(--dim)");
    const aq = st.agentQuery.trim().toLowerCase();
    const agentMatches = st.agents.filter(a => !aq || (a.name + " " + a.role + " " + a.preview).toLowerCase().indexOf(aq) > -1);

    const segStyle = (active) => "display:flex;align-items:center;gap:7px;height:30px;padding:0 14px;border:0;border-radius:var(--r-seg,7px);cursor:pointer;font-size:12.5px;white-space:nowrap;"
      + "transition:background .24s var(--ease),color .24s var(--ease),font-weight .24s var(--ease);"
      + (active ? "background:var(--pill-bg);color:var(--pill-ink);font-weight:500;box-shadow:0 2px 5px rgba(0,0,0,.34),0 6px 16px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.5);" : "background:none;color:var(--dim)");
    // active/inactive are booleans the template branches on — a changed style string
    // on a keyless reused node does not reliably commit.
    const seg = (label, active, go, count) => ({label, go, count: count || "",
      active: !!active, inactive: !active});

    const importanceStyle = {
      critical:{dot:RED, tileBg:"var(--bad-soft)"},
      high:{dot:AMBER, tileBg:"var(--warn-soft)"},
      normal:{dot:DIM, tileBg:"var(--track)"}
    };
    const rowFor = (k) => {
      const it = ITEMS[k], expanded = st.open === k, imp = importanceStyle[it.importance];
      return Object.assign({}, it, imp, {
        expanded, chevron: expanded ? "180deg" : "0deg",
        open: () => this.setState({open: expanded ? null : k}),
        action: (e) => { if (e) e.stopPropagation(); this.setState({resolved:Object.assign({},st.resolved,{[k]:true}), open:null}); },
        ask: (e) => { if (e) e.stopPropagation(); this.ask(it.title); }
      });
    };
    const inboxKeys = openKeys.filter(k => st.inboxFilter === "All" || ITEMS[k].group === st.inboxFilter);
    const pillStyle = (active) => "height:30px;padding:0 15px;border:0;border-radius:var(--r-seg,7px);cursor:pointer;font-size:12.5px;white-space:nowrap;transition:background .24s var(--ease),color .24s var(--ease);"
      + (active ? "background:var(--pill-bg);color:var(--pill-ink);font-weight:500;box-shadow:0 2px 5px rgba(0,0,0,.34),0 6px 16px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.5);" : "background:none;color:var(--dim)");

    const TASKS = jodzTasks().filter(t => t.status !== "Done").map(t => ({id:t.id, title:t.title, due:t.dueLabel, who:t.whoInitials,
      queue:["mine","team"].concat(t.late ? ["overdue"] : []).concat(t.due <= "2026-10-03" ? ["upcoming"] : []), subject:linkLabelOf(t.link),
      priority:t.priority.toLowerCase() === "medium" ? "normal" : t.priority.toLowerCase(), late:t.late}));
    const decorateTask = (t) => {
      const done = !!st.done[t.id];
      return Object.assign({}, t, {
        checkOpacity: done ? "1" : "0",
        fill: done ? LIME : "transparent",
        ring: done ? LIME : "var(--track)",
        color: done ? FAINT : INK,
        strike: done ? "line-through" : "none",
        dueColor: done ? FAINT : (t.late ? RED : "var(--mid)"),
        showPriority: t.priority !== "normal",
        prioBg: t.priority === "high" ? "var(--warn-soft)" : "var(--track)",
        prioColor: t.priority === "high" ? AMBER : DIM,
        toggle: () => this.setState({done:Object.assign({},st.done,{[t.id]:!done})})
      });
    };
    const queueCounts = {
      mine: TASKS.filter(t => t.queue.includes("mine")).length,
      team: TASKS.filter(t => t.queue.includes("team")).length,
      overdue: TASKS.filter(t => t.queue.includes("overdue")).length,
      upcoming: TASKS.filter(t => t.queue.includes("upcoming")).length,
      unassigned: TASKS.filter(t => t.queue.includes("unassigned")).length,
      all: TASKS.length
    };
    const queues = [["mine","My work"],["team","Team"],["overdue","Overdue"],["upcoming","Next 7 days"],["unassigned","Unassigned"],["all","Everything"]].map(q => ({
      label:q[1], count:String(queueCounts[q[0]]),
      style: pillStyle(st.queue === q[0]) + ";display:flex;align-items:center;gap:8px",
      countStyle: "font-family:"+MONO+";font-size:10.5px;color:" + (st.queue === q[0] ? "var(--pill-ink)" : FAINT),
      pick: () => this.setState({queue:q[0]})
    }));
    const queueTasks = (st.queue === "all" ? TASKS : TASKS.filter(t => t.queue.includes(st.queue))).map(decorateTask);

    const APPROVALS = jodzState().approvals.map(ap => {
      const waiting = ap.status === "Awaiting approval";
      return {id:ap.id, title:ap.title + " · " + ap.value, subject:ap.kind + " · raised by " + ap.requestedBy, age: ap.raised.slice(5).split("-").reverse().join("/"),
        status: waiting ? "awaiting you" : ap.status === "Declined" ? "declined" : "approved in demo",
        steps:[{who:ap.requestedBy, state:"raised " + ap.raised.slice(5).split("-").reverse().join("/"), dot:GREEN},
               {who:"Aoibhe Dunleavy", state: waiting ? "pending" : ap.status.toLowerCase(), dot: waiting ? AMBER : GREEN}],
        work:{viewLabel:"Open"}, _ap:ap};
    });
    const bucketOf = (a) => a._ap.status === "Awaiting approval" ? "Awaiting you" : "Decided";
    const APPROVAL_COUNTS = {"Awaiting you":0, "Awaiting others":0, "Decided":0};
    APPROVALS.forEach(a => { APPROVAL_COUNTS[bucketOf(a)] += 1; });
    const approvals = APPROVALS.filter(a => bucketOf(a) === st.approvalFilter).map(a => Object.assign({}, a, {
      pending: a.status === "awaiting you",
      statusBg: a.status !== "awaiting you" ? "var(--ok-soft)" : "var(--warn-soft)",
      statusColor: a.status !== "awaiting you" ? GREEN : AMBER,
      viewLabel: "Open",
      openWork: () => jodzOpenDrawer("approval", a.id),
      approve: () => jodzDecide(a.id, true)
    }));

    const cell = (v, opts) => Object.assign({v, isText:true, isBadge:false, avatar:false, font:"inherit", size:"13px", color:INK, avatarRadius:"50%", initials:"", badgeBg:"", badgeColor:""}, opts || {});
    const initials = (name) => name.split(" ").map(w => w[0].toUpperCase()).slice(0,2).join("");
    const statusBadge = (s) => {
      const map = {active:[GREEN,"var(--ok-soft)"], external:[DIM,"var(--track)"], inactive:[FAINT,"var(--track)"],
        "on stop":[RED,"var(--bad-soft)"], watch:[AMBER,"var(--warn-soft)"], "lease review":[AMBER,"var(--warn-soft)"]};
      const c = map[s] || [DIM,"var(--track)"];
      return cell(s, {isBadge:true, isText:false, badgeColor:c[0], badgeBg:c[1]});
    };

    // Deltas are tinted against the card they sit on: the lime tile has dark ink,
    // so the dark-card GREEN/AMBER/RED tokens are illegible on it.
    const delta = (dir, cardBg) => {
      const onLight = cardBg === LIME;
      if (onLight) return dir === "down" ? "var(--bad-on-accent)" : "var(--on-accent-2)";
      return dir === "up" ? GREEN : dir === "down" ? RED : AMBER;
    };
    const bars = (arr, hot) => arr.map((v,i,a) => ({h: Math.max(3, Math.round(v*28))+"px", bg: i === a.length-1 ? hot : "var(--track)"}));
    const limeBars = (arr) => arr.map((v,i,a) => ({h: Math.max(3, Math.round(v*28))+"px", bg: i === a.length-1 ? "var(--on-accent-strong)" : "var(--on-accent-soft)"}));
    const rangeLabel = {"7d":"7 days","30d":"30 days","90d":"90 days"}[st.range];
    const scale = {"7d":0.3,"30d":1,"90d":2.7}[st.range];
    const money = (n) => "€" + Math.round(n*scale).toLocaleString("en-IE");

    const metricGroups = [
      {title:"Operations", description:"Universal measures every deployment has.", hasBreakdown:true,
       metrics:[
        {label:"Revenue", value:money(412800), change:"+6.2%", changeColor:delta("up", LIME), hint:"vs previous "+rangeLabel,
         cardBg:LIME, cardBorder:LIME, ink:"var(--on-accent)", bars:limeBars([.4,.55,.44,.62,.5,.7,.6,.78,.68,1])},
        {label:"Tasks completed", value:String(Math.round(126*scale)), change:"+4", changeColor:delta("up"), hint:"7 overdue",
         cardBg:"var(--surface)", cardBorder:"var(--track)", ink:INK, bars:bars([.5,.6,.44,.7,.55,.75,.62,.8,.7,.9], LIME)},
        {label:"Overdue tasks", value:String(Math.max(1, Math.round(11*Math.min(scale,1.4)))), change:"+3", changeColor:delta("down"), hint:"worse than before",
         cardBg:"var(--surface)", cardBorder:"var(--bad-soft)", ink:INK, bars:bars([.3,.36,.3,.44,.4,.5,.46,.6,.7,.85], RED)},
        {label:"Approvals waiting", value:String(approvals.filter(a => a.pending).length), change:"−1", changeColor:delta("up"), hint:"oldest 18m",
         cardBg:"var(--surface)", cardBorder:"var(--track)", ink:INK, bars:bars([.4,.5,.44,.6,.5,.55,.48,.6,.5,.45], AMBER)}
       ],
       breakdown:[
        {key:"Online", value:money(18000), pct:"75%", color:LIME},
        {key:"Wholesale", value:money(6000), pct:"25%", color:"var(--track)"}
       ]},
      {title:"site-visits", description:"Contributed by an installed module.", hasBreakdown:false,
       metrics:[
        {label:"Visits completed", value:String(Math.round(38*scale)), change:"+11%", changeColor:delta("up"), hint:"vs previous "+rangeLabel,
         cardBg:"var(--surface)", cardBorder:"var(--track)", ink:INK, bars:bars([.4,.5,.6,.5,.66,.6,.72,.66,.8,.9], LIME)},
        {label:"Unassigned", value:"1", change:"-", changeColor:delta("flat"), hint:"Thursday 09:00",
         cardBg:"var(--surface)", cardBorder:"var(--warn-soft)", ink:INK, bars:bars([.2,.3,.2,.4,.3,.25,.2,.3,.25,.4], AMBER)},
        {label:"Average duration", value:"1h 48m", change:"−6m", changeColor:delta("up"), hint:"across completed visits",
         cardBg:"var(--surface)", cardBorder:"var(--track)", ink:INK, bars:bars([.6,.55,.6,.5,.55,.48,.5,.46,.44,.4], LIME)},
        {label:"Cancelled", value:String(Math.round(3*scale)), change:"+1", changeColor:delta("flat"), hint:"client-side",
         cardBg:"var(--surface)", cardBorder:"var(--track)", ink:INK, bars:bars([.2,.24,.2,.3,.26,.34,.3,.4,.36,.5], AMBER)}
       ], breakdown:[]}
    ];

    const runBar = (state) => ({ok:"var(--accent)", partial:"var(--warn)", failed:"var(--bad)", idle:"var(--track)"})[state];
    const runs = (pattern) => pattern.map(p => ({bg:runBar(p), label:p}));
    const automations = [
      {name:"Overdue invoice reminder", state:"live", stateBg:"var(--ok-soft)", stateColor:GREEN,
       trigger:"schedule · weekdays 09:00", actions:[{label:"reminder.draft", border:"var(--track)", color:BODY},{label:"approval.request", border:"var(--track)", color:BODY}],
       lastRun:"Today 06:45", result:"1 drafted · 0 sent", resultColor:AMBER, hasRuns:true, runSummary:"demo runs, simulated",
       runs:runs(["idle","idle","idle","idle","idle","idle","idle","idle","idle","idle","idle","ok","ok","partial"])},
      {name:"Wholesale shortage watch", state:"live", stateBg:"var(--ok-soft)", stateColor:GREEN,
       trigger:"event · order confirmed or stock moved", actions:[{label:"tasks.create", border:"var(--track)", color:BODY}],
       lastRun:"Today 06:41", result:"1 shortage", resultColor:AMBER, hasRuns:true, runSummary:"demo runs, simulated",
       runs:runs(["ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","ok"])},
      {name:"Shopify order sync", state:"live", stateBg:"var(--ok-soft)", stateColor:GREEN,
       trigger:"schedule · hourly (demo connection)", actions:[{label:"shopify.orders.read", border:"var(--track)", color:BODY}],
       lastRun:"Today 06:00", result:"simulated data", resultColor:GREEN, hasRuns:true, runSummary:"simulated",
       runs:runs(["ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","ok"])}
    ];

    const health = [
      {label:"Events waiting", value:"0", hint:"demo queue", color:INK, border:"var(--track)"},
      {label:"Drafts awaiting a person", value:"3", hint:"reminder, purchase, partial dispatch", color:AMBER, border:"var(--warn-soft)"},
      {label:"Live connections", value:"0", hint:"all integrations are simulated", color:INK, border:"var(--track)"},
      {label:"Failed runs", value:"0", hint:"last 14 days", color:INK, border:"var(--track)"}
    ];
    const failures = [
      {name:"Overdue invoice reminder", status:"partial", error:"reminder drafted, sending is not connected in the demo", at:"06:45", tagBg:"var(--warn-soft)", tagColor:AMBER}
    ];
    const calls = [
      {tool:"shopify.orders.read (simulated)", status:"ok", ms:"demo", at:"06:00", tagBg:"var(--ok-soft)", tagColor:GREEN},
      {tool:"stock.variants.read", status:"ok", ms:"demo", at:"06:40", tagBg:"var(--ok-soft)", tagColor:GREEN},
      {tool:"invoices.reminder.draft", status:"ok", ms:"demo", at:"06:45", tagBg:"var(--ok-soft)", tagColor:GREEN},
      {tool:"csv.import.preview", status:"ok", ms:"demo", at:"Fri", tagBg:"var(--ok-soft)", tagColor:GREEN}
    ];

    const modules = [
      {label:"Pulse Core", id:"core", version:"0.1.0", state:"always installed", bg:"var(--surface)", border:"var(--track)",
       stateBg:"var(--track)", stateColor:BODY,
       description:"People, organisations, tasks, approvals, files and the relationships between them.",
       contributions:[{n:"4",k:"demo users"},{n:"4",k:"agents"},{n:"7",k:"workflows"}]},
      {label:"Sales & Wholesale", id:"wholesale", version:"demo", state:"installed", bg:"var(--accent-faint)", border:"var(--accent-line)",
       stateBg:"var(--accent-soft)", stateColor:LIME,
       description:"Online and wholesale sales on one page, wholesale orders with size and colour grids, allocation and simulated dispatch.",
       contributions:[{n:"1",k:"page"},{n:"8",k:"retailers"},{n:"7",k:"orders"}]},
      {label:"Inventory", id:"inventory", version:"demo", state:"installed", bg:"var(--surface)", border:"var(--track)",
       stateBg:"var(--accent-soft)", stateColor:LIME,
       description:"Stock by product, colour and size, incoming purchase orders and returns.",
       contributions:[{n:"40",k:"variants"},{n:"4",k:"purchase orders"},{n:"6",k:"returns"}]},
      {label:"Advertising", id:"ads", version:"demo", state:"installed", bg:"var(--surface)", border:"var(--track)",
       stateBg:"var(--accent-soft)", stateColor:LIME,
       description:"Meta Ads and Google Ads in one dashboard, checked against Shopify revenue and live stock. Demo connections with simulated data; proposed changes are drafts only.",
       contributions:[{n:"8",k:"campaigns"},{n:"5",k:"proposed changes"},{n:"1",k:"page"}]},
      {label:"Forecasting", id:"finance", version:"demo", state:"installed", bg:"var(--surface)", border:"var(--track)",
       stateBg:"var(--accent-soft)", stateColor:LIME,
       description:"Demand, size and colour mix, and the buying plan. A planning view, not a ledger.",
       contributions:[{n:"1",k:"page"}]}
    ];

    const notificationFeed = [
      {dot:RED, text:"Admiral Navy S: 6 available, about 2 days of cover", event:"Detected · Stock & Demand", channel:"Inbox", meta:"06:40"},
      {dot:RED, text:"JOD-W1041 for Meadow Tack is 12 units short", event:"Detected · Ops Watchdog", channel:"Inbox", meta:"06:41"},
      {dot:AMBER, text:"Reminder for JOD-INV2031 drafted, not sent", event:"Draft prepared · Finance & Cash", channel:"Inbox", meta:"06:45"},
      {dot:AMBER, text:"PO-D193 (€10,800) is awaiting your approval", event:"Awaiting approval", channel:"Inbox", meta:"Fri"},
      {dot:NEUTRAL, text:"Return RET-316 is waiting on a restock decision", event:"Simulated", channel:"Inbox", meta:"Fri"},
      {dot:NEUTRAL, text:"Your morning briefing is ready", event:"Draft prepared · Briefing", channel:"Home", meta:"07:02"}
    ];

    const FEATURES = [["approvals","Approvals"],["automations","Automations"],["insights","Insights"],["customEntities","Custom entities"],["whatsapp","Messaging channel (not connected)"],["composio","External actions (not connected)"]];
    const features = FEATURES.map(f => {
      const on = st.flags[f[0]];

    return {label:f[1], trackBg: on ? "var(--accent)" : "var(--track)", knobLeft: on ? "19px" : "3px",
        knobBg: on ? "var(--on-accent)" : "var(--dim)",
        toggle: () => this.setState({flags:Object.assign({}, st.flags, {[f[0]]:!on})})};
    });

    const q = st.query.trim();
    const ql = q.toLowerCase();
    const scope = st.palScope || "All";
    const GLYPH = {
      agent: "M12 4a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 0 1 0-7.2 M4.8 20a7.2 7.2 0 0 1 14.4 0",
      task: "M4 6h16 M4 12h16 M4 18h9",
      person: "M12 4a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 0 1 0-7.2 M4.8 20a7.2 7.2 0 0 1 14.4 0",
      org: "M4 20V7.5L12 4l8 3.5V20 M9.5 20v-5.5h5V20",
      page: "M6.5 3.5h8l4 4v13h-12z M14.5 3.5v4h4",
      action: "M13 3 4.5 14H10l-1 7 9-11h-5.5z",
      recent: "M12 7v5l3.4 2 M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9"
    };
    const recents = st.palRecent || [];
    const themeAction = st.theme === "dark" ? "Switch to light appearance" : "Switch to dark appearance";
    const SEARCH = [
      recents.length ? {group:"Recent", scope:"All", items:recents.slice(0, 3).map(r => ({title:r, meta:"Recent search", hint:"AGAIN", glyph:"recent",
        go: () => this.setState({query:r, palSel:0})}))} : null,
      {group:"Actions", scope:"Actions", items:[
        {title:"Start a new conversation", meta:"Clears the current thread", hint:"ACTION", glyph:"action",
          go: () => { clearInterval(this._t); this.setState({page:"Home", thread:[], typed:0, draft:""}); }},
        {title:themeAction, meta:"Appearance", hint:"ACTION", glyph:"action",
          go: () => this.setState(p => p.theme === "light" ? {theme: p.darkTheme || this.props.theme || "jodz"} : {theme:"light", darkTheme:p.theme})},
        {title:"Open system health", meta:"Admin · modules and jobs", hint:"ACTION", glyph:"action",
          go: () => this.setState({page:"Settings"})}
      ]},
      {group:"Pages", scope:"Pages", items:ASPECT_DEFS.slice(0, 3).map(a => ({title:a.label, meta:a.description, hint:"AREA", glyph:"page",
        go: () => this.goPage("Dashboard", {aspect:a.id})}))
        .concat([{title:"Roles and grants", meta:"Who can see and do what", hint:"CONFIG", glyph:"page",
        go: () => this.setState({page:"Settings"})}])}
    ].filter(Boolean);

    const match = g => g.items.filter(i => !ql || (i.title + " " + i.meta).toLowerCase().includes(ql));
    const scopeCounts = {All:0};
    SEARCH.forEach(g => { const n = match(g).length; scopeCounts.All += n; if (g.scope !== "All") scopeCounts[g.scope] = (scopeCounts[g.scope] || 0) + n; });
    const palScopes = ["All","Actions","Pages"].map(name => {
      const on = scope === name;
      return {label:name, count:scopeCounts[name] || 0,
        style:"flex:none;display:flex;align-items:center;gap:6px;height:26px;padding:0 11px;border-radius:var(--r-ctl,9px);cursor:pointer;font-size:12px;transition:background .2s var(--ease),color .2s var(--ease),border-color .2s var(--ease);"
          + (on ? "background:var(--pill-bg);border:1px solid var(--accent-line);color:var(--pill-ink);box-shadow:0 2px 5px rgba(0,0,0,.34),0 6px 16px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.5);" : "background:none;border:1px solid var(--border);color:var(--dim)"),
        countStyle:"font-family:var(--mono);font-size:9.5px;" + (on ? "color:var(--pill-ink);opacity:.75" : "color:var(--faint)"),
        pick: () => this.setState({palScope:name, palSel:0})};
    });

    const groups = SEARCH.filter(g => scope === "All" || g.scope === scope || g.group === "Recent")
      .map(g => ({group:g.group, items:match(g).slice(0, 6)})).filter(g => g.items.length);
    const base = q ? 1 : 0;
    const total = base + groups.reduce((n, g) => n + g.items.length, 0);
    const sel = total ? Math.max(0, Math.min(st.palSel || 0, total - 1)) : 0;
    const fresh = Date.now() - (this._palOpenedAt || 0) < 420;
    const rowBase = "display:flex;align-items:center;gap:12px;padding:9px 20px;cursor:pointer;transition:background .16s var(--ease),box-shadow .16s var(--ease)";
    const flat = [];
    const remember = (title, go) => () => {
      const list = [title].concat((st.palRecent || []).filter(r => r !== title)).slice(0, 4);
      this.setState({paletteOpen:false, query:"", palSel:0, palRecent:list});
      go();
    };
    let n = base;
    const results = groups.map((g, gi) => ({
      group:g.group, count:g.items.length,
      anim: fresh ? "animation:rowIn .34s var(--ease) " + (70 + gi * 40) + "ms both" : "",
      items:g.items.map(i => {
        const idx = n++;
        const active = idx === sel;
        const open = remember(i.title, i.go);
        flat[idx] = open;
        const at = ql ? i.title.toLowerCase().indexOf(ql) : -1;
        return {
          pre: at < 0 ? i.title : i.title.slice(0, at),
          match: at < 0 ? "" : i.title.slice(at, at + ql.length),
          post: at < 0 ? "" : i.title.slice(at + ql.length),
          meta:i.meta, hint:i.hint, icon:GLYPH[i.glyph] || GLYPH.page,
          rowStyle: rowBase + (active ? ";background:var(--surface);box-shadow:inset 2px 0 0 var(--accent)" : ""),
          iconStyle: "flex:none;width:26px;height:26px;border-radius:var(--r-sm,9px);display:flex;align-items:center;justify-content:center;border:1px solid var(--border);transition:color .16s var(--ease),border-color .16s var(--ease);"
            + (active ? "background:var(--pill-bg);border-color:var(--accent-line);color:var(--accent)" : "background:var(--surface-2);color:var(--dim)"),
          enterStyle: "flex:none;font-family:var(--mono);font-size:9px;letter-spacing:.08em;color:var(--accent);"
            + (active ? "opacity:1" : "opacity:0"),
          open, hover: () => { if (st.palSel !== idx) this.setState({palSel:idx}); }
        };
      })
    }));
    const askActive = base === 1 && sel === 0;
    /* launcher rows extend the same flat index; see below */
    if (base === 1) flat[0] = () => this.ask(q);

    /* ---- launcher (no query): page kit, frequents, recents, jump-to ---- */
    const jump = (p, extra) => () => {
      this.setState(Object.assign({page:p, paletteOpen:false, query:"", palSel:0}, extra || {}));
      if (p === "Dashboard") this.startKpiCount();
    };
    const KITS = {
      Home: [
        {title:"Ask what changed today", meta:"Briefing · demo answer", icon:ICONS.helios, go: () => { clearInterval(this._t); this.setState({paletteOpen:false, query:"", page:"Home"}); this.ask("What changed today?"); }},
        {title:"Action inbox", meta:openKeys.length + " waiting on you", icon:ICONS.inbox, go: jump("Home", {open:null})},
        {title:"Edit widgets", meta:"Rearrange the right rail", icon:ICONS.dash, go: jump("Home", {widgetEdit:true})}
      ],
      Dashboard: [
        {title:"Sales", meta:"Pipeline and quotes", icon:ICONS.insights, go: jump("Dashboard", {aspect:"sales"})},
        {title:"Cash", meta:"Owed, overdue, collected", icon:ICONS.navDash, go: jump("Dashboard", {aspect:"cash"})},
        {title:"Last 7 days", meta:"Shorten the range", icon:ICONS.autos, go: jump("Dashboard", {range:"7d"})},
        {title:"Edit metrics", meta:"Pick the five on top", icon:ICONS.dash, go: jump("Dashboard", {kpiEdit:true})}
      ],
      Settings: [
        {title:"Roles and grants", meta:"Who can see and do what", icon:ICONS.navAdmin, go: jump("Settings")},
        {title:"Installed modules", meta:"What this client runs", icon:ICONS.modules, go: jump("Settings")},
        {title:"System health", meta:"Jobs, queues, sync", icon:ICONS.health, go: jump("Settings")},
        {title:"Automations", meta:"Triggers and runs", icon:ICONS.autos, go: jump("Settings")}
      ]
    };
    const palPageRaw = KITS[page] || [
      {title:"Ask about this page", meta:"Fixture answers from the demo data", icon:ICONS.helios, go: () => { this.setState({paletteOpen:false, query:"", page:"Home"}); this.ask("What should I know about " + page + "?"); }},
      {title:"Action inbox", meta:openKeys.length + " waiting on you", icon:ICONS.inbox, go: jump("Home")}
    ];
    const FREQ = [
      {title:"Action inbox", count:"31×", icon:ICONS.inbox, go: jump("Home")},
      {title:"JOD-W1041 · Meadow Tack", count:"12×", icon:ICONS.navSales, go: () => { this.setState({paletteOpen:false, query:""}); jodzOpenRecord({kind:"order", id:"JOD-W1041"}); }},
      {title:"Buying Plan", count:"9×", icon:ICONS.navForecast, go: () => { this.setState({paletteOpen:false, query:""}); jodzGoTo("Forecasting", "buying"); }},
      {title:"Stock", count:"7×", icon:ICONS.navStock, go: () => { this.setState({paletteOpen:false, query:""}); jodzGoTo("Inventory", "stock"); }}
    ];
    const JUMPS = [
      {title:"Home", icon:ICONS.navHome, go: jump("Home")},
      {title:"Sales & Wholesale", icon:ICONS.navSales, go: jump("Dashboard")},
      {title:"Inventory", icon:ICONS.navStock, go: jump("Inventory")},
      {title:"Advertising", icon:ICONS.navAds, go: jump("Advertising")},
      {title:"Settings", icon:ICONS.navAdmin, go: jump("Settings")}
    ];
    const RECENT_WHEN = ["2 min", "18 min", "1 h", "yesterday"];
    const recentRaw = (st.palRecent || []).slice(0, 4);

    const homeCount = q ? 0 : palPageRaw.length + FREQ.length + recentRaw.length + JUMPS.length;
    const homeSel = q ? -1 : Math.max(0, Math.min(st.palSel || 0, Math.max(homeCount - 1, 0)));
    let hi = 0;
    const homeItem = (i, run) => {
      const idx = hi++;
      const active = !q && idx === homeSel;
      const open = () => { this.setState({paletteOpen:false, query:"", palSel:0}); run(); };
      if (!q) flat[idx] = open;
      return {active, open, hover: () => { if (!q && st.palSel !== idx) this.setState({palSel:idx}); }};
    };
    const tileBase = "display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:var(--r-sm,11px);cursor:pointer;text-align:left;transition:background .16s var(--ease),border-color .16s var(--ease),transform .18s var(--ease);";
    const chipBase = "display:flex;align-items:center;gap:7px;height:30px;padding:0 12px;border-radius:var(--r-ctl,11px);cursor:pointer;font-size:12px;transition:background .16s var(--ease),border-color .16s var(--ease),color .16s var(--ease);";
    const palPage = palPageRaw.map(p => {
      const h = homeItem(0, p.go);
      return {title:p.title, meta:p.meta, icon:p.icon, open:h.open, hover:h.hover,
        style: tileBase + (h.active
          ? "background:var(--surface);border:1px solid var(--accent-line);transform:translateY(-1px)"
          : "background:var(--surface-2);border:1px solid var(--border)"),
        iconStyle: "flex:none;width:26px;height:26px;border-radius:var(--r-sm,9px);display:flex;align-items:center;justify-content:center;border:1px solid var(--border);"
          + (h.active ? "background:var(--pill-bg);border-color:var(--accent-line);color:var(--accent)" : "background:var(--surface);color:var(--dim)")};
    });
    const palFrequent = FREQ.map(f => {
      const h = homeItem(0, f.go);
      return {title:f.title, count:f.count, icon:f.icon, open:h.open, hover:h.hover,
        style: chipBase + (h.active
          ? "background:var(--pill-bg);border:1px solid var(--accent-line);color:var(--pill-ink)"
          : "background:var(--surface-2);border:1px solid var(--border);color:var(--body)"),
        countStyle: "font-family:var(--mono);font-size:9.5px;" + (h.active ? "color:var(--pill-ink);opacity:.7" : "color:var(--faint)")};
    });
    const palRecentRows = recentRaw.map((r, i) => {
      const h = homeItem(0, () => this.setState({paletteOpen:false, query:r, palSel:0, palScope:"All"}));
      return {title:r, when:RECENT_WHEN[i] || "earlier", icon:GLYPH.recent, open:h.open, hover:h.hover,
        rowStyle: "display:flex;align-items:center;gap:11px;padding:9px 20px;cursor:pointer;transition:background .16s var(--ease),box-shadow .16s var(--ease);"
          + (h.active ? "background:var(--surface);box-shadow:inset 2px 0 0 var(--accent)" : ""),
        iconStyle: "flex:none;width:24px;height:24px;border-radius:8px;display:flex;align-items:center;justify-content:center;border:1px solid var(--border);"
          + (h.active ? "background:var(--pill-bg);border-color:var(--accent-line);color:var(--accent)" : "background:var(--surface-2);color:var(--dim)"),
        enterStyle: "flex:none;font-family:var(--mono);font-size:9px;color:var(--accent);" + (h.active ? "opacity:1" : "opacity:0")};
    });
    const palJump = JUMPS.map(j => {
      const h = homeItem(0, j.go);
      return {title:j.title, icon:j.icon, open:h.open, hover:h.hover,
        style: chipBase + (h.active
          ? "background:var(--pill-bg);border:1px solid var(--accent-line);color:var(--pill-ink)"
          : "background:none;border:1px solid var(--border);color:var(--dim)")};
    });

    const DIRS_ORDER = ["People","Organisations","Teams","Locations","Site visits"];
    const JODZ_SECTIONS = {
      Inventory: [["stock","Stock"],["incoming","Incoming Stock"],["returns","Returns & Adjustments"]],
      Forecasting: [["demand","Demand"],["matrix","Size & Colour"],["buying","Buying Plan"]],
      Advertising: [["overview","Overview"],["meta","Meta Ads"],["google","Google Ads"]]
    };
    const ADMIN_ORDER = ["Automations","System health","Installed modules"];
    let contextNav, contextHint, searchHint;
    if (page === "Settings"){
      contextNav = ADMIN_GROUPS.map(grp => seg(
        grp[0].charAt(0) + grp[0].slice(1).toLowerCase(),
        st.adminGroup === grp[0],
        () => this.setState({adminGroup: st.adminGroup === grp[0] ? null : grp[0]}),
        String(ADMIN_CARDS.filter(c => c.group === grp[0]).length)));
      contextHint = "ADMIN · 13 AREAS";
      searchHint = "Search settings";
    } else if (JODZ_SECTIONS[page]){
      const cur = jodzState().sections[page];
      contextNav = JODZ_SECTIONS[page].map(x => seg(x[1], cur === x[0], () => jodzSetSection(page, x[0])));
      contextHint = "JOD-Z · SNAPSHOT 26 SEP 2026";
      searchHint = "Search " + page.toLowerCase();
    } else if (page === "Home" || page === "Dashboard"){
      contextNav = [
        seg("Home", page === "Home", () => this.go("Home")),
        seg("Sales & Wholesale", page === "Dashboard", () => this.go("Dashboard"))
      ];
      contextHint = page === "Home" ? "BRIEFING · " + openKeys.length + " WAITING" : "JOD-Z · LAST 30 DAYS";
      searchHint = page === "Dashboard" ? "Search orders and retailers" : "Search every record you can see";
    } else if (page === "Action inbox"){
      contextNav = ["All","Approvals","Alerts","Work","Automations"].map(fl =>
        seg(fl, st.inboxFilter === fl, () => this.setState({inboxFilter:fl, open:null}),
          fl === "All" ? String(openKeys.length) : String(openKeys.filter(k => ITEMS[k].group === fl).length)));
      contextHint = "PROVIDERS · CORE + MODULES";
      searchHint = "Search the inbox";
    } else if (page === "Insights"){
      contextNav = [["7d","7 days"],["30d","30 days"],["90d","90 days"]].map(r => seg(r[1], st.range === r[0], () => this.setState({range:r[0]})));
      contextHint = "METRICS FROM THE REGISTRY";
      searchHint = "Search metrics";
    } else if (DIRS_ORDER.indexOf(page) > -1){
      contextNav = DIRS_ORDER.map(d => seg(d, page === d, () => this.go(d)));
      contextHint = "DIRECTORY · SPINE-BACKED";
      searchHint = "Search " + page.toLowerCase();
    } else if (page === "Approvals"){
      contextNav = ["Awaiting you","Awaiting others","Decided"].map(s =>
        seg(s, st.approvalFilter === s, () => this.setState({approvalFilter:s}),
          String(APPROVAL_COUNTS[s])));
      contextHint = "STEPS · CORE:APPROVAL:DECIDE";
      searchHint = "Search approvals";
    } else if (ADMIN_ORDER.indexOf(page) > -1){
      contextNav = ADMIN_ORDER.map(a => seg(a, page === a, () => this.go(a)));
      contextHint = "ADMIN · CORE:AUTOMATION:VIEW";
      searchHint = "Search automations and runs";
    } else if (page === "Settings"){
      contextNav = ADMIN_GROUPS.map(g => seg(g.name.charAt(0) + g.name.slice(1).toLowerCase(), false, () => {}));
      contextHint = "ADMIN · CONFIGURATION";
      searchHint = "Search settings";
    } else {
      contextNav = [seg(page, true, () => {}), seg("Home", false, () => this.go("Home"))];
      contextHint = "CLIENT CONFIG";
      searchHint = "Search this page";
    }

    // Below these widths the nav keeps its room and the softer furniture gives way:
    // the context hint first, then the search label, then the profile text.
    const roomy = st.w >= 1320, mid = st.w >= 1120;
    return {
      nav, contextNav, contextHint, searchHint, queueTasks,
      admin: adminModel,

      /* rail */
      railOuter: "position:relative;z-index:2;width:" + (railOpen ? "252px" : "68px")
        + ";flex:none;display:flex;flex-direction:column;align-items:" + (railOpen ? "stretch" : "center")
        + ";gap:4px;padding:22px " + (railOpen ? "16px" : "0") + " 16px"
        + ";background:transparent;"
        + "overflow-y:auto;overflow-x:hidden;scrollbar-width:none;"
        + "transition:width .32s var(--ease),padding .32s var(--ease)",
      brandStyle: railOpen
        ? "flex:1;min-width:0;font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;opacity:1"
        : "display:none",
      railToggleStyle: "width:28px;height:28px;flex:none;border:0;border-radius:var(--r-ctl,10px);background:none;color:var(--mid);cursor:pointer;"
        + "display:flex;align-items:center;justify-content:center;transition:background .2s var(--ease),color .2s var(--ease);"
        + (railOpen ? "" : "position:absolute;opacity:0;pointer-events:none"),
      railOpen,
      railRowStyle: "display:flex;align-items:center;gap:10px;"
        + (railOpen ? "width:100%;padding:0 10px;" : "justify-content:center;width:40px;"),
      railLabel: railOpen ? "Collapse sidebar" : "Expand sidebar",
      toggleRail: () => this.setState(prev => ({railOpen: !prev.railOpen, hovered:null})),
      settingsInlineStyle: inlineStyle(st.railHov === "settings", page === "Settings"),

      /* home widgets */
      widgetHint: st.widgetEdit ? "EDITING BOARD" : String(st.widgets.length) + " WIDGETS",
      widgetEdit: st.widgetEdit,
      toggleWidgetEdit: () => this.setState(prev => ({widgetEdit: !prev.widgetEdit})),
      widgetEditLabel: st.widgetEdit ? "Done" : "Edit",
      widgetEditBg: st.widgetEdit ? "var(--accent)" : "var(--surface)",
      widgetEditBorder: st.widgetEdit ? "var(--accent)" : "var(--border)",
      widgetEditColor: st.widgetEdit ? "var(--on-accent)" : "var(--dim)",
      widgetChoices: WIDGET_DEFS.filter(w => st.widgets.indexOf(w[0]) < 0)
        .map(w => ({label:w[1], add: () => this.toggleIn("widgets", w[0])})),
      noWidgetChoices: WIDGET_DEFS.every(w => st.widgets.indexOf(w[0]) > -1),
      show: {
        inbox: st.widgets.indexOf("inbox") > -1, work: st.widgets.indexOf("work") > -1,
        activity: st.widgets.indexOf("activity") > -1, kpi: st.widgets.indexOf("kpi") > -1,
        visits: st.widgets.indexOf("visits") > -1
      },
      removeInbox: () => this.toggleIn("widgets", "inbox"),
      removeWork: () => this.toggleIn("widgets", "work"),
      removeActivity: () => this.toggleIn("widgets", "activity"),
      removeKpi: () => this.toggleIn("widgets", "kpi"),
      removeVisits: () => this.toggleIn("widgets", "visits"),
      miniKpis: jodzNumbers(),
      visitWidget: jodzUpcoming(),

      /* dashboard */
      isDashboard: false,
      isJodz: ["Dashboard","Inventory","Forecasting","Advertising"].indexOf(page) > -1,
      jodzPage: page,
      dashTitle: "Jod-Z · " + areaLabel,
      kpiEdit: st.kpiEdit,
      toggleKpiEdit: () => this.setState(prev => ({kpiEdit: !prev.kpiEdit})),
      kpiEditLabel: st.kpiEdit ? "Done" : "Edit KPIs",
      kpiEditBg: st.kpiEdit ? "var(--on-accent)" : "var(--on-accent-soft)",
      kpiEditBorder: st.kpiEdit ? "var(--on-accent)" : "var(--on-accent-soft)",
      kpiEditColor: st.kpiEdit ? "var(--accent)" : "var(--on-accent)",
      kpiColumns: String(Math.max(1, st.kpiKeys.length)),
      kpis: st.kpiKeys.map((k, ki) => {
        const d = KPI_DEFS[k];
        const up = d.dir === "up";
        return {label:d.label, value:this.countValue(d.value, ki), delta:d.delta, hint:d.hint,
          bg: "var(--kpi-card)",
          border: "var(--kpi-card)",
          ink: "var(--kpi-ink)",
          deltaColor: up ? "var(--kpi-up)" : "var(--kpi-down)",
          arrow: up ? "M12 19V7 M6 12l6-6 6 6" : "M12 5v12 M6 12l6 6 6-6",
          arrowStyle: "flex:none;animation:" + (up ? "driftUp" : "driftDown") + " 2.4s ease-in-out "
            + (ki * 180) + "ms infinite",
          valueStyle: "font-size:22px;font-weight:500;letter-spacing:-.8px;margin-top:7px;line-height:1;"
            + "font-variant-numeric:tabular-nums;animation:kpiRoll .62s var(--ease) " + (ki * 70) + "ms both",
          remove: () => this.toggleIn("kpiKeys", k)};
      }),
      kpiChoices: Object.keys(KPI_DEFS).filter(k => st.kpiKeys.indexOf(k) < 0)
        .map(k => ({label:KPI_DEFS[k].label, add: () => this.toggleIn("kpiKeys", k)})),
      noKpiChoices: Object.keys(KPI_DEFS).every(k => st.kpiKeys.indexOf(k) > -1),
      aspectTrack: segTrack("flex:0 1 auto;overflow:hidden"),
      aspectThumb: (() => {
        const ids = ASPECT_DEFS.map(a => a.id).concat(st.extraFilters);
        return segThumb(ids.length, Math.max(0, ids.indexOf(st.aspect)), "var(--pill-bg)");
      })(),
      // One area at a time: the slider selects, it does not accumulate.
      aspects: ASPECT_DEFS.map(a => ({
        label:a.label, color:a.color,
        active: st.aspect === a.id, inactive: st.aspect !== a.id,
        pick: () => { this.setState({aspect:a.id}); this.startKpiCount(); }
      })).concat(st.extraFilters.map(name => ({
        label:name, color:"var(--accent)",
        active: st.aspect === name, inactive: st.aspect !== name,
        pick: () => { this.setState({aspect:name}); this.startKpiCount(); }
      }))),
      area: (() => {
        const a = ASPECT_DEFS.find(x => x.id === st.aspect) || synthesizeCustomArea(st.aspect);
        if (!a) return {title: st.aspect, description:"Custom filter. No metrics registered against it yet.",
          owner:"CUSTOM", color:"var(--accent)", metrics:[], chart:[], chartTitle:"No series", chartUnit:"",
          splitTitle:"No breakdown", split:[], tableCols:["Name","Value","Change","Note"], table:[]};
        const isCustom = !ASPECT_DEFS.find(x => x.id === st.aspect);
        const peak = Math.max.apply(null, a.chart.map(c => c[1]));
        return {
          title:a.label, description:a.description, owner:a.owner, color:a.color,
          isCustom, customBadge: isCustom ? "GENERATED FROM PLAIN ENGLISH" : "",
          metrics: a.metrics.map((m, mi) => ({
            delay: (mi * 70) + "ms",
            label:m[0], value:m[1], delta:m[2], hint:m[4],
            deltaColor: m[3] === "up" ? GREEN : RED,
            bars: m[5].map((v, i, arr) => ({h: Math.max(3, Math.round(v * 24)) + "px",
              bg: i === arr.length - 1 ? a.color : "var(--track)"})),
            isHero: false, cardStyle: "", valueStyle: "", barsStyle: ""
          })).map((m, i, arr) => {
            const hero = (a.kind === "columns" || a.kind === "area") && i === 0;
            const card = "display:flex;flex-direction:column;background:var(--surface);border:1px solid var(--border);border-radius:var(--card-r,18px);"
              + "backdrop-filter:blur(20px) saturate(1.3);box-shadow:var(--card-shadow);padding:18px 20px 20px;"
              + "transition:transform .32s cubic-bezier(.16,1.4,.3,1),border-color .22s var(--ease),box-shadow .3s var(--ease);"
              + "animation:springIn .5s var(--ease) both;animation-delay:" + m.delay + ";"
              + (hero ? "border-color:var(--border-strong)" : "");
            return Object.assign(m, {
              isHero: hero,
              cardStyle: card,
              valueStyle: "font-weight:500;letter-spacing:-.8px;margin-top:9px;line-height:1;font-size:" + (hero ? "34px" : "24px"),
              barsStyle: "display:flex;align-items:flex-end;gap:3px;margin-top:auto;padding-top:14px;height:" + (hero ? "40px" : "26px")
            });
          }),
          /* Structure follows the shape of the data. A trend aspect leads with
             one hero metric and a tall chart; a ranking or funnel aspect is
             short, so its metrics stay equal and the two cards share the row
             evenly — that is what keeps the second row from leaving a hole. */
          metricGrid: (a.kind === "columns" || a.kind === "area")
            ? "display:grid;grid-template-columns:1.7fr 1fr 1fr 1fr;gap:12px;align-items:stretch"
            : a.kind === "dots"
              ? "display:grid;grid-template-columns:repeat(2,1fr);gap:12px;align-items:stretch"
              : "display:grid;grid-template-columns:repeat(4,1fr);gap:12px;align-items:stretch",
          mainGrid: (a.kind === "rows" || a.kind === "funnel")
            ? "display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;align-items:stretch"
            : a.kind === "stacked"
              ? "display:grid;grid-template-columns:1.35fr 1fr;gap:12px;margin-top:12px;align-items:stretch"
              : "display:grid;grid-template-columns:1.6fr 1fr;gap:12px;margin-top:12px;align-items:stretch",
          /* The footer totals the rows it sits under — parsed from the row
             values themselves, so it can never drift into quoting an
             unrelated metric. Euro rows total in euro, counts in counts. */
          splitUnit: (() => {
            const v = (a.split[0] || [])[1] || "";
            return /€/.test(v) ? "EUR" : "COUNT";
          })(),
          splitFootLabel: "TOTAL",
          splitFootValue: (() => {
            if (!a.split.length) return "-";
            const raw = a.split.map(r => String(r[1]));
            const euro = /€/.test(raw[0]);
            const nums = raw.map(v => {
              const n = parseFloat(v.replace(/[^0-9.]/g, "")) || 0;
              return /k/i.test(v) ? n * 1000 : n;
            });
            const sum = nums.reduce((t, n) => t + n, 0);
            if (!euro) return sum.toLocaleString();
            return sum >= 1000
              ? "€" + (sum / 1000).toFixed(1).replace(/\.0$/, "") + "k"
              : "€" + Math.round(sum).toLocaleString();
          })(),
          chartTitle:a.chartTitle, chartUnit:a.chartUnit,
          chart: a.chart.map(c => ({label:c[0], value:c[2],
            h: Math.max(6, Math.round(100 * c[1] / peak)) + "%",
            bg: c[1] === peak ? a.color : "var(--track)",
            labelOpacity: c[1] === peak ? "1" : "0.55"})),
          // The chart form follows the data: a trend gets a line, a mix gets a
          // funnel or stack, a ranking gets rows, a target gets a dot plot.
          isColumns: a.kind === "columns", isArea: a.kind === "area", isFunnel: a.kind === "funnel",
          isStacked: a.kind === "stacked", isRows: a.kind === "rows", isDots: a.kind === "dots",
          gridLines: [0, 1, 2, 3].map(i => ({y: 10 + i * 40})),
          areaPath: (() => {
            const pts = a.chart.map((c, i) => [i * (600 / (a.chart.length - 1)), 140 - 130 * (c[1] / peak)]);
            return "M0," + 150 + " L" + pts.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" L") + " L600,150 Z";
          })(),
          linePath: (() => {
            const pts = a.chart.map((c, i) => [i * (600 / (a.chart.length - 1)), 140 - 130 * (c[1] / peak)]);
            return "M" + pts.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" L");
          })(),
          points: a.chart.map((c, i) => ({
            x: (i * (600 / (a.chart.length - 1))).toFixed(1),
            y: (140 - 130 * (c[1] / peak)).toFixed(1),
            r: c[1] === peak ? 5 : 3.2
          })),
          funnel: (a.funnel || []).map((s, i, arr) => ({
            label:s[0], value:s[1], rate:s[2],
            pct: Math.round(100 * s[3] / arr[0][3]) + "%",
            bg: i === 0 ? a.color : i === arr.length - 1 ? "var(--surface-2)" : "var(--neutral)",
            ink: i === 0 ? "var(--on-accent)" : "var(--ink)"
          })),
          stacked: (a.stacked || []).map(col => {
            const total = col[1].reduce((x, y) => x + y, 0);
            const colMax = Math.max.apply(null, a.stacked.map(c => c[1].reduce((x, y) => x + y, 0)));
            return {label:col[0], h: Math.max(8, Math.round(100 * total / colMax)) + "%",
              parts: col[1].map((v, i) => ({
                flex: String(v), title: a.legend[i] + ": " + v,
                radius: i === 0 ? "5px 5px 2px 2px" : "2px",
                bg: [a.color, "var(--neutral)", "var(--track)"][i]
              }))};
          }),
          legend: (a.legend || []).map((l, i) => ({label:l, bg: [a.color, "var(--neutral)", "var(--track)"][i]})),
          rows: (a.rows || []).map(r => {
            const rmax = Math.max.apply(null, a.rows.map(x => x[2]));
            return {label:r[0], value:r[1], pct: Math.max(4, Math.round(100 * r[2] / rmax)) + "%",
              bg: r[2] === rmax ? a.color : "var(--neutral)"};
          }),
          targetY: (140 - 130 * (a.target / peak)).toFixed(1),
          targetLabel: a.targetLabel || "",
          dots: a.chart.map((c, i) => ({
            x: (i * (600 / (a.chart.length - 1))).toFixed(1),
            y: (140 - 130 * (c[1] / peak)).toFixed(1),
            r: c[1] <= a.target ? 5.5 : 4,
            fill: c[1] <= a.target ? a.color : "var(--bg)",
            stroke: c[1] <= a.target ? a.color : "var(--neutral)"
          })),
          splitTitle:a.splitTitle,
          split: a.split.map(s => ({key:s[0], value:s[1], pct:s[2],
            color: s[3] ? a.color : "var(--neutral)"})),
          tableCols:a.tableCols,
          table: a.table.map(r => ({cells:[
            {v:r[0], font:"inherit", color:INK},
            {v:r[1], font:MONO, color:INK},
            {v:r[2], font:MONO, color: /^[−-]/.test(r[2]) ? RED : GREEN},
            {v:r[3], font:"inherit", color:DIM}
          ]}))
        };
      })(),
      filterMenuOpen: st.filterMenuOpen,
      filterGroups: FILTER_GROUPS.map(g => ({title:g.title, items:g.items.map(label => {
        const asp = ASPECT_DEFS.find(a => a.label === label);
        const on = asp ? st.aspect === asp.id : st.aspect === label;
        return {label,
          style: "height:30px;padding:0 13px;border-radius:var(--r-ctl,9px);cursor:pointer;font-size:12px;white-space:nowrap;"
            + "transition:border-color .2s var(--ease),background .2s var(--ease),color .2s var(--ease);"
            + (on ? "background:var(--accent-faint);border:1px solid var(--accent-line);color:var(--ink)"
                  : "background:var(--surface-2);border:1px solid var(--border);color:var(--body)"),
          pick: () => asp ? (this.setState({aspect:asp.id, filterMenuOpen:false}), this.startKpiCount())
            : this.setState(prev => ({aspect:label, filterMenuOpen:false,
                extraFilters: prev.extraFilters.indexOf(label) > -1 ? prev.extraFilters : prev.extraFilters.concat([label])}))};
      })})),
      customFilter: st.customFilter,
      setCustomFilter: (e) => this.setState({customFilter:e.target.value}),
      onCustomFilterKey: (e) => { if (e.key === "Enter") this.addCustom(); },
      addCustomFilter: () => this.addCustom(),

      /* work: tasks, approvals, workflows, schedules */
      _unusedWorkflows: WORKFLOWS.map(w => ({
        name:w.name, trigger:w.trigger, lastRun:w.lastRun, result:w.result, runSummary:w.runSummary,
        state:w.state,
        stateStyle: "padding:3px 10px;border-radius:var(--r-sm,9px);font-size:11px;"
          + (w.state === "live" ? "background:var(--ok-soft);color:" + GREEN : "background:var(--bad-soft);color:" + RED),
        resultColor: w.resultKind === "ok" ? GREEN : w.resultKind === "warn" ? AMBER : RED,
        actions: w.actions.map(a => ({label:a[0],
          style: "padding:5px 11px;border-radius:var(--r-sm,9px);background:var(--surface-2);font-family:" + MONO + ";font-size:10.5px;"
            + (a[1] === "external" ? "border:1px solid var(--bad-soft);color:" + RED
               : a[1] === "write" ? "border:1px solid var(--warn-soft);color:" + AMBER
               : "border:1px solid var(--border);color:" + BODY)})),
        runs: w.runs.map(r => ({label:r,
          bg: {ok:"var(--accent)", partial:"var(--warn)", failed:"var(--bad)", idle:"var(--track)"}[r]}))
      })),
      schedules: SCHEDULES.map(s => {
        const on = st.scheduleOff[s.id] === undefined ? s.on : !st.scheduleOff[s.id];
        return {name:s.name, cadence:s.cadence, owner:s.owner,
          next: on ? s.next : "Paused",
          tileBg: on ? "var(--accent-faint)" : "var(--track)",
          tileColor: on ? "var(--accent)" : DIM,
          trackBg: on ? "var(--accent)" : "var(--track)",
          knobLeft: on ? "19px" : "3px",
          knobBg: on ? "var(--on-accent)" : DIM,
          toggle: () => this.setState(prev => ({scheduleOff: Object.assign({}, prev.scheduleOff, {[s.id]: on})}))};
      }),
      scheduleWeek: ["MON","TUE","WED","THU","FRI","SAT","SUN"].map((d, i) => {
        const n = [3, 3, 3, 4, 4, 0, 1][i];
        return {label:d, count: n ? String(n) : "-",
          cellStyle: "margin-top:7px;height:44px;border-radius:var(--r-md,14px);display:flex;align-items:center;justify-content:center;"
            + "font-family:" + MONO + ";font-size:13px;"
            + (i === 1 ? "background:var(--accent-fill,var(--accent));color:var(--on-accent);box-shadow:var(--accent-glow,none);font-weight:500"
               : n ? "background:var(--surface-2);border:1px solid var(--border);color:" + BODY
                   : "background:none;border:1px dashed var(--border);color:" + FAINT)};
      }),
      scheduleNext: [
        {name:"Morning briefing", when:"Tomorrow 07:00", dot:LIME},
        {name:"Overdue invoice reminder", when:"Tomorrow 08:00", dot:LIME},
        {name:"Weekly stock check", when:"Thu 09:00", dot:AMBER}
      ],

      /* home widget board */
      workWidgetHint: "TASK QUEUE · " + queueTasks.length + " SHOWN",
      workWidgets: WORK_WIDGETS.map(w => {
        const on = st.workWidget === w.id;
        return {label:w.label, value:w.value, hint:w.hint, icon:ICONS[w.icon],
          tileBg: on ? "var(--accent-soft)" : "var(--surface-2)",
          tileColor: on ? "var(--accent)" : "var(--dim)",
          style: "flex:1 1 190px;min-width:180px;padding:16px 18px 18px;border-radius:var(--card-r,18px);cursor:pointer;"
            + "backdrop-filter:blur(20px) saturate(1.3);box-shadow:var(--card-shadow);"
            + "transition:transform .26s var(--ease),border-color .22s var(--ease);"
            + (on ? "background:var(--surface-2);border:1px solid var(--border-strong)"
                  : "background:var(--surface);border:1px solid var(--border)"),
          open: () => this.setState({workWidget:w.id, queue:w.queue})};
      }),

      /* agents */
      agentListHint: agentMatches.length + " AGENTS · " + st.agents.length + " INSTALLED",
      agentHasDraft: (st.agentDraft || "").trim().length > 0,
      sendAgent: () => { if (st.agentDraft.trim()) this.sendToAgent(st.agentDraft.trim()); },

      /* mini chat */
      showFab: page !== "Home",
      fabTitle: st.miniOpen ? "Close chat" : "Ask Pulse",
      fabChatStyle: "position:absolute;inset:0;transition:transform .34s var(--ease),opacity .24s var(--ease);"
        + (st.miniOpen ? "transform:rotate(-90deg) scale(.7);opacity:0" : "transform:none;opacity:1"),
      fabCloseStyle: "position:absolute;inset:0;transition:transform .34s var(--ease),opacity .24s var(--ease);"
        + (st.miniOpen ? "transform:none;opacity:1" : "transform:rotate(90deg) scale(.7);opacity:0"),
      miniMicStyle: "width:34px;height:34px;flex:none;border-radius:var(--r-ctl,12px);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:color .2s var(--ease),border-color .2s var(--ease),background .2s var(--ease);"
        + (st.miniMic ? "border:1px solid var(--accent-line);background:var(--accent-soft);color:var(--accent)" : "border:1px solid var(--border);background:none;color:var(--dim)"),
      miniDictate: () => this.setState(prev => ({miniMic: !prev.miniMic})),
      miniAttach: () => this.openPalette(),
      miniFooter: st.miniMic ? "LISTENING" : "SEES " + page.toUpperCase() + " · ENTER TO SEND",
      miniOpen: st.miniOpen,
      toggleMini: () => this.setState(prev => ({miniOpen: !prev.miniOpen})),
      miniContext: "SEES " + page.toUpperCase(),
      goHomeChat: () => this.setState({page:"Home", miniOpen:false}),
      miniIsChat: (st.miniTab || "chat") === "chat", miniIsWork: (st.miniTab || "chat") === "work",
      miniTabTrack: "position:relative;display:flex;align-items:center;width:164px;padding:2px;background:var(--surface-faint);border:1px solid var(--border);border-radius:var(--r-md,14px);flex:none;box-shadow:inset 0 1px 3px rgba(0,0,0,.34),inset 0 -1px 0 var(--glass-highlight);",
      miniTabThumb: (() => {
        const idx = (st.miniTab || "chat") === "chat" ? 0 : 1;
        return "position:absolute;top:2px;bottom:2px;left:2px;width:calc(50% - 2px);border-radius:calc(var(--r-md,14px) - 2px);background:var(--pill-bg);box-shadow:0 2px 5px rgba(0,0,0,.34),0 6px 16px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.5);"
          + "transform:translateX(" + (idx * 100) + "%);transition:transform .3s var(--ease)";
      })(),
      miniTabs: [["chat","Chat"],["work","Work"]].map(t => {
        const on = (st.miniTab || "chat") === t[0];
        return {label:t[1],
          style: "position:relative;z-index:1;flex:1;height:28px;padding:0;border:0;border-radius:var(--r-ctl,10px);background:none;font-size:12px;font-weight:500;cursor:pointer;white-space:nowrap;transition:color .24s var(--ease);"
            + (on ? "color:var(--pill-ink)" : "color:var(--dim)"),
          pick: () => this.setState({miniTab:t[0]})};
      }),
      miniHasRecent: st.thread.length > 0,
      miniRecent: st.thread.length > 0 ? [{title: (st.thread.find(m => m.role === "user") || {}).text || "Recent conversation",
        date: new Date().toLocaleDateString("en-GB"), open: () => this.setState({page:"Home", miniOpen:false})}] : [],
      miniEmpty: st.miniThread.length === 0,
      miniGreeting: (() => { const h = new Date().getHours();
        const g = h < 5 ? "Still up" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 22 ? "Good evening" : "Still going";
        return g + ", Chantal"; })(),
      miniSuggestions: [
        {label:"What changed today?", run:() => this.askMini("What changed today?")},
        {label:"What needs my decision?", run:() => this.askMini("What needs my decision?")},
        {label:"Draft a chase for the worst account", run:() => this.askMini("Draft chase emails")}
      ],
      miniWorkSections: (() => {
        const openTasks = openWork.slice(0, 4);
        const meetingsOpen = (st.miniWorkOpen || "tasks") === "meetings";
        const tasksOpen = (st.miniWorkOpen || "tasks") === "tasks";
        const notifsOpen = st.miniWorkOpen === "notifications";
        const toggle = (key) => () => this.setState(prev => ({miniWorkOpen: prev.miniWorkOpen === key ? null : key}));
        return [
          {num:"01", title:"Meetings", icon:"M8 4v3 M16 4v3 M4.5 9.5h15 M6.4 6h11.2A1.9 1.9 0 0 1 19.5 8v10a1.9 1.9 0 0 1-1.9 1.9H6.4A1.9 1.9 0 0 1 4.5 18V8A1.9 1.9 0 0 1 6.4 6Z",
            statusText:"Clear", statusColor:"var(--faint)", open:meetingsOpen, toggle:toggle("meetings"),
            isEmpty:true, emptyText:"Nothing scheduled.", rows:[],
            hasLink:false,
            wrapStyle: "background:var(--surface);border:1px solid var(--border);border-radius:var(--card-r,18px);overflow:hidden"},
          {num:"02", title:"Tasks", icon:"M5 6.5h2l1.4 1.4L11 5.5 M5 12.5h2l1.4 1.4 2.6-2.4 M5 18.5h2l1.4 1.4 2.6-2.4 M15 6.5h4 M15 12.5h4 M15 18.5h4",
            statusText:openTasks.length + " open", statusColor:"var(--accent)", open:tasksOpen, toggle:toggle("tasks"),
            isEmpty:openTasks.length === 0, emptyText:"Nothing open.",
            rows: openTasks.map(t => ({isCheck:true, title:t.title,
              hasTag:true, tag:t.priority, tagStyle:"flex:none;padding:2px 9px;border-radius:var(--chip-r,6px);font-size:11px;background:var(--ok-soft);color:var(--ok)"})),
            hasLink:false,
            wrapStyle: "background:var(--surface);border:1px solid var(--border);border-radius:var(--card-r,18px);overflow:hidden"},
          {num:"03", title:"Notifications", icon:"M12 4a5.5 5.5 0 0 0-5.5 5.5v3.2L5 16h14l-1.5-3.3V9.5A5.5 5.5 0 0 0 12 4Z M9.8 19a2.2 2.2 0 0 0 4.4 0",
            statusText:"12 unread", statusColor:"#6ad0f0", open:notifsOpen, toggle:toggle("notifications"),
            isEmpty:false, emptyText:"",
            rows:[{isCheck:false, title:"JOD-W1041 is 12 units short", hasTag:false},
              {isCheck:false, title:"PO-D193 awaiting approval", hasTag:false},
              {isCheck:false, title:"JOD-INV2031 reminder drafted, not sent", hasTag:false}],
            hasLink:true, linkLabel:"All notifications", linkGo: () => this.setState({showNotifs:true, miniOpen:false}),
            wrapStyle: "background:var(--surface);border:1px solid var(--border);border-radius:var(--card-r,18px);overflow:hidden"}
        ];
      })(),
      miniThread: st.miniThread.map(m => ({
        text:m.text,
        wrapStyle: "display:flex;margin-bottom:12px;" + (m.role === "user" ? "justify-content:flex-end" : "justify-content:flex-start"),
        bubbleStyle: "max-width:84%;padding:11px 14px;font-size:13px;line-height:1.6;border-radius:"
          + (m.role === "user" ? "16px 16px 5px 16px" : "16px 16px 16px 5px") + ";"
          + (m.role === "user" ? "background:var(--accent-fill,var(--accent));color:var(--on-accent);box-shadow:var(--accent-glow,none)"
                               : "background:var(--surface);border:1px solid var(--border);color:var(--body)")
      })),
      miniDraft: st.miniDraft,
      setMiniDraft: (e) => this.setState({miniDraft:e.target.value}),
      onMiniKey: (e) => { if (e.key === "Enter" && st.miniDraft.trim()) this.askMini(st.miniDraft.trim()); },
      sendMini: () => { if (st.miniDraft.trim()) this.askMini(st.miniDraft.trim()); },

      /* agent builder */
      tuneCount: (st.tuneThread || []).filter(m => m.role === "you").length,
      tuneCountLabel: (st.tuneThread || []).filter(m => m.role === "you").length + " change"
        + ((st.tuneThread || []).filter(m => m.role === "you").length === 1 ? "" : "s"),
      /* Concrete starting points beat an instruction paragraph — one tap writes
         the line into the prompt the same way typing it would. */
      quickTunes: [
        "Always name the account in the first line",
        "Stop mentioning margin",
        "Flag anything over €5,000 to me first",
        "Keep answers to three sentences"
      ].map(q => ({label:q, apply: () => { this.setState({tuneDraft:q}, () => this.sendTune()); }})),
      hasTuneThread: (st.tuneThread || []).length > 0,
      noTuneThread: (st.tuneThread || []).length === 0,
      tuneThread: (st.tuneThread || []).map(m => ({
        text:m.text,
        rowStyle: "display:flex;justify-content:" + (m.role === "you" ? "flex-end" : "flex-start") + ";animation:expandIn .3s var(--ease) both",
        bubbleStyle: "max-width:94%;padding:8px 11px;border-radius:var(--r-sm,9px);font-size:12px;line-height:1.45;"
          + (m.role === "you"
              ? "background:var(--surface-strong);border:1px solid var(--border);color:var(--ink);border-bottom-right-radius:5px"
              : "background:var(--accent-faint);border:1px solid var(--accent-line);color:var(--ink);border-bottom-left-radius:5px")
      })),
      /* ---- skills: every registered tool in one list. Context is not a choice —
         an agent reads the whole ontology, and anything with an effect still
         waits for a yes, so grouping by effect earned nothing here. ---- */
      skills: SKILL_DEFS.map(d => {
        const on = st.agentSpec.skills.indexOf(d[0]) > -1;
        return {label:d[0], style: chip(on), toggle: () => this.toggleSpecList("skills", d[0])};
      }),
      skillCount: st.agentSpec.skills.length + " of " + SKILL_DEFS.length + " granted",
      grantAllSkills: () => this.setState(prev => ({agentSpec: Object.assign({}, prev.agentSpec,
        {skills: prev.agentSpec.skills.length === SKILL_DEFS.length ? [] : SKILL_DEFS.map(d => d[0])})})),
      grantAllSkillsLabel: st.agentSpec.skills.length === SKILL_DEFS.length ? "Clear all" : "Grant all",

      approvalsEmpty: approvals.length === 0,
      approvalsEmptyTitle: st.approvalFilter === "Decided" ? "Nothing decided yet"
        : st.approvalFilter === "Awaiting others" ? "Nothing waiting on anyone else" : "Nothing waiting on you",
      approvalsEmptyBody: st.approvalFilter === "Decided"
        ? "Decisions stay on the record's activity timeline once made."
        : "Requests appear here as they are raised, with every step and who it sits with.",
      /* On the dashboard the KPI band is a solid accent field. Running that
         field up behind the nav bar removes the seam between them; the pill
         goes opaque dark so it still reads on the lime. */
      headerFieldStyle: false && page === "Dashboard"
        /* 70px stopped short of the header's real height, so a hairline of page
           background showed between it and the sticky KPI band once scrolled.
           82px clears the header and laps 8px into the band's own padding. */
        ? "position:absolute;left:0;right:0;top:0;height:76px;z-index:3;pointer-events:none;background:var(--accent)"
        : "display:none",
      headerPillStyle: "display:flex;align-items:center;gap:4px;height:54px;padding:5px;box-sizing:border-box;max-width:100%;min-width:0;overflow:hidden;"
        + ((contextNav.length <= 6 && (st.w - (st.railOpen ? 252 : 68) - 12) >= 780) ? "" : "width:fit-content;margin:0 auto;")
        + "background:var(--surface);border:1px solid var(--border);border-radius:999px;"
        + "backdrop-filter:blur(24px) saturate(1.4);-webkit-backdrop-filter:blur(24px) saturate(1.4);"
        + "box-shadow:var(--header-shadow)",
      headerStyle: "flex:none;display:grid;align-items:center;gap:14px;padding:14px 22px 12px;border-bottom:1px solid var(--border);"
        + "grid-template-columns:minmax(0,1fr) " + (mid ? "minmax(150px,340px)" : "44px") + " minmax(0,1fr)",
      barOpen: st.barOpen,
      railShut: !st.railOpen,
      kpiBackdrop: this.props.kpiBackdrop || "#5f8f63",
      kpiBackdropOn: st.theme !== "light" && this.props.kpiBackdropOn !== false,
      railThumbStyle: "position:absolute;z-index:0;pointer-events:none;border-radius:14px;"
        + "background:var(--rail-active,var(--accent-faint));box-shadow:var(--rail-active-ring,inset 0 0 0 1px var(--accent-line));"
        + (st.railThumb
            ? "left:" + st.railThumb.l + "px;top:0;width:" + st.railThumb.w + "px;height:" + st.railThumb.h + "px;"
              + "transform:translateY(" + st.railThumb.t + "px);opacity:1;"
              + (st.railThumbLive ? "transition:transform .55s cubic-bezier(.3,1.25,.4,1),width .3s var(--ease),height .3s var(--ease),left .3s var(--ease),opacity .2s" : "transition:none")
            : "opacity:0"),
      pageDy: (st.navDir === -1 ? "-22px" : "22px"),
      pageSweepEl: React.createElement("span", {key:"sweep" + (st.navSeq || 0), style:{position:"absolute", left:0, right:0, top:0, height:1, zIndex:6, pointerEvents:"none",
        background:"linear-gradient(90deg,transparent,var(--accent) 40%,var(--accent) 60%,transparent)",
        animation:(st.navSeq ? "pageSweep .8s cubic-bezier(.4,0,.2,1) both" : "none"), opacity:(st.navSeq ? 1 : 0)}}),
      // Hover: the dot eases a few px right and deepens; the arrow slips out
      // through its right edge while a twin slides in from the left.
      setBtnIn: () => this.setState({setBtnHover:true}),
      setBtnOut: () => this.setState({setBtnHover:false}),
      // Hover: the dot un-rolls leftward into a darker capsule behind the label,
      // the mixer knobs slide to new levels, one sheen passes, the arrow swaps.
      setDotStyle: "position:absolute;z-index:1;right:5px;top:5px;bottom:5px;border-radius:999px;"
        + "background:var(--accent-soft);box-shadow:inset 0 0 0 1px var(--accent-line);"
        + "width:" + (st.setBtnHover ? "calc(100% - 10px)" : "36px") + ";"
        + "transition:width .62s cubic-bezier(.65,0,.15,1)",
      setSheen: "position:absolute;z-index:1;top:0;bottom:0;left:0;width:45%;pointer-events:none;"
        + "background:linear-gradient(100deg,transparent,rgba(255,255,255,.1),transparent);"
        + "transform:translateX(" + (st.setBtnHover ? "260%" : "-120%") + ") skewX(-18deg);"
        + "transition:" + (st.setBtnHover ? "transform .9s cubic-bezier(.3,0,.2,1) .1s" : "none"),
      setIconStyle: "position:relative;z-index:2;flex:none;overflow:visible;transition:color .4s var(--ease);color:" + (st.setBtnHover ? "var(--accent)" : "var(--dim)"),
      setKnobA: "transition:transform .55s cubic-bezier(.34,1.4,.5,1);transform:translateY(" + (st.setBtnHover ? "-6px" : "0") + ")",
      setKnobB: "transition:transform .55s cubic-bezier(.34,1.4,.5,1) .06s;transform:translateY(" + (st.setBtnHover ? "9px" : "0") + ")",
      setKnobC: "transition:transform .55s cubic-bezier(.34,1.4,.5,1) .12s;transform:translateY(" + (st.setBtnHover ? "-5px" : "0") + ")",
      setArrowA: "position:absolute;left:50%;top:50%;margin:-7.5px 0 0 -7.5px;"
        + "transform:translateX(" + (st.setBtnHover ? "22px" : "0") + ");opacity:" + (st.setBtnHover ? "0" : "1") + ";"
        + "transition:transform .45s cubic-bezier(.5,0,.2,1),opacity .3s var(--ease)",
      setArrowB: "position:absolute;left:50%;top:50%;margin:-7.5px 0 0 -7.5px;"
        + "transform:translateX(" + (st.setBtnHover ? "0" : "-22px") + ");opacity:" + (st.setBtnHover ? "1" : "0") + ";"
        + "transition:transform .45s cubic-bezier(.22,.9,.16,1) " + (st.setBtnHover ? ".08s" : "0s") + ",opacity .3s var(--ease) " + (st.setBtnHover ? ".08s" : "0s"),
      showTeam: (st.w - (st.railOpen ? 252 : 68)) >= 1000 || contextNav.length <= 3,
      showTheme: (st.w - (st.railOpen ? 252 : 68)) >= 820 || contextNav.length <= 3,
      tabPad: (st.w - (st.railOpen ? 252 : 68)) >= 1100 ? "0 18px" : (st.w - (st.railOpen ? 252 : 68)) >= 1000 ? "0 12px" : "0 10px",
      _tabs: (() => { const tight = (st.w - (st.railOpen ? 252 : 68)) < 1000 && contextNav.length >= 4;
        contextNav.forEach(t => { t.showCount = !!t.count && !tight; }); return 0; })(),
      tabsLoose: false,
      tabsTight: (st.w - (st.railOpen ? 252 : 68)) < 1000 && contextNav.length >= 4,
      tabActiveBg: "var(--surface-2);box-shadow:inset 0 0 0 1px var(--border)",
      searchWrapFlex: (contextNav.length <= 6 && (st.w - (st.railOpen ? 252 : 68) - 12) >= 780) ? "1 1 auto" : "0 0 auto",
      barLabel: st.barOpen ? "Collapse the bar" : "Expand the bar",
      barChevronStyle: "transition:transform .3s var(--ease);transform:rotate(" + (st.barOpen ? "0deg" : "180deg") + ")",
      toggleBar: () => this.setState(prev => ({barOpen: !prev.barOpen})),
      showHint: roomy && st.barOpen,
      showSearchText: mid && st.barOpen,
      showProfileText: roomy,
      navGroupStyle: "position:relative;display:inline-grid;grid-auto-flow:column;grid-auto-columns:"
        + (((st.w - (st.railOpen ? 252 : 68)) < 1000 && contextNav.length >= 4) ? "max-content" : "1fr") + ";"
        + "width:max-content;max-width:100%;align-items:center;padding:0;flex:" + (contextNav.length <= 3 ? "none" : "0 1 auto") + ";min-width:0;border-radius:999px;"
        + "overflow-x:auto;overflow-y:hidden;scrollbar-width:none;overscroll-behavior-x:contain;"
        + "-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 14px),transparent);mask-image:linear-gradient(90deg,#000 calc(100% - 14px),transparent)",
      // Pure CSS: the group keeps equal 1fr tracks, so the pill is one track wide
      // and stepped by index. Nothing is measured and nothing is written after
      // render, so there is no mutation feedback loop and the transition survives.
      navThumb: (() => {
        const n = Math.max(1, contextNav.length);
        const i = Math.max(0, contextNav.findIndex(t => t.active));
        return "position:absolute;left:0;top:0;bottom:0;z-index:0;pointer-events:none;border-radius:999px;"
          + "width:calc(100% / " + n + ");transform:translateX(" + (i * 100) + "%);"
          + "background-color:var(--surface-2);box-shadow:0 1px 0 rgba(255,255,255,.05) inset,0 4px 12px rgba(0,0,0,.35);"
          + "background-image:linear-gradient(180deg,rgba(255,255,255,.22),rgba(255,255,255,0) 55%);background-blend-mode:overlay;"
          + "transition:transform .46s cubic-bezier(.22,.9,.16,1)";
      })(),
      searchStyle: "height:38px;justify-self:center;min-width:0;" + (mid ? "width:100%;padding:0 8px 0 15px;" : "width:44px;justify-content:center;padding:0;"),
      // The bar is one row: the fewer sub-nav segments a page has, the more of the
      // leftover width the search field takes.
      searchExpanded: contextNav.length <= 6 && (st.w - (st.railOpen ? 252 : 68) - 12) >= 780,
      searchBarStyle: (() => {
        const segs = contextNav.length;
        // No min-width floor: when the sub-nav pill group is wide, the search
        // must be free to shrink rather than overflow its centring parent and
        // slide under the nav.
        const cap = segs <= 2 ? 520 : segs <= 4 ? 440 : 340;
        // A real floor so the label always fits — the sub-nav group is now
        // shrinkable, so this comes out of its slack, not out of an overflow.
        const collapsed = !(segs <= 6 && (st.w - (st.railOpen ? 252 : 68) - 12) >= 780);
        if (collapsed) return "flex:none;width:42px;height:42px;display:flex;align-items:center;justify-content:center;padding:0;margin:0 2px;"
          + "background:var(--track);border:1px solid transparent;border-radius:999px;cursor:pointer;color:var(--body);"
          + "transition:border-color .2s var(--ease),color .2s var(--ease)";
        return "flex:1 1 auto;width:100%;min-width:0;max-width:" + cap + "px;height:42px;"
          + "display:flex;align-items:center;gap:9px;padding:0 6px 0 15px;margin:0 2px;"
          + "background:var(--track);border:1px solid transparent;border-radius:999px;"
          + "box-shadow:0 1px 2px rgba(0,0,0,.22) inset;"
          + "cursor:pointer;color:var(--body);"
          + "transition:border-color .2s var(--ease),color .2s var(--ease),background .2s var(--ease),max-width .3s var(--ease)";
      })(),
      notificationFeed, features, results,
      inbox: inboxKeys.map(rowFor),
      inboxTop: jodzDecisions().slice(0,4),
      inboxFilters: ["All","Approvals","Alerts","Work","Automations"].map(f => ({label:f, style:pillStyle(st.inboxFilter === f), pick:() => this.setState({inboxFilter:f, open:null})})),
      tasks: jodzTasks().slice(0,6).map(t => {
        const done = t.status === "Done";
        return {title:t.title, due:t.dueLabel, open:t.open, checkOpacity: done ? "1" : "0", fill: done ? LIME : "transparent", ring: done ? LIME : "var(--track)",
          color: done ? FAINT : INK, strike: done ? "line-through" : "none", dueColor: done ? FAINT : (t.late ? RED : "var(--mid)"), toggle: () => jodzCompleteTask(t.id)};
      }),
      settingsStyle: railStyle(page === "Settings") + ";animation:railIn .42s var(--ease) 300ms both",
      settingsGlyphStyle: glyphStyle(page === "Settings", st.hovered === "__settings"),
      settingsHovered: st.hovered === "__settings",
      // Live: renderVals reads the real clock every render, and a 1s ticker
      // (Home page only) is what makes a render happen when no one is typing.
      approvalsCount: openKeys.length,
      approvalsValue: "48,120",
      approvalsSub: "Oldest open two days · two are past their SLA",
      approvalsSpark: [.34,.46,.4,.58,.52,.72,.64,.92].map((v, i, a) => ({
        style: "width:3px;border-radius:var(--r-sm,9px);height:" + Math.round(v * 30) + "px;background:"
          + (i === a.length - 1 ? "var(--accent)" : "var(--border-strong)")
          + ";opacity:" + (i === a.length - 1 ? 1 : (0.3 + i * 0.06).toFixed(2))
      })),
      closeNotifs: () => this.setState({showNotifs:false}),
      homeEyebrow: (() => {
        const live = st.agents.filter(a => a.state === "working" || a.state === "thinking").length;
        return (live ? live + " AGENTS RUNNING" : "NO AGENTS RUNNING") + " · SYNCED 2 MIN AGO";
      })(),
      homeSubline: "Answers come from the Jod-Z demo dataset. No live AI service is connected.",
      approvalsPill: jodzWaiting(),
      goApprovals: () => { const a = jodzState().approvals.find(x => x.status === "Awaiting approval"); if (a) jodzOpenRecord({kind:"approval", id:a.id}); },
      showApprovalNote: openKeys.length > 0 && !st.approvalNoteHidden,
      dismissApprovalNote: () => this.setState({approvalNoteHidden:true}),
      /* Home canvas: a decorative layer the user can switch, scoped to the
         empty chat view so it never competes with a live thread. */
      homeCanvasStyle: (() => {
        const bgs = {
          none: "",
          bloom: "background:radial-gradient(60% 48% at 50% 34%, var(--accent-faint), transparent 72%), radial-gradient(44% 38% at 16% 84%, rgba(255,255,255,.05), transparent 70%)",
          mist: "background:radial-gradient(52% 44% at 24% 22%, rgba(255,255,255,.07), transparent 70%), radial-gradient(56% 46% at 80% 76%, rgba(255,255,255,.05), transparent 72%)",
          grid: "background-image:linear-gradient(var(--border) 1px, transparent 1px),linear-gradient(90deg, var(--border) 1px, transparent 1px);background-size:56px 56px;mask-image:radial-gradient(62% 56% at 50% 46%, #000, transparent 78%);-webkit-mask-image:radial-gradient(62% 56% at 50% 46%, #000, transparent 78%)"
        };
        const key = st.homeBg || "bloom";
        const def = BG_DEFS.find(b => b.id === key);
        const css = def ? def.css : (st.homeBgCss || bgs[key] || "");
        return "position:absolute;top:-24px;bottom:-24px;left:-24px;right:-24px;z-index:0;pointer-events:none;overflow:hidden;opacity:"
          + (st.thread.length ? ".35" : "1") + ";transition:opacity .4s var(--ease);" + css;
      })(),
      bgMenuOpen: false,
      toggleBgMenu: () => this.setState({bgGalleryOpen:true, bgSpot:null}),
      bgGallery: (() => {
        const cur = st.homeBg || "bloom";
        const ups = st.bgUploads || [];
        const cats = ["Signature","Gradient","Abstract","Your photos"];
        const active = st.bgCat || "Signature";
        const pickOf = (id, css) => () => this.setState({homeBg:id, homeBgCss: css === undefined ? null : css});
        let tiles;
        if (active === "Your photos"){
          tiles = ups.map((u, i) => ({
            id:"up" + i, name:"Photo " + (i + 1), isUpload:false,
            thumbStyle:"position:absolute;inset:0;background:url(" + u + ") center/cover",
            on: cur === "up" + i,
            pick: pickOf("up" + i, "background:url(" + u + ") center/cover")}));
        } else {
          tiles = BG_DEFS.filter(b => b.cat === active).map(b => ({
            id:b.id, name:b.name, isUpload:false,
            thumbStyle:"position:absolute;inset:0;" + b.thumb,
            on: cur === b.id,
            pick: pickOf(b.id, b.css)}));
        }
        const spot = st.bgSpot;
        return {
          open: !!st.bgGalleryOpen,
          close: () => this.setState({bgGalleryOpen:false, bgSpot:null}),
          cats: cats.map(c => ({label:c, count: c === "Your photos" ? String(ups.length) : String(BG_DEFS.filter(b => b.cat === c).length),
            style:"height:30px;padding:0 13px;border-radius:var(--r-ctl,10px);cursor:pointer;font-size:12.5px;white-space:nowrap;transition:background .2s var(--ease),color .2s var(--ease),border-color .2s var(--ease);"
              + (c === active ? "background:var(--accent);border:1px solid var(--accent);color:var(--on-accent);font-weight:500"
                              : "background:var(--surface-2);border:1px solid var(--border);color:var(--dim)"),
            pick: () => this.setState({bgCat:c})})),
          isPhotos: active === "Your photos",
          emptyPhotos: active === "Your photos" && ups.length === 0,
          tiles,
          currentName: (BG_DEFS.find(b => b.id === cur) || {}).name || (cur.indexOf("up") === 0 ? "Your photo" : "None"),
          heroStyle: "position:absolute;inset:0;" + ((BG_DEFS.find(b => b.id === cur) || {}).thumb || (st.homeBgCss || "background:var(--surface-2)")),
          /* the spotlight follows the pointer across the whole grid */
          onMove: (e) => {
            const r = e.currentTarget.getBoundingClientRect();
            this.setState({bgSpot:{x: Math.round(e.clientX - r.left), y: Math.round(e.clientY - r.top)}});
          },
          onLeave: () => this.setState({bgSpot:null}),
          spotStyle: "position:absolute;inset:0;z-index:2;pointer-events:none;transition:opacity .3s var(--ease);opacity:"
            + (spot ? "1" : "0") + ";background:radial-gradient(220px circle at "
            + (spot ? spot.x + "px " + spot.y + "px" : "50% 50%")
            + ", var(--accent-faint), transparent 72%)",
          onUpload: (e) => { this.readBgFile(e.target.files && e.target.files[0]); e.target.value = ""; },
          onDragOver: (e) => { e.preventDefault(); if (!st.bgDrag) this.setState({bgDrag:true}); },
          onDragLeave: (e) => { e.preventDefault(); this.setState({bgDrag:false}); },
          onDrop: (e) => {
            e.preventDefault();
            this.setState({bgDrag:false});
            const dt = e.dataTransfer;
            const f = dt && dt.files && dt.files[0];
            if (f) this.readBgFile(f);
          },
          dragging: !!st.bgDrag,
          dropHint: st.bgDrag ? "Drop to use this image" : "Click to choose, drop a file, or paste"
        };
      })(),
      bgButtonStyle: "width:26px;height:26px;border:1px solid var(--border);border-radius:var(--r-ctl,9px);background:var(--surface);backdrop-filter:blur(16px);color:var(--faint);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:color .2s var(--ease),border-color .2s var(--ease)",
      bgPlusStyle: "transition:transform .3s var(--ease);" + (st.bgMenuOpen ? "transform:rotate(45deg)" : ""),
      bgOptions: [["bloom","Bloom","radial-gradient(circle at 40% 35%, var(--accent), #16181a)"],
                  ["mist","Mist","radial-gradient(circle at 40% 35%, rgba(255,255,255,.55), #16181a)"],
                  ["grid","Grid","repeating-linear-gradient(0deg,#2b2e2c 0 1px,#16181a 1px 4px)"],
                  ["none","None","#16181a"]].map(o => {
        const on = (st.homeBg || "bloom") === o[0];
        return {label:o[1],
          style: "display:flex;align-items:center;gap:9px;width:100%;height:28px;padding:0 10px 0 7px;border:0;border-radius:var(--r-ctl,10px);cursor:pointer;font-size:12px;text-align:left;white-space:nowrap;transition:background .18s var(--ease),color .18s var(--ease);"
            + (on ? "background:var(--surface-2);color:var(--ink)" : "background:none;color:var(--dim)"),
          swatch: "width:15px;height:15px;flex:none;border-radius:6px;border:1px solid " + (on ? "var(--accent-line)" : "var(--border)") + ";background:" + o[2],
          pick: () => this.setState({homeBg:o[0]})};
      }),
      greetingPrefix: (() => {
        const h = new Date().getHours();
        const pool = h < 5 ? ["Still up","Burning the midnight oil"]
          : h < 12 ? ["Good morning","Rise and grind","Morning"]
          : h < 17 ? ["Good afternoon","Afternoon"]
          : h < 22 ? ["Good evening","Evening"]
          : ["Still going","Night owl mode"];
        // A goofy one about 1 in 5 times, otherwise the plain greeting — picked
        // once per hour and cached, so it doesn't flip on every re-render.
        const goofy = ["Top of the morning","Look who it is","Well if it isn't"];
        const bucket = Math.floor(Date.now() / 3600000);
        if (this._greetBucket !== bucket) {
          this._greetBucket = bucket;
          const useGoofy = bucket % 5 === 0;
          const list = useGoofy ? pool.concat(goofy) : pool;
          this._greetPick = list[Math.floor(Math.random() * list.length)];
        }
        return this._greetPick;
      })(),
      greetingName: "Chantal",
      flipUnits: this.buildFlipUnits(BODY, INK, LIME),
      enterSettings: (e) => this.hover("__settings", "Settings", "", e),
      leaveSettings: () => this.unhover("__settings"),
      // Always mounted: the resting state is the visible one, so the reveal is a
      // transition off a real style rather than an animation supplying the end frame.
      hoverLabel: {
        label: st.hoverLabel, hint: st.hoverHint,
        style: labelStyle(st.hovered !== null, st.hoverTop)
      },
      isChat: page === "Home",
      isSettings: page === "Settings",
      admin: adminModel,
      inboxCount: String(jodzDecisions().length),
      inboxEmpty: jodzDecisions().length === 0,
      filteredEmpty: inboxKeys.length === 0,
      queueEmpty: queueTasks.length === 0,
      taskSummary: jodzTasks().filter(t => t.status === "Done").length + " of " + jodzTasks().length + " done",
      heliosEmpty: st.thread.length === 0,
      threadOpen: st.thread.length > 0,
      threadTitle: st.thread.length ? st.thread[0].text : "",
      thread: st.thread.map((m, idx) => {
        const isHelios = m.role === "helios";
        // The reveal is derived from a word counter in state, so a re-render or a
        // hot reload can never leave a message stuck mid-stream.
        const text = isHelios ? m.full : m.text;
        const done = isHelios;

    return {
          isUser: m.role === "user", isHelios, text, typing:false,
          hasTool: isHelios, tool:m.tool || "", toolEffect: m.effect ? "· " + m.effect : "",
          toolDot: m.effect === "write" ? AMBER : LIME,
          hasTable: done && !!m.cols,
          cols:m.cols || [], tableCols: m.cols ? (m.cols.length === 3 ? "1.4fr 1fr 1fr" : "1.6fr 1fr .85fr .9fr") : "1fr",
          rows:(m.rows || []).map(r => ({cells:r.map((v,i) => ({v, color: i===0 ? INK : DIM, font: i===0 ? "inherit" : MONO}))})),
          hasConfirm: done && m.confirm === true,
          confirmSummary: m.confirmSummary || "",
          confirmHash: "sha256 a4f19c…",
          hasActions: done && m.confirm !== true && !!m.actions,
          actions:(m.actions || []).map(a => ({label:a[0], bg:a[1] ? LIME : "none", color:a[1] ? "var(--on-accent)" : "var(--ink)", border:a[1] ? LIME : "var(--border)", run:() => runAction(a, (x) => this.ask(x))}))
        };
      }),
      suggestions: ["What should we reorder?","Which wholesale orders are blocked?","Can we afford the proposed stock purchase?"]
        .map(q => ({label:q, run:() => this.ask(q)})),
      activity: jodzActivity(),
      /* Cards, not rows: each one lands on its own spring, newest first, with
         the status colour carried into a soft glow behind its marker. */
      notifications: notificationFeed.slice(0,5).map((n, i) => ({
        dot:n.dot, text:n.text, when:n.meta, event:n.event,
        cardStyle: "position:relative;flex:none;display:flex;align-items:flex-start;gap:11px;padding:13px 15px;border-radius:var(--r-md,16px);cursor:pointer;"
          + "background:var(--surface);border:1px solid var(--border);"
          + "transition:background .2s var(--ease),border-color .2s var(--ease),transform .22s var(--ease);"
          + "animation:notifCard .62s cubic-bezier(.16,1,.28,1) " + (110 + i * 62) + "ms both",
        washStyle: "position:absolute;left:0;top:0;bottom:0;width:58%;pointer-events:none;border-radius:var(--r-md,16px) 0 0 16px;"
          + "background:linear-gradient(90deg," + n.dot + "14, transparent 78%)",
        dotStyle: "position:relative;width:7px;height:7px;border-radius:50%;flex:none;margin-top:5px;background:" + n.dot
          + ";box-shadow:0 0 10px " + n.dot + ";animation:notifDot .56s cubic-bezier(.16,1,.3,1) " + (200 + i * 62) + "ms both"
      })),
      notifGroups: [["EARLIER TODAY", 0]],
      deployment: [
        {k:"Client", v:"jod-z", font:MONO},
        {k:"App name", v:"Jod-Z Operations (demo)", font:"inherit"},
        {k:"Brand tokens", v:"#111111 · #F7F7F5 · #71717A", font:MONO},
        {k:"Terminology", v:"organisation → Retailer", font:"inherit"},
        {k:"Locale", v:"EUR · Europe/Dublin", font:"inherit"},
        {k:"Data", v:"Fictional demo data", font:"inherit"}
      ],
      roles: [
        {name:"Owner", grants:"all permissions, approves purchases, adjustments and partial dispatch", scope:"all", users:"1"},
        {name:"Operations", grants:"wholesale orders, allocation, dispatch", scope:"all", users:"1"},
        {name:"Stock", grants:"stock, deliveries, returns, draft purchases", scope:"all", users:"1"},
        {name:"Finance", grants:"invoices, bills, cash outlook, reminders", scope:"all", users:"1"}
      ],
      team: [{i:"RK",bg:"var(--accent)"},{i:"MB",bg:"#9fd6f0"},{i:"DW",bg:"#e6c78a"}],
      paletteOpen: st.paletteOpen, showNotifs: st.showNotifs, query: st.query, draft: st.draft,
      noResults: results.length === 0,
      palScopes, hasQuery: q.length > 0, askPreview: q ? '"' + q + '"' : "",
      palIsHome: !q, palPage, palFrequent, palRecentRows, palJump,
      palPageLabel: page.toUpperCase(),
      palHasRecent: recentRaw.length > 0,
      palClearRecent: () => this.setState({palRecent:[], palSel:0}),
      palFooter: q ? total + (total === 1 ? " RESULT" : " RESULTS") : "TYPE TO SEARCH EVERYTHING",
      askRowStyle: rowBase + (askActive ? ";background:var(--surface);box-shadow:inset 2px 0 0 var(--accent)" : ""),
      askIconStyle: "flex:none;width:26px;height:26px;border-radius:var(--r-sm,9px);display:flex;align-items:center;justify-content:center;border:1px solid var(--accent-line);background:var(--pill-bg);color:var(--accent)",
      hoverAsk: () => { if (st.palSel !== 0) this.setState({palSel:0}); },
      askHelios: () => this.ask(q),
      clearQuery: () => this.setState({query:"", palSel:0}),
      setDraft: (e) => this.setState({draft:e.target.value}),
      onDraftKey: (e) => { if (e.key === "Enter" && !e.shiftKey){ e.preventDefault(); if (st.draft.trim()) this.ask(st.draft.trim()); } },
      onQueryKey: (e) => {
        const n = q ? total : homeCount, cur = q ? sel : homeSel;
        if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)){ e.preventDefault(); this.setState({palSel: n ? (cur + 1) % n : 0}); return; }
        if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)){ e.preventDefault(); this.setState({palSel: n ? (cur - 1 + n) % n : 0}); return; }
        if (e.key === "Enter"){
          e.preventDefault();
          if ((e.metaKey || e.ctrlKey) && q) { this.ask(q); return; }
          const target = flat[q ? sel : homeSel];
          if (target) target();
          else if (q) this.ask(q);
        }
      },
      send: () => { if (st.draft.trim()) this.ask(st.draft.trim()); },
      newThread: () => { clearInterval(this._t); this.setState({thread:[], typed:0, draft:""}); },
      setQuery: (e) => this.setState({query:e.target.value, palSel:0}),
      openPalette: () => this.openPalette(),
      closePalette: () => this.setState({paletteOpen:false, query:"", palSel:0}),
      stop: (e) => e.stopPropagation(),
      theme: st.theme,
      themeLabel: st.theme === "light" ? "Switch to dark" : "Switch to light",
      themeIcon: st.theme === "light"
        ? "M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z"
        : "M12 4.2V2.6 M12 21.4v-1.6 M4.2 12H2.6 M21.4 12h-1.6 M6.5 6.5 5.4 5.4 M18.6 18.6l-1.1-1.1 M6.5 17.5l-1.1 1.1 M18.6 5.4l-1.1 1.1 M12 16.6a4.6 4.6 0 1 0 0-9.2 4.6 4.6 0 0 0 0 9.2Z",
      /* The two glyphs are stacked and swapped, so the control shows which way
         it is going rather than redrawing a thin outline. */
      sunStyle: "position:absolute;inset:0;transition:transform .42s cubic-bezier(.16,1,.3,1),opacity .26s var(--ease);"
        + (st.theme === "light" ? "transform:none;opacity:1;color:var(--accent)" : "transform:rotate(-80deg) scale(.55);opacity:0"),
      moonStyle: "position:absolute;inset:0;transition:transform .42s cubic-bezier(.16,1,.3,1),opacity .26s var(--ease);"
        + (st.theme === "light" ? "transform:rotate(80deg) scale(.55);opacity:0" : "transform:none;opacity:1"),
      // Back from light returns to whichever dark theme you were on, not the base "dark".
      toggleTheme: () => this.setState(p => p.theme === "light"
        ? {theme: p.darkTheme || this.props.theme || "jodz"}
        : {theme: "light", darkTheme: p.theme}),
      toggleNotifs: () => this.setState({showNotifs:!st.showNotifs}),
      /* Home: the widget rail steps away once a conversation starts, so the
         thread gets the full width — brought back on demand, not automatically. */
      showRail: st.thread.length === 0 || st.chatRailPinned,
      toggleChatRail: () => this.setState(prev => ({chatRailPinned: !prev.chatRailPinned})),
      chatRailLabel: st.chatRailPinned ? "Hide widgets" : "Widgets",
      chatScrollStyle: st.thread.length
        ? "flex:1 1 0;min-height:0;overflow-y:auto;display:flex;flex-direction:column"
        : "flex:0 0 auto;display:flex;flex-direction:column",
      chatColumnStyle: "position:relative;z-index:1;flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;"
        + "transition:max-width .38s var(--ease)",
      threadWidthStyle: "flex:0 0 auto;width:100%;margin:0 auto;padding:14px 4px 8px;"
        + "max-width:" + (st.thread.length && !st.chatRailPinned ? "880px" : "760px") + ";"
        + "transition:max-width .38s var(--ease)",
      composerPrompts: [
        {label:"What should we reorder?", tag:"STOCK", icon:ICONS.navStock,
          run: () => this.ask("What should we reorder?")},
        {label:"Which wholesale orders are blocked?", tag:"ORDERS", icon:ICONS.navSales,
          run: () => this.ask("Which wholesale orders are blocked?")},
        {label:"Can we afford the proposed stock purchase?", tag:"CASH", icon:ICONS.navBooks,
          run: () => this.ask("Can we afford the proposed stock purchase?")}
      ].map((p, i) => Object.assign(p, {
        rowStyle: "display:flex;align-items:center;gap:13px;width:100%;padding:10px 14px;background:none;border:0;"
          + (i ? "border-top:1px solid var(--border);" : "")
          + "color:var(--body);font-size:13.5px;text-align:left;cursor:pointer;transition:background .18s var(--ease),color .18s var(--ease)"
      })),
      showPrompts: st.promptsHidden !== true,
      promptsStyle: (() => {
        const w = st.thread.length ? (st.chatRailPinned ? "760px" : "880px") : "600px";
        return "width:100%;max-width:" + w + ";margin:0 auto;animation:" + (st.promptsFading ? "fadeOutUp .26s var(--ease) both" : "rowIn .34s var(--ease) both");
      })(),
      hidePrompts: () => { this.setState({promptsFading:true}); setTimeout(() => this.setState({promptsHidden:true, promptsFading:false}), 240); },
      composerShellStyle: "background:var(--surface);border:1px solid var(--border);border-radius:var(--card-r,18px);backdrop-filter:blur(22px) saturate(1.35);box-shadow:0 18px 44px rgba(0,0,0,.34);overflow:hidden;transition:border-color .22s var(--ease),box-shadow .3s var(--ease)",
      composerWidthStyle: "width:100%;margin:0 auto;"
        + "max-width:" + (st.thread.length ? (st.chatRailPinned ? "760px" : "880px") : "600px") + ";"
        + "transition:max-width .38s var(--ease)",
      goSettings: () => this.go("Settings")
    };
  }
}
