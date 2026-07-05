"use client";
import { useState, useRef, useEffect } from "react";
import { MODULES, DIAGRAMS, GLOSSARY } from "./learnContent";

// XSS-safe formatter: paragraphs, **bold**, and - bullets.
function fmt(text) {
  return String(text).split(/\n/).map((line, i) => {
    const bullet = /^\s*[-*]\s+/.test(line);
    const clean = line.replace(/^\s*[-*]\s+/, "");
    const parts = clean.split(/(\*\*[^*]+\*\*)/g).map((seg, j) =>
      /^\*\*[^*]+\*\*$/.test(seg) ? <strong key={j}>{seg.slice(2, -2)}</strong> : <span key={j}>{seg}</span>);
    return <div key={i} style={bullet ? { paddingLeft: 16, textIndent: -10 } : { margin: line.trim() ? "0 0 6px" : "0 0 8px" }}>{bullet ? "• " : ""}{parts}</div>;
  });
}

function FlowDiagram({ d }) {
  const [sel, setSel] = useState(0);
  return (
    <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: 18, marginBottom: 16 }}>
      <h3 style={{ margin: "0 0 2px", fontSize: 15 }}>{d.title}</h3>
      <div className="cat" style={{ marginBottom: 12 }}>{d.subtitle}</div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "stretch", gap: 6 }}>
        {d.steps.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <button onClick={() => setSel(i)} style={{
              padding: "10px 12px", borderRadius: 9, fontSize: 12.5, fontFamily: "inherit", cursor: "pointer", minWidth: 96, maxWidth: 140, textAlign: "center",
              border: "1px solid " + (sel === i ? "var(--blue)" : "var(--line)"),
              background: sel === i ? "var(--blue)" : "#fff", color: sel === i ? "#fff" : "var(--ink)", fontWeight: sel === i ? 700 : 500,
            }}>{s.label}</button>
            {i < d.steps.length - 1 && <span style={{ color: "var(--muted)", margin: "0 2px", fontSize: 16 }}>→</span>}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, padding: "12px 14px", background: "var(--bg)", borderRadius: 9, fontSize: 13.5, lineHeight: 1.5 }}>
        <b>{d.steps[sel].label}.</b> {d.steps[sel].desc}
      </div>
    </div>
  );
}

export default function Intelligence() {
  const [mode, setMode] = useState("learn");
  const [openId, setOpenId] = useState(null);
  const [gq, setGq] = useState("");

  // chat state (lifted so lessons can seed questions)
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
      if (data.error) setError(data.error);
      else setMessages((m) => [...m, { role: "assistant", content: data.answer }]);
    } catch { setError("Couldn't reach the assistant. Try again."); }
    finally { setLoading(false); }
  }
  function askAbout(q) { setMode("ask"); send(q); }

  const open = MODULES.find((m) => m.id === openId);
  const glossary = GLOSSARY.filter((g) => !gq || (g.term + " " + g.def).toLowerCase().includes(gq.toLowerCase()));

  const NAV = [["learn", "📚 Learn"], ["diagrams", "🗺️ Diagrams"], ["glossary", "📖 Glossary"], ["ask", "💬 Ask AI"]];

  return (
    <section>
      <div className="note"><b>Intelligence.</b> A learning hub for California energy, governance, and the CPUC / CEC / CARB — browse lessons and diagrams, look up terms, or ask the AI. Educational reference, not legal advice.</div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {NAV.map(([k, label]) => (
          <button key={k} onClick={() => { setMode(k); setOpenId(null); }} style={{
            padding: "8px 14px", borderRadius: 20, fontSize: 13, fontFamily: "inherit", cursor: "pointer",
            border: "1px solid " + (mode === k ? "var(--navy)" : "var(--line)"),
            background: mode === k ? "var(--navy)" : "#fff", color: mode === k ? "#fff" : "var(--ink)",
          }}>{label}</button>
        ))}
      </div>

      {/* LEARN */}
      {mode === "learn" && !open && (
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
          {MODULES.map((m) => (
            <div key={m.id} className="card" style={{ cursor: "pointer" }} onClick={() => setOpenId(m.id)}>
              <div style={{ fontSize: 26 }}>{m.icon}</div>
              <h3 style={{ margin: "6px 0 4px" }}>{m.title}</h3>
              <div className="desc">{m.summary}</div>
              <div className="sub" style={{ color: "var(--blue)" }}>Open lesson →</div>
            </div>
          ))}
        </div>
      )}

      {mode === "learn" && open && (
        <div>
          <button className="linklike" onClick={() => setOpenId(null)}>← All lessons</button>
          <h2 style={{ margin: "10px 0 4px", fontSize: 22 }}>{open.icon} {open.title}</h2>
          <div className="desc" style={{ marginBottom: 16 }}>{open.summary}</div>
          {open.diagram && DIAGRAMS[open.diagram] && <FlowDiagram d={DIAGRAMS[open.diagram]} />}
          {open.sections.map((s, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <h3 style={{ margin: "0 0 6px", fontSize: 15.5 }}>{s.h}</h3>
              <div style={{ fontSize: 14.5, lineHeight: 1.6 }}>{s.body}</div>
            </div>
          ))}
          <div className="card" style={{ background: "var(--bg)", marginBottom: 16 }}>
            <div className="cat" style={{ marginBottom: 8 }}>KEY TAKEAWAYS</div>
            {open.keyPoints.map((k, i) => <div key={i} style={{ fontSize: 13.5, padding: "2px 0" }}>• {k}</div>)}
          </div>
          <div className="cat" style={{ marginBottom: 8 }}>GO DEEPER — ask the assistant:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {open.ask.map((q, i) => (
              <button key={i} onClick={() => askAbout(q)} style={{ textAlign: "left", fontSize: 13, background: "#fff", border: "1px solid var(--line)", borderRadius: 10, padding: "9px 12px", cursor: "pointer", fontFamily: "inherit", maxWidth: 360 }}>{q}</button>
            ))}
          </div>
        </div>
      )}

      {/* DIAGRAMS */}
      {mode === "diagrams" && (
        <div>
          <div className="cat" style={{ marginBottom: 12 }}>Click any step to see what happens there.</div>
          {Object.values(DIAGRAMS).map((d, i) => <FlowDiagram key={i} d={d} />)}
        </div>
      )}

      {/* GLOSSARY */}
      {mode === "glossary" && (
        <div>
          <input className="search" placeholder="Search terms…" value={gq} onChange={(e) => setGq(e.target.value)} />
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
            {glossary.map((g, i) => (
              <div key={i} className="card"><h3 style={{ margin: 0, fontSize: 14, color: "var(--navy)" }}>{g.term}</h3><div style={{ fontSize: 13.5, marginTop: 4, lineHeight: 1.5 }}>{g.def}</div></div>
            ))}
            {glossary.length === 0 && <div className="empty">No terms match "{gq}".</div>}
          </div>
        </div>
      )}

      {/* ASK AI */}
      {mode === "ask" && (
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: 16, minHeight: 340, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1 }}>
            {messages.length === 0 && !loading && (
              <div>
                <div className="cat" style={{ marginBottom: 10 }}>Ask anything about California energy, governance, the agencies, or a tracked item:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {["What's the state of the Energy Efficiency proceeding R.25-04-010?", "Which tracked bills are closest to becoming law?", "Explain how a CPUC rulemaking works.", "What deadlines are coming up?"].map((s, i) => (
                    <button key={i} onClick={() => send(s)} style={{ textAlign: "left", fontSize: 13, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 10, padding: "9px 12px", cursor: "pointer", fontFamily: "inherit", maxWidth: 340 }}>{s}</button>
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
      )}
    </section>
  );
}
