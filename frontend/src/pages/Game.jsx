import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const DIFF_COLOR = { easy: '#4ade80', medium: '#facc15', hard: '#f87171' }
const AVATAR_COLORS = [
  { bg: '#2a1a3a', text: '#9f7aea' },
  { bg: '#0f2a1a', text: '#4ade80' },
  { bg: '#2a1a0a', text: '#facc15' },
  { bg: '#2a0a0a', text: '#f87171' },
]

export default function Game() {
  const { caseId } = useParams()
  const navigate = useNavigate()
  const [caseData, setCaseData] = useState(null)
  const [selectedSuspect, setSelectedSuspect] = useState(null)
  const [histories, setHistories] = useState({})
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [accuseMode, setAccuseMode] = useState(false)
  const [accusedName, setAccusedName] = useState('')
  const [reasoning, setReasoning] = useState('')
  const [reveal, setReveal] = useState(null)
  const [questionCounts, setQuestionCounts] = useState({})
  const chatRef = useRef(null)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/cases`)
      .then(r => r.json())
      .then(cases => {
        const found = cases.find(c => c.id === Number(caseId))
        setCaseData(found)
        if (found) {
          const init = {}
          found.suspectNames.forEach(n => init[n] = [])
          setHistories(init)
        }
      })
  }, [caseId])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [histories, selectedSuspect])

  const sendQuestion = async () => {
    if (!input.trim() || !selectedSuspect || loading) return
    const q = input.trim()
    setInput('')
    setLoading(true)
    const newHistory = [...(histories[selectedSuspect] || []), { role: 'user', content: q }]
    setHistories(prev => ({ ...prev, [selectedSuspect]: newHistory }))
    setQuestionCounts(prev => ({ ...prev, [selectedSuspect]: (prev[selectedSuspect] || 0) + 1 }))
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/interrogate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: Number(caseId), suspectName: selectedSuspect, question: q, history: newHistory }),
      })
      const data = await res.json()
      setHistories(prev => ({ ...prev, [selectedSuspect]: [...newHistory, { role: 'assistant', content: data.reply }] }))
    } catch {
      setHistories(prev => ({ ...prev, [selectedSuspect]: [...newHistory, { role: 'assistant', content: 'The suspect stares at you silently.' }] }))
    }
    setLoading(false)
  }

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
      setReveal(data)

      // Calculate score
      const score = data.correct
        ? Math.max(1000 - (totalQuestions * 30), 100)
        : 0

      // Ask for name and save to leaderboard
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
              score,
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

  if (!caseData) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#6b6055' }}>Loading case file...</p>
    </div>
  )

  const currentHistory = selectedSuspect ? histories[selectedSuspect] || [] : []
  const totalQuestions = Object.values(questionCounts).reduce((a, b) => a + b, 0)

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#0d0d0a', borderBottom: '1px solid #1a1a15', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#5a4535', cursor: 'pointer', fontSize: 14 }}>← Cases</button>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 16, fontWeight: 400, color: '#e8e0d0' }}>{caseData.title}</h1>
          <p style={{ fontSize: 12, color: '#4a3f35' }}>{caseData.setting}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#4a3f35' }}>{totalQuestions} questions</span>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: DIFF_COLOR[caseData.difficulty] + '22', color: DIFF_COLOR[caseData.difficulty] }}>{caseData.difficulty}</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', maxHeight: 'calc(100vh - 60px)' }}>
        <div style={{ width: 220, background: '#0d0d0a', borderRight: '1px solid #1a1a15', padding: '1rem', overflowY: 'auto', flexShrink: 0 }}>
          <p style={{ fontSize: 11, color: '#3a3530', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Suspects</p>
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
          <div style={{ borderTop: '1px solid #1a1a15', marginTop: 16, paddingTop: 16 }}>
            <p style={{ fontSize: 11, color: '#3a3530', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Your notes</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Jot down clues..." style={{ width: '100%', background: '#0a0a0f', border: '1px solid #1a1a15', borderRadius: 6, color: '#8b7355', fontSize: 12, padding: 8, resize: 'none', height: 120, fontFamily: 'Georgia, serif' }} />
          </div>
          <button onClick={() => setAccuseMode(true)} style={{ width: '100%', marginTop: 12, background: '#1a0a0a', border: '1px solid #3a1515', borderRadius: 8, padding: '10px', cursor: 'pointer', color: '#f87171', fontSize: 13 }}>
            Make an accusation
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedSuspect ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
              <p style={{ color: '#3a3530', fontSize: 16 }}>Select a suspect to begin interrogation</p>
              <p style={{ color: '#2a2520', fontSize: 13 }}>Victim: {caseData.victim} — {caseData.method}</p>
            </div>
          ) : (
            <>
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #1a1a15' }}>
                <p style={{ fontSize: 14, color: '#8b7355' }}>Interrogating: <span style={{ color: '#e8e0d0' }}>{selectedSuspect}</span></p>
              </div>
              <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                {currentHistory.length === 0 && (
                  <p style={{ color: '#3a3530', fontSize: 14, fontStyle: 'italic' }}>{selectedSuspect} sits across from you, waiting. Ask your first question.</p>
                )}
                {currentHistory.map((msg, i) => (
                  <div key={i} style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: 11, color: msg.role === 'user' ? '#5a7a5a' : '#5a4535', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                      {msg.role === 'user' ? 'Detective Harlow' : selectedSuspect}
                    </p>
                    <p style={{ fontSize: 15, color: msg.role === 'user' ? '#a0c0a0' : '#e8e0d0', lineHeight: 1.7 }}>{msg.content}</p>
                  </div>
                ))}
                {loading && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: 11, color: '#5a4535', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{selectedSuspect}</p>
                    <p style={{ fontSize: 15, color: '#4a3f35', fontStyle: 'italic' }}>thinking...</p>
                  </div>
                )}
              </div>
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #1a1a15', display: 'flex', gap: 8 }}>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendQuestion()} placeholder={`Ask ${selectedSuspect} something...`} disabled={loading} style={{ flex: 1, background: '#0d0d0a', border: '1px solid #2a2520', borderRadius: 8, color: '#e8e0d0', fontSize: 14, padding: '10px 14px', fontFamily: 'Georgia, serif' }} />
                <button onClick={sendQuestion} disabled={loading || !input.trim()} style={{ background: '#1a1a10', border: '1px solid #3a3525', borderRadius: 8, color: '#8b7355', fontSize: 14, padding: '10px 20px', cursor: 'pointer' }}>Ask</button>
              </div>
            </>
          )}
        </div>
      </div>

      {accuseMode && !reveal && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#0d0d0a', border: '1px solid #2a1515', borderRadius: 12, padding: '2rem', maxWidth: 480, width: '100%' }}>
            <h2 style={{ fontSize: 20, fontWeight: 400, color: '#e8e0d0', marginBottom: 8 }}>Make your accusation</h2>
            <p style={{ fontSize: 14, color: '#6b6055', marginBottom: 24 }}>Choose carefully. You only get one shot.</p>
            <p style={{ fontSize: 12, color: '#4a3f35', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Who did it?</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
              {caseData.suspectNames.map(name => (
                <button key={name} onClick={() => setAccusedName(name)} style={{ background: accusedName === name ? '#2a0a0a' : '#0a0a0f', border: accusedName === name ? '1px solid #f87171' : '1px solid #2a2520', borderRadius: 8, padding: '10px', cursor: 'pointer', color: accusedName === name ? '#f87171' : '#8b7355', fontSize: 13 }}>
                  {name}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 12, color: '#4a3f35', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Your reasoning</p>
            <textarea value={reasoning} onChange={e => setReasoning(e.target.value)} placeholder="Why do you think this person is the killer?" style={{ width: '100%', background: '#0a0a0f', border: '1px solid #2a2520', borderRadius: 8, color: '#e8e0d0', fontSize: 13, padding: 12, resize: 'none', height: 80, fontFamily: 'Georgia, serif', marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setAccuseMode(false)} style={{ flex: 1, background: 'none', border: '1px solid #2a2520', borderRadius: 8, color: '#6b6055', fontSize: 14, padding: 12, cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitAccusation} disabled={!accusedName || !reasoning.trim() || loading} style={{ flex: 1, background: '#2a0a0a', border: '1px solid #f87171', borderRadius: 8, color: '#f87171', fontSize: 14, padding: 12, cursor: 'pointer' }}>
                {loading ? 'Revealing...' : 'Accuse'}
              </button>
            </div>
          </div>
        </div>
      )}

      {reveal && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#0d0d0a', border: `1px solid ${reveal.correct ? '#4ade80' : '#f87171'}`, borderRadius: 12, padding: '2rem', maxWidth: 520, width: '100%', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: reveal.correct ? '#4ade80' : '#f87171', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
              {reveal.correct ? 'Case solved' : 'Wrong accusation'}
            </p>
            <p style={{ fontSize: 15, color: '#e8e0d0', lineHeight: 1.8, marginBottom: 24, fontStyle: 'italic' }}>{reveal.reveal}</p>
            <p style={{ fontSize: 13, color: '#4a3f35', marginBottom: 20 }}>Questions asked: {totalQuestions}</p>
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