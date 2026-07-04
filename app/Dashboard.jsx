"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const Analytics = dynamic(() => import("./Analytics"), { ssr: false, loading: () => <div className="empty">Loading charts…</div> });

const STAGES = ["Introduced", "Committee", "Floor", "Enrolled", "Signed"];
// LegiScan status codes: 1 Introduced, 2 Engrossed, 3 Enrolled, 4 Passed,
// 5 Vetoed, 6 Failed/Dead. Terminal (vetoed/failed) states are NOT progress.
function billOutcome(b) {
  const s = parseInt(b.status || "0", 10);
  const a = (b.lastAction || "").toLowerCase();
  if (s === 5 || a.includes("vetoed")) return { label: "Vetoed", cls: "High" };
  if (s === 6 || a.includes("died") || a.includes("failed") || a.includes("dead")) return { label: "Failed / Dead", cls: "High" };
  if (s === 4 || a.includes("chaptered") || a.includes("approved by the governor") || a.includes("enacted")) return { label: "Signed / Chaptered", cls: "Low" };
  return null;
}
function stageOf(b) {
  const s = parseInt(b.status || "0", 10);
  const a = (b.lastAction || "").toLowerCase();
  if (s === 4 || a.includes("chaptered") || a.includes("approved by the governor")) return 4;
  if (s === 3 || a.includes("enrolled")) return 3;
  if (a.includes("third reading") || a.includes("do pass") || a.includes("passed") || s === 2) return 2;
  if (a.includes("committee") || a.includes("referred")) return 1;
  return 0;
}

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
  const [devType, setDevType] = useState("");
  const [devRel, setDevRel] = useState("");
  const [devAgency, setDevAgency] = useState("");
  const [tracked, setTracked] = useState([]);
  const [snaps, setSnaps] = useState({});

  useEffect(() => {
    try {
      setTracked(JSON.parse(localStorage.getItem("trackedBills") || "[]"));
      setSnaps(JSON.parse(localStorage.getItem("billSnaps") || "{}"));
    } catch {}
  }, []);

  function toggleTrack(num) {
    setTracked((prev) => {
      const adding = !prev.includes(num);
      const next = adding ? [...prev, num] : prev.filter((x) => x !== num);
      try { localStorage.setItem("trackedBills", JSON.stringify(next)); } catch {}
      if (adding) {
        const b = bills.find((x) => x.number === num);
        if (b) setSnaps((s) => { const ns = { ...s, [num]: b.changeHash }; try { localStorage.setItem("billSnaps", JSON.stringify(ns)); } catch {} return ns; });
      }
      return next;
    });
  }
  const billByNum = Object.fromEntries(bills.map((b) => [b.number, b]));
  const trackedBills = tracked.map((n) => billByNum[n] || { number: n, missing: true });
  const isMoved = (b) => !b.missing && snaps[b.number] !== b.changeHash;
  const movedCount = trackedBills.filter(isMoved).length;
  function markAllSeen() {
    const next = {};
    trackedBills.forEach((b) => { if (!b.missing) next[b.number] = b.changeHash; });
    setSnaps(next);
    try { localStorage.setItem("billSnaps", JSON.stringify(next)); } catch {}
  }

  const procs = proceedings.filter((p) => !pq || JSON.stringify(p).toLowerCase().includes(pq.toLowerCase()));
  const devs = [...developments]
    .filter((d) => d.headline && (!dq || JSON.stringify(d).toLowerCase().includes(dq.toLowerCase())))
    .filter((d) => !topicFilter || d.topic === topicFilter)
    .filter((d) => !devType || d.type === devType)
    .filter((d) => !devRel || d.relevance === devRel)
    .filter((d) => !devAgency || d.agency === devAgency)
    .sort((a, z) => (z.date || z.firstSeen || "").localeCompare(a.date || a.firstSeen || ""));
  const devTopics = [...new Set(developments.map((d) => d.topic).filter(Boolean))].sort();
  const devTypes = [...new Set(developments.map((d) => d.type).filter(Boolean))].sort();
  const devAgencies = [...new Set(developments.map((d) => d.agency).filter(Boolean))].sort();
  const clearDevFilters = () => { setTopicFilter(""); setDevType(""); setDevRel(""); setDevAgency(""); setDq(""); };
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
    // Export the FULL datasets, not the currently filtered on-screen view.
    const allDevs = [...developments].sort((a, z) => (z.date || z.firstSeen || "").localeCompare(a.date || a.firstSeen || ""));
    const allBills = [...bills].sort((a, z) => (z.lastActionDate || "").localeCompare(a.lastActionDate || ""));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(allDevs.map((d) => ({
      Date: d.date, Source: d.source, "Filed By": d.filedBy || "", Docket: d.docket, Type: d.type, Topic: d.topic,
      DataType: d.dataType, Relevance: d.relevance, Headline: d.headline, "Impact Summary": d.impact, Link: d.url || "",
    }))), "Developments");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(allBills.map((b) => ({
      Bill: b.number, Title: b.title, Status: b.status, "Last Action": b.lastAction, Date: b.lastActionDate, Link: b.url || "",
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
          {["cpuc", "cec", "carb", "legiscan"].map((k) => {
            const s = src[k] || {};
            const degraded = s.status === "error" && s.lastGoodCount != null;
            const dot = s.status === "ok" ? "ok" : degraded ? "warn" : s.status === "error" ? "err" : "pend";
            const label = s.status === "ok" ? `ok${s.count ? ` (${s.count})` : ""}`
              : degraded ? `last synced ${s.lastGoodCount}`
              : (s.status || "pending");
            return (
              <span key={k} title={s.error || ""}>
                <span className={"dot " + dot} />
                {k.toUpperCase()}: {label}
              </span>
            );
          })}
        </div>

        <div className="tabs">
          <button className={"tab" + (tab === "brief" ? " active" : "")} onClick={() => setTab("brief")}>Director Brief</button>
          <button className={"tab" + (tab === "proc" ? " active" : "")} onClick={() => setTab("proc")}>Proceedings</button>
          <button className={"tab" + (tab === "dev" ? " active" : "")} onClick={() => setTab("dev")}>Developments {devs.length ? `(${developments.length})` : ""}</button>
          <button className={"tab" + (tab === "topics" ? " active" : "")} onClick={() => setTab("topics")}>Topics</button>
          <button className={"tab" + (tab === "analytics" ? " active" : "")} onClick={() => setTab("analytics")}>Analytics</button>
          <button className={"tab" + (tab === "bills" ? " active" : "")} onClick={() => setTab("bills")}>Bills {blls.length ? `(${blls.length})` : ""}</button>
          <button className={"tab" + (tab === "tracked" ? " active" : "")} onClick={() => setTab("tracked")}>★ Tracked {tracked.length ? `(${tracked.length})` : ""}{movedCount ? <span className="pill High" style={{ marginLeft: 6 }}>{movedCount} moved</span> : null}</button>
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
                        <td>{d.url ? <a href={d.url} target="_blank" rel="noreferrer">{d.headline}</a> : d.headline}{d.similar ? <span className="pill Low" style={{ marginLeft: 6 }}>+{d.similar} similar</span> : null}</td>
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
            <div className="filterbar">
              <input className="search" style={{ marginBottom: 0 }} placeholder="Search…" value={dq} onChange={(e) => setDq(e.target.value)} />
              <select value={devAgency} onChange={(e) => setDevAgency(e.target.value)}><option value="">All sources</option>{devAgencies.map((a) => <option key={a} value={a}>{a}</option>)}</select>
              <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)}><option value="">All topics</option>{devTopics.map((t) => <option key={t} value={t}>{t}</option>)}</select>
              <select value={devType} onChange={(e) => setDevType(e.target.value)}><option value="">All types</option>{devTypes.map((t) => <option key={t} value={t}>{t}</option>)}</select>
              <select value={devRel} onChange={(e) => setDevRel(e.target.value)}><option value="">All relevance</option><option>High</option><option>Medium</option><option>Low</option></select>
              {(dq || topicFilter || devType || devRel || devAgency) && <button className="linklike" onClick={clearDevFilters}>Clear</button>}
              <span className="sub" style={{ marginLeft: "auto", marginTop: 0 }}>{devs.length} shown</span>
            </div>
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
                          <td>{d.source}{d.docket && d.docket !== d.source ? <><br /><small>{d.docket}</small></> : null}{d.filedBy ? <><br /><small style={{ color: "var(--muted)" }}>filed by {d.filedBy}</small></> : null}</td>
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

        {tab === "analytics" && <Analytics developments={developments} />}

        {tab === "bills" && (
          <section>
            <div className="note"><b>Legislative bills</b> from the LegiScan API, filtered to energy/climate keywords. Requires a free LegiScan API key set as a GitHub secret (see README).</div>
            <input className="search" placeholder="Filter bills…" value={bq} onChange={(e) => setBq(e.target.value)} />
            {blls.length === 0
              ? <div className="empty">No bills ingested yet. Add a LEGISCAN_API_KEY GitHub secret and run the workflow, and tracked bills will appear here.</div>
              : (
                <>
                  <div className="sub" style={{ marginBottom: 8 }}>Click ★ to track a bill — it appears in the Tracked tab with a status stepper and moves are highlighted.</div>
                  <table>
                    <thead><tr><th>Track</th><th></th><th>Bill</th><th>Title</th><th>Last action</th><th>Date</th><th>Link</th></tr></thead>
                    <tbody>
                      {blls.map((b, i) => (
                        <tr key={i}>
                          <td><button className="star" onClick={() => toggleTrack(b.number)} title="Track this bill">{tracked.includes(b.number) ? "★" : "☆"}</button></td>
                          <td>{b.isNew ? <span className="pill High">NEW</span> : b.isUpdated ? <span className="pill Medium">UPD</span> : ""}</td>
                          <td>{b.number}</td><td>{b.title}</td><td>{b.lastAction}</td><td>{b.lastActionDate}</td>
                          <td>{b.url ? <a href={b.url} target="_blank" rel="noreferrer">open</a> : ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="sub">Legislative data via <a href="https://legiscan.com/" target="_blank" rel="noreferrer">LegiScan</a>, licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>.</div>
                </>
              )}
          </section>
        )}

        {tab === "tracked" && (
          <section>
            <div className="note"><b>Tracked bills.</b> Your watchlist, saved in this browser. Each bill shows where it is in the legislative process; anything that <b>moved since you last checked</b> is highlighted. {movedCount ? <button className="linklike" onClick={markAllSeen}>Mark all as seen</button> : null}</div>
            {trackedBills.length === 0
              ? <div className="empty">No bills tracked yet. Go to the Bills tab and click ★ on the bills you want to follow.</div>
              : (
                <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
                  {trackedBills.map((b, i) => {
                    const moved = isMoved(b);
                    const outcome = b.missing ? null : billOutcome(b);
                    const stage = b.missing ? -1 : stageOf(b);
                    return (
                      <div className="card" key={i} style={moved ? { borderLeft: "4px solid var(--amber)" } : {}}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <button className="star" onClick={() => toggleTrack(b.number)} title="Untrack">★</button>{" "}
                            <b>{b.number}</b> {moved && <span className="pill High" style={{ marginLeft: 6 }}>MOVED</span>}
                            {outcome && <span className={"pill " + outcome.cls} style={{ marginLeft: 6 }}>{outcome.label}</span>}
                            {b.missing && <span className="pill Low" style={{ marginLeft: 6 }}>not in current feed</span>}
                          </div>
                          {b.url && <a href={b.url} target="_blank" rel="noreferrer">open on LegiScan →</a>}
                        </div>
                        {!b.missing && <div className="desc">{b.title}</div>}
                        {!b.missing && (
                          <div style={{ display: "flex", gap: 4, margin: "12px 0 6px", flexWrap: "wrap" }}>
                            {STAGES.map((label, si) => (
                              <div key={si} style={{ flex: 1, minWidth: 70, textAlign: "center" }}>
                                <div style={{ height: 6, borderRadius: 3, background: si <= stage ? "var(--blue)" : "var(--line)" }} />
                                <div style={{ fontSize: 10.5, marginTop: 4, color: si === stage ? "var(--navy)" : "var(--muted)", fontWeight: si === stage ? 700 : 400 }}>{label}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        {!b.missing && <div className="kv"><b>Latest:</b> {b.lastAction} <span style={{ color: "var(--muted)" }}>({b.lastActionDate})</span></div>}
                        {b.missing && <div className="sub">This bill isn't in the current feed (it may have fallen off the list or become inactive). It stays tracked and will refresh if it reappears.</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            <div className="sub" style={{ marginTop: 12 }}>Tracked list is stored only in this browser. Legislative data via <a href="https://legiscan.com/" target="_blank" rel="noreferrer">LegiScan</a> (CC BY 4.0).</div>
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
