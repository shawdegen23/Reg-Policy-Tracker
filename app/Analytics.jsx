"use client";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, Tooltip, Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);

const noLegend = { plugins: { legend: { display: false } }, maintainAspectRatio: false };
const STAGE_NAMES = { "-1": "Dead", 0: "Introduced", 1: "Committee", 2: "Floor", 3: "Enrolled", 4: "Signed" };
const daysSince = (iso) => iso ? Math.floor((Date.now() - Date.parse(iso)) / 86400000) : null;
const within = (iso, d) => iso && (Date.now() - Date.parse(iso)) / 86400000 <= d;
const SIGNAL = new Set(["Decision", "Proposed Decision", "Ruling"]);

export default function Analytics({ developments, bills, proceedings }) {
  const devs = developments || [];
  const bl = bills || [];
  const procs = (proceedings || []).filter((p) => p.docket && p.docket !== "CONFIRM #");

  // ---------- Docket activity monitor ----------
  const dockets = procs.map((p) => {
    const items = devs.filter((d) => d.docket === p.docket).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    const c30 = items.filter((d) => within(d.date || d.firstSeen, 30)).length;
    const cPrior = items.filter((d) => { const g = daysSince(d.date || d.firstSeen); return g != null && g > 30 && g <= 60; }).length;
    const last = items[0];
    const quiet = last ? daysSince(last.date || last.firstSeen) : null;
    const trend = c30 > cPrior ? "▲ heating" : c30 < cPrior ? "▼ cooling" : "— steady";
    const trendCls = c30 > cPrior ? "High" : c30 < cPrior ? "Low" : "Medium";
    return { docket: p.docket, topic: p.topic, c30, quiet, trend, trendCls, latest: last };
  }).sort((a, b) => (a.quiet ?? 9999) - (b.quiet ?? 9999));

  // ---------- Decisions & rulings feed ----------
  const decisions = devs.filter((d) => SIGNAL.has(d.type))
    .sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 25);

  // ---------- Legislative momentum ----------
  const haveStages = bl.some((b) => b.prevStage != null);
  const advanced = bl.filter((b) => b.prevStage != null && b.stage > b.prevStage && b.stage >= 0)
    .sort((a, b) => (b.lastActionDate || "").localeCompare(a.lastActionDate || ""));
  const stalledDead = bl.filter((b) => b.stage === -1 || (b.prevStage != null && b.stage < b.prevStage))
    .sort((a, b) => (b.lastActionDate || "").localeCompare(a.lastActionDate || ""));
  // Fallback until prevStage populates: infer from last action verbs
  const recentlyMoved = bl.filter((b) => within(b.lastActionDate, 14));

  // ---------- KPIs ----------
  const newDecisions7 = devs.filter((d) => SIGNAL.has(d.type) && within(d.date || d.firstSeen, 7)).length;
  const heating = dockets.filter((d) => d.trend.includes("heating")).length;
  const dormant = dockets.filter((d) => (d.quiet ?? 0) > 30).length;

  // ---------- context charts ----------
  const byMonth = {};
  devs.forEach((d) => { const m = (d.date || d.firstSeen || "").slice(0, 7); if (m) byMonth[m] = (byMonth[m] || 0) + 1; });
  const months = Object.keys(byMonth).sort();
  const timeData = { labels: months, datasets: [{ label: "Developments", data: months.map((m) => byMonth[m]), borderColor: "#2e5e8c", backgroundColor: "rgba(46,94,140,.15)", fill: true, tension: 0.3 }] };
  const filerCount = {};
  devs.forEach((d) => { const f = (d.filedBy || "").trim(); if (f && f !== "-") filerCount[f] = (filerCount[f] || 0) + 1; });
  const filers = Object.entries(filerCount).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const filerData = { labels: filers.map((f) => f[0].length > 30 ? f[0].slice(0, 30) + "…" : f[0]), datasets: [{ data: filers.map((f) => f[1]), backgroundColor: "#2e5e8c" }] };

  const card = { background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: "16px 18px" };
  const KPI = ({ label, value, sub, color }) => (
    <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: "14px 16px" }}>
      <div className="cat">{label}</div><div style={{ fontSize: 26, fontWeight: 700, color: color || "var(--navy)" }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{sub}</div>}
    </div>
  );

  return (
    <section>
      <div className="note"><b>Metrics.</b> Change and signal — not counts. What moved, what needs attention, where activity is concentrating.</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 20 }}>
        <KPI label="New decisions/rulings · 7d" value={newDecisions7} sub="high-signal outcomes" color="var(--red)" />
        <KPI label="Bills advanced a stage" value={haveStages ? advanced.length : "—"} sub={haveStages ? "since last sync" : "populates next run"} color="var(--green)" />
        <KPI label="Dockets heating up" value={heating} sub="more active vs prior 30d" />
        <KPI label="Dormant dockets" value={dormant} sub="quiet 30+ days" color="var(--muted)" />
      </div>

      <div style={card}>
        <h3 style={{ margin: "0 0 10px", fontSize: 15 }}>Docket activity monitor</h3>
        <table>
          <thead><tr><th>Proceeding</th><th>Topic</th><th>Last activity</th><th>Trend (30d)</th><th>Most recent</th></tr></thead>
          <tbody>
            {dockets.map((d, i) => (
              <tr key={i}>
                <td><b>{d.docket}</b></td>
                <td>{d.topic}</td>
                <td>{d.quiet == null ? "—" : d.quiet === 0 ? "today" : `${d.quiet}d ago`}{(d.quiet ?? 0) > 30 && <span className="pill Low" style={{ marginLeft: 6 }}>dormant</span>}</td>
                <td><span className={"pill " + d.trendCls}>{d.trend}</span> <small style={{ color: "var(--muted)" }}>{d.c30} in 30d</small></td>
                <td>{d.latest ? (d.latest.url ? <a href={d.latest.url} target="_blank" rel="noreferrer">{d.latest.headline.slice(0, 60)}</a> : d.latest.headline.slice(0, 60)) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ ...card, marginTop: 16 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 15 }}>Decisions &amp; rulings</h3>
        <div className="cat" style={{ marginBottom: 10 }}>Outcomes that matter — routine party comments filtered out.</div>
        {decisions.length === 0 ? <div className="empty">No decisions, proposed decisions, or rulings in the current feed.</div> : (
          <table>
            <thead><tr><th>Date</th><th>Docket</th><th>Type</th><th>Headline</th></tr></thead>
            <tbody>
              {decisions.map((d, i) => (
                <tr key={i}>
                  <td>{d.date}</td><td>{d.docket}</td>
                  <td><span className="pill Medium">{d.type}</span></td>
                  <td>{d.url ? <a href={d.url} target="_blank" rel="noreferrer">{d.headline}</a> : d.headline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16, marginTop: 16 }}>
        <div style={card}>
          <h3 style={{ margin: "0 0 4px", fontSize: 15 }}>Legislative momentum</h3>
          <div className="cat" style={{ marginBottom: 10 }}>{haveStages ? "Bills that changed stage since the last sync." : "Stage tracking populates after the next ingest run — showing bills active in the last 14 days for now."}</div>
          {haveStages ? (
            <>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--green)", margin: "4px 0" }}>Advanced ({advanced.length})</div>
              {advanced.length === 0 ? <div className="sub">None this cycle.</div> : advanced.slice(0, 8).map((b, i) => (
                <div key={i} style={{ fontSize: 13, padding: "3px 0" }}><a href={b.url} target="_blank" rel="noreferrer">{b.number}</a> · {STAGE_NAMES[b.prevStage]} → <b>{STAGE_NAMES[b.stage]}</b></div>
              ))}
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--red)", margin: "10px 0 4px" }}>Stalled / dead ({stalledDead.length})</div>
              {stalledDead.length === 0 ? <div className="sub">None this cycle.</div> : stalledDead.slice(0, 6).map((b, i) => (
                <div key={i} style={{ fontSize: 13, padding: "3px 0" }}><a href={b.url} target="_blank" rel="noreferrer">{b.number}</a> · {STAGE_NAMES[b.stage] || "Dead"}</div>
              ))}
            </>
          ) : (
            recentlyMoved.slice(0, 10).map((b, i) => (
              <div key={i} style={{ fontSize: 13, padding: "3px 0" }}><a href={b.url} target="_blank" rel="noreferrer">{b.number}</a> · {STAGE_NAMES[b.stage]} <small style={{ color: "var(--muted)" }}>({b.lastActionDate})</small></div>
            ))
          )}
        </div>
        <div style={card}><h3 style={{ margin: "0 0 10px", fontSize: 15 }}>Most active filers (CPUC)</h3><div style={{ height: 240 }}><Bar data={filerData} options={{ ...noLegend, indexAxis: "y" }} /></div></div>
      </div>

      <div style={{ ...card, marginTop: 16 }}><h3 style={{ margin: "0 0 10px", fontSize: 15 }}>Filing activity over time</h3><div style={{ height: 200 }}><Line data={timeData} options={noLegend} /></div></div>

      <div className="sub" style={{ marginTop: 14 }}>Deadline radar (comment windows &amp; hearings) arrives with the AI document deep-dive — those dates live inside the filings, not their titles.</div>
    </section>
  );
}
