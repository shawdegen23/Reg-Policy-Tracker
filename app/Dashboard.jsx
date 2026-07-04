"use client";
import { useState } from "react";

const WATCH = [
  { source: "CEC — California Energy Commission", monitor: "Title 24 building standards, Title 20 appliance standards, load management, decarb programs, Codes & Standards dockets.", page: "https://www.energy.ca.gov/proceedings", sub: "https://www.energy.ca.gov/subscriptions" },
  { source: "CARB — Air Resources Board", monitor: "Zero-NOx building/appliance rules, climate disclosure (SB 253/261), Cap-and-Trade, LCFS, Scoping Plan.", page: "https://ww2.arb.ca.gov/rulemaking-activity", sub: "https://public.govdelivery.com/accounts/CARB/subscriber/new" },
  { source: "AQMD / SCAQMD", monitor: "Local air-district rules on furnaces/water heaters and permitting affecting electrification.", page: "https://www.aqmd.gov/nav/rules", sub: "https://www.aqmd.gov/" },
  { source: "California Legislature", monitor: "Energy & climate bills: building decarb, demand flexibility, grid, equity. Live bills in the Bills tab.", page: "https://leginfo.legislature.ca.gov/faces/billSearchClient.xhtml", sub: "https://leginfo.legislature.ca.gov/" },
  { source: "PDAEnergyWeb", monitor: "Named in the JD but not a public state portal — confirm what it is with the Director before relying on it.", page: null, sub: "Confirm with Director" },
];
const SUBS = [
  ["CPUC Subscription Service", "Per-proceeding rulings, decisions & filings", "https://subscribecpuc.cpuc.ca.gov/"],
  ["CEC Subscriptions + listservs", "Building/appliance standards, load management, decarb", "https://www.energy.ca.gov/subscriptions"],
  ["CARB GovDelivery", "Rulemaking notices, board items, climate disclosure", "https://public.govdelivery.com/accounts/CARB/subscriber/new"],
  ["California Legislature", "Bill status on tracked energy/climate bills", "https://leginfo.legislature.ca.gov/"],
  ["AQMD / SCAQMD", "Local air-district rule activity", "https://www.aqmd.gov/"],
];
const ADJACENT = ["Energy Efficiency", "Codes & Standards", "Building Decarbonization", "Demand Flexibility", "Grid Modernization", "Equity"];

function depthClass(d = "") {
  d = d.toUpperCase();
  if (d.includes("FULL")) return ["full", "FULL READ"];
  if (d.includes("PRIORITY")) return ["prio", "SCAN · PRIORITY"];
  if (d.includes("CONFIRM")) return ["confirm", "CONFIRM #"];
  return ["scan", "SCAN"];
}

export default function Dashboard({ proceedings, developments, bills, meta, brief }) {
  const [tab, setTab] = useState("brief");
  const [pq, setPq] = useState("");
  const [dq, setDq] = useState("");
  const [bq, setBq] = useState("");
  const [topicFilter, setTopicFilter] = useState("");

  const procs = proceedings.filter((p) => !pq || JSON.stringify(p).toLowerCase().includes(pq.toLowerCase()));
  const devs = [...developments]
    .filter((d) => d.headline && (!dq || JSON.stringify(d).toLowerCase().includes(dq.toLowerCase())))
    .filter((d) => !topicFilter || d.topic === topicFilter)
    .sort((a, z) => (z.date || z.firstSeen || "").localeCompare(a.date || a.firstSeen || ""));
  const blls = [...bills]
    .filter((b) => !bq || JSON.stringify(b).toLowerCase().includes(bq.toLowerCase()))
    .sort((a, z) => (z.lastActionDate || "").localeCompare(a.lastActionDate || ""));

  const src = meta?.sources || {};
  const lastRun = meta?.lastRun ? new Date(meta.lastRun).toLocaleString() : "not yet run";

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(proceedings.map((p) => ({
      Docket: p.docket, Title: p.title, Topic: p.topic, "Read Depth": p.depth, Status: p.status,
      Relevance: p.relevance, "Director Impact": p.directorImpact, "Qual Notes": p.qualNotes,
      "Quant Notes": p.quantNotes, "Last Reviewed": p.lastReviewed, Docket_URL: p.url || "",
    }))), "Proceedings");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(devs.map((d) => ({
      Date: d.date, Source: d.source, Docket: d.docket, Type: d.type, Topic: d.topic,
      DataType: d.dataType, Relevance: d.relevance, Headline: d.headline, "Impact Summary": d.impact, Link: d.url || "",
    }))), "Developments");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(blls.map((b) => ({
      Bill: b.number, Title: b.title, "Last Action": b.lastAction, Date: b.lastActionDate, Link: b.url || "",
    }))), "Bills");
    XLSX.writeFile(wb, `TEC_Regulatory_Tracker_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  const t = brief?.totals || {};
  const topicCounts = brief?.topicCounts || {};

  return (
    <>
      <header>
        <h1>TEC Regulatory Monitoring</h1>
        <p>Regulatory Policy &amp; Strategy · Live data from CPUC, CEC, CARB, AQMD &amp; the Legislature · Last ingest: {lastRun}</p>
      </header>
      <div className="wrap">
        <div className="bar">
          <a href="https://apps.cpuc.ca.gov/apex/f?p=401:1:0" target="_blank" rel="noreferrer">CPUC Proceedings</a>
          <a href="https://docs.cpuc.ca.gov/advancedsearchform.aspx" target="_blank" rel="noreferrer">CPUC Doc Search</a>
          <a href="https://www.cpuc.ca.gov/proceedings-and-rulemaking" target="_blank" rel="noreferrer">CPUC New Filings</a>
          <a href="https://www.energy.ca.gov/proceedings" target="_blank" rel="noreferrer">CEC</a>
          <a href="https://ww2.arb.ca.gov/rulemaking-activity" target="_blank" rel="noreferrer">CARB</a>
          <a href="https://leginfo.legislature.ca.gov/faces/billSearchClient.xhtml" target="_blank" rel="noreferrer">Leginfo</a>
          <a onClick={exportExcel} style={{ cursor: "pointer", background: "var(--navy)", color: "#fff", borderColor: "var(--navy)" }}>⤓ Export Excel</a>
        </div>

        <div className="status-strip">
          {["cpuc", "cec", "carb", "legiscan"].map((k) => (
            <span key={k}>
              <span className={"dot " + (src[k]?.status === "ok" ? "ok" : src[k]?.status === "error" ? "err" : "pend")} />
              {k.toUpperCase()}: {src[k]?.status || "pending"}{src[k]?.count ? ` (${src[k].count})` : ""}
            </span>
          ))}
        </div>

        <div className="tabs">
          <button className={"tab" + (tab === "brief" ? " active" : "")} onClick={() => setTab("brief")}>Director Brief</button>
          <button className={"tab" + (tab === "proc" ? " active" : "")} onClick={() => setTab("proc")}>Proceedings</button>
          <button className={"tab" + (tab === "dev" ? " active" : "")} onClick={() => setTab("dev")}>Developments {devs.length ? `(${developments.length})` : ""}</button>
          <button className={"tab" + (tab === "topics" ? " active" : "")} onClick={() => setTab("topics")}>Topics</button>
          <button className={"tab" + (tab === "bills" ? " active" : "")} onClick={() => setTab("bills")}>Bills {blls.length ? `(${blls.length})` : ""}</button>
          <button className={"tab" + (tab === "agency" ? " active" : "")} onClick={() => setTab("agency")}>Agency Watchlist</button>
          <button className={"tab" + (tab === "subs" ? " active" : "")} onClick={() => setTab("subs")}>Subscriptions</button>
        </div>

        {tab === "brief" && (
          <section>
            <div className="note"><b>Director Brief.</b> Auto-synthesized from the latest developments — the same layer you'd hand up for review. Generated {brief?.generatedAt ? new Date(brief.generatedAt).toLocaleString() : "on first ingest run"}.</div>
            {brief?.narrative && (
              <div className="card" style={{ borderLeft: "4px solid var(--blue)", marginBottom: 18 }}>
                <div className="cat" style={{ marginBottom: 6 }}>AI SYNTHESIS</div>
                <div style={{ fontSize: 14, lineHeight: 1.6 }}>{brief.narrative}</div>
              </div>
            )}
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", marginBottom: 18 }}>
              <div className="card"><div className="cat">Total developments</div><div style={{ fontSize: 28, fontWeight: 700 }}>{t.developments ?? 0}</div></div>
              <div className="card"><div className="cat">High relevance</div><div style={{ fontSize: 28, fontWeight: 700, color: "var(--red)" }}>{t.high ?? 0}</div></div>
              <div className="card"><div className="cat">Quantitative items</div><div style={{ fontSize: 28, fontWeight: 700, color: "var(--blue)" }}>{t.quantitative ?? 0}</div></div>
              <div className="card"><div className="cat">Topics active</div><div style={{ fontSize: 28, fontWeight: 700 }}>{t.topics ?? 0}</div></div>
            </div>
            <h3 style={{ marginBottom: 8 }}>High-relevance items for review</h3>
            {(!brief?.highRelevance || brief.highRelevance.length === 0)
              ? <div className="empty">No high-relevance items yet. This fills after the first scheduled ingest run.</div>
              : (
                <table>
                  <thead><tr><th>Date</th><th>Source / Docket</th><th>Topic</th><th>Headline</th><th>Suggested impact</th></tr></thead>
                  <tbody>
                    {brief.highRelevance.map((d, i) => (
                      <tr key={i} className="prio-row">
                        <td>{d.date}</td><td>{d.source}</td><td>{d.topic}</td>
                        <td>{d.url ? <a href={d.url} target="_blank" rel="noreferrer">{d.headline}</a> : d.headline}</td>
                        <td>{d.impact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </section>
        )}

        {tab === "proc" && (
          <section>
            <div className="note"><b>Tracked CPUC proceedings.</b> R.25-04-010 (Energy Efficiency) is the full-read proceeding; the rest are scan-for-relevance. Cards link to the live docket.</div>
            <input className="search" placeholder="Filter proceedings…" value={pq} onChange={(e) => setPq(e.target.value)} />
            <div className="grid">
              {procs.map((p, i) => {
                const [cls, lab] = depthClass(p.depth);
                return (
                  <div className="card" key={i}>
                    <div className="docket">{p.docket}</div>
                    <h3>{p.title}</h3>
                    <div><span className={"tag " + cls}>{lab}</span> {p.topic && <span className="tag scan">{p.topic}</span>}</div>
                    <div className="cat">{p.category} · {p.status}</div>
                    {p.directorImpact ? <div className="desc"><b>Director impact:</b> {p.directorImpact}</div> : (p.impact && <div className="desc">{p.impact}</div>)}
                    {p.quantNotes && <div className="kv"><b>Quantitative:</b> {p.quantNotes}</div>}
                    {p.url
                      ? <a className="open" href={p.url} target="_blank" rel="noreferrer">Open live docket →</a>
                      : <div className="sub">Confirm docket number first.</div>}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {tab === "dev" && (
          <section>
            <div className="note"><b>Developments</b> ingested automatically, each tagged by topic, data type (qualitative/quantitative), and client relevance with a suggested impact summary. R.25-04-010 items highlighted.</div>
            <input className="search" placeholder="Filter developments…" value={dq} onChange={(e) => setDq(e.target.value)} />
            {devs.length === 0
              ? <div className="empty">No developments ingested yet. They appear here after the first scheduled scraper run (or a manual run from the Actions tab).</div>
              : (
                <table>
                  <thead><tr><th>Date</th><th>Source / Docket</th><th>Topic</th><th>Type</th><th>Rel.</th><th>Headline</th><th>Suggested impact</th></tr></thead>
                  <tbody>
                    {devs.map((d, i) => {
                      const prio = (d.docket || "").includes("25-04-010") || (d.source || "").includes("25-04-010");
                      return (
                        <tr key={i} className={prio ? "prio-row" : ""}>
                          <td>{d.date}</td>
                          <td>{d.source}{d.docket && d.docket !== d.source ? <><br /><small>{d.docket}</small></> : null}</td>
                          <td>{d.topic}{d.dataType === "Quantitative" ? <><br /><small>#</small></> : null}</td>
                          <td>{d.type}</td>
                          <td>{d.relevance ? <span className={"pill " + d.relevance}>{d.relevance}</span> : ""}</td>
                          <td>{d.url ? <a href={d.url} target="_blank" rel="noreferrer">{d.headline}</a> : d.headline}</td>
                          <td>{d.impact}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
          </section>
        )}

        {tab === "topics" && (
          <section>
            <div className="note"><b>Adjacent topics.</b> Maintain working knowledge across the areas the role spans. Click a topic to filter the Developments feed.</div>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))" }}>
              {ADJACENT.concat(Object.keys(topicCounts).filter((x) => !ADJACENT.includes(x))).map((topic, i) => (
                <div className="card" key={i} style={{ cursor: "pointer" }} onClick={() => { setTopicFilter(topic); setTab("dev"); }}>
                  <h3>{topic}</h3>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "var(--blue)" }}>{topicCounts[topic] || 0}</div>
                  <div className="cat">tracked developments</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === "bills" && (
          <section>
            <div className="note"><b>Legislative bills</b> from the LegiScan API, filtered to energy/climate keywords. Requires a free LegiScan API key set as a GitHub secret (see README).</div>
            <input className="search" placeholder="Filter bills…" value={bq} onChange={(e) => setBq(e.target.value)} />
            {blls.length === 0
              ? <div className="empty">No bills ingested yet. Add a LEGISCAN_API_KEY GitHub secret and run the workflow, and tracked bills will appear here.</div>
              : (
                <table>
                  <thead><tr><th>Bill</th><th>Title</th><th>Last action</th><th>Date</th><th>Link</th></tr></thead>
                  <tbody>
                    {blls.map((b, i) => (
                      <tr key={i}>
                        <td>{b.number}</td><td>{b.title}</td><td>{b.lastAction}</td><td>{b.lastActionDate}</td>
                        <td>{b.url ? <a href={b.url} target="_blank" rel="noreferrer">open</a> : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </section>
        )}

        {tab === "agency" && (
          <section>
            <div className="note"><b>Non-CPUC sources.</b> Live items land in the Developments and Bills tabs; each subscription is the safety net.</div>
            <div className="grid">
              {WATCH.map((a, i) => {
                const subUrl = (a.sub || "").match(/https?:\/\/\S+/);
                return (
                  <div className="card" key={i}>
                    <h3>{a.source}</h3>
                    <div className="desc">{a.monitor}</div>
                    {a.page && <a className="open" href={a.page} target="_blank" rel="noreferrer">Check page →</a>}
                    <div className="sub">Subscribe: {subUrl ? <a href={subUrl[0]} target="_blank" rel="noreferrer">{a.sub}</a> : a.sub}</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {tab === "subs" && (
          <section>
            <div className="note"><b>Reliability backbone.</b> Official subscriptions never miss a filing. Automated ingestion sits on top as the fast, prioritized layer.</div>
            <table>
              <thead><tr><th>Source</th><th>Covers</th><th>Subscribe</th></tr></thead>
              <tbody>
                {SUBS.map((s, i) => (
                  <tr key={i}><td><b>{s[0]}</b></td><td>{s[1]}</td><td><a href={s[2]} target="_blank" rel="noreferrer">Subscribe</a></td></tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <footer>Verify CONFIRM # dockets with the Director. Suggested impacts are starting points for analyst review, not final language. Official subscriptions remain the system of record.</footer>
      </div>
    </>
  );
}
