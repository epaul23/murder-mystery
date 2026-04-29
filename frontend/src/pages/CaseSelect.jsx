import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Color mapping for difficulty badges
const DIFF_COLOR = { easy: '#4ade80', medium: '#facc15', hard: '#f87171' }

// Intro animation screen (shows once when user first opens the app)
function Intro({ onDone }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    // Timed phases for fade-in animation
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 3200),
      setTimeout(() => setPhase(4), 4500),
      setTimeout(() => onDone(), 5500), // End intro after animation
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 24,
      transition: 'opacity 1s',
      opacity: phase === 4 ? 0 : 1, // fade out at end
    }}>
      <p style={{
        fontSize: 13,
        letterSpacing: 8,
        color: '#5a4535',
        textTransform: 'uppercase',
        opacity: phase >= 1 ? 1 : 0,
        transition: 'opacity 1.2s',
      }}>
        Detective Agency
      </p>

      <h1 style={{
        fontSize: 'clamp(3rem, 10vw, 6rem)',
        color: '#e8e0d0',
        fontWeight: 400,
        fontFamily: 'Georgia, serif',
        margin: 0,
        opacity: phase >= 2 ? 1 : 0,
        transition: 'opacity 1.2s',
        textShadow: '0 0 80px rgba(139, 115, 85, 0.3)',
      }}>
        Murder Mystery
      </h1>

      <p style={{
        fontSize: 14,
        color: '#3a3530',
        letterSpacing: 3,
        opacity: phase >= 3 ? 1 : 0,
        transition: 'opacity 1.2s',
      }}>
        The truth is never what it seems
      </p>
    </div>
  )
}

export default function CaseSelect() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)

  // Only show intro if user hasn't seen it before (stored in sessionStorage)
  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem('introSeen'))

  const [hoveredId, setHoveredId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Fetch available cases from backend
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/cases`)
      .then(r => r.json())
      .then(data => {
        setCases(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // If intro hasn't been seen, show it first
  // When finished → mark as seen and continue to main screen
  if (showIntro)
    return (
      <Intro
        onDone={() => {
          sessionStorage.setItem('introSeen', '1')
          setShowIntro(false)
        }}
      />
    )

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050508',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(139,115,85,0.08) 0%, transparent 60%)',
      padding: '2rem 1rem',
    }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>

        {/* Header section (title + subtitle + navigation) */}
        <div style={{ textAlign: 'center', padding: '4rem 0 3rem' }}>
          <p style={{ color: '#5a4535', letterSpacing: 6, fontSize: 11, textTransform: 'uppercase', marginBottom: 16 }}>
            Detective Agency
          </p>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            color: '#e8e0d0',
            fontWeight: 400,
            fontFamily: 'Georgia, serif',
            marginBottom: 8,
            letterSpacing: 2,
            textShadow: '0 0 60px rgba(139,115,85,0.2)',
          }}>
            Suspect Zero
          </h1>

          <p style={{ color: '#3a3530', fontSize: 13, letterSpacing: 2, marginBottom: 4 }}>
            A game by Emil Paul
          </p>

          <p style={{ color: '#4a3f35', fontSize: 14, marginTop: 12 }}>
            Choose a case. Interrogate suspects. Find the killer.
          </p>

          {/* small divider line */}
          <div style={{ width: 40, height: 1, background: '#2a2520', margin: '24px auto 0' }} />

          {/* Leaderboard button */}
          <button
            onClick={() => navigate('/leaderboard')}
            style={{
              marginTop: 20,
              background: 'none',
              border: '1px solid #2a2520',
              borderRadius: 6,
              color: '#5a4535',
              fontSize: 12,
              padding: '8px 20px',
              cursor: 'pointer',
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            🏆 Leaderboard
          </button>
        </div>

        {/* Case list section */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#3a3530', letterSpacing: 2, fontSize: 12 }}>
            LOADING CASE FILES...
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cases.map((c, i) => (
              <div
                key={c.id}
                onClick={() => navigate(`/case/${c.id}`)} // go to selected case
                onMouseEnter={() => setHoveredId(c.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  background: hoveredId === c.id ? '#0f0f0c' : '#080808',
                  border: `1px solid ${hoveredId === c.id ? '#3a3020' : '#151510'}`,
                  borderLeft: `3px solid ${hoveredId === c.id ? '#8b7355' : '#1a1510'}`,
                  borderRadius: 4,
                  padding: '1.75rem 2rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 16,
                  boxShadow: hoveredId === c.id ? '0 8px 40px rgba(0,0,0,0.5)' : 'none',
                  transform: hoveredId === c.id ? 'translateX(4px)' : 'translateX(0)',
                }}
              >
                {/* Left side (case info) */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <span style={{ color: '#2a2520', fontSize: 11, letterSpacing: 2 }}>
                      CASE {String(i + 1).padStart(2, '0')}
                    </span>

                    {/* Difficulty badge */}
                    <span style={{
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 2,
                      background: DIFF_COLOR[c.difficulty] + '15',
                      color: DIFF_COLOR[c.difficulty],
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                      border: `1px solid ${DIFF_COLOR[c.difficulty]}33`,
                    }}>
                      {c.difficulty}
                    </span>
                  </div>

                  <h2 style={{
                    fontSize: 22,
                    fontWeight: 400,
                    color: hoveredId === c.id ? '#f0e8d8' : '#c8c0b0',
                    marginBottom: 8,
                    fontFamily: 'Georgia, serif',
                    transition: 'color 0.3s',
                  }}>
                    {c.title}
                  </h2>

                  <p style={{ fontSize: 13, color: '#3a3530', marginBottom: 4 }}>
                    {c.setting}
                  </p>

                  <p style={{ fontSize: 12, color: '#2a2520' }}>
                    Victim: {c.victim} — {c.method}
                  </p>
                </div>

                {/* Right side (meta info) */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 11, color: '#2a2520', marginBottom: 8, letterSpacing: 1 }}>
                    {c.suspectNames.length} SUSPECTS
                  </p>

                  <span style={{
                    fontSize: 18,
                    color: hoveredId === c.id ? '#8b7355' : '#2a2520',
                    transition: 'color 0.3s',
                  }}>
                    →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <p style={{ textAlign: 'center', color: '#1a1a15', fontSize: 11, marginTop: '4rem', letterSpacing: 2 }}>
          AI-DRIVEN INTERROGATIONS • EVERY SUSPECT CAN LIE
        </p>
      </div>
    </div>
  )
}