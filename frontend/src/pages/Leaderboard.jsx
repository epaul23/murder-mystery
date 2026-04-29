import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Leaderboard() {
  const [scores, setScores] = useState([])
  const [caseId, setCaseId] = useState(1)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/leaderboard/${caseId}`)
      .then(r => r.json())
      .then(data => { setScores(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [caseId])

  const CASES = [
    { id: 1, title: 'Blackwood Manor' },
    { id: 2, title: 'Orient Express' },
    { id: 3, title: 'Silicon Valley' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#050508', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '3rem 0 2rem' }}>
          <p style={{ color: '#5a4535', letterSpacing: 6, fontSize: 11, textTransform: 'uppercase', marginBottom: 12 }}>Hall of Fame</p>
          <h1 style={{ fontSize: 36, color: '#e8e0d0', fontWeight: 400, fontFamily: 'Georgia, serif', marginBottom: 8 }}>Leaderboard</h1>
          <p style={{ color: '#3a3530', fontSize: 13 }}>Top detectives ranked by score</p>
        </div>

        {/* Case selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, justifyContent: 'center' }}>
          {CASES.map(c => (
            <button key={c.id} onClick={() => setCaseId(c.id)} style={{
              background: caseId === c.id ? '#1a1510' : 'none',
              border: `1px solid ${caseId === c.id ? '#8b7355' : '#1a1510'}`,
              borderRadius: 6, padding: '8px 16px', cursor: 'pointer',
              color: caseId === c.id ? '#8b7355' : '#3a3530', fontSize: 12,
            }}>{c.title}</button>
          ))}
        </div>

        {/* Scores */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#3a3530', letterSpacing: 2, fontSize: 12 }}>LOADING...</p>
        ) : scores.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#2a2520', fontSize: 14, marginTop: 40 }}>No scores yet. Be the first to solve this case!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {scores.map((s, i) => (
              <div key={s.id} style={{
                background: '#080808', border: `1px solid ${i === 0 ? '#3a3020' : '#111'}`,
                borderRadius: 6, padding: '1rem 1.5rem',
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <span style={{ fontSize: 20, color: i === 0 ? '#facc15' : i === 1 ? '#9ca3af' : i === 2 ? '#b45309' : '#2a2520', fontFamily: 'Georgia, serif', width: 32 }}>
                  {i === 0 ? '①' : i === 1 ? '②' : i === 2 ? '③' : `${i + 1}.`}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, color: '#e8e0d0', marginBottom: 2 }}>{s.player_name}</p>
                  <p style={{ fontSize: 12, color: '#3a3530' }}>{s.questions_used} questions asked</p>
                </div>
                <span style={{ fontSize: 20, color: '#8b7355', fontFamily: 'Georgia, serif' }}>{s.score}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 32 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: '1px solid #1a1510', borderRadius: 6, color: '#5a4535', fontSize: 13, padding: '10px 24px', cursor: 'pointer' }}>
            ← Back to cases
          </button>
        </div>
      </div>
    </div>
  )
}