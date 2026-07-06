"use client";
import { useState, useRef, useEffect } from "react";
import { MODULES, DIAGRAMS, GLOSSARY, ORG_TREE } from "./learnContent";

function fmt(text) {
  return String(text).split(/\n/).map((line, i) => {
    const bullet = /^\s*[-*]\s+/.test(line);
    const clean = line.replace(/^\s*[-*]\s+/, "");
    const parts = clean.split(/(\*\*[^*]+\*\*)/g).map((seg, j) =>
      /^\*\*[^*]+\*\*$/.test(seg) ? <strong key={j}>{seg.slice(2, -2)}</strong> : <span key={j}>{seg}</span>);
    return <div key={i} style={bullet ? { paddingLeft: 16, textIndent: -10 } : { margin: line.trim() ? "0 0 6px" : "0 0 8px" }}>{bullet ? "• " : ""}{parts}</div>;
  });
}

function FlowDiagram({ d, light }) {
  const [sel, setSel] = useState(0);
  return (
    <div style={{ background: light ? "#fff" : "#fff", border: "1px solid #ece7dc", borderRadius: 12, padding: 18, margin: "24px 0" }}>
      <div className="subhead" style={{ margin: "0 0 2px" }}>{d.title}</div>
      <div style={{ fontSize: 13, color: "#8a857a", marginBottom: 14 }}>{d.subtitle}</div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
        {d.steps.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <button onClick={() => setSel(i)} style={{
              padding: "10px 12px", borderRadius: 9, fontSize: 12.5, fontFamily: "inherit", cursor: "pointer", minWidth: 92, maxWidth: 150, textAlign: "center",
              border: "1px solid " + (sel === i ? "var(--accent)" : "#e0d9ca"),
              background: sel === i ? "var(--accent)" : "#fff", color: sel === i ? "#fff" : "var(--ink2)", fontWeight: sel === i ? 600 : 500,
            }}>{s.label}</button>
            {i < d.steps.length - 1 && <span style={{ color: "#c9c1b0", margin: "0 2px", fontSize: 16 }}>→</span>}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, padding: "12px 14px", background: "var(--paper)", borderRadius: 9, fontSize: 13.5, lineHeight: 1.55, color: "#3a3a34" }}>
        <b style={{ fontFamily: "var(--serif)" }}>{d.steps[sel].label}.</b> {d.steps[sel].desc}
      </div>
    </div>
  );
}

function Node({ nt, ns, cls }) {
  return (
    <span className={"node" + (cls ? " " + cls : "")}>
      <span className="nt">{nt}</span>
      {ns && <span className="ns">{ns}</span>}
    </span>
  );
}

function OrgTree({ t }) {
  return (
    <div style={{ margin: "24px 0" }}>
      <div className="subhead" style={{ marginTop: 0 }}>California governance — the tree</div>
      <div className="treewrap">
        <ul className="tree">
          <li>
            <Node nt={t.top.nt} ns={t.top.ns} cls="top" />
            <ul>
              {t.branches.map((b, i) => (
                <li key={i}>
                  <Node nt={b.nt} ns={b.ns} />
                  {b.children && (
                    <ul>
                      {b.children.map((c, j) => <li key={j}><Node nt={c.nt} ns={c.ns} /></li>)}
                    </ul>
                  )}
                  {b.umbrellas && (
                    <ul>
                      {b.umbrellas.map((u, j) => (
                        <li key={j}>
                          <span className="node">
                            <span className="nt">{u.nt}</span>
                            <span className="ns">{u.ns}</span>
                            <span className="agencylist">
                              {u.agencies.map((a, k) => (
                                <div key={k}>{a.star ? <span className="star">★ </span> : "· "}{a.name}{a.note ? " — " + a.note : ""}</div>
                              ))}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </div>
      <div style={{ background: "#fff", border: "1px solid var(--accent)", borderRadius: 10, padding: "13px 16px", marginTop: 12, display: "flex", gap: 12, alignItems: "flex-start" }}>
        <span style={{ fontFamily: "var(--serif)", fontWeight: 600, color: "var(--accent)", fontSize: 15, whiteSpace: "nowrap" }}>⚡ {t.independent.nt}</span>
        <span style={{ fontSize: 13, color: "#3a3a34", lineHeight: 1.55 }}><b style={{ color: "#1c1b18" }}>{t.independent.ns}.</b> {t.independent.note}</span>
      </div>
      <div style={{ fontSize: 11.5, color: "#8a857a", marginTop: 8 }}>★ = the two agencies that do most energy &amp; climate work.</div>
    </div>
  );
}

function Breakdown({ b }) {
  const max = Math.max(...b.items.map((i) => i.pct));
  return (
    <div style={{ margin: "24px 0" }}>
      <div className="subhead" style={{ marginTop: 0 }}>{b.title}</div>
      {b.note && <div style={{ fontSize: 13.5, color: "#6f6a5f", margin: "0 0 14px", maxWidth: "62ch" }}>{b.note}</div>}
      {b.items.map((it, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, margin: "9px 0" }}>
          <div style={{ width: 190, flexShrink: 0, fontSize: 13.5, color: "#3a3a34" }}>
            {it.label}{it.note && <span style={{ color: "#a49e90", fontSize: 12 }}> · {it.note}</span>}
          </div>
          <div style={{ flex: 1, height: 26, background: "#efe9dc", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ width: (it.pct / max * 100) + "%", height: "100%", background: it.color, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8, color: "#fff", fontSize: 12, fontWeight: 600 }}>{it.pct}%</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DeepDive({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ margin: "6px 0 16px" }}>
      <button onClick={() => setOpen(!open)} className="linklike" style={{ fontFamily: "var(--serif)", fontSize: 13.5, color: "var(--accent)", textDecoration: "none", fontStyle: "italic" }}>
        {open ? "− Less" : "+ Go deeper"}
      </button>
      {open && (
        <div style={{ borderLeft: "2px solid #e4ddcf", paddingLeft: 16, marginTop: 10 }}>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.7, color: "#4a4a42" }}>{text}</p>
        </div>
      )}
    </div>
  );
}

const AGENCIES = {
  CPUC: { name: "CPUC", full: "California Public Utilities Commission", color: "#2e5e8c" },
  CEC: { name: "CEC", full: "California Energy Commission", color: "#2f8f4e" },
  CARB: { name: "CARB", full: "California Air Resources Board", color: "#c0392b" },
  LEG: { name: "Legislature", full: "California State Legislature", color: "#8a6100" },
};
const SCENARIOS = [
  { q: "Set the rate PG&E charges its customers", a: "CPUC", why: "Investor-owned utility rates are set by the CPUC, primarily through a General Rate Case (GRC)." },
  { q: "Decide how rooftop-solar exports get paid (net billing)", a: "CPUC", why: "DER compensation and the Net Billing Tariff are CPUC rate-design decisions (the NEM successor)." },
  { q: "Approve a utility's long-term procurement plan (IRP)", a: "CPUC", why: "Integrated Resource Planning and Resource Adequacy live at the CPUC." },
  { q: "Update the building energy code (Title 24)", a: "CEC", why: "The CEC writes Title 24, Part 6 building efficiency standards on a ~3-year cycle." },
  { q: "Set appliance efficiency standards (Title 20)", a: "CEC", why: "Appliance efficiency standards are Title 20, administered by the CEC." },
  { q: "License a large solar-plus-storage power plant", a: "CEC", why: "The CEC handles siting and certification of large generation (with the AB 205 opt-in path)." },
  { q: "Publish the biennial state energy forecast (IEPR)", a: "CEC", why: "The Integrated Energy Policy Report is the CEC's core planning document." },
  { q: "Run the cap-and-trade carbon market", a: "CARB", why: "Cap-and-trade and the GHG Scoping Plan are CARB programs." },
  { q: "Set zero-emission vehicle rules (Advanced Clean Cars)", a: "CARB", why: "Vehicle emission standards and ZEV mandates are CARB's authority." },
  { q: "Phase out new gas furnaces (zero-NOx appliance rule)", a: "CARB", why: "Zero-NOx space- and water-heater rules are adopted by CARB." },
  { q: "Create a brand-new state energy program", a: "LEG", why: "Only the Legislature can pass the statute; the agencies then implement it." },
  { q: "Set the 2045 carbon-neutrality target in law", a: "LEG", why: "Statewide targets (AB 32 / SB 32 / AB 1279) are set by the Legislature." },
];

function AgencyRouter() {
  const [sel, setSel] = useState(0);
  const s = SCENARIOS[sel];
  const ag = AGENCIES[s.a];
  return (
    <div className="dossier">
      <div className="kicker">Interactive · Who regulates what</div>
      <div className="display lg">Which agency <em>does what</em>.</div>
      <p className="lede">Energy authority is split across three agencies and the Legislature. Pick a task to see which one is responsible, and why.</p>
      <div className="toolgrid">
        <div>
          <div className="subhead" style={{ marginTop: 0 }}>The task</div>
          {SCENARIOS.map((x, i) => (
            <button key={i} onClick={() => setSel(i)} style={{
              display: "block", width: "100%", textAlign: "left", margin: "7px 0", padding: "11px 14px", borderRadius: 9, cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, lineHeight: 1.4,
              border: "1px solid " + (sel === i ? AGENCIES[x.a].color : "#e0d9ca"), background: "#fff", color: "#3a3a34", fontWeight: sel === i ? 600 : 400,
              boxShadow: sel === i ? "inset 3px 0 0 " + AGENCIES[x.a].color : "none",
            }}>{x.q}</button>
          ))}
        </div>
        <div>
          <div className="subhead" style={{ marginTop: 0 }}>The answer</div>
          <div style={{ border: "1px solid " + ag.color, borderRadius: 12, padding: "22px 22px", background: "#fff" }}>
            <span style={{ display: "inline-block", padding: "6px 14px", borderRadius: 20, background: ag.color, color: "#fff", fontFamily: "var(--serif)", fontWeight: 600, fontSize: 16 }}>{ag.name}</span>
            <div style={{ fontFamily: "var(--serif)", fontSize: 20, color: "#1c1b18", marginTop: 12 }}>{ag.full}</div>
            <p style={{ margin: "10px 0 0", fontSize: 14.5, lineHeight: 1.6, color: "#4a4a42" }}>{s.why}</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            {Object.values(AGENCIES).map((a, i) => (
              <span key={i} style={{ fontSize: 11.5, padding: "4px 10px", borderRadius: 14, border: "1px solid " + a.color, color: a.color, fontWeight: 600, opacity: a.name === ag.name ? 1 : 0.4 }}>{a.name}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const DOCKET_TYPES = {
  R: { n: "Rulemaking", d: "A quasi-legislative proceeding opened by an Order Instituting Rulemaking (OIR) to make policy or rules." },
  I: { n: "Investigation", d: "Opened by an Order Instituting Investigation (OII) — the Commission examines a utility's conduct or a problem." },
  A: { n: "Application", d: "A utility or party formally asks the Commission for something — e.g., a General Rate Case or a project approval." },
  C: { n: "Complaint", d: "A formal complaint filed against a utility, resolved through a quasi-judicial process." },
  D: { n: "Decision", d: "A final, adopted Commission decision — the outcome a proceeding produces." },
};
const MONTHS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function DocketDecoder() {
  const [v, setV] = useState("R.25-04-010");
  const m = v.trim().toUpperCase().match(/^([RIACD])[.\s]*(\d{2})-?(\d{2})-?(\d{2,4})$/);
  const t = m ? DOCKET_TYPES[m[1]] : null;
  const samples = ["R.25-04-010", "A.23-05-004", "I.19-06-014", "D.26-04-017"];
  return (
    <div className="dossier">
      <div className="kicker">Interactive · Docket decoder</div>
      <div className="display lg">Decode a <em>CPUC docket number</em>.</div>
      <p className="lede">Every CPUC filing has a code like R.25-04-010. It shows the type of proceeding and when it opened. Type one, or try an example.</p>
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder="e.g. R.25-04-010" style={{ width: "100%", maxWidth: 340, padding: "12px 15px", border: "1px solid #d8d0bf", borderRadius: 10, fontSize: 18, fontFamily: "var(--serif)", fontWeight: 600, color: "#1c1b18", background: "#fff", marginTop: 6 }} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        {samples.map((s, i) => <button key={i} className="chip" onClick={() => setV(s)}>{s}</button>)}
      </div>
      {t ? (
        <>
          <div className="breakcards">
            {[
              { k: "Type", val: m[1], sub: t.n },
              { k: "Year opened", val: "20" + m[2], sub: "" },
              { k: "Month", val: m[3], sub: MONTHS[parseInt(m[3], 10)] || "" },
              { k: "Sequence", val: "#" + parseInt(m[4], 10), sub: "nth filed that month" },
            ].map((c, i) => (
              <div key={i} style={{ flex: "1 1 130px", border: "1px solid #ece7dc", borderRadius: 10, padding: "14px 16px", background: "#fff" }}>
                <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "#a49e90" }}>{c.k}</div>
                <div style={{ fontFamily: "var(--serif)", fontSize: 26, fontWeight: 600, color: "#1c1b18", marginTop: 4 }}>{c.val}</div>
                {c.sub && <div style={{ fontSize: 12.5, color: "#6f6a5f", marginTop: 2 }}>{c.sub}</div>}
              </div>
            ))}
          </div>
          <div style={{ background: "#fff", border: "1px solid #ece7dc", borderRadius: 10, padding: "16px 18px", marginTop: 16 }}>
            <span style={{ fontFamily: "var(--serif)", fontWeight: 600, color: "var(--accent)" }}>{m[1]} = {t.n}.</span>{" "}
            <span style={{ fontSize: 14.5, color: "#4a4a42", lineHeight: 1.6 }}>{t.d}</span>
          </div>
        </>
      ) : (
        <div className="empty" style={{ marginTop: 18 }}>That doesn't look like a docket number yet. Try the format <b>R.25-04-010</b> — a letter (R/I/A/C/D), then year-month-sequence.</div>
      )}
    </div>
  );
}

export default function Intelligence() {
  const [mode, setMode] = useState("learn");
  const [openId, setOpenId] = useState(null);
  const [gq, setGq] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function send(text) {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setError(""); setInput("");
    const next = [...messages, { role: "user", content: q }];
    setMessages(next); setLoading(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: next }) });
      const data = await res.json();
      if (data.error) setError(data.error); else setMessages((m) => [...m, { role: "assistant", content: data.answer }]);
    } catch { setError("Couldn't reach the assistant. Try again."); }
    finally { setLoading(false); }
  }
  function askAbout(q) { setMode("ask"); send(q); }

  const open = MODULES.find((m) => m.id === openId);
  const glossary = GLOSSARY.filter((g) => !gq || (g.term + " " + g.def).toLowerCase().includes(gq.toLowerCase()));
  const NAV = [["learn", "The Dossier"], ["structure", "Structure"], ["diagrams", "Diagrams"], ["tools", "Tools"], ["glossary", "Glossary"], ["ask", "Ask AI"]];

  return (
    <section>
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {NAV.map(([k, label]) => (
          <button key={k} className={"chip" + (mode === k ? " on" : "")} onClick={() => { setMode(k); setOpenId(null); }}>{label}</button>
        ))}
      </div>

      {/* THE DOSSIER — cover / table of contents */}
      {mode === "learn" && !open && (
        <div className="dossier">
          <div className="kicker">TEC · California Regulatory Primer</div>
          <div className="display xl">A guide to <em>California energy &amp; governance</em>.</div>
          <p className="lede">How California's energy and climate system works: what the CPUC, CEC, CARB, and the Legislature each do, how their processes run, and the key terms — in plain language.</p>
          <div className="statrow">
            <div className="stat"><div className="num">4</div><div className="lbl">agencies &amp; the Legislature</div></div>
            <div className="stat"><div className="num">8</div><div className="lbl">guided lessons</div></div>
            <div className="stat"><div className="num">2045</div><div className="lbl">carbon-neutral target</div></div>
          </div>
          <div style={{ marginTop: 20 }}>
            {MODULES.map((m) => (
              <div className="toc-item" key={m.id} onClick={() => setOpenId(m.id)}>
                <div className="section-no" style={{ minWidth: 74 }}>{(m.kicker || "").split("·")[0].trim()}</div>
                <div>
                  <div className="toc-title">{m.icon} {m.title}</div>
                  <div style={{ fontSize: 14, color: "#6f6a5f", marginTop: 3, maxWidth: "60ch" }}>{m.summary}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LESSON — editorial article */}
      {mode === "learn" && open && (
        <div className="dossier">
          <button className="chip" onClick={() => setOpenId(null)} style={{ marginBottom: 18 }}>← The Dossier</button>
          <div className="kicker">{open.kicker}</div>
          <div className="display lg">{open.title}</div>
          <p className="lede">{open.summary}</p>
          {open.stats && (
            <div className="statrow">
              {open.stats.map((s, i) => <div className="stat" key={i}><div className="num">{s.num}</div><div className="lbl">{s.lbl}</div></div>)}
            </div>
          )}
          {open.id === "governance" && <OrgTree t={ORG_TREE} />}
          {open.diagram && DIAGRAMS[open.diagram] && <FlowDiagram d={DIAGRAMS[open.diagram]} />}
          {open.breakdown && <Breakdown b={open.breakdown} />}
          {open.sections.map((s, i) => (
            <div key={i}>
              <div className="subhead">{s.h}</div>
              <p>{s.body}</p>
              {s.deep && <DeepDive text={s.deep} />}
              {i === 1 && open.pullquote && <div className="pullquote">{open.pullquote}</div>}
            </div>
          ))}
          {open.compare && (
            <div className="compare">
              <div className="subhead">{open.compare.title}</div>
              {open.compare.rows.map((r, i) => (
                <div className="row" key={i}>
                  <div className="barlbl">{r.label}</div>
                  <div className="track"><div className="fill" style={{ width: r.pct + "%", background: r.color }}>{r.value}</div></div>
                </div>
              ))}
            </div>
          )}
          <div style={{ background: "#fff", border: "1px solid #ece7dc", borderRadius: 10, padding: "16px 18px", margin: "26px 0" }}>
            <div className="subhead" style={{ marginTop: 0 }}>Key takeaways</div>
            {open.keyPoints.map((k, i) => <div key={i} style={{ fontSize: 14, padding: "3px 0", color: "#3a3a34" }}>— {k}</div>)}
          </div>
          <div className="subhead">Go deeper — ask the assistant</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {open.ask.map((q, i) => <button key={i} className="chip" onClick={() => askAbout(q)} style={{ maxWidth: 380, textAlign: "left" }}>{q}</button>)}
          </div>
        </div>
      )}

      {/* STRUCTURE — the org tree */}
      {mode === "structure" && (
        <div className="dossier">
          <div className="kicker">The structure</div>
          <div className="display lg">Who does <em>what</em> in California government.</div>
          <p className="lede">California's government has three branches. Under the Governor, most agencies sit within two umbrellas — CalEPA and CNRA. The CPUC is independent of both. Here's how it fits together.</p>
          <OrgTree t={ORG_TREE} />
          <div className="subhead">How to read it</div>
          <p>The <strong>Legislature</strong> writes the statutes that direct the agencies. The <strong>Governor</strong> runs the executive branch through cabinet super-agencies: <strong>CalEPA</strong> (which includes CARB) and <strong>CNRA</strong> (which includes the CEC) are the two relevant to energy and climate. The <strong>CPUC</strong> is separate — it was created by the Constitution, regulates investor-owned utilities' rates and programs, and is reviewed by the appellate courts rather than the Governor.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {["Why is the CPUC independent from the Governor's agencies?", "What's the difference between CalEPA and CNRA?", "Which agency regulates my electric rates?"].map((q, i) => <button key={i} className="chip" onClick={() => askAbout(q)} style={{ maxWidth: 360, textAlign: "left" }}>{q}</button>)}
          </div>
        </div>
      )}

      {/* TOOLS — interactive, agency-relevant */}
      {mode === "tools" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <AgencyRouter />
          <DocketDecoder />
        </div>
      )}

      {/* DIAGRAMS */}
      {mode === "diagrams" && (
        <div className="dossier">
          <div className="kicker">Process diagrams</div>
          <div className="display lg">How the <em>process</em> works.</div>
          <p className="lede">Click any step to see what happens there, from a CPUC rulemaking to a bill going to the Governor.</p>
          {Object.values(DIAGRAMS).map((d, i) => <FlowDiagram key={i} d={d} />)}
        </div>
      )}

      {/* GLOSSARY */}
      {mode === "glossary" && (
        <div className="dossier">
          <div className="kicker">Reference</div>
          <div className="display lg">Key <em>terms</em>.</div>
          <input className="search" placeholder="Search terms…" value={gq} onChange={(e) => setGq(e.target.value)} style={{ marginTop: 14 }} />
          <div>
            {glossary.map((g, i) => (
              <div key={i} style={{ padding: "14px 0", borderTop: "1px solid #ece7dc" }}>
                <span style={{ fontFamily: "var(--serif)", fontSize: 16, fontWeight: 600, color: "#1c1b18" }}>{g.term}</span>
                <span style={{ fontSize: 14, color: "#3a3a34", marginLeft: 10 }}>{g.def}</span>
              </div>
            ))}
            {glossary.length === 0 && <div className="empty" style={{ marginTop: 14 }}>No terms match "{gq}".</div>}
          </div>
        </div>
      )}

      {/* ASK AI */}
      {mode === "ask" && (
        <div>
          <div className="note"><b>Ask the assistant.</b> It uses the primer's knowledge base plus your live tracker data. Not legal advice; verify specifics against the source.</div>
          <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: 16, minHeight: 320, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1 }}>
              {messages.length === 0 && !loading && (
                <div>
                  <div className="cat" style={{ marginBottom: 10 }}>Ask anything, or start here:</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {["What's the state of the Energy Efficiency proceeding R.25-04-010?", "Which tracked bills are closest to becoming law?", "Explain how a CPUC rulemaking works.", "What deadlines are coming up?"].map((s, i) => (
                      <button key={i} className="chip" onClick={() => send(s)} style={{ maxWidth: 340, textAlign: "left" }}>{s}</button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", margin: "10px 0" }}>
                  <div style={{ maxWidth: "82%", padding: "10px 14px", borderRadius: 12, fontSize: 14, lineHeight: 1.5, background: m.role === "user" ? "var(--blue)" : "var(--bg)", color: m.role === "user" ? "#fff" : "var(--ink)", border: m.role === "user" ? "none" : "1px solid var(--line)" }}>
                    {m.role === "user" ? m.content : fmt(m.content)}
                  </div>
                </div>
              ))}
              {loading && <div style={{ color: "var(--muted)", fontSize: 13, margin: "10px 0" }}>Thinking…</div>}
              {error && <div className="empty" style={{ borderColor: "var(--red)", color: "var(--red)", marginTop: 10 }}>{error}</div>}
              <div ref={endRef} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Ask about a proceeding, a bill, or how CA regulation works…" style={{ flex: 1, padding: "11px 14px", border: "1px solid var(--line)", borderRadius: 10, fontSize: 14, fontFamily: "inherit" }} />
              <button onClick={() => send()} disabled={loading || !input.trim()} style={{ padding: "0 18px", background: "var(--navy)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, fontFamily: "inherit", opacity: loading || !input.trim() ? 0.6 : 1 }}>Send</button>
              {messages.length > 0 && <button onClick={() => { setMessages([]); setError(""); }} className="linklike" style={{ whiteSpace: "nowrap" }}>Clear</button>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
