"use client";
import { useState, useRef, useEffect } from "react";

const STARTERS = [
  "What's the state of the Energy Efficiency proceeding R.25-04-010?",
  "Explain how a CPUC rulemaking moves from OIR to final decision.",
  "Which tracked bills are closest to becoming law, and what do they do?",
  "Summarize what's happening with building decarbonization right now.",
  "What deadlines are coming up and what should I prioritize?",
  "How does CARB's rulemaking process differ from the CPUC's?",
];

// Minimal, XSS-safe formatter: paragraphs, **bold**, and - bullets.
function render(text) {
  return String(text).split(/\n/).map((line, i) => {
    const bullet = /^\s*[-*]\s+/.test(line);
    const clean = line.replace(/^\s*[-*]\s+/, "");
    const parts = clean.split(/(\*\*[^*]+\*\*)/g).map((seg, j) =>
      /^\*\*[^*]+\*\*$/.test(seg) ? <strong key={j}>{seg.slice(2, -2)}</strong> : <span key={j}>{seg}</span>);
    return <div key={i} style={bullet ? { paddingLeft: 16, textIndent: -10 } : { margin: line.trim() ? "0 0 6px" : "0 0 10px" }}>{bullet ? "• " : ""}{parts}</div>;
  });
}

export default function Intelligence() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function send(text) {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setError("");
    setInput("");
    const next = [...messages, { role: "user", content: q }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); }
      else setMessages((m) => [...m, { role: "assistant", content: data.answer }]);
    } catch (e) {
      setError("Couldn't reach the assistant. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <div className="note"><b>Intelligence.</b> Ask anything about California regulatory and governance matters — CPUC, CEC, CARB, and the Legislature. Answers draw on your live tracker data plus expert knowledge of the CA regulatory process. Not legal advice; verify specifics against the source.</div>

      <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: 16, minHeight: 360, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1 }}>
          {messages.length === 0 && !loading && (
            <div>
              <div className="cat" style={{ marginBottom: 10 }}>Try a question:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {STARTERS.map((s, i) => (
                  <button key={i} onClick={() => send(s)} style={{ textAlign: "left", fontSize: 13, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 10, padding: "9px 12px", cursor: "pointer", fontFamily: "inherit", maxWidth: 340 }}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", margin: "10px 0" }}>
              <div style={{
                maxWidth: "82%", padding: "10px 14px", borderRadius: 12, fontSize: 14, lineHeight: 1.5,
                background: m.role === "user" ? "var(--blue)" : "var(--bg)",
                color: m.role === "user" ? "#fff" : "var(--ink)",
                border: m.role === "user" ? "none" : "1px solid var(--line)",
              }}>
                {m.role === "user" ? m.content : render(m.content)}
              </div>
            </div>
          ))}
          {loading && <div style={{ color: "var(--muted)", fontSize: 13, margin: "10px 0" }}>Thinking…</div>}
          {error && <div className="empty" style={{ borderColor: "var(--red)", color: "var(--red)", marginTop: 10 }}>{error}</div>}
          <div ref={endRef} />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask about a proceeding, a bill, a deadline, or how CA regulation works…"
            style={{ flex: 1, padding: "11px 14px", border: "1px solid var(--line)", borderRadius: 10, fontSize: 14, fontFamily: "inherit" }}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()} style={{ padding: "0 18px", background: "var(--navy)", color: "#fff", border: "none", borderRadius: 10, cursor: loading ? "default" : "pointer", fontSize: 14, fontFamily: "inherit", opacity: loading || !input.trim() ? 0.6 : 1 }}>Send</button>
          {messages.length > 0 && <button onClick={() => { setMessages([]); setError(""); }} className="linklike" style={{ whiteSpace: "nowrap" }}>Clear</button>}
        </div>
      </div>
    </section>
  );
}
