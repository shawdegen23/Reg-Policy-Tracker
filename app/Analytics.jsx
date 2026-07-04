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

export default function Analytics({ developments }) {
  const devs = developments || [];

  // Activity over time by month
  const byMonth = countBy(devs, (d) => (d.date || d.firstSeen || "").slice(0, 7));
  const months = Object.keys(byMonth).filter(Boolean).sort();
  const timeData = {
    labels: months,
    datasets: [{ label: "Developments", data: months.map((m) => byMonth[m]), borderColor: "#2e5e8c", backgroundColor: "rgba(46,94,140,.15)", fill: true, tension: 0.3 }],
  };

  // By topic
  const byTopic = countBy(devs, (d) => d.topic);
  const topics = Object.entries(byTopic).sort((a, b) => b[1] - a[1]);
  const topicData = {
    labels: topics.map((t) => t[0]),
    datasets: [{ data: topics.map((t) => t[1]), backgroundColor: PALETTE }],
  };

  // Top filers (from filedBy, CPUC)
  const clean = (f) => (f || "").trim();
  const byFiler = countBy(devs.filter((d) => clean(d.filedBy) && clean(d.filedBy) !== "-"), (d) => clean(d.filedBy));
  const filers = Object.entries(byFiler).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const filerData = {
    labels: filers.map((f) => f[0].length > 34 ? f[0].slice(0, 34) + "…" : f[0]),
    datasets: [{ data: filers.map((f) => f[1]), backgroundColor: "#2e5e8c" }],
  };

  // By proceeding (CPUC dockets)
  const byDocket = countBy(devs.filter((d) => d.docket), (d) => d.docket);
  const dockets = Object.entries(byDocket).sort((a, b) => b[1] - a[1]);
  const docketData = {
    labels: dockets.map((d) => d[0]),
    datasets: [{ data: dockets.map((d) => d[1]), backgroundColor: "#1f3b57" }],
  };

  // Relevance breakdown
  const byRel = countBy(devs, (d) => d.relevance);
  const relOrder = ["High", "Medium", "Low"].filter((r) => byRel[r]);
  const relData = {
    labels: relOrder,
    datasets: [{ data: relOrder.map((r) => byRel[r]), backgroundColor: ["#c0392b", "#e0a800", "#dce6f1"] }],
  };

  const card = { background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: "16px 18px" };
  const h = (t) => <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>{t}</h3>;

  return (
    <section>
      <div className="note"><b>Analytics.</b> Filing and stakeholder activity computed live from the tracked developments — {devs.length} items across {months.length} months.</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
        <div style={card}>{h("Activity over time")}<div style={{ height: 240 }}><Line data={timeData} options={noLegend} /></div></div>
        <div style={card}>{h("Developments by topic")}<div style={{ height: 240 }}><Doughnut data={topicData} options={{ maintainAspectRatio: false, plugins: { legend: { position: "right", labels: { boxWidth: 12, font: { size: 11 } } } } }} /></div></div>
        <div style={{ ...card, gridColumn: "1 / -1" }}>{h("Most active filers (CPUC)")}<div style={{ height: 300 }}><Bar data={filerData} options={{ ...noLegend, indexAxis: "y" }} /></div></div>
        <div style={card}>{h("Activity by CPUC proceeding")}<div style={{ height: 260 }}><Bar data={docketData} options={{ ...noLegend, indexAxis: "y" }} /></div></div>
        <div style={card}>{h("Client relevance mix")}<div style={{ height: 260 }}><Doughnut data={relData} options={{ maintainAspectRatio: false, plugins: { legend: { position: "right" } } }} /></div></div>
      </div>
    </section>
  );
}
