import { useEffect, useRef, useState } from 'react'
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
  const [exiting, setExiting] = useState(false)
  const finishingRef = useRef(false)

  const finishIntro = () => {
    if (finishingRef.current) return
    finishingRef.current = true
    setExiting(true)
    setTimeout(onDone, 750)
  }

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 180),
      setTimeout(() => setPhase(2), 850),
      setTimeout(() => setPhase(3), 1550),
      setTimeout(finishIntro, 3900),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="cinematic-intro" style={{
      minHeight: '100vh',
      backgroundImage: 'url(/cases/intro-bg.png)',
      backgroundSize: 'cover', backgroundPosition: 'center',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 18, position: 'relative', overflow: 'hidden',
      transition: 'opacity 750ms ease, filter 750ms ease',
      opacity: exiting ? 0 : 1, filter: exiting ? 'blur(5px)' : 'blur(0)',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(2,3,5,.88), rgba(7,6,5,.70) 50%, rgba(2,3,5,.86))' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(160,120,75,.12), transparent 42%)' }} />

      <p style={{
        position: 'relative', fontSize: 11, letterSpacing: 9, color: '#a78660',
        textTransform: 'uppercase', fontFamily: "'Special Elite', monospace",
        opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 900ms ease, transform 900ms ease',
      }}>Special Investigations Division</p>

      <div style={{
        position: 'relative', height: 1, width: phase >= 1 ? 190 : 0,
        background: 'linear-gradient(90deg, transparent, #9b7650, transparent)',
        transition: 'width 1.2s ease',
      }} />

      <h1 style={{
        position: 'relative', fontSize: 'clamp(3.6rem, 10vw, 7.5rem)', color: '#f1e8d8',
        fontWeight: 600, fontFamily: "'Playfair Display', Georgia, serif", margin: 0,
        letterSpacing: 'clamp(3px, 1vw, 12px)', lineHeight: .95,
        opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? 'scale(1)' : 'scale(.94)',
        transition: 'opacity 1.1s ease, transform 1.4s cubic-bezier(.2,.8,.2,1)',
        textShadow: '0 8px 45px rgba(0,0,0,.9), 0 0 70px rgba(170,125,75,.22)',
      }}>Suspect Zero</h1>

      <p style={{
        position: 'relative', fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: '#aa9680', letterSpacing: 4,
        fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic',
        opacity: phase >= 3 ? 1 : 0, transform: phase >= 3 ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 1s ease, transform 1s ease',
      }}>The truth is never what it seems</p>

      <button onClick={finishIntro} style={{ position: 'absolute', zIndex: 2, right: 24, bottom: 24, background: 'rgba(0,0,0,.28)', border: '1px solid #604b36', color: '#a78660', padding: '9px 15px', cursor: 'pointer', letterSpacing: 2, fontFamily: "'Special Elite', monospace", fontSize: 10 }}>Skip intro</button>
    </div>
  )
}

export default function CaseSelect() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem('introSeen'))
  const [hoveredId, setHoveredId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    setError('')
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/cases`)
      .then(async response => {
        const data = await response.json().catch(() => null)
        if (!response.ok || !Array.isArray(data)) throw new Error('Could not load case files')
        return data
      })
      .then(data => { setCases(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [reloadKey])

  if (showIntro) return (
    <Intro onDone={() => {
      sessionStorage.setItem('introSeen', '1')
      setShowIntro(false)
    }} />
  )

  return (
    <div className="case-select-page motion-enabled" style={{
      minHeight: '100vh',
      // ── Background image — replace bg.png with your detective desk image
      position: 'relative',
    }}>

      {/* Animated detective-office background */}
      <div className="case-select-scene" aria-hidden="true" />

      {/* Dark overlay so text is readable */}
      <div className="case-select-shade" style={{
        position: 'fixed', inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.48) 0%, rgba(0,0,0,0.66) 42%, rgba(0,0,0,0.82) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Atmospheric lighting and movement */}
      <div className="case-select-atmosphere" aria-hidden="true">
        <div className="case-select-atmosphere__lamps" />
        <div className="case-select-atmosphere__light-beam" />
        <div className="case-select-atmosphere__window" />
        <div className="case-select-atmosphere__shadow" />
        <div className="case-select-fog case-select-fog--far" />
        <div className="case-select-fog case-select-fog--middle" />
        <div className="case-select-fog case-select-fog--near" />
        <div className="case-select-atmosphere__vignette" />
      </div>

      <div className="motion-preview-badge">Motion preview active</div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 860, margin: '0 auto', padding: '2rem 1rem' }}>

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
            fontWeight: 600, fontFamily: "'Playfair Display', Georgia, serif",
            marginBottom: 0, letterSpacing: 10, lineHeight: 1,
            textShadow: '0 0 60px rgba(139,115,85,0.2)',
          }}>SUSPECT</h1>

          <h1 style={{
            fontSize: 'clamp(3rem, 8vw, 5.5rem)',
            color: 'transparent',
            fontWeight: 600, fontFamily: "'Playfair Display', Georgia, serif",
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
          <p style={{ color: '#6b5b49', fontSize: 15, letterSpacing: 2, fontStyle: 'italic', marginBottom: 36, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
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
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p role="alert" style={{ color: '#f87171', marginBottom: 16 }}>{error}</p>
            <button onClick={() => setReloadKey(key => key + 1)} style={{ background: 'none', border: '1px solid #5a4535', color: '#8b7355', padding: '10px 18px', cursor: 'pointer' }}>Try again</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cases.map((c, i) => (
              <div
                key={c.id}
                className="case-card"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/case/${c.id}`)}
                onKeyDown={event => (event.key === 'Enter' || event.key === ' ') && navigate(`/case/${c.id}`)}
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
