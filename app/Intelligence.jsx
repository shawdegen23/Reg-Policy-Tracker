"use client";
import { useState, useRef, useEffect } from "react";
import { MODULES, DIAGRAMS, GLOSSARY } from "./learnContent";

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
  const NAV = [["learn", "The Dossier"], ["diagrams", "Diagrams"], ["glossary", "Glossary"], ["ask", "Ask AI"]];

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
            <div className="stat"><div className="num">6</div><div className="lbl">guided lessons</div></div>
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
          {open.diagram && DIAGRAMS[open.diagram] && <FlowDiagram d={DIAGRAMS[open.diagram]} />}
          {open.sections.map((s, i) => (
            <div key={i}>
              <div className="subhead">{s.h}</div>
              <p>{s.body}</p>
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
