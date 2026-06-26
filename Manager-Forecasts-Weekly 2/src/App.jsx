import React, { useState, useEffect, useMemo, useRef } from "react";
import Papa from "papaparse";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid,
} from "recharts";
import {
  LayoutDashboard, Users, ArrowUpDown, Megaphone, Lightbulb, TrendingDown, TrendingUp,
  FileText, Settings as SettingsIcon, Plus, Trash2, Check, X, Copy, Sparkles,
  ChevronUp, ChevronDown, AlertTriangle, Target, Image as ImageIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ *
 * Weekly Forecast Cockpit
 * A live console for the weekly forecast meeting: manager calls,
 * swings, headlines, pipeline tips, and trending-behind accounts —
 * all snapshotted week over week.
 * ------------------------------------------------------------------ */

const T = {
  ink: "#0E1116", panel: "#161B22", panel2: "#1C232D", line: "#2A323D",
  text: "#E6EDF3", muted: "#8B98A5", faint: "#5B6673",
  accent: "#4CC2FF", up: "#3FB950", down: "#F85149", warn: "#D6A126",
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
* { box-sizing: border-box; }
.wfm, .wfm * { font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
.wfm .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; font-variant-numeric: tabular-nums; }
.wfm {
  background:${T.ink}; color:${T.text}; min-height:100vh; width:100%;
  display:flex; flex-direction:column; -webkit-font-smoothing:antialiased;
}
.wfm button { font-family:inherit; cursor:pointer; border:none; background:none; color:inherit; }
.wfm input, .wfm textarea, .wfm select {
  font-family:inherit; background:${T.ink}; color:${T.text};
  border:1px solid ${T.line}; border-radius:7px; padding:7px 9px; font-size:13px; outline:none;
  transition:border-color .15s, box-shadow .15s;
}
.wfm input:focus, .wfm textarea:focus, .wfm select:focus {
  border-color:${T.accent}; box-shadow:0 0 0 3px rgba(76,194,255,.13);
}
.wfm input::placeholder, .wfm textarea::placeholder { color:${T.faint}; }

/* topbar */
.wfm .top { display:flex; align-items:center; gap:18px; padding:13px 22px;
  border-bottom:1px solid ${T.line}; background:linear-gradient(180deg,#171D25,${T.panel}); }
.wfm .brand { display:flex; flex-direction:column; line-height:1.1; }
.wfm .brand b { font-size:15px; font-weight:700; letter-spacing:-.2px; }
.wfm .brand span { font-size:10.5px; color:${T.muted}; letter-spacing:.5px; text-transform:uppercase; }
.wfm .gauge { flex:1; max-width:420px; }
.wfm .gauge .gl { display:flex; justify-content:space-between; font-size:11px; color:${T.muted}; margin-bottom:5px; }
.wfm .bar { height:8px; background:${T.panel2}; border-radius:99px; overflow:hidden; position:relative; }
.wfm .bar i { display:block; height:100%; border-radius:99px; transition:width .5s cubic-bezier(.2,.8,.2,1); }
.wfm .tpill { display:flex; flex-direction:column; align-items:flex-end; }
.wfm .tpill small { font-size:10px; color:${T.muted}; text-transform:uppercase; letter-spacing:.5px; }
.wfm .tpill b { font-size:18px; font-weight:600; }
.wfm .wk { display:flex; align-items:center; gap:8px; }

/* shell */
.wfm .shell { display:flex; flex:1; min-height:0; }
.wfm .nav { width:208px; border-right:1px solid ${T.line}; padding:14px 10px; background:${T.panel};
  display:flex; flex-direction:column; gap:2px; flex-shrink:0; }
.wfm .nav button { display:flex; align-items:center; gap:10px; padding:9px 11px; border-radius:8px;
  font-size:13px; color:${T.muted}; text-align:left; transition:background .12s,color .12s; width:100%; }
.wfm .nav button:hover { background:${T.panel2}; color:${T.text}; }
.wfm .nav button.on { background:rgba(76,194,255,.12); color:${T.accent}; }
.wfm .nav button.on svg { color:${T.accent}; }
.wfm .nav .navtag { margin-left:auto; font-size:10px; padding:1px 6px; border-radius:99px;
  background:${T.down}; color:#fff; font-weight:600; }
.wfm .main { flex:1; overflow:auto; padding:24px 28px 60px; }
.wfm .main { animation:fade .35s ease; }
@keyframes fade { from{opacity:0; transform:translateY(6px);} to{opacity:1; transform:none;} }

.wfm h2 { font-size:19px; font-weight:600; margin:0 0 3px; letter-spacing:-.3px; }
.wfm .sub { font-size:12.5px; color:${T.muted}; margin:0 0 18px; max-width:640px; line-height:1.5; }

/* cards */
.wfm .card { background:${T.panel}; border:1px solid ${T.line}; border-radius:12px; padding:16px 18px; }
.wfm .grid { display:grid; gap:14px; }
.wfm .tape { display:grid; grid-template-columns:repeat(auto-fill,minmax(168px,1fr)); gap:12px; }
.wfm .mcard { background:${T.panel}; border:1px solid ${T.line}; border-radius:11px; padding:13px 14px; }
.wfm .mcard .mn { font-size:12px; color:${T.muted}; margin-bottom:7px; }
.wfm .mcard .mv { font-size:23px; font-weight:600; letter-spacing:-.5px; }
.wfm .delta { font-size:12px; display:inline-flex; align-items:center; gap:2px; margin-top:4px; }

/* table */
.wfm table { width:100%; border-collapse:collapse; }
.wfm th { text-align:left; font-size:10.5px; text-transform:uppercase; letter-spacing:.6px;
  color:${T.muted}; font-weight:600; padding:8px 10px; border-bottom:1px solid ${T.line}; }
.wfm td { padding:7px 10px; border-bottom:1px solid ${T.panel2}; font-size:13px; vertical-align:middle; }
.wfm tr:last-child td { border-bottom:none; }
.wfm td input, .wfm td select { width:100%; }
.wfm .cellnum input { text-align:right; font-family:'JetBrains Mono',monospace; font-variant-numeric:tabular-nums; }

/* buttons */
.wfm .btn { display:inline-flex; align-items:center; gap:6px; padding:8px 13px; border-radius:8px;
  font-size:13px; font-weight:500; transition:filter .12s,background .12s,border-color .12s; }
.wfm .btn.pri { background:${T.accent}; color:#06141d; font-weight:600; }
.wfm .btn.pri:hover { filter:brightness(1.08); }
.wfm .btn.gho { border:1px solid ${T.line}; color:${T.text}; }
.wfm .btn.gho:hover { border-color:${T.accent}; color:${T.accent}; }
.wfm .btn.sm { padding:5px 9px; font-size:12px; }
.wfm .ico { padding:6px; border-radius:7px; color:${T.faint}; transition:color .12s,background .12s; }
.wfm .ico:hover { color:${T.down}; background:${T.panel2}; }

.wfm .row { display:flex; align-items:center; gap:10px; }
.wfm .between { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.wfm .tag { font-size:10.5px; padding:2px 8px; border-radius:99px; font-weight:600; letter-spacing:.3px; }
.wfm .empty { border:1px dashed ${T.line}; border-radius:11px; padding:26px; text-align:center; color:${T.muted}; font-size:13px; }
.wfm .empty b { color:${T.text}; display:block; margin-bottom:4px; font-size:14px; }

/* tips */
.wfm .tip { display:flex; gap:12px; align-items:flex-start; padding:13px 14px; border:1px solid ${T.line};
  border-radius:11px; transition:border-color .12s; }
.wfm .tip.inc { border-color:rgba(63,185,80,.5); background:rgba(63,185,80,.05); }
.wfm .chk { width:21px; height:21px; border-radius:6px; border:1.5px solid ${T.line}; flex-shrink:0;
  display:flex; align-items:center; justify-content:center; margin-top:1px; transition:all .12s; }
.wfm .chk.on { background:${T.up}; border-color:${T.up}; color:#06141d; }
.wfm .src { font-size:10px; padding:1px 7px; border-radius:99px; border:1px solid ${T.line}; color:${T.muted}; }

.wfm .out { background:${T.ink}; border:1px solid ${T.line}; border-radius:10px; padding:16px; font-size:13px;
  line-height:1.6; white-space:pre-wrap; max-height:440px; overflow:auto; }
.wfm .out .mono { font-size:12.5px; }
.wfm .notice { font-size:11.5px; color:${T.warn}; display:flex; gap:7px; align-items:flex-start;
  background:rgba(214,161,38,.08); border:1px solid rgba(214,161,38,.28); border-radius:9px; padding:9px 12px; }
.wfm label.fld { display:flex; flex-direction:column; gap:5px; font-size:11.5px; color:${T.muted}; }
.wfm .seg { display:inline-flex; border:1px solid ${T.line}; border-radius:8px; overflow:hidden; }
.wfm .seg button { padding:6px 12px; font-size:12px; color:${T.muted}; }
.wfm .seg button.on { background:${T.accent}; color:#06141d; font-weight:600; }
.wfm .drop { border:1.5px dashed ${T.line}; border-radius:11px; padding:32px 20px; text-align:center;
  cursor:pointer; transition:border-color .15s, background .15s, color .15s; color:${T.muted}; outline:none; }
.wfm .drop:hover, .wfm .drop:focus-visible { border-color:${T.accent}; color:${T.text}; }
.wfm .drop.over { border-color:${T.accent}; background:rgba(76,194,255,.07); color:${T.text}; }
.wfm .drop b { display:block; color:${T.text}; font-size:14px; margin-bottom:4px; }
.wfm .drop .di { color:${T.accent}; margin-bottom:8px; }
.wfm .map { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; margin:14px 0; }
.wfm .map label { font-size:11px; color:${T.muted}; display:flex; flex-direction:column; gap:5px; }
.wfm .map select.bad { border-color:${T.down}; }
.wfm .prev th, .wfm .prev td { padding:5px 9px; font-size:12px; }
.wfm .prev td { color:${T.text}; }
@media (prefers-reduced-motion: reduce){ .wfm *{ animation:none!important; transition:none!important; } }
`;

/* ---------- storage helpers ----------
 * Inside Claude, window.storage persists across sessions.
 * Standalone (this repo), we fall back to localStorage so data still persists
 * in the browser. For multi-user / multi-device persistence, point these at a
 * real backend (see README). */
const hasStore = typeof window !== "undefined" && window.storage;
const LS = typeof window !== "undefined" ? window.localStorage : null;
async function sget(k) {
  try {
    if (hasStore) { const r = await window.storage.get(k); return r ? JSON.parse(r.value) : null; }
    if (LS) { const v = LS.getItem("wfm:" + k); return v ? JSON.parse(v) : null; }
    return null;
  } catch { return null; }
}
async function sset(k, v) {
  try {
    if (hasStore) { await window.storage.set(k, JSON.stringify(v)); return; }
    if (LS) LS.setItem("wfm:" + k, JSON.stringify(v));
  } catch { /* ignore quota / serialization errors */ }
}

/* ---------- AI suggestions endpoint ----------
 * Inside Claude, the bare Anthropic endpoint works (the host injects auth).
 * Standalone, calling it from the browser will fail (no key / CORS) — point
 * this at your own backend proxy that holds the API key. Until then, the
 * "Suggest tips" button degrades gracefully and manual entry still works. */
const AI_ENDPOINT = "https://api.anthropic.com/v1/messages";

/* ---------- utils ---------- */
const uid = () => Math.random().toString(36).slice(2, 9);
const money = (n) => (n == null || n === "" || isNaN(n)) ? "—"
  : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(n));
const pct = (n) => (n == null || n === "" || isNaN(n)) ? "—" : `${Number(n).toFixed(0)}%`;
const num = (v) => v === "" || v == null ? null : Number(v);
const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

function thisMonday() {
  const d = new Date(); const day = d.getDay(); const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff); return d.toISOString().slice(0, 10);
}

const NAV = [
  ["overview", "Overview", LayoutDashboard],
  ["calls", "Manager Calls", Users],
  ["swings", "Swings", ArrowUpDown],
  ["headlines", "Headlines", Megaphone],
  ["tips", "Pipeline Tips", Lightbulb],
  ["trending", "Trending Behind", TrendingDown],
  ["ahead", "Trending Ahead", TrendingUp],
  ["grr", "GRR Attainment", Target],
  ["update", "Weekly Update", FileText],
  ["settings", "Settings", SettingsIcon],
];

function blankWeek(date, managers, prev) {
  const calls = {};
  managers.forEach((m) => {
    const p = prev?.calls?.[m];
    calls[m] = {
      call: null, commit: p?.commit ?? null, best: p?.best ?? null,
      goal: p?.goal ?? null, closedWon: p?.closedWon ?? null,
      note: "", prior: p?.call ?? null,
    };
  });
  return {
    id: date, date,
    plan: prev?.plan ?? null,
    calls,
    swings: [],
    headlines: (prev?.headlines || []).map((h) => ({ ...h, id: uid() })),
    tips: (prev?.tips || []).map((t) => ({ ...t, id: uid() })),
    trending: (prev?.trending || []).map((t) => ({ ...t, id: uid() })),
    grr: {
      rows: (prev?.grr?.rows || []).map((r) => ({ ...r, id: uid(), grrCall: null })),
      image: null, imageName: "",
    },
  };
}

export default function App() {
  const [meta, setMeta] = useState(null);
  const [weeks, setWeeks] = useState({});
  const [tab, setTab] = useState("overview");
  const [loaded, setLoaded] = useState(false);

  // boot
  useEffect(() => {
    (async () => {
      let m = await sget("meta");
      if (!m) {
        const managers = ["Rachel", "Michaela", "Emma", "Sammi", "Gabby", "Suchita", "Eli"];
        const d = thisMonday();
        m = { activeWeek: d, weeks: [d], managers,
          thresholds: { d180: 50, d270: 90, mode: "and", aheadD180: 90, aheadD270: 100, aheadMode: "and" } };
        const wk = blankWeek(d, managers, null);
        await sset("meta", m); await sset("week:" + d, wk);
        setWeeks({ [d]: wk });
      } else {
        const all = {};
        for (const id of m.weeks) { const w = await sget("week:" + id); if (w) all[id] = w; }
        setWeeks(all);
      }
      // Backfill thresholds for users with older saved state
      const defaults = { d180: 50, d270: 90, mode: "and", aheadD180: 90, aheadD270: 100, aheadMode: "and" };
      const merged = { ...defaults, ...(m.thresholds || {}) };
      if (JSON.stringify(merged) !== JSON.stringify(m.thresholds)) {
        m = { ...m, thresholds: merged };
        await sset("meta", m);
      }
      setMeta(m); setLoaded(true);
    })();
  }, []);

  const week = meta ? weeks[meta.activeWeek] : null;

  function saveMeta(nm) { setMeta(nm); sset("meta", nm); }
  function updateWeek(fn) {
    const w = weeks[meta.activeWeek]; if (!w) return;
    const nw = fn(structuredClone(w));
    setWeeks({ ...weeks, [meta.activeWeek]: nw }); sset("week:" + nw.id, nw);
  }

  function newWeek() {
    const def = thisMonday();
    const d = prompt("Meeting date for the new week (YYYY-MM-DD):", def);
    if (!d) return;
    if (meta.weeks.includes(d)) { setMeta({ ...meta, activeWeek: d }); return; }
    const prev = weeks[meta.activeWeek];
    const wk = blankWeek(d, meta.managers, prev);
    const order = [...meta.weeks, d].sort();
    setWeeks({ ...weeks, [d]: wk }); sset("week:" + d, wk);
    saveMeta({ ...meta, weeks: order, activeWeek: d });
    setTab("calls");
  }

  if (!loaded || !meta || !week) {
    return (<><style>{CSS}</style><div className="wfm"><div className="main">Loading the cockpit…</div></div></>);
  }

  const totalCall = meta.managers.reduce((s, m) => s + (week.calls[m]?.call || 0), 0);
  const totalCommit = meta.managers.reduce((s, m) => s + (week.calls[m]?.commit || 0), 0);
  const planPct = week.plan ? (totalCall / week.plan) * 100 : 0;
  const netSwing = week.swings.reduce((s, x) => s + (x.dir === "up" ? 1 : -1) * (x.amount || 0), 0);
  const gColor = planPct >= 100 ? T.up : planPct >= 92 ? T.warn : T.down;

  const flagged = week.trending.filter((r) => flag(r, meta.thresholds));
  const flaggedAhead = week.trending.filter((r) => flagAhead(r, meta.thresholds));

  const sortedWeeks = [...meta.weeks].sort();
  const idx = sortedWeeks.indexOf(meta.activeWeek);
  const prevWeek = idx > 0 ? weeks[sortedWeeks[idx - 1]] : null;

  return (
    <>
      <style>{CSS}</style>
      <div className="wfm">
        {/* TOP */}
        <div className="top">
          <div className="brand"><b>Forecast Cockpit</b><span>Weekly Manager Review</span></div>
          <div className="gauge">
            <div className="gl"><span>Call vs Plan</span><span className="mono">{money(totalCall)} / {money(week.plan)}</span></div>
            <div className="bar"><i style={{ width: Math.min(100, planPct) + "%", background: gColor }} /></div>
          </div>
          <div className="tpill"><small>Net Swing</small>
            <b className="mono" style={{ color: netSwing >= 0 ? T.up : T.down }}>{netSwing >= 0 ? "+" : "−"}{money(Math.abs(netSwing))}</b>
          </div>
          <div className="wk">
            <select value={meta.activeWeek} onChange={(e) => saveMeta({ ...meta, activeWeek: e.target.value })}>
              {sortedWeeks.slice().reverse().map((d) => <option key={d} value={d}>Wk of {fmtDate(d)}</option>)}
            </select>
            <button className="btn pri sm" onClick={newWeek}><Plus size={15} />New week</button>
          </div>
        </div>

        <div className="shell">
          {/* NAV */}
          <div className="nav">
            {NAV.map(([key, label, Icon]) => (
              <button key={key} className={tab === key ? "on" : ""} onClick={() => setTab(key)}>
                <Icon size={16} />{label}
                {key === "trending" && flagged.length > 0 && <span className="navtag">{flagged.length}</span>}
                {key === "ahead" && flaggedAhead.length > 0 && <span className="navtag" style={{ background: T.up }}>{flaggedAhead.length}</span>}
                {key === "tips" && week.tips.filter((t) => (t.status || "not_tried") !== "not_tried").length > 0 &&
                  <span className="navtag" style={{ background: T.up }}>{week.tips.filter((t) => (t.status || "not_tried") !== "not_tried").length}</span>}
              </button>
            ))}
          </div>

          {/* MAIN */}
          <div className="main" key={tab + meta.activeWeek}>
            {tab === "overview" && <Overview {...{ meta, weeks, week, prevWeek, totalCall, totalCommit, netSwing, flagged }} />}
            {tab === "calls" && <Calls {...{ meta, week, prevWeek, updateWeek, saveMeta, totalCall }} />}
            {tab === "swings" && <Swings {...{ week, meta, updateWeek }} />}
            {tab === "headlines" && <Headlines {...{ week, meta, updateWeek }} />}
            {tab === "tips" && <Tips {...{ meta, week, updateWeek }} />}
            {tab === "trending" && <Trending {...{ week, meta, updateWeek, flagged, flaggedAhead, mode: "behind" }} />}
            {tab === "ahead" && <Trending {...{ week, meta, updateWeek, flagged, flaggedAhead, mode: "ahead" }} />}
            {tab === "grr" && <Grr {...{ week, meta, prevWeek, updateWeek }} />}
            {tab === "update" && <Update {...{ meta, week, totalCall, totalCommit, netSwing, flagged, flaggedAhead }} />}
            {tab === "settings" && <SettingsTab {...{ meta, saveMeta, updateWeek, week }} />}
          </div>
        </div>
      </div>
    </>
  );
}

function flag(r, t) {
  const checks = [];
  if (r.day180 != null) checks.push(r.day180 < t.d180);
  if (r.day270 != null) checks.push(r.day270 < t.d270);
  if (!checks.length) return false; // not yet measured at any milestone
  return t.mode === "and" ? checks.every(Boolean) : checks.some(Boolean);
}

function flagAhead(r, t) {
  const checks = [];
  if (r.day180 != null) checks.push(r.day180 >= (t.aheadD180 ?? 90));
  if (r.day270 != null) checks.push(r.day270 >= (t.aheadD270 ?? 100));
  if (!checks.length) return false;
  const mode = t.aheadMode || "and";
  return mode === "and" ? checks.every(Boolean) : checks.some(Boolean);
}

/* ============================== OVERVIEW ============================== */
function Overview({ meta, weeks, week, prevWeek, totalCall, totalCommit, netSwing, flagged }) {
  const series = [...meta.weeks].sort().map((d) => {
    const w = weeks[d]; if (!w) return null;
    const call = meta.managers.reduce((s, m) => s + (w.calls[m]?.call || 0), 0);
    return { wk: fmtDate(d), call, plan: w.plan || null };
  }).filter(Boolean);

  const hasAttainment = meta.managers.some((m) => {
    const c = week.calls[m] || {};
    return c.goal != null || c.closedWon != null;
  });
  const totalWon = meta.managers.reduce((s, m) => s + (week.calls[m]?.closedWon || 0), 0);
  const totalGoal = meta.managers.reduce((s, m) => s + (week.calls[m]?.goal || 0), 0);
  const totalAttPct = totalGoal ? (totalWon / totalGoal) * 100 : null;

  return (
    <>
      <h2>This week at a glance</h2>
      <p className="sub">Live snapshot for the meeting on {fmtDate(week.date)}. Everything here is captured against this week and kept as you move forward.</p>

      {hasAttainment && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="between" style={{ marginBottom: 12 }}>
            <b style={{ fontSize: 14 }}>Goal attainment</b>
            {totalAttPct != null && (
              <span className="mono" style={{ fontSize: 12, color: T.muted }}>
                Team: <b style={{ color: totalAttPct >= 100 ? T.up : totalAttPct >= 80 ? T.warn : T.down }}>{totalAttPct.toFixed(0)}%</b>
                {" · "}{money(totalWon)} / {money(totalGoal)}
              </span>
            )}
          </div>
          <div className="tape">
            {meta.managers.map((m) => {
              const c = week.calls[m] || {};
              const goal = c.goal || 0;
              const won = c.closedWon || 0;
              const pctVal = goal ? (won / goal) * 100 : null;
              const color = pctVal == null ? T.muted : pctVal >= 100 ? T.up : pctVal >= 80 ? T.warn : T.down;
              return (
                <div className="mcard" key={m}>
                  <div className="mn">{m}</div>
                  <div className="mv mono" style={{ color }}>{pctVal == null ? "—" : pctVal.toFixed(0) + "%"}</div>
                  <div className="mono" style={{ fontSize: 11.5, color: T.muted, marginTop: 4 }}>
                    {money(c.closedWon)} / {money(c.goal)}
                  </div>
                  <div className="bar" style={{ marginTop: 8 }}>
                    <i style={{ width: Math.min(100, pctVal || 0) + "%", background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="tape" style={{ marginBottom: 18 }}>
        {meta.managers.map((m) => {
          const c = week.calls[m] || {};
          const prior = prevWeek?.calls?.[m]?.call ?? c.prior;
          const d = c.call != null && prior != null ? c.call - prior : null;
          return (
            <div className="mcard" key={m}>
              <div className="mn">{m}</div>
              <div className="mv mono">{c.call == null ? <span style={{ color: T.faint }}>—</span> : money(c.call)}</div>
              <div className="mono" style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
                Last: {prior == null ? "—" : money(prior)}
              </div>
              {d != null && d !== 0 && (
                <div className="delta mono" style={{ color: d > 0 ? T.up : T.down }}>
                  {d > 0 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}{money(Math.abs(d))} WoW
                </div>
              )}
              {d === 0 && <div className="delta mono" style={{ color: T.muted }}>flat WoW</div>}
            </div>
          );
        })}
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <div className="card">
          <div className="between" style={{ marginBottom: 12 }}>
            <b style={{ fontSize: 14 }}>Total call vs plan</b>
            <span className="mono" style={{ fontSize: 12, color: T.muted }}>{meta.weeks.length} week{meta.weeks.length > 1 ? "s" : ""} tracked</span>
          </div>
          <div style={{ height: 210 }}>
            <ResponsiveContainer>
              <LineChart data={series} margin={{ top: 6, right: 10, left: -8, bottom: 0 }}>
                <CartesianGrid stroke={T.panel2} vertical={false} />
                <XAxis dataKey="wk" tick={{ fill: T.muted, fontSize: 11 }} stroke={T.line} />
                <YAxis tick={{ fill: T.muted, fontSize: 11 }} stroke={T.line}
                  tickFormatter={(v) => "$" + (v / 1e6).toFixed(1) + "M"} />
                <Tooltip contentStyle={{ background: T.panel2, border: "1px solid " + T.line, borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => money(v)} labelStyle={{ color: T.text }} />
                <Line type="monotone" dataKey="plan" stroke={T.faint} strokeDasharray="4 4" dot={false} strokeWidth={1.5} name="Plan" />
                <Line type="monotone" dataKey="call" stroke={T.accent} strokeWidth={2.5} dot={{ r: 3, fill: T.accent }} name="Call" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid">
          <div className="card">
            <div className="mn" style={{ color: T.muted, fontSize: 12, marginBottom: 6 }}>Commit floor</div>
            <div className="mono" style={{ fontSize: 26, fontWeight: 600 }}>{money(totalCommit)}</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>across {meta.managers.length} managers</div>
          </div>
          <div className="card">
            <div className="between" style={{ marginBottom: 8 }}>
              <b style={{ fontSize: 14 }}>Trending behind</b>
              {flagged.length > 0 && <span className="tag" style={{ background: "rgba(248,81,73,.15)", color: T.down }}>{flagged.length} flagged</span>}
            </div>
            {flagged.length === 0 ? <div style={{ fontSize: 12.5, color: T.muted }}>No accounts breaching thresholds.</div>
              : flagged.slice(0, 4).map((r) => (
                <div key={r.id} className="row between" style={{ fontSize: 12.5, padding: "5px 0", borderBottom: "1px solid " + T.panel2 }}>
                  <span>{r.account} <span style={{ color: T.faint }}>· {r.owner}</span></span>
                  <span className="mono" style={{ color: T.down }}>{pct(r.day180)}/{pct(r.day270)}</span>
                </div>))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ============================== CALLS ============================== */
function Calls({ meta, week, prevWeek, updateWeek, saveMeta, totalCall }) {
  const set = (m, field, v) => updateWeek((w) => { w.calls[m] = { ...w.calls[m], [field]: field === "note" ? v : num(v) }; return w; });
  return (
    <>
      <h2>Manager calls</h2>
      <p className="sub">Each manager's call on where they'll land. Edit weekly — the prior week's call is carried in automatically so you can see movement. Commit is the floor, Best is the ceiling. Or drop this week's forecast export to fill the whole table at once.</p>

      <ForecastImporter meta={meta} updateWeek={updateWeek} saveMeta={saveMeta} />

      <div className="card" style={{ padding: 0, marginTop: 16 }}>
        <table>
          <thead><tr>
            <th>Manager</th>
            <th style={{ textAlign: "right" }}>Last call</th>
            <th style={{ textAlign: "right" }}>This call</th>
            <th style={{ textAlign: "right" }}>WoW Δ</th>
            <th style={{ textAlign: "right" }}>Commit</th>
            <th style={{ textAlign: "right" }}>Best</th>
            <th>Note</th>
          </tr></thead>
          <tbody>
            {meta.managers.map((m) => {
              const c = week.calls[m] || {};
              const prior = prevWeek?.calls?.[m]?.call ?? c.prior;
              const d = c.call != null && prior != null ? c.call - prior : null;
              return (
                <tr key={m}>
                  <td style={{ fontWeight: 500 }}>{m}</td>
                  <td className="mono" style={{ textAlign: "right", color: prior == null ? T.faint : T.muted, paddingRight: 19 }}>
                    {prior == null ? "—" : money(prior)}
                  </td>
                  <td className="cellnum"><input type="number" value={c.call ?? ""} placeholder="—" onChange={(e) => set(m, "call", e.target.value)} /></td>
                  <td className="mono" style={{ textAlign: "right", color: d > 0 ? T.up : d < 0 ? T.down : T.muted, paddingRight: 19 }}>
                    {d == null ? "—" : (d === 0 ? "flat" : (d > 0 ? "+" : "−") + money(Math.abs(d)))}
                  </td>
                  <td className="cellnum"><input type="number" value={c.commit ?? ""} placeholder="—" onChange={(e) => set(m, "commit", e.target.value)} /></td>
                  <td className="cellnum"><input type="number" value={c.best ?? ""} placeholder="—" onChange={(e) => set(m, "best", e.target.value)} /></td>
                  <td><input value={c.note || ""} placeholder="add context…" onChange={(e) => set(m, "note", e.target.value)} /></td>
                </tr>);
            })}
          </tbody>
          <tfoot><tr>
            <td style={{ fontWeight: 600 }}>Total</td>
            <td></td>
            <td className="mono" style={{ textAlign: "right", fontWeight: 600, color: T.accent, paddingRight: 19 }}>{money(totalCall)}</td>
            <td colSpan={4}></td>
          </tr></tfoot>
        </table>
      </div>
      <p className="sub" style={{ marginTop: 12 }}>Add or remove managers in Settings — names stay stable so the trend chart stays continuous.</p>
    </>
  );
}

/* ---------- forecast CSV importer ---------- */
function ForecastImporter({ meta, updateWeek, saveMeta }) {
  const [over, setOver] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState("");
  const inputRef = useRef(null);

  const isIndented = (s) => s !== s.replace(/^[\s\u2003\u2002\u00a0]+/, "");
  const moneyNum = (v) => { const n = parseFloat(String(v ?? "").replace(/[^0-9.\-]/g, "")); return isNaN(n) ? null : Math.round(n); };

  function handleFile(file) {
    setErr(""); setDone("");
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") { setErr("That's not a .csv — export the forecast as CSV and try again."); return; }
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (res) => {
        const fields = (res.meta.fields || []).filter(Boolean);
        const find = (re) => fields.find((f) => re.test(f)) || "";
        const cMgr = find(/manager|name/i);
        const cCall = find(/most likely/i) || find(/forecast|call/i);
        const cCommit = find(/^commit/i) || find(/commit/i);
        const cBest = find(/best/i);
        const cGoal = fields.find((f) => /goal/i.test(f) && !/attain/i.test(f)) || "";
        const cClosedWon = find(/closed.?won|booked|won.?(?:amount|amt|\$|mtd|qtd|ytd)|actuals?|won.?to.?date/i) || fields.find((f) => /\bwon\b/i.test(f) && !/unwon|will\s*win/i.test(f)) || "";
        if (!cMgr || !cCall) { setErr("Couldn't find Manager and Most Likely columns — is this the forecast export?"); return; }

        const data = res.data;
        const managers = [];
        const calls = {};
        let planTotal = null;
        data.forEach((r) => {
          const raw = String(r[cMgr] ?? "");
          const name = raw.trim();
          if (!name) return;
          if (/^total$/i.test(name)) { planTotal = cGoal ? moneyNum(r[cGoal]) : null; return; }
          if (isIndented(raw)) return;          // skip rep rows, keep manager rollups
          managers.push(name);
          calls[name] = {
            call: moneyNum(r[cCall]), commit: cCommit ? moneyNum(r[cCommit]) : null,
            best: cBest ? moneyNum(r[cBest]) : null,
            goal: cGoal ? moneyNum(r[cGoal]) : null,
            closedWon: cClosedWon ? moneyNum(r[cClosedWon]) : null,
            note: "", prior: null,
          };
        });
        if (!managers.length) { setErr("No manager rows detected in that file."); return; }

        updateWeek((w) => {
          managers.forEach((m) => {
            const ex = w.calls[m];
            // Preserve last-week's call (set when the week was created via blankWeek). If absent, fall back to whatever call value was already there.
            calls[m].prior = ex?.prior ?? ex?.call ?? null;
            if (ex?.note) calls[m].note = ex.note;
          });
          w.calls = calls;
          if (planTotal != null) w.plan = planTotal;
          return w;
        });
        saveMeta({ ...meta, managers });
        const parts = [`${managers.length} managers`];
        if (planTotal != null) parts.push("plan " + money(planTotal));
        if (cClosedWon) parts.push("closed-won from “" + cClosedWon + "”");
        else parts.push("no closed-won column detected");
        setDone("Loaded " + parts.join(" · ") + ".");
      },
      error: () => setErr("Couldn't read that file."),
    });
  }
  const onDrop = (e) => { e.preventDefault(); setOver(false); handleFile(e.dataTransfer.files?.[0]); };

  return (
    <div className={"drop" + (over ? " over" : "")} role="button" tabIndex={0}
      style={{ padding: "18px 20px" }}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)} onDrop={onDrop}>
      <div className="row" style={{ justifyContent: "center", gap: 9 }}>
        <FileText size={18} style={{ color: T.accent }} />
        <b style={{ fontSize: 13.5 }}>Drop the forecast export</b>
        <span style={{ fontSize: 12, color: T.muted }}>— fills calls from Most Likely, Commit, Best Case; sets plan from the Total goal</span>
      </div>
      {done && <div style={{ fontSize: 12, color: T.up, marginTop: 7 }}>{done}</div>}
      {err && <div style={{ fontSize: 12, color: T.down, marginTop: 7 }}>{err}</div>}
      <input ref={inputRef} type="file" accept=".csv,text/csv" style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files?.[0])} />
    </div>
  );
}

/* ============================== SWINGS ============================== */
function Swings({ week, meta, updateWeek }) {
  const add = () => updateWeek((w) => { w.swings.push({ id: uid(), account: "", owner: meta.managers[0] || "", dir: "up", amount: null, note: "" }); return w; });
  const upd = (id, f, v) => updateWeek((w) => { w.swings = w.swings.map((s) => s.id === id ? { ...s, [f]: f === "amount" ? num(v) : v } : s); return w; });
  const del = (id) => updateWeek((w) => { w.swings = w.swings.filter((s) => s.id !== id); return w; });
  const up = week.swings.filter((s) => s.dir === "up").reduce((a, s) => a + (s.amount || 0), 0);
  const dn = week.swings.filter((s) => s.dir === "down").reduce((a, s) => a + (s.amount || 0), 0);
  return (
    <>
      <h2>Swing factors</h2>
      <p className="sub">Deals or accounts that could move the number up or down before quarter close. Net swing rolls up to the top bar.</p>
      <div className="row" style={{ gap: 12, marginBottom: 16 }}>
        <div className="card" style={{ flex: 1, padding: "12px 16px" }}><div className="mn">Potential upside</div><div className="mono" style={{ fontSize: 22, fontWeight: 600, color: T.up }}>+{money(up)}</div></div>
        <div className="card" style={{ flex: 1, padding: "12px 16px" }}><div className="mn">Potential downside</div><div className="mono" style={{ fontSize: 22, fontWeight: 600, color: T.down }}>−{money(dn)}</div></div>
        <div className="card" style={{ flex: 1, padding: "12px 16px" }}><div className="mn">Net</div><div className="mono" style={{ fontSize: 22, fontWeight: 600, color: up - dn >= 0 ? T.up : T.down }}>{up - dn >= 0 ? "+" : "−"}{money(Math.abs(up - dn))}</div></div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        {week.swings.length === 0 ? <div style={{ padding: 18 }}><div className="empty"><b>No swings logged</b>Track the deals most likely to move your call this week.</div></div> :
          <table>
            <thead><tr><th>Account</th><th>Owner</th><th>Direction</th><th style={{ textAlign: "right" }}>Amount</th><th>Why</th><th></th></tr></thead>
            <tbody>{week.swings.map((s) => (
              <tr key={s.id}>
                <td><input value={s.account} placeholder="account" onChange={(e) => upd(s.id, "account", e.target.value)} /></td>
                <td><select value={s.owner} onChange={(e) => upd(s.id, "owner", e.target.value)}>{meta.managers.map((m) => <option key={m}>{m}</option>)}</select></td>
                <td><div className="seg">
                  <button className={s.dir === "up" ? "on" : ""} onClick={() => upd(s.id, "dir", "up")}>Up</button>
                  <button className={s.dir === "down" ? "on" : ""} onClick={() => upd(s.id, "dir", "down")}>Down</button>
                </div></td>
                <td className="cellnum"><input type="number" value={s.amount ?? ""} placeholder="0" onChange={(e) => upd(s.id, "amount", e.target.value)} /></td>
                <td><input value={s.note} placeholder="context…" onChange={(e) => upd(s.id, "note", e.target.value)} /></td>
                <td><button className="ico" onClick={() => del(s.id)}><Trash2 size={15} /></button></td>
              </tr>))}</tbody>
          </table>}
      </div>
      <button className="btn gho sm" style={{ marginTop: 12 }} onClick={add}><Plus size={14} />Add swing</button>
    </>
  );
}

/* ============================== HEADLINES ============================== */
function Headlines({ week, meta, updateWeek }) {
  const add = () => updateWeek((w) => { w.headlines.push({ id: uid(), account: "", owner: meta.managers[0] || "", note: "" }); return w; });
  const upd = (id, f, v) => updateWeek((w) => { w.headlines = w.headlines.map((h) => h.id === id ? { ...h, [f]: v } : h); return w; });
  const del = (id) => updateWeek((w) => { w.headlines = w.headlines.filter((h) => h.id !== id); return w; });
  return (
    <>
      <h2>Rep & customer headlines</h2>
      <p className="sub">The notable stories from the week — expansions, risks, champion changes. These carry forward week over week so you can keep editing the running narrative.</p>
      {week.headlines.length === 0 && <div className="empty" style={{ marginBottom: 14 }}><b>No headlines yet</b>Capture what your managers are calling out this week.</div>}
      <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 10 }}>
        {week.headlines.map((h) => (
          <div className="card" key={h.id} style={{ padding: "12px 14px" }}>
            <div className="row" style={{ marginBottom: 8 }}>
              <input style={{ flex: "0 0 200px" }} value={h.account} placeholder="Account / rep" onChange={(e) => upd(h.id, "account", e.target.value)} />
              <select style={{ flex: "0 0 140px" }} value={h.owner} onChange={(e) => upd(h.id, "owner", e.target.value)}>{meta.managers.map((m) => <option key={m}>{m}</option>)}</select>
              <button className="ico" style={{ marginLeft: "auto" }} onClick={() => del(h.id)}><Trash2 size={15} /></button>
            </div>
            <textarea style={{ width: "100%", minHeight: 52, resize: "vertical" }} value={h.note} placeholder="What's the story?" onChange={(e) => upd(h.id, "note", e.target.value)} />
          </div>))}
      </div>
      <button className="btn gho sm" style={{ marginTop: 12 }} onClick={add}><Plus size={14} />Add headline</button>
    </>
  );
}

/* ============================== TIPS ============================== */
const TIP_STATUSES = [
  { key: "not_tried", label: "Not tried", color: "#8B98A5", bg: "rgba(139,152,165,.12)" },
  { key: "in_progress", label: "In progress", color: "#D6A126", bg: "rgba(214,161,38,.15)" },
  { key: "unsuccessful", label: "Unsuccessful", color: "#F85149", bg: "rgba(248,81,73,.15)" },
  { key: "successful", label: "Successful", color: "#3FB950", bg: "rgba(63,185,80,.15)" },
];
const tipStatus = (s) => TIP_STATUSES.find((x) => x.key === s) || TIP_STATUSES[0];

function Tips({ meta, week, updateWeek }) {
  const addFor = (owner) => updateWeek((w) => {
    w.tips.push({ id: uid(), source: "Manual", text: "", included: false, owner, status: "not_tried" });
    return w;
  });
  const del = (id) => updateWeek((w) => { w.tips = w.tips.filter((t) => t.id !== id); return w; });
  const editText = (id, v) => updateWeek((w) => { w.tips = w.tips.map((t) => t.id === id ? { ...t, text: v } : t); return w; });
  const setStatus = (id, s) => updateWeek((w) => { w.tips = w.tips.map((t) => t.id === id ? { ...t, status: s } : t); return w; });
  const setOwner = (id, o) => updateWeek((w) => { w.tips = w.tips.map((t) => t.id === id ? { ...t, owner: o } : t); return w; });

  // Bucket tips by owner; tips missing an owner or pointing at a removed manager land in "Unassigned".
  const buckets = {};
  meta.managers.forEach((m) => { buckets[m] = []; });
  const unassigned = [];
  week.tips.forEach((t) => {
    if (t.owner && buckets[t.owner]) buckets[t.owner].push(t);
    else unassigned.push(t);
  });

  const tipRow = (t) => {
    const s = tipStatus(t.status);
    return (
      <div key={t.id} className="row" style={{ gap: 10, alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid " + T.panel2 }}>
        <textarea style={{ flex: 1, minHeight: 32, resize: "vertical", border: "1px solid " + T.line, borderRadius: 7, padding: "6px 8px", fontSize: 13 }}
          value={t.text} placeholder="What are they trying? (e.g. cold-call walk-ins, ABM sequence with CFO, etc.)"
          onChange={(e) => editText(t.id, e.target.value)} />
        <div className="seg" style={{ flexShrink: 0 }}>
          {TIP_STATUSES.map((opt) => (
            <button key={opt.key} className={t.status === opt.key ? "on" : ""}
              style={t.status === opt.key ? { background: opt.color, color: "#06141d" } : { color: opt.color }}
              onClick={() => setStatus(t.id, opt.key)}>{opt.label}</button>
          ))}
        </div>
        <button className="ico" onClick={() => del(t.id)} title="Delete"><Trash2 size={15} /></button>
      </div>
    );
  };

  const statusCount = (k) => week.tips.filter((t) => (t.status || "not_tried") === k).length;

  return (
    <>
      <h2>Pipeline generation tips</h2>
      <p className="sub">Each manager logs the tactics they're trying to generate pipeline. Mark progress with the status pill — these carry forward each week so we can see what's working over time.</p>

      <div className="row" style={{ flexWrap: "wrap", gap: 8, marginBottom: 16, fontSize: 12, color: T.muted }}>
        <b style={{ color: T.text }}>{week.tips.length} tactic{week.tips.length !== 1 ? "s" : ""} tracked</b>
        {TIP_STATUSES.map((s) => (
          <span key={s.key} className="tag" style={{ background: s.bg, color: s.color }}>{statusCount(s.key)} {s.label.toLowerCase()}</span>
        ))}
      </div>

      <div className="grid" style={{ gap: 14 }}>
        {meta.managers.map((m) => (
          <div className="card" key={m}>
            <div className="between" style={{ marginBottom: 4 }}>
              <b style={{ fontSize: 14 }}>{m}</b>
              <button className="btn gho sm" onClick={() => addFor(m)}><Plus size={14} />Add tactic</button>
            </div>
            {buckets[m].length === 0
              ? <div style={{ fontSize: 12.5, color: T.faint, padding: "8px 0" }}>No tactics yet — add what they're trying this week.</div>
              : buckets[m].map(tipRow)}
          </div>
        ))}

        {unassigned.length > 0 && (
          <div className="card">
            <div className="between" style={{ marginBottom: 4 }}>
              <b style={{ fontSize: 14, color: T.warn }}>Unassigned</b>
              <span style={{ fontSize: 12, color: T.muted }}>{unassigned.length} tactic{unassigned.length !== 1 ? "s" : ""} — pick a manager below</span>
            </div>
            {unassigned.map((t) => (
              <div key={t.id} className="row" style={{ gap: 10, alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid " + T.panel2 }}>
                <select style={{ flexShrink: 0, width: 140 }} value={t.owner || ""} onChange={(e) => setOwner(t.id, e.target.value)}>
                  <option value="">— pick owner —</option>
                  {meta.managers.map((mm) => <option key={mm} value={mm}>{mm}</option>)}
                </select>
                <textarea style={{ flex: 1, minHeight: 32, resize: "vertical", border: "1px solid " + T.line, borderRadius: 7, padding: "6px 8px", fontSize: 13 }}
                  value={t.text} onChange={(e) => editText(t.id, e.target.value)} />
                <div className="seg" style={{ flexShrink: 0 }}>
                  {TIP_STATUSES.map((opt) => (
                    <button key={opt.key} className={t.status === opt.key ? "on" : ""}
                      style={t.status === opt.key ? { background: opt.color, color: "#06141d" } : { color: opt.color }}
                      onClick={() => setStatus(t.id, opt.key)}>{opt.label}</button>
                  ))}
                </div>
                <button className="ico" onClick={() => del(t.id)}><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ============================== TRENDING ============================== */
function Trending({ week, meta, updateWeek, flagged, flaggedAhead, mode }) {
  const t = meta.thresholds;
  const isAhead = mode === "ahead";
  const matches = isAhead ? flaggedAhead : flagged;
  const [view, setView] = useState("flagged");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const add = () => updateWeek((w) => { w.trending.push({ id: uid(), account: "", owner: meta.managers[0] || "", day180: null, day270: null, actionPlan: "" }); return w; });
  const upd = (id, f, v) => updateWeek((w) => { w.trending = w.trending.map((r) => r.id === id ? { ...r, [f]: f === "day180" || f === "day270" ? num(v) : v } : r); return w; });
  const del = (id) => updateWeek((w) => { w.trending = w.trending.filter((r) => r.id !== id); return w; });

  const hasD270 = week.trending.some((r) => r.day270 != null);
  const ownerOpts = (o) => (meta.managers.includes(o) || !o ? meta.managers : [o, ...meta.managers]);

  // Sort: behind = worst-first (smallest pacing first); ahead = best-first (largest pacing first).
  const sortRows = (list) => {
    const score = (r) => (r.day180 == null ? 100 : r.day180) + (r.day270 == null ? 100 : r.day270);
    return [...list].sort((a, b) => isAhead ? score(b) - score(a) : score(a) - score(b));
  };

  let shown = view === "flagged" ? matches : week.trending;
  if (ownerFilter !== "all") shown = shown.filter((r) => r.owner === ownerFilter);
  shown = sortRows(shown);

  const title = isAhead ? "Trending ahead" : "Trending behind";
  const accent = isAhead ? T.up : T.down;
  const accentBg = isAhead ? "rgba(63,185,80,.15)" : "rgba(248,81,73,.15)";
  const rowHighlight = isAhead ? "rgba(63,185,80,.06)" : "rgba(248,81,73,.06)";
  const statusLabel = isAhead ? "Ahead" : "Behind";
  const otherStatusLabel = isAhead ? "Not yet ahead" : "On pace";
  const isFlaggedFn = isAhead ? (r) => flagAhead(r, t) : (r) => flag(r, t);

  const ruleSummary = isAhead
    ? <>An account shows here when its pacing is at or above <b style={{ color: T.text }}>{t.aheadD180 ?? 90}%</b> at Day 180 {hasD270 ? <><b style={{ color: T.text }}>{(t.aheadMode || "and") === "and" ? "and" : "or"}</b> <b style={{ color: T.text }}>{t.aheadD270 ?? 100}%</b> at Day 270</> : "(only Day 180 data loaded — see note below)"}. Values are attainment vs. expected pace. Adjust the rule in Settings.</>
    : <>Accounts pacing behind plan. An account is flagged when it's behind <b style={{ color: T.text }}>{t.d180}%</b> at Day 180 {hasD270 ? <><b style={{ color: T.text }}>{t.mode === "and" ? "and" : "or"}</b> behind <b style={{ color: T.text }}>{t.d270}%</b> at Day 270</> : "(no Day 270 data loaded yet — see note below)"}. Values are attainment vs. expected pace, so 42 means at 42% of where the account should be. Accounts not yet at a milestone stay unflagged. Adjust the rule in Settings.</>;

  return (
    <>
      <h2>{title}</h2>
      <p className="sub">{ruleSummary}</p>

      {!hasD270 && (
        <div className="notice" style={{ marginBottom: 16 }}>
          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>This week's file is the <b>Day 180</b> export only, so the rule is running on the Day 180 line alone. Drop the matching <b>Day 270</b> export too and accounts present in both will be evaluated against the full both-milestones rule.</span>
        </div>
      )}

      <div className="between" style={{ marginBottom: 10, flexWrap: "wrap", gap: 10 }}>
        <b style={{ fontSize: 13, color: T.muted }}>{week.trending.length} tracked · {matches.length} {isAhead ? "ahead" : "flagged"}</b>
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: T.muted }}>
            Manager
            <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} style={{ minWidth: 130 }}>
              <option value="all">All managers</option>
              {meta.managers.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <div className="seg">
            <button className={view === "flagged" ? "on" : ""} onClick={() => setView("flagged")}>{isAhead ? "Ahead" : "Flagged"} ({matches.length})</button>
            <button className={view === "all" ? "on" : ""} onClick={() => setView("all")}>All ({week.trending.length})</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, marginBottom: 14 }}>
        {shown.length === 0 ? <div style={{ padding: 18 }}><div className="empty"><b>{view === "flagged" ? `Nothing ${isAhead ? "ahead" : "flagged"}` : "No accounts yet"}</b>{view === "flagged" ? `No accounts ${isAhead ? "meet the ahead rule" : "breach the rule"} this week${ownerFilter !== "all" ? ` for ${ownerFilter}` : ""}.` : "Drop your CSV export below to populate the segment."}</div></div> :
        <table>
          <thead><tr>
            <th>Account</th><th>Owner</th>
            <th style={{ textAlign: "right" }}>Day 180</th><th style={{ textAlign: "right" }}>Day 270</th>
            <th>Status</th><th>Action Plan</th><th></th>
          </tr></thead>
          <tbody>{shown.map((r) => {
            const f = isFlaggedFn(r);
            return (
              <tr key={r.id} style={{ background: f ? rowHighlight : "transparent" }}>
                <td><input value={r.account} placeholder="account" onChange={(e) => upd(r.id, "account", e.target.value)} /></td>
                <td><select value={r.owner} onChange={(e) => upd(r.id, "owner", e.target.value)}>{ownerOpts(r.owner).map((m) => <option key={m}>{m}</option>)}</select></td>
                <td className="cellnum"><input type="number" value={r.day180 ?? ""} placeholder="—" onChange={(e) => upd(r.id, "day180", e.target.value)} /></td>
                <td className="cellnum"><input type="number" value={r.day270 ?? ""} placeholder="—" onChange={(e) => upd(r.id, "day270", e.target.value)} /></td>
                <td>{f ? <span className="tag" style={{ background: accentBg, color: accent }}>{statusLabel}</span>
                  : <span className="tag" style={{ background: T.panel2, color: T.muted }}>{otherStatusLabel}</span>}</td>
                <td style={{ minWidth: 220 }}>
                  <textarea
                    value={r.actionPlan || ""}
                    placeholder={isAhead ? "what's working…" : "next step, owner, ETA…"}
                    onChange={(e) => upd(r.id, "actionPlan", e.target.value)}
                    style={{ width: "100%", minHeight: 32, resize: "vertical", padding: "5px 7px", fontSize: 12.5 }}
                  />
                </td>
                <td><button className="ico" onClick={() => del(r.id)}><Trash2 size={15} /></button></td>
              </tr>);
          })}</tbody>
        </table>}
      </div>

      <button className="btn gho sm" onClick={add}><Plus size={14} />Add account</button>

      <Importer meta={meta} updateWeek={updateWeek} />
    </>
  );
}

/* ============================== IMPORTER ============================== */
function Importer({ meta, updateWeek }) {
  const [rows, setRows] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [map, setMap] = useState({ account: "", owner: "", day180: "", day270: "" });
  const [scale, setScale] = useState("percent");
  const [mode, setMode] = useState("replace");
  const [over, setOver] = useState(false);
  const [err, setErr] = useState("");
  const [fileName, setFileName] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [bulk, setBulk] = useState("");
  const [topN, setTopN] = useState(20);
  const inputRef = useRef(null);

  // Rank only the accounts that breach the behind rule, worst-first, capped at topN.
  // Worst = smallest pacing values; treat a missing milestone as 100% (not worse).
  function rankBehind(list) {
    const t = meta.thresholds;
    const score = (r) => (r.day180 == null ? 100 : r.day180) + (r.day270 == null ? 100 : r.day270);
    return list.filter((r) => flag(r, t)).sort((a, b) => score(a) - score(b)).slice(0, topN);
  }
  // Ahead: highest pacing first.
  function rankAhead(list) {
    const t = meta.thresholds;
    const score = (r) => (r.day180 == null ? 0 : r.day180) + (r.day270 == null ? 0 : r.day270);
    return list.filter((r) => flagAhead(r, t)).sort((a, b) => score(b) - score(a)).slice(0, topN);
  }
  function rankUnion(list) {
    const behind = rankBehind(list);
    const ahead = rankAhead(list);
    const seen = new Set(behind.map((r) => r.id));
    return [...behind, ...ahead.filter((r) => !seen.has(r.id))];
  }

  const pctNum = (v) => { const n = parseFloat(String(v ?? "").replace(/[^0-9.\-]/g, "")); return isNaN(n) ? null : n; };

  function autoMap(fields) {
    const find = (re) => fields.find((f) => re.test(f)) || "";
    const milestone = (day) => {
      const metric = (f) => /ratio|attain|percent|pct|%|pacing|index|score/i.test(f) && !/cutoff|date|day\)|expected|purchased|used/i.test(f);
      return fields.find((f) => new RegExp(day).test(f) && metric(f)) || fields.find((f) => new RegExp(day).test(f) && !/cutoff|date/i.test(f)) || "";
    };
    return {
      account: find(/account|customer|company|client|logo/i) || find(/name/i),
      owner: find(/manager/i) || find(/owner/i) || find(/\brep\b|\bae\b|csm|exec/i),
      day180: milestone("180"),
      day270: milestone("270"),
    };
  }

  // ratios (0–1) vs percentages (0–100): if the day columns top out near 1–3, they're ratios
  function guessScale(data, m) {
    const vals = [];
    [m.day180, m.day270].filter(Boolean).forEach((c) => data.forEach((r) => { const n = pctNum(r[c]); if (n != null) vals.push(Math.abs(n)); }));
    if (!vals.length) return "percent";
    return Math.max(...vals) <= 3 ? "ratio" : "percent";
  }

  function handleFile(file) {
    setErr("");
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") { setErr("That's not a .csv — export the dashboard as CSV and try again."); return; }
    setFileName(file.name);
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (res) => {
        const fields = (res.meta.fields || []).filter(Boolean);
        const data = (res.data || []).filter((r) => Object.values(r).some((v) => String(v).trim()));
        if (!fields.length || !data.length) { setErr("The file opened but had no rows. Check the export and try again."); return; }
        const m = autoMap(fields);
        setHeaders(fields); setRows(data); setMap(m); setScale(guessScale(data, m));
      },
      error: () => setErr("Couldn't read that file. Make sure it's a valid CSV."),
    });
  }

  const onDrop = (e) => { e.preventDefault(); setOver(false); handleFile(e.dataTransfer.files?.[0]); };

  function build() {
    const f = scale === "ratio" ? 100 : 1;
    const conv = (v) => { const n = pctNum(v); return n == null ? null : Math.round(n * f * 10) / 10; };
    return rows.map((r) => ({
      id: uid(),
      account: String(r[map.account] ?? "").trim(),
      owner: String(r[map.owner] ?? "").trim() || (meta.managers[0] || ""),
      day180: map.day180 ? conv(r[map.day180]) : null,
      day270: map.day270 ? conv(r[map.day270]) : null,
      actionPlan: "",
    })).filter((x) => x.account);
  }

  function doImport() {
    if (!map.account) { setErr("Tell me which column is the account name first."); return; }
    const all = build();
    if (!all.length) { setErr("No rows landed — double-check the account column."); return; }
    const top = rankUnion(all);
    if (!top.length) { setErr(`None of the ${all.length} rows match the behind (D180 < ${meta.thresholds.d180}%) or ahead (D180 ≥ ${meta.thresholds.aheadD180 ?? 90}%) rules. Loosen the rules in Settings if needed.`); return; }
    updateWeek((w) => {
      const incoming = top.map((r) => {
        const prev = w.trending.find((x) => x.account === r.account && x.owner === r.owner);
        return prev?.actionPlan ? { ...r, actionPlan: prev.actionPlan } : r;
      });
      w.trending = mode === "replace" ? incoming : [...w.trending, ...incoming];
      return w;
    });
    reset();
  }
  function reset() { setRows(null); setHeaders([]); setFileName(""); setErr(""); }

  function importPaste() {
    const lines = bulk.trim().split("\n").map((l) => l.split(/[\t,]/).map((x) => x.trim())).filter((r) => r[0]);
    if (!lines.length) { setErr("Nothing to import."); return; }
    const built = lines.map((r) => ({ id: uid(), account: r[0], owner: r[1] || meta.managers[0] || "", day180: pctNum(r[2]), day270: pctNum(r[3]), actionPlan: "" }));
    const top = rankUnion(built);
    if (!top.length) { setErr(`None of the ${built.length} rows match the behind or ahead rules.`); return; }
    updateWeek((w) => {
      const incoming = top.map((r) => {
        const prev = w.trending.find((x) => x.account === r.account && x.owner === r.owner);
        return prev?.actionPlan ? { ...r, actionPlan: prev.actionPlan } : r;
      });
      w.trending = mode === "replace" ? incoming : [...w.trending, ...incoming];
      return w;
    });
    setBulk(""); setErr("");
  }

  const TARGETS = [["account", "Account"], ["owner", "Owner"], ["day180", "Day 180 %"], ["day270", "Day 270 %"]];

  return (
    <div className="card" style={{ marginTop: 18 }}>
      <div className="between" style={{ marginBottom: 12 }}>
        <b style={{ fontSize: 14 }}>Import this week's export</b>
        <button className="btn gho sm" onClick={() => { setShowPaste(!showPaste); reset(); }}>
          {showPaste ? "Use file upload" : "Paste rows instead"}
        </button>
      </div>

      {!showPaste && !rows && (
        <div className={"drop" + (over ? " over" : "")} role="button" tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)} onDrop={onDrop}>
          <div className="di"><FileText size={26} /></div>
          <b>Drop your CSV here</b>
          <span style={{ fontSize: 12.5 }}>or click to browse · columns map automatically</span>
          <input ref={inputRef} type="file" accept=".csv,text/csv" style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files?.[0])} />
        </div>
      )}

      {!showPaste && rows && (
        <>
          {(() => {
            const all = build();
            const behind = all.filter((r) => flag(r, meta.thresholds));
            const ahead = all.filter((r) => flagAhead(r, meta.thresholds));
            return (
              <div className="row between" style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 12.5, color: T.muted }}>
                  <span className="mono" style={{ color: T.text }}>{fileName}</span> · {rows.length} row{rows.length !== 1 ? "s" : ""} · <b style={{ color: T.down }}>{behind.length}</b> behind · <b style={{ color: T.up }}>{ahead.length}</b> ahead · matched columns shown below
                </span>
                <button className="btn gho sm" onClick={reset}>Choose another file</button>
              </div>
            );
          })()}
          <div className="map">
            {TARGETS.map(([k, label]) => (
              <label key={k}>{label}{k === "account" && " *"}
                <select className={k === "account" && !map[k] ? "bad" : ""} value={map[k]}
                  onChange={(e) => setMap({ ...map, [k]: e.target.value })}>
                  <option value="">— none —</option>
                  {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </label>
            ))}
          </div>

          <div className="row" style={{ gap: 10, marginBottom: 12, fontSize: 12, color: T.muted }}>
            <span>Pacing values are</span>
            <div className="seg">
              <button className={scale === "percent" ? "on" : ""} onClick={() => setScale("percent")}>Percent (0–100)</button>
              <button className={scale === "ratio" ? "on" : ""} onClick={() => setScale("ratio")}>Ratio (0–1)</button>
            </div>
            {scale === "ratio" && <span style={{ color: T.faint }}>× 100 on import — e.g. 0.43 → 43%</span>}
          </div>

          {(() => {
            const all = build();
            const previewBehind = rankBehind(all).slice(0, 4);
            const previewAhead = rankAhead(all).slice(0, 4);
            return (
              <div style={{ border: "1px solid " + T.line, borderRadius: 9, overflow: "hidden", marginBottom: 12 }}>
                <table className="prev">
                  <thead><tr><th></th>{TARGETS.map(([k, l]) => <th key={k}>{l}</th>)}</tr></thead>
                  <tbody>
                    {previewBehind.map((r) => (
                      <tr key={r.id}>
                        <td><span className="tag" style={{ background: "rgba(248,81,73,.15)", color: T.down }}>Behind</span></td>
                        <td>{r.account || <span style={{ color: T.faint }}>—</span>}</td>
                        <td>{r.owner}</td>
                        <td className="mono">{r.day180 == null ? "—" : r.day180 + "%"}</td>
                        <td className="mono">{r.day270 == null ? "—" : r.day270 + "%"}</td>
                      </tr>))}
                    {previewAhead.map((r) => (
                      <tr key={r.id}>
                        <td><span className="tag" style={{ background: "rgba(63,185,80,.15)", color: T.up }}>Ahead</span></td>
                        <td>{r.account || <span style={{ color: T.faint }}>—</span>}</td>
                        <td>{r.owner}</td>
                        <td className="mono">{r.day180 == null ? "—" : r.day180 + "%"}</td>
                        <td className="mono">{r.day270 == null ? "—" : r.day270 + "%"}</td>
                      </tr>))}
                  </tbody>
                </table>
              </div>
            );
          })()}

          <div className="row" style={{ flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <div className="seg">
              <button className={mode === "replace" ? "on" : ""} onClick={() => setMode("replace")}>Replace list</button>
              <button className={mode === "add" ? "on" : ""} onClick={() => setMode("add")}>Add to list</button>
            </div>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: T.muted }}>
              Top
              <input type="number" min="1" max="200" value={topN} onChange={(e) => setTopN(Math.max(1, Math.min(200, parseInt(e.target.value, 10) || 1)))} style={{ width: 60 }} />
              each
            </label>
            {(() => {
              const all = build();
              const nb = rankBehind(all).length;
              const na = rankAhead(all).length;
              return <button className="btn pri sm" onClick={doImport}><Check size={14} />Import {nb} behind + {na} ahead</button>;
            })()}
          </div>
          <p className="sub" style={{ margin: "10px 0 0", fontSize: 11.5 }}>
            Imports the worst-pacing behind accounts (Day 180 &lt; {meta.thresholds.d180}%) and the best-pacing ahead accounts (Day 180 ≥ {meta.thresholds.aheadD180 ?? 90}%), each capped at the Top value. Existing Action Plans are preserved if the same account/owner is re-imported. “Replace” swaps the whole segment for this week; “Add” appends.
          </p>
        </>
      )}

      {showPaste && (
        <>
          <p className="sub" style={{ margin: "0 0 9px" }}>One per line: <span className="mono" style={{ color: T.text }}>Account, Owner, Day180%, Day270%</span> (comma or tab separated)</p>
          <textarea style={{ width: "100%", minHeight: 70, resize: "vertical", marginBottom: 10 }} value={bulk}
            placeholder={"Helio Corp, Okafor, 42, 78\nQuill Labs, Petrova, 61, 85"} onChange={(e) => setBulk(e.target.value)} />
          <div className="row">
            <div className="seg">
              <button className={mode === "replace" ? "on" : ""} onClick={() => setMode("replace")}>Replace list</button>
              <button className={mode === "add" ? "on" : ""} onClick={() => setMode("add")}>Add to list</button>
            </div>
            <button className="btn gho sm" onClick={importPaste}>Import rows</button>
          </div>
        </>
      )}

      {err && <p style={{ fontSize: 12, color: T.down, margin: "10px 0 0" }}>{err}</p>}
    </div>
  );
}

/* ============================== GRR ============================== */
function Grr({ week, meta, prevWeek, updateWeek }) {
  const [csvErr, setCsvErr] = useState("");
  const [csvDone, setCsvDone] = useState("");
  const [imgErr, setImgErr] = useState("");
  const [csvOver, setCsvOver] = useState(false);
  const [imgOver, setImgOver] = useState(false);
  const csvRef = useRef(null);
  const imgRef = useRef(null);

  const grr = week.grr || { rows: [], image: null, imageName: "" };
  const rows = grr.rows;

  const moneyNum = (v) => { const n = parseFloat(String(v ?? "").replace(/[^0-9.\-]/g, "")); return isNaN(n) ? null : Math.round(n * 100) / 100; };
  const isIndented = (s) => s !== s.replace(/^[\s   ]+/, "");

  const updRow = (id, f, v) => updateWeek((w) => {
    w.grr = { ...(w.grr || { rows: [], image: null, imageName: "" }) };
    w.grr.rows = (w.grr.rows || []).map((r) => r.id === id ? { ...r, [f]: (f === "goal" || f === "closedWon" || f === "grrCall") ? num(v) : v } : r);
    return w;
  });
  const delRow = (id) => updateWeek((w) => {
    w.grr = { ...(w.grr || { rows: [], image: null, imageName: "" }) };
    w.grr.rows = (w.grr.rows || []).filter((r) => r.id !== id);
    return w;
  });
  const addRow = () => updateWeek((w) => {
    w.grr = { ...(w.grr || { rows: [], image: null, imageName: "" }) };
    w.grr.rows = [...(w.grr.rows || []), { id: uid(), manager: "", segment: "", goal: null, closedWon: null, grrCall: null, notes: "" }];
    return w;
  });

  function handleCsv(file) {
    setCsvErr(""); setCsvDone("");
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") { setCsvErr("That's not a .csv — export and try again."); return; }
    Papa.parse(file, {
      header: false, skipEmptyLines: true,
      complete: (res) => {
        const data = (res.data || []).filter((r) => Array.isArray(r) && r.some((v) => String(v).trim()));
        if (!data.length) { setCsvErr("File opened but had no rows."); return; }
        // First row in this export is the header strip (",,,Closed Won,Commit,Most Likely,Best Case,..."). Skip it if col 0/1 are empty and col 3 ≈ "Closed Won".
        let start = 0;
        const r0 = data[0];
        const hdr3 = String(r0?.[3] ?? "").toLowerCase();
        if (!String(r0?.[0] ?? "").trim() && hdr3.includes("closed")) start = 1;

        const built = [];
        for (let i = start; i < data.length; i++) {
          const row = data[i];
          const raw = String(row[0] ?? "");
          const name = raw.trim();
          if (!name) continue;
          if (/^total$/i.test(name)) continue;       // skip the team total row
          if (isIndented(raw)) continue;             // skip rep rows
          built.push({
            id: uid(),
            manager: name,
            segment: String(row[1] ?? "").trim(),
            goal: moneyNum(row[2]),
            closedWon: moneyNum(row[3]),
            grrCall: null,
            notes: "",
          });
        }
        if (!built.length) { setCsvErr("No manager rows detected in that file."); return; }

        updateWeek((w) => {
          const prevRows = (w.grr?.rows || []);
          // Preserve grrCall + notes if the same manager+segment appears in the new file.
          const enriched = built.map((r) => {
            const old = prevRows.find((p) => p.manager === r.manager && (p.segment || "") === (r.segment || ""));
            return old ? { ...r, grrCall: old.grrCall, notes: old.notes } : r;
          });
          w.grr = { ...(w.grr || {}), rows: enriched };
          return w;
        });
        setCsvDone(`Loaded ${built.length} manager${built.length !== 1 ? "s" : ""} from ${file.name}.`);
      },
      error: () => setCsvErr("Couldn't read that file."),
    });
  }

  function handleImage(file) {
    setImgErr("");
    if (!file) return;
    if (!/^image\//.test(file.type)) { setImgErr("That doesn't look like an image."); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1400;
        const scale = img.width > maxW ? maxW / img.width : 1;
        const cw = Math.round(img.width * scale);
        const ch = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = cw; canvas.height = ch;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, cw, ch);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        updateWeek((w) => {
          w.grr = { ...(w.grr || { rows: [], image: null, imageName: "" }) };
          w.grr.image = dataUrl; w.grr.imageName = file.name;
          return w;
        });
      };
      img.onerror = () => setImgErr("Couldn't decode that image.");
      img.src = e.target.result;
    };
    reader.onerror = () => setImgErr("Couldn't read that file.");
    reader.readAsDataURL(file);
  }
  const clearImage = () => updateWeek((w) => {
    w.grr = { ...(w.grr || {}), image: null, imageName: "" }; return w;
  });

  const onCsvDrop = (e) => { e.preventDefault(); setCsvOver(false); handleCsv(e.dataTransfer.files?.[0]); };
  const onImgDrop = (e) => { e.preventDefault(); setImgOver(false); handleImage(e.dataTransfer.files?.[0]); };

  // Look up last week's GRR call by manager+segment.
  const lastGrrCallFor = (r) => {
    const pr = (prevWeek?.grr?.rows || []).find((p) => p.manager === r.manager && (p.segment || "") === (r.segment || ""));
    return pr?.grrCall ?? null;
  };

  // Team totals
  const totals = rows.reduce((a, r) => ({
    closedWon: a.closedWon + (r.closedWon || 0),
    goal: a.goal + (r.goal || 0),
    grrCall: a.grrCall + (r.grrCall || 0),
    lastGrrCall: a.lastGrrCall + (lastGrrCallFor(r) || 0),
  }), { closedWon: 0, goal: 0, grrCall: 0, lastGrrCall: 0 });
  const teamPct = totals.goal ? (totals.closedWon / totals.goal) * 100 : null;

  return (
    <>
      <h2>GRR Attainment</h2>
      <p className="sub">Closed Won vs Goal per manager. Drop the forecast export to populate the table, optionally attach a screenshot of the source dashboard for reference. The <b style={{ color: T.text }}>GRR Call</b> field is yours to fill each week and carries last week's number side-by-side for WoW tracking.</p>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 16 }}>
        <div className={"drop" + (csvOver ? " over" : "")} role="button" tabIndex={0}
          onClick={() => csvRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && csvRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setCsvOver(true); }}
          onDragLeave={() => setCsvOver(false)} onDrop={onCsvDrop}
          style={{ padding: "18px 20px" }}>
          <div className="row" style={{ justifyContent: "center", gap: 9 }}>
            <FileText size={18} style={{ color: T.accent }} />
            <b style={{ fontSize: 13.5 }}>Drop the GRR CSV export</b>
            <span style={{ fontSize: 12, color: T.muted }}>— per-manager rows, indented reps skipped</span>
          </div>
          {csvDone && <div style={{ fontSize: 12, color: T.up, marginTop: 7 }}>{csvDone}</div>}
          {csvErr && <div style={{ fontSize: 12, color: T.down, marginTop: 7 }}>{csvErr}</div>}
          <input ref={csvRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={(e) => handleCsv(e.target.files?.[0])} />
        </div>

        <div className={"drop" + (imgOver ? " over" : "")} role="button" tabIndex={0}
          onClick={() => imgRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && imgRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setImgOver(true); }}
          onDragLeave={() => setImgOver(false)} onDrop={onImgDrop}
          style={{ padding: "18px 20px" }}>
          <div className="row" style={{ justifyContent: "center", gap: 9 }}>
            <ImageIcon size={18} style={{ color: T.accent }} />
            <b style={{ fontSize: 13.5 }}>{grr.image ? "Replace screenshot" : "Drop a dashboard screenshot"}</b>
            <span style={{ fontSize: 12, color: T.muted }}>— PNG / JPG, resized to ~1400px</span>
          </div>
          {imgErr && <div style={{ fontSize: 12, color: T.down, marginTop: 7 }}>{imgErr}</div>}
          <input ref={imgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleImage(e.target.files?.[0])} />
        </div>
      </div>

      {grr.image && (
        <div className="card" style={{ marginBottom: 16, padding: 12 }}>
          <div className="between" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: T.muted }}>Reference — <span className="mono" style={{ color: T.text }}>{grr.imageName || "screenshot"}</span></span>
            <button className="btn gho sm" onClick={clearImage}><X size={14} />Remove</button>
          </div>
          <img src={grr.image} alt="GRR reference" style={{ maxWidth: "100%", borderRadius: 8, display: "block" }} />
        </div>
      )}

      {teamPct != null && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="between" style={{ marginBottom: 8 }}>
            <b style={{ fontSize: 14 }}>Team GRR attainment (Closed Won only)</b>
            <span className="mono" style={{ fontSize: 13, color: teamPct >= 100 ? T.up : teamPct >= 80 ? T.warn : T.down }}>
              <b>{teamPct.toFixed(1)}%</b> · {money(totals.closedWon)} / {money(totals.goal)}
            </span>
          </div>
          <div className="bar"><i style={{ width: Math.min(100, teamPct) + "%", background: teamPct >= 100 ? T.up : teamPct >= 80 ? T.warn : T.down }} /></div>
        </div>
      )}

      <div className="card" style={{ padding: 0, marginBottom: 14 }}>
        {rows.length === 0
          ? <div style={{ padding: 18 }}><div className="empty"><b>No GRR rows yet</b>Drop the CSV above, or click Add row to enter manually.</div></div>
          : <table>
              <thead><tr>
                <th>Manager</th>
                <th>Segment</th>
                <th style={{ textAlign: "right" }}>Closed Won</th>
                <th style={{ textAlign: "right" }}>Goal</th>
                <th style={{ textAlign: "right" }}>Attainment</th>
                <th style={{ textAlign: "right" }}>Last GRR Call</th>
                <th style={{ textAlign: "right" }}>This GRR Call</th>
                <th style={{ textAlign: "right" }}>WoW Δ</th>
                <th>Notes</th>
                <th></th>
              </tr></thead>
              <tbody>{rows.map((r) => {
                const pct = r.goal ? (r.closedWon || 0) / r.goal * 100 : null;
                const color = pct == null ? T.muted : pct >= 100 ? T.up : pct >= 80 ? T.warn : T.down;
                const last = lastGrrCallFor(r);
                const d = r.grrCall != null && last != null ? r.grrCall - last : null;
                return (
                  <tr key={r.id}>
                    <td><input value={r.manager} placeholder="manager" onChange={(e) => updRow(r.id, "manager", e.target.value)} /></td>
                    <td><input value={r.segment || ""} placeholder="segment" onChange={(e) => updRow(r.id, "segment", e.target.value)} style={{ width: 110 }} /></td>
                    <td className="cellnum"><input type="number" value={r.closedWon ?? ""} placeholder="—" onChange={(e) => updRow(r.id, "closedWon", e.target.value)} /></td>
                    <td className="cellnum"><input type="number" value={r.goal ?? ""} placeholder="—" onChange={(e) => updRow(r.id, "goal", e.target.value)} /></td>
                    <td className="mono" style={{ textAlign: "right", color, paddingRight: 19 }}>{pct == null ? "—" : pct.toFixed(1) + "%"}</td>
                    <td className="mono" style={{ textAlign: "right", color: last == null ? T.faint : T.muted, paddingRight: 19 }}>{last == null ? "—" : money(last)}</td>
                    <td className="cellnum"><input type="number" value={r.grrCall ?? ""} placeholder="—" onChange={(e) => updRow(r.id, "grrCall", e.target.value)} /></td>
                    <td className="mono" style={{ textAlign: "right", color: d > 0 ? T.up : d < 0 ? T.down : T.muted, paddingRight: 19 }}>
                      {d == null ? "—" : (d === 0 ? "flat" : (d > 0 ? "+" : "−") + money(Math.abs(d)))}
                    </td>
                    <td><input value={r.notes || ""} placeholder="add context…" onChange={(e) => updRow(r.id, "notes", e.target.value)} /></td>
                    <td><button className="ico" onClick={() => delRow(r.id)}><Trash2 size={15} /></button></td>
                  </tr>
                );
              })}</tbody>
              {rows.length > 0 && (
                <tfoot><tr>
                  <td style={{ fontWeight: 600 }}>Team</td>
                  <td></td>
                  <td className="mono" style={{ textAlign: "right", fontWeight: 600, paddingRight: 19 }}>{money(totals.closedWon)}</td>
                  <td className="mono" style={{ textAlign: "right", fontWeight: 600, paddingRight: 19 }}>{money(totals.goal)}</td>
                  <td className="mono" style={{ textAlign: "right", fontWeight: 600, color: teamPct == null ? T.muted : teamPct >= 100 ? T.up : teamPct >= 80 ? T.warn : T.down, paddingRight: 19 }}>
                    {teamPct == null ? "—" : teamPct.toFixed(1) + "%"}
                  </td>
                  <td className="mono" style={{ textAlign: "right", color: T.muted, paddingRight: 19 }}>{totals.lastGrrCall ? money(totals.lastGrrCall) : "—"}</td>
                  <td className="mono" style={{ textAlign: "right", fontWeight: 600, color: T.accent, paddingRight: 19 }}>{totals.grrCall ? money(totals.grrCall) : "—"}</td>
                  <td colSpan={3}></td>
                </tr></tfoot>
              )}
            </table>}
      </div>

      <button className="btn gho sm" onClick={addRow}><Plus size={14} />Add row</button>
    </>
  );
}

/* ============================== UPDATE ============================== */
function Update({ meta, week, totalCall, totalCommit, netSwing, flagged, flaggedAhead }) {
  const [copied, setCopied] = useState(false);
  const text = useMemo(() => {
    const L = [];
    L.push(`📊 Weekly Forecast Update — Wk of ${fmtDate(week.date)}`);
    L.push(``);
    L.push(`TOP LINE`);
    L.push(`• Call: ${money(totalCall)}${week.plan ? `  (${((totalCall / week.plan) * 100).toFixed(0)}% to plan ${money(week.plan)})` : ""}`);
    L.push(`• Commit floor: ${money(totalCommit)}`);
    L.push(`• Net swing in play: ${netSwing >= 0 ? "+" : "−"}${money(Math.abs(netSwing))}`);
    L.push(``);
    L.push(`MANAGER CALLS`);
    meta.managers.forEach((m) => { const c = week.calls[m] || {}; L.push(`• ${m}: ${money(c.call)}${c.note ? ` — ${c.note}` : ""}`); });
    if (week.swings.length) {
      L.push(``); L.push(`SWING FACTORS`);
      week.swings.forEach((s) => L.push(`• ${s.dir === "up" ? "▲" : "▼"} ${s.account} (${s.owner}) ${s.dir === "up" ? "+" : "−"}${money(s.amount)}${s.note ? ` — ${s.note}` : ""}`));
    }
    if (week.headlines.length) {
      L.push(``); L.push(`HEADLINES`);
      week.headlines.forEach((h) => L.push(`• ${h.account} (${h.owner}): ${h.note}`));
    }
    const activeTips = week.tips.filter((t) => t.text && (t.status || "not_tried") !== "not_tried");
    if (activeTips.length) {
      L.push(``); L.push(`PIPELINE GENERATION TACTICS`);
      meta.managers.forEach((m) => {
        const mine = activeTips.filter((t) => t.owner === m);
        if (!mine.length) return;
        L.push(`${m}:`);
        mine.forEach((t) => L.push(`  • [${tipStatus(t.status).label}] ${t.text}`));
      });
    }
    if (flagged.length) {
      L.push(``); L.push(`TRENDING BEHIND`);
      flagged.forEach((r) => {
        L.push(`• ${r.account} (${r.owner}) — ${pct(r.day180)} @ D180, ${pct(r.day270)} @ D270`);
        if (r.actionPlan) L.push(`    Action plan: ${r.actionPlan}`);
      });
    }
    if (flaggedAhead && flaggedAhead.length) {
      L.push(``); L.push(`TRENDING AHEAD`);
      flaggedAhead.forEach((r) => {
        L.push(`• ${r.account} (${r.owner}) — ${pct(r.day180)} @ D180, ${pct(r.day270)} @ D270`);
        if (r.actionPlan) L.push(`    What's working: ${r.actionPlan}`);
      });
    }
    return L.join("\n");
  }, [meta, week, totalCall, totalCommit, netSwing, flagged, flaggedAhead]);

  function copy() { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1600); }

  return (
    <>
      <div className="between">
        <div><h2>Weekly update</h2><p className="sub">Auto-assembled from this week — including only the pipeline tips you selected. Copy and drop it into Slack or email.</p></div>
        <button className="btn pri" onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : "Copy update"}</button>
      </div>
      <div className="out mono">{text}</div>
    </>
  );
}

/* ============================== SETTINGS ============================== */
function SettingsTab({ meta, saveMeta, updateWeek, week }) {
  const [nm, setNm] = useState("");
  const t = meta.thresholds;
  function addMgr() {
    const name = nm.trim(); if (!name || meta.managers.includes(name)) return;
    saveMeta({ ...meta, managers: [...meta.managers, name] });
    updateWeek((w) => { w.calls[name] = { call: null, commit: null, best: null, note: "", prior: null }; return w; });
    setNm("");
  }
  function delMgr(m) {
    if (!confirm(`Remove ${m}? Their calls stay in past weeks but they won't appear going forward.`)) return;
    saveMeta({ ...meta, managers: meta.managers.filter((x) => x !== m) });
  }
  const setT = (patch) => saveMeta({ ...meta, thresholds: { ...t, ...patch } });
  const setPlan = (v) => updateWeek((w) => { w.plan = num(v); return w; });

  return (
    <>
      <h2>Settings</h2>
      <p className="sub">Managers and the trending-behind rule. Changes to the rule re-evaluate every account immediately.</p>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
        <div className="card">
          <b style={{ fontSize: 14 }}>Managers</b>
          <div className="grid" style={{ gap: 7, margin: "12px 0" }}>
            {meta.managers.map((m) => (
              <div className="row between" key={m} style={{ padding: "7px 10px", background: T.panel2, borderRadius: 8 }}>
                <span style={{ fontSize: 13 }}>{m}</span>
                <button className="ico" onClick={() => delMgr(m)}><Trash2 size={14} /></button>
              </div>))}
          </div>
          <div className="row"><input style={{ flex: 1 }} value={nm} placeholder="Add manager…" onChange={(e) => setNm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addMgr()} />
            <button className="btn gho sm" onClick={addMgr}><Plus size={14} />Add</button></div>
        </div>

        <div className="card">
          <b style={{ fontSize: 14 }}>Trending-behind rule</b>
          <div className="grid" style={{ gap: 12, marginTop: 12 }}>
            <label className="fld">Behind threshold at Day 180 (%)
              <input type="number" value={t.d180} onChange={(e) => setT({ d180: Number(e.target.value) })} /></label>
            <label className="fld">Behind threshold at Day 270 (%)
              <input type="number" value={t.d270} onChange={(e) => setT({ d270: Number(e.target.value) })} /></label>
            <label className="fld">Combine conditions with
              <div className="seg">
                <button className={t.mode === "and" ? "on" : ""} onClick={() => setT({ mode: "and" })}>AND (both)</button>
                <button className={t.mode === "or" ? "on" : ""} onClick={() => setT({ mode: "or" })}>OR (either)</button>
              </div></label>
          </div>
        </div>

        <div className="card">
          <b style={{ fontSize: 14 }}>Trending-ahead rule</b>
          <div className="grid" style={{ gap: 12, marginTop: 12 }}>
            <label className="fld">Ahead threshold at Day 180 (%)
              <input type="number" value={t.aheadD180 ?? 90} onChange={(e) => setT({ aheadD180: Number(e.target.value) })} /></label>
            <label className="fld">Ahead threshold at Day 270 (%)
              <input type="number" value={t.aheadD270 ?? 100} onChange={(e) => setT({ aheadD270: Number(e.target.value) })} /></label>
            <label className="fld">Combine conditions with
              <div className="seg">
                <button className={(t.aheadMode || "and") === "and" ? "on" : ""} onClick={() => setT({ aheadMode: "and" })}>AND (both)</button>
                <button className={(t.aheadMode || "and") === "or" ? "on" : ""} onClick={() => setT({ aheadMode: "or" })}>OR (either)</button>
              </div></label>
          </div>
        </div>

        <div className="card">
          <b style={{ fontSize: 14 }}>Plan for this week</b>
          <p className="sub" style={{ margin: "5px 0 10px" }}>Target the call is measured against on {fmtDate(week.date)}.</p>
          <input type="number" className="mono" style={{ width: "100%" }} value={week.plan ?? ""} placeholder="e.g. 4200000" onChange={(e) => setPlan(e.target.value)} />
        </div>
      </div>
    </>
  );
}
