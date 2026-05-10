import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const DIFF_COLOR = { easy: '#4ade80', medium: '#facc15', hard: '#f87171' }

// Case thumbnail images — add yours here
const CASE_IMAGES = {
  1: '/cases/case1/manor.png',
  2: '/cases/case2/train.png',   // add your train image here
  3: '/cases/case3/office.png',  // add your office image here
}

// Intro animation — plays once per session
function Intro({ onDone }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 3200),
      setTimeout(() => setPhase(4), 4500),
      setTimeout(() => onDone(), 5500),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div style={{
      minHeight: '100vh', background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 24,
      transition: 'opacity 1s', opacity: phase === 4 ? 0 : 1,
    }}>
      <p style={{
        fontSize: 13, letterSpacing: 8, color: '#5a4535',
        textTransform: 'uppercase',
        opacity: phase >= 1 ? 1 : 0, transition: 'opacity 1.2s',
      }}>Detective Agency</p>
      <h1 style={{
        fontSize: 'clamp(3rem, 10vw, 6rem)', color: '#e8e0d0',
        fontWeight: 400, fontFamily: 'Georgia, serif', margin: 0,
        opacity: phase >= 2 ? 1 : 0, transition: 'opacity 1.2s',
        textShadow: '0 0 80px rgba(139, 115, 85, 0.3)',
      }}>Suspect Zero</h1>
      <p style={{
        fontSize: 14, color: '#3a3530', letterSpacing: 3,
        opacity: phase >= 3 ? 1 : 0, transition: 'opacity 1.2s',
      }}>The truth is never what it seems</p>
    </div>
  )
}

export default function CaseSelect() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem('introSeen'))
  const [hoveredId, setHoveredId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/cases`)
      .then(r => r.json())
      .then(data => { setCases(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (showIntro) return (
    <Intro onDone={() => {
      sessionStorage.setItem('introSeen', '1')
      setShowIntro(false)
    }} />
  )

  return (
    <div style={{
      minHeight: '100vh',
      // ── Background image — replace bg.png with your detective desk image
      backgroundImage: 'url(/cases/bg.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      position: 'relative',
    }}>

      {/* Dark overlay so text is readable */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.88) 40%, rgba(0,0,0,0.95) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 860, margin: '0 auto', padding: '2rem 1rem' }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', padding: '5rem 0 3rem' }}>
          <p style={{
            color: '#3a3020', letterSpacing: 8, fontSize: 10,
            textTransform: 'uppercase', marginBottom: 28,
            fontFamily: 'monospace',
          }}>
            — Special Investigations Division —
          </p>

          <h1 style={{
            fontSize: 'clamp(3rem, 8vw, 5.5rem)', color: '#e8e0d0',
            fontWeight: 400, fontFamily: 'Georgia, serif',
            marginBottom: 0, letterSpacing: 10, lineHeight: 1,
            textShadow: '0 0 60px rgba(139,115,85,0.2)',
          }}>SUSPECT</h1>

          <h1 style={{
            fontSize: 'clamp(3rem, 8vw, 5.5rem)',
            color: 'transparent',
            fontWeight: 400, fontFamily: 'Georgia, serif',
            marginBottom: 20, letterSpacing: 10, lineHeight: 1,
            WebkitTextStroke: '1px rgba(139,115,85,0.6)',
          }}>ZERO</h1>

          {/* Decorative divider */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 80, height: 1, background: 'linear-gradient(to right, transparent, #3a3020)' }} />
            <div style={{ width: 5, height: 5, background: '#5a4535', transform: 'rotate(45deg)' }} />
            <div style={{ width: 80, height: 1, background: 'linear-gradient(to left, transparent, #3a3020)' }} />
          </div>

          <p style={{ color: '#4a3f35', fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 4, fontFamily: 'monospace' }}>
            A Game by Emil Paul
          </p>
          <p style={{ color: '#2a2520', fontSize: 13, letterSpacing: 2, fontStyle: 'italic', marginBottom: 36, fontFamily: 'Georgia, serif' }}>
            "The truth is never what it seems"
          </p>

          {/* Leaderboard button */}
          <button
            onClick={() => navigate('/leaderboard')}
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid #3a2a1a',
              borderRadius: 2, color: '#6a5040',
              fontSize: 10, padding: '10px 28px',
              cursor: 'pointer', letterSpacing: 4,
              textTransform: 'uppercase', fontFamily: 'monospace',
              transition: 'all 0.3s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#8b7355'; e.currentTarget.style.color = '#8b7355' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#3a2a1a'; e.currentTarget.style.color = '#6a5040' }}
          >
            🏆 Leaderboard
          </button>
        </div>

        {/* ── Case list ── */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#3a3530', letterSpacing: 2, fontSize: 12 }}>
            LOADING CASE FILES...
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cases.map((c, i) => (
              <div
                key={c.id}
                onClick={() => navigate(`/case/${c.id}`)}
                onMouseEnter={() => setHoveredId(c.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  display: 'flex', alignItems: 'stretch',
                  background: hoveredId === c.id ? 'rgba(20,16,10,0.9)' : 'rgba(10,8,6,0.85)',
                  border: `1px solid ${hoveredId === c.id ? '#3a3020' : '#1a1510'}`,
                  borderLeft: `3px solid ${hoveredId === c.id ? '#8b7355' : '#2a2010'}`,
                  borderRadius: 4, cursor: 'pointer',
                  transition: 'all 0.3s',
                  transform: hoveredId === c.id ? 'translateX(4px)' : 'translateX(0)',
                  boxShadow: hoveredId === c.id ? '0 8px 40px rgba(0,0,0,0.6)' : 'none',
                  overflow: 'hidden',
                }}
              >
                {/* Case thumbnail image */}
                <div style={{
                  width: 160, flexShrink: 0, position: 'relative',
                  backgroundImage: `url(${CASE_IMAGES[c.id] || ''})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  minHeight: 120,
                }}>
                  {/* Dark overlay on image */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to right, rgba(0,0,0,0.2), rgba(0,0,0,0.6))',
                  }} />
                  {/* Case number over image */}
                  <p style={{
                    position: 'absolute', top: 10, left: 12,
                    fontSize: 10, color: 'rgba(200,176,144,0.7)',
                    letterSpacing: 2, fontFamily: 'monospace',
                    textTransform: 'uppercase',
                  }}>
                    Case {String(i + 1).padStart(2, '0')}
                  </p>
                </div>

                {/* Case info */}
                <div style={{ flex: 1, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    {/* Difficulty badge */}
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 2,
                      background: DIFF_COLOR[c.difficulty] + '18',
                      color: DIFF_COLOR[c.difficulty],
                      letterSpacing: 2, textTransform: 'uppercase',
                      border: `1px solid ${DIFF_COLOR[c.difficulty]}33`,
                      marginBottom: 10, display: 'inline-block',
                    }}>{c.difficulty}</span>

                    <h2 style={{
                      fontSize: 20, fontWeight: 400,
                      color: hoveredId === c.id ? '#f0e8d8' : '#c8c0b0',
                      marginBottom: 6, fontFamily: 'Georgia, serif',
                      transition: 'color 0.3s',
                    }}>{c.title}</h2>

                    <p style={{ fontSize: 12, color: '#3a3530', marginBottom: 3 }}>{c.setting}</p>
                    <p style={{ fontSize: 11, color: '#2a2520' }}>Victim: {c.victim} — {c.method}</p>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 10, color: '#2a2520', marginBottom: 8, letterSpacing: 1 }}>
                      {c.suspectNames.length} SUSPECTS
                    </p>
                    <span style={{
                      fontSize: 18,
                      color: hoveredId === c.id ? '#8b7355' : '#2a2520',
                      transition: 'color 0.3s',
                    }}>→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <p style={{ textAlign: 'center', color: '#1a1510', fontSize: 10, marginTop: '4rem', letterSpacing: 3, fontFamily: 'monospace' }}>
          AI-DRIVEN INTERROGATIONS • EVERY SUSPECT CAN LIE
        </p>
      </div>
    </div>
  )
}