"use client";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

const PALETTE = ["#2e5e8c", "#e0a800", "#2f8f4e", "#c0392b", "#7b5ea7", "#1f3b57", "#3b9db5", "#c97b3b", "#8a8f98"];
const noLegend = { plugins: { legend: { display: false } }, maintainAspectRatio: false };

function countBy(arr, keyFn) {
  const m = {};
  for (const x of arr) { const k = keyFn(x); if (k) m[k] = (m[k] || 0) + 1; }
  return m;
}
const daysBetween = (iso) => iso ? (Date.now() - Date.parse(iso)) / 86400000 : Infinity;

const BILL_STAGES = ["Introduced", "Committee", "Floor", "Enrolled", "Signed"];
function billStage(b) {
  const s = parseInt(b.status || "0", 10);
  const a = (b.lastAction || "").toLowerCase();
  if (s === 5 || s === 6 || a.includes("vetoed") || a.includes("died") || a.includes("failed")) return -1; // terminal negative
  if (s === 4 || a.includes("chaptered") || a.includes("approved by the governor")) return 4;
  if (s === 3 || a.includes("enrolled")) return 3;
  if (a.includes("third reading") || a.includes("do pass") || a.includes("passed") || s === 2) return 2;
  if (a.includes("committee") || a.includes("referred")) return 1;
  return 0;
}

export default function Analytics({ developments, bills }) {
  const devs = developments || [];
  const bl = bills || [];

  // ---- KPI metrics ----
  const new7 = devs.filter((d) => daysBetween(d.date || d.firstSeen) <= 7).length;
  const new30 = devs.filter((d) => daysBetween(d.date || d.firstSeen) <= 30).length;
  const prev30 = devs.filter((d) => { const g = daysBetween(d.date || d.firstSeen); return g > 30 && g <= 60; }).length;
  const velocity = prev30 ? Math.round(((new30 - prev30) / prev30) * 100) : null;
  const highCount = devs.filter((d) => d.relevance === "High").length;
  const activeProc = new Set(devs.filter((d) => d.docket && daysBetween(d.date || d.firstSeen) <= 30).map((d) => d.docket)).size;
  const billsAdvancing = bl.filter((b) => { const st = billStage(b); return st >= 2 && st <= 4; }).length;
  const billsChanged = bl.filter((b) => b.isNew || b.isUpdated).length;

  const KPI = ({ label, value, sub, color }) => (
    <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: "14px 16px" }}>
      <div className="cat">{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color || "var(--navy)" }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{sub}</div>}
    </div>
  );

  // ---- chart datasets ----
  const byMonth = countBy(devs, (d) => (d.date || d.firstSeen || "").slice(0, 7));
  const months = Object.keys(byMonth).filter(Boolean).sort();
  const timeData = { labels: months, datasets: [{ label: "Developments", data: months.map((m) => byMonth[m]), borderColor: "#2e5e8c", backgroundColor: "rgba(46,94,140,.15)", fill: true, tension: 0.3 }] };

  // Bills legislative funnel
  const stageCounts = BILL_STAGES.map((_, i) => bl.filter((b) => billStage(b) === i).length);
  const funnelData = { labels: BILL_STAGES, datasets: [{ data: stageCounts, backgroundColor: ["#8a8f98", "#3b9db5", "#2e5e8c", "#e0a800", "#2f8f4e"] }] };

  // Hot proceedings (activity last 30d)
  const hot = {};
  devs.filter((d) => d.docket && daysBetween(d.date || d.firstSeen) <= 30).forEach((d) => { hot[d.docket] = (hot[d.docket] || 0) + 1; });
  const hotSorted = Object.entries(hot).sort((a, b) => b[1] - a[1]);
  const hotData = { labels: hotSorted.map((x) => x[0]), datasets: [{ data: hotSorted.map((x) => x[1]), backgroundColor: "#c0392b" }] };

  // By topic
  const byTopic = countBy(devs, (d) => d.topic);
  const topics = Object.entries(byTopic).sort((a, b) => b[1] - a[1]);
  const topicData = { labels: topics.map((t) => t[0]), datasets: [{ data: topics.map((t) => t[1]), backgroundColor: PALETTE }] };

  // Top filers
  const clean = (f) => (f || "").trim();
  const byFiler = countBy(devs.filter((d) => clean(d.filedBy) && clean(d.filedBy) !== "-"), (d) => clean(d.filedBy));
  const filers = Object.entries(byFiler).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const filerData = { labels: filers.map((f) => f[0].length > 34 ? f[0].slice(0, 34) + "…" : f[0]), datasets: [{ data: filers.map((f) => f[1]), backgroundColor: "#2e5e8c" }] };

  const card = { background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: "16px 18px" };
  const h = (t, s) => <><h3 style={{ margin: "0 0 4px", fontSize: 14 }}>{t}</h3>{s && <div className="cat" style={{ marginBottom: 10 }}>{s}</div>}</>;

  return (
    <section>
      <div className="note"><b>Analytics.</b> Live tracking metrics across {devs.length} developments and {bl.length} bills.</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 18 }}>
        <KPI label="New · last 7 days" value={new7} sub="filings/notices" />
        <KPI label="New · last 30 days" value={new30} sub={velocity == null ? "" : `${velocity >= 0 ? "▲" : "▼"} ${Math.abs(velocity)}% vs prior 30d`} color={velocity >= 0 ? "var(--green)" : "var(--red)"} />
        <KPI label="High relevance" value={highCount} sub="need review" color="var(--red)" />
        <KPI label="Active proceedings" value={`${activeProc}/${new Set(devs.map((d) => d.docket).filter(Boolean)).size}`} sub="moved in 30d" />
        <KPI label="Bills advancing" value={billsAdvancing} sub={`of ${bl.length} tracked`} color="var(--green)" />
        <KPI label="Bills changed" value={billsChanged} sub="new or updated" color="var(--blue)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
        <div style={card}>{h("Filing activity over time")}<div style={{ height: 230 }}><Line data={timeData} options={noLegend} /></div></div>
        <div style={card}>{h("Legislative funnel", "energy bills by stage")}<div style={{ height: 230 }}><Bar data={funnelData} options={{ ...noLegend, indexAxis: "y" }} /></div></div>
        <div style={card}>{h("Hot proceedings", "activity in last 30 days")}<div style={{ height: 230 }}><Bar data={hotData} options={{ ...noLegend, indexAxis: "y" }} /></div></div>
        <div style={card}>{h("Developments by topic")}<div style={{ height: 230 }}><Doughnut data={topicData} options={{ maintainAspectRatio: false, plugins: { legend: { position: "right", labels: { boxWidth: 12, font: { size: 11 } } } } }} /></div></div>
        <div style={{ ...card, gridColumn: "1 / -1" }}>{h("Most active filers (CPUC)", "who is engaging most across your dockets")}<div style={{ height: 300 }}><Bar data={filerData} options={{ ...noLegend, indexAxis: "y" }} /></div></div>
      </div>
    </section>
  );
}
