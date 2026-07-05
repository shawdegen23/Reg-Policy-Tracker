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

function Calculator() {
  const [heatload, setHeatload] = useState(40); // MMBtu/yr of heat delivered
  const [gasPrice, setGasPrice] = useState(2.2); // $/therm
  const [elecPrice, setElecPrice] = useState(0.32); // $/kWh
  const [cop, setCop] = useState(3.2);
  const furnaceEff = 0.92;
  // gas: MMBtu -> therms (1 therm = 0.1 MMBtu). Furnace loses (1-eff).
  const gasTherms = (heatload / furnaceEff) / 0.1;
  const gasCost = gasTherms * gasPrice;
  // heat pump: MMBtu heat delivered / COP = MMBtu electricity in; 1 kWh = 0.003412 MMBtu
  const hpKwh = (heatload / cop) / 0.003412;
  const hpCost = hpKwh * elecPrice;
  const diff = gasCost - hpCost;
  const cheaper = diff >= 0;
  const fmtUsd = (n) => "$" + Math.round(n).toLocaleString();
  const barMax = Math.max(gasCost, hpCost, 1);
  const field = (label, val, set, min, max, step, unit) => (
    <label style={{ display: "block", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#3a3a34", marginBottom: 5 }}>
        <span>{label}</span><span style={{ fontFamily: "var(--serif)", fontWeight: 600, color: "#1c1b18" }}>{val}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(parseFloat(e.target.value))} style={{ width: "100%", accentColor: "var(--accent)" }} />
    </label>
  );
  return (
    <div className="dossier">
      <div className="kicker">Interactive tool</div>
      <div className="display lg">Heat pump vs. gas — <em>run your own numbers</em>.</div>
      <p className="lede">A heat pump is 3–4× more efficient, but California electricity is expensive per unit. Whether it actually lowers the bill depends on the spread between gas and electric prices. Drag the sliders to see.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, marginTop: 22 }}>
        <div>
          <div className="subhead" style={{ marginTop: 0 }}>Assumptions</div>
          {field("Annual heat needed", heatload, setHeatload, 10, 100, 1, " MMBtu")}
          {field("Gas price", gasPrice, setGasPrice, 0.8, 4, 0.1, " $/therm")}
          {field("Electricity price", elecPrice, setElecPrice, 0.1, 0.6, 0.01, " $/kWh")}
          {field("Heat-pump efficiency (COP)", cop, setCop, 1.8, 4.5, 0.1, "")}
          <div style={{ fontSize: 11.5, color: "#a49e90", marginTop: 6 }}>Gas furnace assumed 92% efficient. Heating only; excludes equipment & install cost.</div>
        </div>
        <div>
          <div className="subhead" style={{ marginTop: 0 }}>Estimated annual heating cost</div>
          {[["Gas furnace", gasCost, "#8a857a"], ["Heat pump", hpCost, "#2f8f4e"]].map(([lbl, cost, col], i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 5 }}>
                <span style={{ color: "#3a3a34" }}>{lbl}</span>
                <span style={{ fontFamily: "var(--serif)", fontWeight: 600, fontSize: 18, color: "#1c1b18" }}>{fmtUsd(cost)}/yr</span>
              </div>
              <div style={{ height: 22, background: "#efe9dc", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ width: (cost / barMax * 100) + "%", height: "100%", background: col, borderRadius: 6 }} />
              </div>
            </div>
          ))}
          <div style={{ background: cheaper ? "#e9f4ec" : "#fbecea", border: "1px solid " + (cheaper ? "#b7ddc2" : "#f0b7ae"), borderRadius: 10, padding: "14px 16px", marginTop: 18 }}>
            <div style={{ fontFamily: "var(--serif)", fontSize: 20, fontWeight: 600, color: cheaper ? "#1f7a3d" : "#c0392b" }}>
              {cheaper ? "Heat pump saves " + fmtUsd(Math.abs(diff)) + "/yr" : "Gas is " + fmtUsd(Math.abs(diff)) + "/yr cheaper"}
            </div>
            <div style={{ fontSize: 13, color: "#4a4a42", marginTop: 5, lineHeight: 1.5 }}>
              {cheaper
                ? "At these prices the efficiency advantage wins. Add rebates and the case gets stronger."
                : "This is the California paradox: the heat pump uses far less energy, but high per-kWh rates can erase the savings. It's why rate design (see the Rates lesson) is central to electrification."}
            </div>
          </div>
        </div>
      </div>
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
          <div className="kicker">TEC · Field Dossier · Vol. 01</div>
          <div className="display xl">A working guide to <em>California energy &amp; governance</em>.</div>
          <p className="lede">The agencies, the rules, and the machinery behind California's energy and climate system — CPUC, CEC, CARB, and the Legislature — explained from first principles, with the process diagrams and vocabulary you actually need.</p>
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
          <div className="display lg">Who sits <em>where</em> in California government.</div>
          <p className="lede">Three branches, two agency umbrellas under the Governor, and one commission that answers to none of them. This is the map behind every acronym in the dossier.</p>
          <OrgTree t={ORG_TREE} />
          <div className="subhead">Read it top-down</div>
          <p>The <strong>Legislature</strong> writes statutes that direct everyone below. The <strong>Governor</strong> runs the executive branch through cabinet 'super-agencies' — <strong>CalEPA</strong> (home of CARB) and <strong>CNRA</strong> (home of the CEC) are the two that matter for energy and climate. The <strong>CPUC</strong> sits off to the side: created by the Constitution, it regulates the investor-owned utilities' rates and programs and is reviewed directly by the appellate courts, not the Governor.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {["Why is the CPUC independent from the Governor's agencies?", "What's the difference between CalEPA and CNRA?", "Which agency regulates my electric rates?"].map((q, i) => <button key={i} className="chip" onClick={() => askAbout(q)} style={{ maxWidth: 360, textAlign: "left" }}>{q}</button>)}
          </div>
        </div>
      )}

      {/* TOOLS — interactive calculator */}
      {mode === "tools" && <Calculator />}

      {/* DIAGRAMS */}
      {mode === "diagrams" && (
        <div className="dossier">
          <div className="kicker">Process diagrams</div>
          <div className="display lg">How the machinery <em>actually moves</em>.</div>
          <p className="lede">Click any step to see what happens there — from a CPUC rulemaking to a bill on the Governor's desk.</p>
          {Object.values(DIAGRAMS).map((d, i) => <FlowDiagram key={i} d={d} />)}
        </div>
      )}

      {/* GLOSSARY */}
      {mode === "glossary" && (
        <div className="dossier">
          <div className="kicker">Reference</div>
          <div className="display lg">The <em>vocabulary</em>.</div>
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
          <div className="note"><b>Ask the assistant.</b> Grounded in the dossier knowledge base plus your live tracker data. Not legal advice — verify specifics against the source.</div>
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
