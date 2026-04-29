import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const DIFF_COLOR = { easy: '#4ade80', medium: '#facc15', hard: '#f87171' }

export default function CaseSelect() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/cases`)
      .then(r => r.json())
      .then(data => { setCases(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <p style={{ color: '#8b7355', letterSpacing: 4, fontSize: 12, textTransform: 'uppercase', marginBottom: 12 }}>Detective Agency</p>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#e8e0d0', fontWeight: 400, marginBottom: 12 }}>Murder Mystery</h1>
          <p style={{ color: '#6b6055', fontSize: 16 }}>By: EMIL PAUL</p>
          <p style={{ color: '#6b6055', fontSize: 16 }}>Choose a case. Interrogate suspects. Find the killer.</p>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#6b6055' }}>Loading cases...</p>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {cases.map((c, i) => (
              <div
                key={c.id}
                onClick={() => navigate(`/case/${c.id}`)}
                style={{
                  background: '#12120f', border: '1px solid #2a2520', borderRadius: 12,
                  padding: '1.5rem 2rem', cursor: 'pointer', transition: 'border-color 0.2s',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#5a4535'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2520'}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span style={{ color: '#5a4535', fontSize: 13 }}>Case {String(i + 1).padStart(2, '0')}</span>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 20,
                      background: DIFF_COLOR[c.difficulty] + '22', color: DIFF_COLOR[c.difficulty],
                      textTransform: 'uppercase', letterSpacing: 1,
                    }}>{c.difficulty}</span>
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 400, color: '#e8e0d0', marginBottom: 6 }}>{c.title}</h2>
                  <p style={{ fontSize: 14, color: '#6b6055', marginBottom: 4 }}>{c.setting}</p>
                  <p style={{ fontSize: 13, color: '#4a3f35' }}>Victim: {c.victim} — {c.method}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 12, color: '#4a3f35', marginBottom: 4 }}>{c.suspectNames.length} suspects</p>
                  <span style={{ fontSize: 20, color: '#5a4535' }}>→</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <p style={{ textAlign: 'center', color: '#3a3530', fontSize: 13, marginTop: '3rem' }}>
          Powered by Groq AI — Every suspect is a real AI
        </p>
      </div>
    </div>
  )
}