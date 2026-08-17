import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CaseBriefing from '../components/CaseBriefing.jsx'

// Difficulty badge colors
const DIFF_COLOR = { easy: '#4ade80', medium: '#facc15', hard: '#f87171' }

// Max questions allowed per case
const MAX_QUESTIONS = 20

async function requestJson(url, options) {
  const response = await fetch(url, options)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Request failed')
  return data
}

// Avatar colors for each suspect
const AVATAR_COLORS = [
  { bg: '#2a1a3a', text: '#9f7aea' },
  { bg: '#0f2a1a', text: '#4ade80' },
  { bg: '#2a1a0a', text: '#facc15' },
  { bg: '#2a0a0a', text: '#f87171' },
]

// Background image per case
const CASE_BG = {
  1: '/cases/case1/interrogation-moonlit.png',
  2: '/cases/case2/train.png',
  3: '/cases/case3/office.png',
}

const CASE_VICTIM_IMAGE = {
  1: '/cases/case1/victim.png',
  2: '/cases/case2/train.png',
  3: '/cases/case3/office.png',
}

export default function Game() {
  const { caseId } = useParams()
  const navigate = useNavigate()

  // Core game state
  const [caseData, setCaseData] = useState(null)
  const [selectedSuspect, setSelectedSuspect] = useState(null)
  const [histories, setHistories] = useState({})
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')

  // Show briefing before game starts
  const [showBriefing, setShowBriefing] = useState(true)

  // Player tools
  const [notes, setNotes] = useState('')

  // Accusation state
  const [accuseMode, setAccuseMode] = useState(false)
  const [accusedName, setAccusedName] = useState('')
  const [reasoning, setReasoning] = useState('')

  // Results
  const [reveal, setReveal] = useState(null)
  const [playerName, setPlayerName] = useState('')
  const [saveStatus, setSaveStatus] = useState('idle')
  const [saveMessage, setSaveMessage] = useState('')

  // Scoring
  const [questionCounts, setQuestionCounts] = useState({})

  const chatRef = useRef(null)

  // Derived values
  const totalQuestions = Object.values(questionCounts).reduce((a, b) => a + b, 0)
  const questionsLeft = MAX_QUESTIONS - totalQuestions

  // Load case data on mount
  useEffect(() => {
    setLoadError('')
    requestJson(`${import.meta.env.VITE_API_URL || ''}/api/cases`)
      .then(cases => {
        const found = cases.find(c => c.id === Number(caseId))
        if (!found) throw new Error('Case not found')
        setCaseData(found)
        if (found) {
          const init = {}
          found.suspectNames.forEach(n => init[n] = [])
          setHistories(init)
        }
      })
      .catch(error => setLoadError(error.message || 'Could not load this case'))
  }, [caseId])

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [histories, selectedSuspect])

  // Send a question to the selected suspect
  const sendQuestion = async () => {
    if (!input.trim() || !selectedSuspect || loading) return
    if (questionsLeft <= 0) return

    const q = input.trim()
    setInput('')
    setLoading(true)

    const previousHistory = histories[selectedSuspect] || []
    const previousReplies = previousHistory
      .filter(message => message.role === 'assistant' && typeof message.content === 'string')
      .slice(-4)
      .map(message => message.content)
    const suspectTurn = (questionCounts[selectedSuspect] || 0) + 1
    const newHistory = [...previousHistory, { role: 'user', content: q }]
    setHistories(prev => ({ ...prev, [selectedSuspect]: newHistory }))
    setQuestionCounts(prev => ({ ...prev, [selectedSuspect]: (prev[selectedSuspect] || 0) + 1 }))

    try {
      const data = await requestJson(`${import.meta.env.VITE_API_URL || ''}/api/interrogate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: Number(caseId),
          suspectName: selectedSuspect,
          question: q,
          suspectTurn,
          previousReplies,
        }),
      })
      if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('The suspect did not answer. Try again.')
      setHistories(prev => ({ ...prev, [selectedSuspect]: [...newHistory, { role: 'assistant', content: data.reply }] }))
    } catch (error) {
      setHistories(prev => ({ ...prev, [selectedSuspect]: [...newHistory, { role: 'assistant', content: error.message || 'The interrogation could not continue. Try again.' }] }))
      setQuestionCounts(prev => ({ ...prev, [selectedSuspect]: Math.max((prev[selectedSuspect] || 1) - 1, 0) }))
    }
    setLoading(false)
  }

  // Submit final accusation
  const submitAccusation = async () => {
    if (!accusedName || reasoning.trim().length < 20) return
    setSaveMessage('')
    setLoading(true)
    try {
      const data = await requestJson(`${import.meta.env.VITE_API_URL || ''}/api/accuse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: Number(caseId), accusedName, reasoning, questionsUsed: totalQuestions }),
      })
      if (typeof data.correct !== 'boolean' || typeof data.reveal !== 'string' || !Number.isInteger(data.finalScore)) throw new Error('The case result was incomplete. Try again.')
      setReveal(data)
    } catch (error) {
      setSaveMessage(error.message || 'Something went wrong. Try again.')
    }
    setLoading(false)
  }

  const saveScore = async () => {
    if (!reveal?.correct || !playerName.trim() || saveStatus === 'saving') return
    setSaveStatus('saving')
    setSaveMessage('')
    try {
      await requestJson(`${import.meta.env.VITE_API_URL || ''}/api/leaderboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_name: playerName.trim(),
          case_id: Number(caseId),
          case_title: caseData.title,
          score: reveal.finalScore,
          questions_used: totalQuestions,
          evidence_score: reveal.evidenceScore,
          solved: true,
        }),
      })
      setSaveStatus('saved')
      setSaveMessage('Score saved to the leaderboard.')
    } catch (error) {
      setSaveStatus('error')
      setSaveMessage(error.message || 'Could not save your score.')
    }
  }

  // Loading state
  if (!caseData) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {loadError ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#f87171', marginBottom: 16 }}>{loadError}</p>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: '1px solid #2a2520', color: '#8b7355', padding: '10px 18px', cursor: 'pointer' }}>Back to cases</button>
        </div>
      ) : <p style={{ color: '#6b6055' }}>Loading case file...</p>}
    </div>
  )

  // Show case briefing before game starts
  if (showBriefing) return (
    <CaseBriefing
      caseId={Number(caseId)}
      caseData={caseData}
      onStart={() => setShowBriefing(false)}
    />
  )

  const currentHistory = selectedSuspect ? histories[selectedSuspect] || [] : []
  const bg = CASE_BG[Number(caseId)] || CASE_BG[1]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* ── Background image ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }} />

      {/* ── Dark overlay ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1,
        background: Number(caseId) === 1 ? 'rgba(4,7,10,0.42)' : 'rgba(0,0,0,0.87)',
      }} />

      {/* ── All UI content above overlay ── */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100vh' }}>

        {/* ── Header bar ── */}
        <div className="game-header" style={{ background: 'rgba(10,10,8,0.95)', borderBottom: '1px solid #1a1a15', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#5a4535', cursor: 'pointer', fontSize: 14 }}>← Cases</button>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 15, fontWeight: 400, color: '#e8e0d0' }}>{caseData.title}</h1>
            <p style={{ fontSize: 11, color: '#4a3f35' }}>{caseData.setting}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: questionsLeft <= 5 ? '#f87171' : '#4a3f35' }}>
                {questionsLeft} questions left
              </span>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: DIFF_COLOR[caseData.difficulty] + '22', color: DIFF_COLOR[caseData.difficulty] }}>{caseData.difficulty}</span>
            </div>
          </div>
        </div>

        {/* ── Warning bars ── */}
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

        {/* ── Crime scene banner ── */}
        <div className="crime-banner" style={{
          background: 'rgba(13,10,8,0.92)', borderBottom: '1px solid #1a1a15',
          padding: '1.25rem 2rem', display: 'flex', alignItems: 'center',
          gap: '2rem', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse at 0% 50%, rgba(139,115,85,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />

          {/* Victim photo */}
          <div style={{
            width: 64, height: 64, borderRadius: 4, flexShrink: 0,
            backgroundImage: `url(${CASE_VICTIM_IMAGE[Number(caseId)] || bg})`,
            backgroundSize: 'cover', backgroundPosition: 'center top',
            border: '1px solid #2a2520',
          }} />

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: '#5a4535', letterSpacing: 3, textTransform: 'uppercase' }}>Active case</span>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#f87171', display: 'inline-block', boxShadow: '0 0 6px #f87171' }} />
            </div>
            <p style={{ fontSize: 17, color: '#e8e0d0', fontFamily: 'Georgia, serif', marginBottom: 3 }}>
              Victim: <span style={{ color: '#c8b090' }}>{caseData.victim}</span>
            </p>
            <p style={{ fontSize: 12, color: '#4a3f35' }}>{caseData.method}</p>
          </div>

          <div style={{ border: '2px solid #3a1515', borderRadius: 4, padding: '4px 12px', transform: 'rotate(-8deg)', flexShrink: 0 }}>
            <p style={{ fontSize: 11, color: '#5a2525', letterSpacing: 4, textTransform: 'uppercase', fontWeight: 700 }}>Classified</p>
          </div>
        </div>

        {/* ── Main content area ── */}
        <div className="game-main" style={{ flex: 1, display: 'flex', overflow: 'hidden', maxHeight: 'calc(100vh - 180px)' }}>

          {/* ── Left sidebar ── */}
          <div className="suspect-sidebar" style={{ width: 220, background: 'rgba(13,13,10,0.95)', borderRight: '1px solid #1a1a15', padding: '1rem', overflowY: 'auto', flexShrink: 0 }}>
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

            {/* Notes */}
            <div style={{ borderTop: '1px solid #1a1a15', marginTop: 16, paddingTop: 16 }}>
              <p style={{ fontSize: 11, color: '#3a3530', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Your notes</p>
              <textarea value={notes} maxLength={2000} onChange={e => setNotes(e.target.value)} placeholder="Jot down clues..." style={{ width: '100%', background: '#0a0a0f', border: '1px solid #1a1a15', borderRadius: 6, color: '#8b7355', fontSize: 12, padding: 8, resize: 'none', height: 100, fontFamily: 'Georgia, serif' }} />
            </div>

            {/* Accusation button */}
            <button onClick={() => setAccuseMode(true)} style={{ width: '100%', marginTop: 12, background: '#1a0a0a', border: '1px solid #3a1515', borderRadius: 8, padding: '10px', cursor: 'pointer', color: '#f87171', fontSize: 13 }}>
              Make an accusation
            </button>
          </div>

          {/* ── Chat area ── */}
          <div className="chat-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {!selectedSuspect ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                <p style={{ color: '#3a3530', fontSize: 16 }}>Select a suspect to begin interrogation</p>
                <p style={{ color: '#2a2520', fontSize: 13 }}>Victim: {caseData.victim} — {caseData.method}</p>
              </div>
            ) : (
              <>
                <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #1a1a15', background: 'rgba(10,10,8,0.5)' }}>
                  <p style={{ fontSize: 14, color: '#8b7355' }}>Interrogating: <span style={{ color: '#e8e0d0' }}>{selectedSuspect}</span></p>
                </div>

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
                  {loading && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <p style={{ fontSize: 11, color: '#5a4535', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{selectedSuspect}</p>
                      <p style={{ fontSize: 15, color: '#4a3f35', fontStyle: 'italic' }}>thinking...</p>
                    </div>
                  )}
                </div>

                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #1a1a15', display: 'flex', gap: 8, background: 'rgba(10,10,8,0.7)' }}>
                  <input
                    value={input}
                    maxLength={500}
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
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflowY: 'auto', zIndex: 50 }}>
            <div style={{ background: '#0d0d0a', border: '1px solid #2a1515', borderRadius: 12, padding: '2rem', maxWidth: 500, width: '100%', margin: 'auto' }}>
              <h2 style={{ fontSize: 20, fontWeight: 400, color: '#e8e0d0', marginBottom: 4 }}>Make your accusation</h2>
              <p style={{ fontSize: 13, color: '#4a3f35', marginBottom: 20 }}>Earn points for the correct killer, strong evidence, and an efficient investigation.</p>

              <p style={{ fontSize: 11, color: '#4a3f35', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Who killed them?</p>
              <div className="accusation-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                {caseData.suspectNames.map(name => (
                  <button key={name} onClick={() => setAccusedName(name)} style={{ background: accusedName === name ? '#2a0a0a' : '#0a0a0f', border: accusedName === name ? '1px solid #f87171' : '1px solid #2a2520', borderRadius: 8, padding: '10px', cursor: 'pointer', color: accusedName === name ? '#f87171' : '#8b7355', fontSize: 13 }}>
                    {name}
                  </button>
                ))}
              </div>

              <p style={{ fontSize: 11, color: '#4a3f35', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Explain the evidence</p>
              <textarea value={reasoning} maxLength={1000} onChange={e => setReasoning(e.target.value)} placeholder="Connect the timeline, opportunity, motive, or contradictions that prove your accusation..." style={{ width: '100%', background: '#0a0a0f', border: '1px solid #2a2520', borderRadius: 8, color: '#e8e0d0', fontSize: 13, padding: 12, resize: 'none', height: 100, fontFamily: 'Georgia, serif', marginBottom: 6 }} />
              <p style={{ fontSize: 11, color: reasoning.trim().length >= 20 ? '#4a6a4a' : '#4a3f35', marginBottom: 16 }}>{reasoning.trim().length} / 20 minimum characters</p>

              {saveMessage && !reveal && <p role="alert" style={{ color: '#f87171', fontSize: 12, marginBottom: 12 }}>{saveMessage}</p>}

              <div className="modal-actions" style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setAccuseMode(false)} style={{ flex: 1, background: 'none', border: '1px solid #2a2520', borderRadius: 8, color: '#6b6055', fontSize: 14, padding: 12, cursor: 'pointer' }}>Cancel</button>
                <button onClick={submitAccusation} disabled={!accusedName || reasoning.trim().length < 20 || loading} style={{ flex: 1, background: '#2a0a0a', border: '1px solid #f87171', borderRadius: 8, color: '#f87171', fontSize: 14, padding: 12, cursor: 'pointer', opacity: (!accusedName || reasoning.trim().length < 20) ? 0.4 : 1 }}>
                  {loading ? 'Revealing...' : 'Accuse'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Reveal modal ── */}
        {reveal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 50, overflowY: 'auto' }}>
            <div style={{ background: '#0d0d0a', border: `1px solid ${reveal.correct ? '#4ade80' : '#f87171'}`, borderRadius: 12, padding: '2rem', maxWidth: 520, width: '100%', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: reveal.correct ? '#4ade80' : '#f87171', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
                {reveal.correct ? 'Case solved' : 'Wrong accusation'}
              </p>
              <p style={{ fontSize: 15, color: '#e8e0d0', lineHeight: 1.8, marginBottom: 20, fontStyle: 'italic' }}>{reveal.reveal}</p>

              {/* Score breakdown */}
              <div style={{ background: '#080808', border: '1px solid #1a1a15', borderRadius: 8, padding: '1rem', marginBottom: 20, textAlign: 'left' }}>
                <p style={{ fontSize: 12, color: '#3a3530', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Case rating</p>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: '#6b6055' }}>Questions used</span>
                    <span style={{ fontSize: 13, color: '#8b7355' }}>{totalQuestions} / {MAX_QUESTIONS}</span>
                  </div>
                  <div style={{ height: 4, background: '#1a1a15', borderRadius: 2 }}>
                    <div style={{ height: 4, borderRadius: 2, width: `${(totalQuestions / MAX_QUESTIONS) * 100}%`, background: totalQuestions <= 10 ? '#4ade80' : totalQuestions <= 15 ? '#facc15' : '#f87171', transition: 'width 0.5s' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#6b6055' }}>Correct killer</span>
                  <span style={{ fontSize: 13, color: reveal.correct ? '#4ade80' : '#f87171' }}>{reveal.killerScore} / 300</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#6b6055' }}>Evidence</span>
                  <span style={{ fontSize: 13, color: reveal.correct ? '#4ade80' : '#6b6055' }}>{reveal.evidenceScore} / 600</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: '#6b6055' }}>Efficiency</span>
                  <span style={{ fontSize: 13, color: reveal.correct ? '#4ade80' : '#6b6055' }}>{reveal.efficiencyScore} / 100</span>
                </div>

                {reveal.correct && Array.isArray(reveal.evidenceFound) && (
                  <div style={{ background: '#0a0a0f', border: '1px solid #1a1a15', borderRadius: 6, padding: '10px 12px', marginBottom: 12 }}>
                    <p style={{ fontSize: 12, color: '#4ade80', marginBottom: 6 }}>Evidence recognized: {reveal.evidenceScore} / 600</p>
                    <p style={{ fontSize: 12, color: '#6b6055', lineHeight: 1.6 }}>{reveal.evidenceFound.length ? reveal.evidenceFound.join(' · ') : 'Correct killer, but the explanation did not connect a key clue.'}</p>
                  </div>
                )}

                <div style={{ borderTop: '1px solid #2a2520', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 14, color: '#e8e0d0' }}>Final score</span>
                  <span style={{ fontSize: 24, color: '#8b7355', fontFamily: 'Georgia, serif' }}>{reveal.finalScore} / 1000</span>
                </div>

                <div style={{ background: '#0a0a0f', border: '1px solid #1a1a15', borderRadius: 6, padding: '10px 12px' }}>
                  <p style={{ fontSize: 12, color: '#4a3f35', marginBottom: 4 }}>💡 Detective's note</p>
                  <p style={{ fontSize: 12, color: '#6b6055', lineHeight: 1.6 }}>
                    {reveal.correct && reveal.evidenceScore >= 450 && 'Strong case. You identified the killer and connected the important evidence.'}
                    {reveal.correct && reveal.evidenceScore < 450 && 'You found the killer. Connect more of the timeline, opportunity, and motive to improve your score.'}
                    {!reveal.correct && 'Wrong accusation. The real killer left clues — look for contradictions in their timeline and alibi.'}
                  </p>
                </div>
              </div>

              {reveal.correct && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ color: '#6b6055', fontSize: 12, marginBottom: 8 }}>Add your result to the leaderboard</p>
                  <div className="modal-actions" style={{ display: 'flex', gap: 8 }}>
                    <input
                      aria-label="Detective name"
                      value={playerName}
                      onChange={event => setPlayerName(event.target.value.slice(0, 30))}
                      onKeyDown={event => event.key === 'Enter' && saveScore()}
                      placeholder="Detective name"
                      disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                      style={{ flex: 1, minWidth: 0, background: '#080808', border: '1px solid #2a2520', borderRadius: 8, color: '#e8e0d0', padding: '10px 12px' }}
                    />
                    <button onClick={saveScore} disabled={!playerName.trim() || saveStatus === 'saving' || saveStatus === 'saved'} style={{ background: '#0a1a0a', border: '1px solid #4ade80', borderRadius: 8, color: '#4ade80', padding: '10px 16px', cursor: 'pointer', opacity: !playerName.trim() || saveStatus === 'saving' || saveStatus === 'saved' ? 0.5 : 1 }}>
                      {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save score'}
                    </button>
                  </div>
                  {saveMessage && <p role="status" style={{ color: saveStatus === 'saved' ? '#4ade80' : '#f87171', fontSize: 12, marginTop: 8 }}>{saveMessage}</p>}
                </div>
              )}

              <div className="modal-actions" style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button onClick={() => navigate('/')} style={{ background: 'none', border: '1px solid #2a2520', borderRadius: 8, color: '#8b7355', fontSize: 14, padding: '10px 24px', cursor: 'pointer' }}>Back to cases</button>
                <button onClick={() => navigate('/leaderboard')} style={{ background: '#0a1a0a', border: '1px solid #4ade80', borderRadius: 8, color: '#4ade80', fontSize: 14, padding: '10px 24px', cursor: 'pointer' }}>View leaderboard</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
