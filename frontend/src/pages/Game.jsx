import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

// Difficulty badge colors
const DIFF_COLOR = { easy: '#4ade80', medium: '#facc15', hard: '#f87171' }

// Max questions allowed per case
const MAX_QUESTIONS = 20

// Avatar colors for each suspect
const AVATAR_COLORS = [
  { bg: '#2a1a3a', text: '#9f7aea' },
  { bg: '#0f2a1a', text: '#4ade80' },
  { bg: '#2a1a0a', text: '#facc15' },
  { bg: '#2a0a0a', text: '#f87171' },
]

// Returns rank label + color based on final score
function getRank(score) {
  if (score >= 900) return { label: 'Master Detective', color: '#facc15' }
  if (score >= 750) return { label: 'Senior Investigator', color: '#4ade80' }
  if (score >= 600) return { label: 'Detective', color: '#60a5fa' }
  return { label: 'Rookie', color: '#f87171' }
}

export default function Game() {
  const { caseId } = useParams()         // Get case ID from URL
  const navigate = useNavigate()

  // Core game state
  const [caseData, setCaseData] = useState(null)           // Current case info
  const [selectedSuspect, setSelectedSuspect] = useState(null) // Who player is interrogating
  const [histories, setHistories] = useState({})           // Chat history per suspect
  const [input, setInput] = useState('')                   // Current question input
  const [loading, setLoading] = useState(false)            // API loading state

  // Player tools
  const [notes, setNotes] = useState('')                   // Player's personal notes

  // Accusation state
  const [accuseMode, setAccuseMode] = useState(false)      // Show accusation modal
  const [accusedName, setAccusedName] = useState('')       // Who player accuses
  const [reasoning, setReasoning] = useState('')           // Player's reasoning

  // Results
  const [reveal, setReveal] = useState(null)               // Reveal result after accusation

  // Scoring
  const [questionCounts, setQuestionCounts] = useState({}) // Questions asked per suspect
  const [score, setScore] = useState(1000)                 // Live score (starts at 1000)

  const chatRef = useRef(null) // For auto-scrolling chat

  // Derived values
  const totalQuestions = Object.values(questionCounts).reduce((a, b) => a + b, 0)
  const questionsLeft = MAX_QUESTIONS - totalQuestions
  const rank = getRank(score)

  // Load case data on mount
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/cases`)
      .then(r => r.json())
      .then(cases => {
        const found = cases.find(c => c.id === Number(caseId))
        setCaseData(found)
        if (found) {
          // Initialize empty chat history for each suspect
          const init = {}
          found.suspectNames.forEach(n => init[n] = [])
          setHistories(init)
        }
      })
  }, [caseId])

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [histories, selectedSuspect])

  // Send a question to the selected suspect
  const sendQuestion = async () => {
    if (!input.trim() || !selectedSuspect || loading) return
    if (questionsLeft <= 0) return // Block if out of questions

    const q = input.trim()
    setInput('')
    setLoading(true)

    // Add player's question to chat history
    const newHistory = [...(histories[selectedSuspect] || []), { role: 'user', content: q }]
    setHistories(prev => ({ ...prev, [selectedSuspect]: newHistory }))

    // Increment question count and deduct 20 points per question
    setQuestionCounts(prev => ({ ...prev, [selectedSuspect]: (prev[selectedSuspect] || 0) + 1 }))
    setScore(prev => Math.max(prev - 20, 0))

    try {
      // Call backend to get AI suspect response
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/interrogate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: Number(caseId), suspectName: selectedSuspect, question: q, history: newHistory }),
      })
      const data = await res.json()

      // Add suspect's reply to chat history
      setHistories(prev => ({ ...prev, [selectedSuspect]: [...newHistory, { role: 'assistant', content: data.reply }] }))
    } catch {
      setHistories(prev => ({ ...prev, [selectedSuspect]: [...newHistory, { role: 'assistant', content: 'The suspect stares at you silently.' }] }))
    }
    setLoading(false)
  }

  // Submit final accusation
  const submitAccusation = async () => {
    if (!accusedName || !reasoning.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/accuse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: Number(caseId), accusedName, reasoning }),
      })
      const data = await res.json()

      // +200 for correct accusation, -200 for wrong
      const finalScore = data.correct ? Math.max(score + 200, 0) : Math.max(score - 200, 0)
      setScore(finalScore)
      setReveal({ ...data, finalScore })

      // If correct, ask for name and save to leaderboard
      if (data.correct) {
        const name = prompt('🎉 Case solved! Enter your name for the leaderboard:')
        if (name && name.trim()) {
          await fetch(`${import.meta.env.VITE_API_URL || ''}/api/leaderboard`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              player_name: name.trim(),
              case_id: Number(caseId),
              case_title: caseData.title,
              score: finalScore,
              questions_used: totalQuestions,
              solved: true,
            }),
          })
        }
      }
    } catch {
      setReveal({ correct: false, reveal: 'Something went wrong. Try again.' })
    }
    setLoading(false)
  }

  // Show loading state while case data fetches
  if (!caseData) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#6b6055' }}>Loading case file...</p>
    </div>
  )

  const currentHistory = selectedSuspect ? histories[selectedSuspect] || [] : []

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header bar ── */}
      <div style={{ background: '#0d0d0a', borderBottom: '1px solid #1a1a15', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#5a4535', cursor: 'pointer', fontSize: 14 }}>← Cases</button>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 15, fontWeight: 400, color: '#e8e0d0' }}>{caseData.title}</h1>
          <p style={{ fontSize: 11, color: '#4a3f35' }}>{caseData.setting}</p>
        </div>
        {/* Live score + questions tracker */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: questionsLeft <= 5 ? '#f87171' : '#4a3f35' }}>
              {questionsLeft} questions left
            </span>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: DIFF_COLOR[caseData.difficulty] + '22', color: DIFF_COLOR[caseData.difficulty] }}>{caseData.difficulty}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: rank.color }}>{rank.label}</span>
            <span style={{ fontSize: 13, color: '#8b7355', fontWeight: 500 }}>{score} pts</span>
          </div>
        </div>
      </div>

      {/* ── Warning bar when questions are low ── */}
      {questionsLeft <= 5 && questionsLeft > 0 && (
        <div style={{ background: '#1a0808', borderBottom: '1px solid #3a1515', padding: '6px 1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#f87171' }}>⚠️ Only {questionsLeft} questions remaining — choose wisely!</p>
        </div>
      )}
      {questionsLeft === 0 && (
        <div style={{ background: '#1a0808', borderBottom: '1px solid #3a1515', padding: '6px 1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#f87171' }}>🚨 No questions left — you must make your accusation now!</p>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', maxHeight: 'calc(100vh - 60px)' }}>

        {/* ── Left sidebar: suspects + notes ── */}
        <div style={{ width: 220, background: '#0d0d0a', borderRight: '1px solid #1a1a15', padding: '1rem', overflowY: 'auto', flexShrink: 0 }}>
          <p style={{ fontSize: 11, color: '#3a3530', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Suspects</p>

          {/* Suspect buttons */}
          {caseData.suspectNames.map((name, i) => {
            const colors = AVATAR_COLORS[i % AVATAR_COLORS.length]
            const initials = name.split(' ').map(w => w[0]).join('')
            const qCount = questionCounts[name] || 0
            return (
              <button key={name} onClick={() => setSelectedSuspect(name)} style={{ width: '100%', textAlign: 'left', background: selectedSuspect === name ? '#1a1a15' : 'none', border: selectedSuspect === name ? '1px solid #2a2520' : '1px solid transparent', borderRadius: 8, padding: '10px', cursor: 'pointer', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: colors.bg, color: colors.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, flexShrink: 0 }}>{initials}</div>
                  <div>
                    <p style={{ fontSize: 13, color: '#e8e0d0', marginBottom: 1 }}>{name}</p>
                    {qCount > 0 && <p style={{ fontSize: 11, color: '#4a3f35' }}>{qCount} questions</p>}
                  </div>
                </div>
              </button>
            )
          })}

          {/* Notes area */}
          <div style={{ borderTop: '1px solid #1a1a15', marginTop: 16, paddingTop: 16 }}>
            <p style={{ fontSize: 11, color: '#3a3530', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Your notes</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Jot down clues..." style={{ width: '100%', background: '#0a0a0f', border: '1px solid #1a1a15', borderRadius: 6, color: '#8b7355', fontSize: 12, padding: 8, resize: 'none', height: 100, fontFamily: 'Georgia, serif' }} />
          </div>

          {/* Accusation button */}
          <button onClick={() => setAccuseMode(true)} style={{ width: '100%', marginTop: 12, background: '#1a0a0a', border: '1px solid #3a1515', borderRadius: 8, padding: '10px', cursor: 'pointer', color: '#f87171', fontSize: 13 }}>
            Make an accusation
          </button>
        </div>

        {/* ── Main chat area ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedSuspect ? (
            // Placeholder when no suspect selected
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
              <p style={{ color: '#3a3530', fontSize: 16 }}>Select a suspect to begin interrogation</p>
              <p style={{ color: '#2a2520', fontSize: 13 }}>Victim: {caseData.victim} — {caseData.method}</p>
            </div>
          ) : (
            <>
              <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #1a1a15' }}>
                <p style={{ fontSize: 14, color: '#8b7355' }}>Interrogating: <span style={{ color: '#e8e0d0' }}>{selectedSuspect}</span></p>
              </div>

              {/* Chat messages */}
              <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                {currentHistory.length === 0 && (
                  <p style={{ color: '#3a3530', fontSize: 14, fontStyle: 'italic' }}>{selectedSuspect} sits across from you, waiting.</p>
                )}
                {currentHistory.map((msg, i) => (
                  <div key={i} style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: 11, color: msg.role === 'user' ? '#5a7a5a' : '#5a4535', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                      {msg.role === 'user' ? 'Detective Harlow' : selectedSuspect}
                    </p>
                    <p style={{ fontSize: 15, color: msg.role === 'user' ? '#a0c0a0' : '#e8e0d0', lineHeight: 1.7 }}>{msg.content}</p>
                  </div>
                ))}
                {/* Loading indicator */}
                {loading && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: 11, color: '#5a4535', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{selectedSuspect}</p>
                    <p style={{ fontSize: 15, color: '#4a3f35', fontStyle: 'italic' }}>thinking...</p>
                  </div>
                )}
              </div>

              {/* Question input */}
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #1a1a15', display: 'flex', gap: 8 }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendQuestion()}
                  placeholder={questionsLeft === 0 ? 'No questions left — make your accusation!' : `Ask ${selectedSuspect} something...`}
                  disabled={loading || questionsLeft === 0}
                  style={{ flex: 1, background: '#0d0d0a', border: '1px solid #2a2520', borderRadius: 8, color: questionsLeft === 0 ? '#3a3530' : '#e8e0d0', fontSize: 14, padding: '10px 14px', fontFamily: 'Georgia, serif' }}
                />
                <button onClick={sendQuestion} disabled={loading || !input.trim() || questionsLeft === 0} style={{ background: '#1a1a10', border: '1px solid #3a3525', borderRadius: 8, color: '#8b7355', fontSize: 14, padding: '10px 20px', cursor: 'pointer' }}>Ask</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Accusation modal ── */}
      {accuseMode && !reveal && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#0d0d0a', border: '1px solid #2a1515', borderRadius: 12, padding: '2rem', maxWidth: 480, width: '100%' }}>
            <h2 style={{ fontSize: 20, fontWeight: 400, color: '#e8e0d0', marginBottom: 4 }}>Make your accusation</h2>
            <p style={{ fontSize: 13, color: '#4a3f35', marginBottom: 20 }}>Current score: <span style={{ color: '#8b7355' }}>{score} pts</span> — Correct accusation adds 200pts</p>
            <p style={{ fontSize: 12, color: '#4a3f35', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Who did it?</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {caseData.suspectNames.map(name => (
                <button key={name} onClick={() => setAccusedName(name)} style={{ background: accusedName === name ? '#2a0a0a' : '#0a0a0f', border: accusedName === name ? '1px solid #f87171' : '1px solid #2a2520', borderRadius: 8, padding: '10px', cursor: 'pointer', color: accusedName === name ? '#f87171' : '#8b7355', fontSize: 13 }}>
                  {name}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 12, color: '#4a3f35', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Your reasoning</p>
            <textarea value={reasoning} onChange={e => setReasoning(e.target.value)} placeholder="What's the motive, method, and key clue that proves it?" style={{ width: '100%', background: '#0a0a0f', border: '1px solid #2a2520', borderRadius: 8, color: '#e8e0d0', fontSize: 13, padding: 12, resize: 'none', height: 80, fontFamily: 'Georgia, serif', marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setAccuseMode(false)} style={{ flex: 1, background: 'none', border: '1px solid #2a2520', borderRadius: 8, color: '#6b6055', fontSize: 14, padding: 12, cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitAccusation} disabled={!accusedName || !reasoning.trim() || loading} style={{ flex: 1, background: '#2a0a0a', border: '1px solid #f87171', borderRadius: 8, color: '#f87171', fontSize: 14, padding: 12, cursor: 'pointer' }}>
                {loading ? 'Revealing...' : 'Accuse'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reveal modal ── */}
      {reveal && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#0d0d0a', border: `1px solid ${reveal.correct ? '#4ade80' : '#f87171'}`, borderRadius: 12, padding: '2rem', maxWidth: 520, width: '100%', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: reveal.correct ? '#4ade80' : '#f87171', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
              {reveal.correct ? 'Case solved' : 'Wrong accusation'}
            </p>
            <p style={{ fontSize: 15, color: '#e8e0d0', lineHeight: 1.8, marginBottom: 20, fontStyle: 'italic' }}>{reveal.reveal}</p>

            {/* Score breakdown */}
            <div style={{ background: '#080808', border: '1px solid #1a1a15', borderRadius: 8, padding: '1rem', marginBottom: 20, textAlign: 'left' }}>
              <p style={{ fontSize: 12, color: '#3a3530', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Score breakdown</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#6b6055' }}>Starting score</span>
                <span style={{ fontSize: 13, color: '#8b7355' }}>1000</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#6b6055' }}>Questions used ({totalQuestions})</span>
                <span style={{ fontSize: 13, color: '#f87171' }}>-{totalQuestions * 20}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: '#6b6055' }}>Accusation</span>
                <span style={{ fontSize: 13, color: reveal.correct ? '#4ade80' : '#f87171' }}>{reveal.correct ? '+200' : '-200'}</span>
              </div>
              <div style={{ borderTop: '1px solid #2a2520', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: '#e8e0d0' }}>Final score</span>
                <span style={{ fontSize: 20, color: '#8b7355', fontFamily: 'Georgia, serif' }}>{reveal.finalScore}</span>
              </div>
              <p style={{ fontSize: 12, color: getRank(reveal.finalScore || 0).color, textAlign: 'right', marginTop: 4 }}>
                {getRank(reveal.finalScore || 0).label}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={() => navigate('/')} style={{ background: 'none', border: '1px solid #2a2520', borderRadius: 8, color: '#8b7355', fontSize: 14, padding: '10px 24px', cursor: 'pointer' }}>Back to cases</button>
              <button onClick={() => { setReveal(null); setAccuseMode(false); setAccusedName(''); setReasoning(''); }} style={{ background: '#0a1a0a', border: '1px solid #4ade80', borderRadius: 8, color: '#4ade80', fontSize: 14, padding: '10px 24px', cursor: 'pointer' }}>Keep investigating</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}