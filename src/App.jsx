import { useState, useRef, useEffect, useCallback } from "react"

const API_BASE = "http://localhost:8000"

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
}

async function createSession(name, age, conditions) {
  const res = await fetch(`${API_BASE}/api/session/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patient_name: name || "User", age: age || null, known_conditions: conditions || [] }),
  })
  return res.json()
}

async function sendMessage(sessionId, message) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message }),
  })
  if (!res.ok) throw new Error("API error")
  return res.json()
}

const SUGGESTIONS = [
  "I have a headache and fever since 2 days",
  "What are symptoms of diabetes?",
  "How to manage high blood pressure?",
  "I feel very anxious lately",
  "What does hemoglobin level of 10 mean?",
  "Suggest a healthy diet plan",
]

const INTENT_STYLE = {
  emergency: { bg: "#FCEBEB", color: "#A32D2D", label: "🚨 Emergency" },
  mental_health: { bg: "#EEEDFE", color: "#3C3489", label: "🧠 Mental Health" },
  medication: { bg: "#FAEEDA", color: "#633806", label: "💊 Medication" },
  general: { bg: "#EAF3DE", color: "#27500A", label: "ℹ️ General" },
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user"
  const intent = msg.intent ? INTENT_STYLE[msg.intent] : null
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 16, gap: 10, alignItems: "flex-end" }}>
      {!isUser && (
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #1D9E75, #0F6E56)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🩺</div>
      )}
      <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", gap: 4, alignItems: isUser ? "flex-end" : "flex-start" }}>
        {intent && !isUser && (
          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: intent.bg, color: intent.color }}>{intent.label}</span>
        )}
        <div style={{ background: isUser ? "#1D9E75" : "#F7F9F8", color: isUser ? "#fff" : "#1a2e25", borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "12px 16px", fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", border: isUser ? "none" : "1px solid #E8F0EC" }}>
          {msg.content}
        </div>
        {msg.timestamp && <span style={{ fontSize: 11, color: "#9aada4" }}>{formatTime(msg.timestamp)}</span>}
      </div>
      {isUser && (
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#0F6E56", fontWeight: 700, fontSize: 13 }}>U</div>
      )}
    </div>
  )
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 16 }}>
      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #1D9E75, #0F6E56)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🩺</div>
      <div style={{ background: "#F7F9F8", border: "1px solid #E8F0EC", borderRadius: "18px 18px 18px 4px", padding: "14px 18px", display: "flex", gap: 5, alignItems: "center" }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#1D9E75", display: "inline-block", animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </div>
  )
}

function OnboardingModal({ onStart }) {
  const [name, setName] = useState("")
  const [age, setAge] = useState("")
  const [conditions, setConditions] = useState("")
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "36px 32px", maxWidth: 420, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🩺</div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#0F6E56" }}>MedBot</h1>
          <p style={{ margin: "8px 0 0", color: "#6b8c7d", fontSize: 14 }}>Your AI Healthcare Assistant</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#4a6b5d", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" }}>Your Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rahul" type="text"
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 14, border: "1.5px solid #D1E8DF", outline: "none", boxSizing: "border-box", background: "#F7FAF8", color: "#1a2e25" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#4a6b5d", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" }}>Age (optional)</label>
            <input value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 28" type="number"
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 14, border: "1.5px solid #D1E8DF", outline: "none", boxSizing: "border-box", background: "#F7FAF8", color: "#1a2e25" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#4a6b5d", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" }}>Known Conditions (optional)</label>
            <input value={conditions} onChange={e => setConditions(e.target.value)} placeholder="e.g. Diabetes, Hypertension" type="text"
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 14, border: "1.5px solid #D1E8DF", outline: "none", boxSizing: "border-box", background: "#F7FAF8", color: "#1a2e25" }} />
          </div>
        </div>
        <button onClick={() => onStart(name, parseInt(age) || null, conditions.split(",").map(s => s.trim()).filter(Boolean))}
          style={{ marginTop: 24, width: "100%", padding: "14px", borderRadius: 12, background: "linear-gradient(135deg, #1D9E75, #0F6E56)", color: "#fff", fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer" }}>
          Start Consultation →
        </button>
        <p style={{ textAlign: "center", fontSize: 11, color: "#9aada4", marginTop: 14, marginBottom: 0 }}>
          ⚕️ MedBot is an AI assistant, not a substitute for professional medical advice.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [sessionId, setSessionId] = useState(null)
  const [patientName, setPatientName] = useState("User")
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SR()
      recognition.lang = "en-IN"
      recognition.continuous = false
      recognition.interimResults = false
      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript
        setInput(prev => prev + transcript)
        setIsListening(false)
      }
      recognition.onerror = () => setIsListening(false)
      recognition.onend = () => setIsListening(false)
      recognitionRef.current = recognition
    }
  }, [])

  const toggleVoice = () => {
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleStart = useCallback(async (name, age, conditions) => {
    try {
      const data = await createSession(name, age, conditions)
      setSessionId(data.session_id)
      setPatientName(name || "User")
      setMessages([{ role: "assistant", content: `Hello ${name || "there"}! 👋 I'm MedBot, your AI healthcare assistant.\n\nI can help you with:\n• General health questions\n• Understanding symptoms\n• Medication information\n• Wellness advice\n\nPlease remember I'm an AI — always consult a doctor for diagnosis and treatment. How can I help you today?`, timestamp: new Date().toISOString(), intent: "general" }])
      setShowOnboarding(false)
    } catch {
      setSessionId(generateId())
      setPatientName(name || "User")
      setMessages([{ role: "assistant", content: `Hello ${name || "there"}! 👋 I'm MedBot.\n\n⚠️ Backend server is not running.`, timestamp: new Date().toISOString(), intent: "general" }])
      setShowOnboarding(false)
    }
  }, [])

  const handleSend = useCallback(async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput("")
    setError(null)
    setMessages(prev => [...prev, { role: "user", content: msg, timestamp: new Date().toISOString() }])
    setLoading(true)
    try {
      const data = await sendMessage(sessionId, msg)
      setMessages(prev => [...prev, { role: "assistant", content: data.response, timestamp: data.timestamp, intent: data.intent }])
    } catch {
      setError("Could not connect to MedBot server. Is the FastAPI backend running?")
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Backend connection failed. Make sure the FastAPI server is running on port 8000.", timestamp: new Date().toISOString(), intent: "general" }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, sessionId])

  const handleClear = async () => {
    try { await fetch(`${API_BASE}/api/session/${sessionId}`, { method: "DELETE" }) } catch {}
    setMessages([{ role: "assistant", content: "Chat cleared. How can I help you?", timestamp: new Date().toISOString(), intent: "general" }])
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #EDF5F1; font-family: -apple-system, 'Segoe UI', sans-serif; }
        @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #C8DDD5; border-radius: 10px; }
      `}</style>

      {showOnboarding && <OnboardingModal onStart={handleStart} />}

      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px" }}>
        <div style={{ width: "100%", maxWidth: 720, height: "88vh", background: "#fff", borderRadius: 24, boxShadow: "0 8px 40px rgba(15,110,86,0.12)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Header */}
          <div style={{ padding: "16px 22px", borderBottom: "1px solid #E8F0EC", display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(135deg, #F0FAF5, #fff)" }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg, #1D9E75, #0F6E56)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🩺</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F6E56", margin: 0 }}>MedBot</h2>
              <p style={{ fontSize: 12, color: "#6b8c7d", margin: 0 }}>{loading ? "⏳ Thinking..." : "🟢 Online · AI Healthcare Assistant"}</p>
            </div>
            <span style={{ fontSize: 12, background: "#E1F5EE", color: "#0F6E56", padding: "4px 10px", borderRadius: 20, fontWeight: 600 }}>{patientName}</span>
            <button onClick={handleClear} style={{ background: "#FEF0E6", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 13, color: "#993C1D" }}>🗑</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div style={{ padding: "0 22px 12px", display: "flex", flexWrap: "wrap", gap: 6 }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => handleSend(s)} style={{ background: "#F0FAF5", border: "1px solid #C8DDD5", borderRadius: 20, padding: "6px 12px", fontSize: 12, color: "#0F6E56", cursor: "pointer", fontWeight: 500 }}>{s}</button>
              ))}
            </div>
          )}

          {error && (
            <div style={{ margin: "0 16px 8px", padding: "8px 14px", background: "#FCEBEB", borderRadius: 10, fontSize: 12, color: "#A32D2D" }}>⚠️ {error}</div>
          )}

          {/* Input */}
          <div style={{ padding: "14px 20px 10px", borderTop: "1px solid #E8F0EC", display: "flex", gap: 10, alignItems: "flex-end" }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Describe your symptoms or ask a health question..."
              rows={1}
              style={{ flex: 1, resize: "none", border: "1.5px solid #D1E8DF", borderRadius: 14, padding: "11px 15px", fontSize: 14, fontFamily: "inherit", background: "#F7FAF8", color: "#1a2e25", maxHeight: 120, overflowY: "auto", lineHeight: 1.5 }}
              onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px" }}
            />
            <button onClick={toggleVoice} title="Voice input"
              style={{ width: 46, height: 46, borderRadius: 14, border: isListening ? "2px solid #A32D2D" : "1.5px solid #C8DDD5", background: isListening ? "#FCEBEB" : "#F0FAF5", color: isListening ? "#A32D2D" : "#0F6E56", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, animation: isListening ? "pulse 1s infinite" : "none" }}>
              🎤
            </button>
            <button onClick={() => handleSend()} disabled={loading || !input.trim()}
              style={{ width: 46, height: 46, borderRadius: 14, border: "none", background: loading || !input.trim() ? "#C8DDD5" : "linear-gradient(135deg, #1D9E75, #0F6E56)", color: "#fff", fontSize: 18, cursor: loading || !input.trim() ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {loading ? "⏳" : "➤"}
            </button>
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", padding: "8px 20px 14px" }}>
            <p style={{ fontSize: 11, color: "#9aada4", margin: 0 }}>
              ⚕️ MedBot provides general information only — not a substitute for professional medical advice.
            </p>
            <p style={{ fontSize: 12, color: "#0F6E56", margin: "4px 0 0", fontWeight: 600 }}>
              Developed by Anas Saifi
            </p>
          </div>

        </div>
      </div>
    </>
  )
}
