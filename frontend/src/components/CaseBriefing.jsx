// Pure renderer — knows nothing about specific cases
// Never edit this file when adding new cases
// Only edit data/caseX.js files

import { useState, useEffect } from 'react'
import { BRIEFINGS } from '../data/index.js'

// Load cinematic fonts once
const fontLink = document.createElement('link')
fontLink.rel = 'stylesheet'
fontLink.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Special+Elite&display=swap'
if (!document.head.querySelector('link[href*="Playfair"]')) {
  document.head.appendChild(fontLink)
}

export default function CaseBriefing({ caseId, onStart }) {
  const slides = BRIEFINGS[caseId] || []
  const [slide, setSlide] = useState(0)
  const [phase, setPhase] = useState('in')
  const current = slides[slide]
  const isLast = slide === slides.length - 1

  // If no briefing exists for this case, skip straight to game
  useEffect(() => {
    if (!slides.length) onStart()
  }, [])

  useEffect(() => {
    setPhase('in')
  }, [slide])

  const goNext = () => {
    if (isLast) {
      setPhase('out')
      setTimeout(() => onStart(), 800)
    } else {
      setPhase('out')
      setTimeout(() => {
        setSlide(s => s + 1)
      }, 400)
    }
  }

  const skip = () => {
    setPhase('out')
    setTimeout(() => onStart(), 600)
  }

  if (!current) return null

  const isIn = phase === 'in'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: '#000',
      fontFamily: "'Cormorant Garamond', Georgia, serif",
    }}>

      {/* ── Background image ── */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${current.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: isIn ? 1 : 0,
        transform: isIn ? 'scale(1.03)' : 'scale(1)',
        transition: 'opacity 1s ease, transform 1.4s ease',
      }} />

      {/* ── Overlay ── */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `rgba(0,0,0,${current.overlay})`,
      }} />

      {/* ── Vignette ── */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)',
        pointerEvents: 'none',
      }} />

      {/* ── Skip ── */}
      <button onClick={skip} style={{
        position: 'absolute', top: 24, right: 24, zIndex: 10,
        background: 'none', border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 3, color: 'rgba(255,255,255,0.3)',
        fontSize: 10, padding: '6px 16px', cursor: 'pointer',
        letterSpacing: 3, textTransform: 'uppercase',
        fontFamily: "'Special Elite', monospace",
      }}>Skip Briefing</button>

      {/* ── Slide dots ── */}
      <div style={{
        position: 'absolute', top: 28, left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', gap: 6, zIndex: 10,
      }}>
        {slides.map((_, i) => (
          <div key={i} style={{
            height: 6, borderRadius: 3,
            width: i === slide ? 24 : 6,
            background: i === slide ? 'rgba(200,176,144,0.8)' : 'rgba(255,255,255,0.2)',
            transition: 'all 0.4s',
          }} />
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex',
        alignItems: current.layout === 'cinematic' ? 'flex-end' : 'center',
        justifyContent:
          current.layout === 'split-right' ? 'flex-end' :
          current.layout === 'split-left' ? 'flex-start' : 'center',
        padding: current.layout === 'cinematic' ? '0 0 80px' : '0',
      }}>
        <div style={{
          maxWidth: current.layout === 'cinematic' ? 680 : 400,
          width: '100%',
          padding: current.layout === 'cinematic' ? '0 60px' : '48px',
          opacity: isIn ? 1 : 0,
          transform: isIn ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s',
        }}>

          {/* Eyebrow */}
          {current.eyebrow && (
            <p style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: 10, letterSpacing: 4,
              color: 'rgba(200,176,144,0.65)',
              textTransform: 'uppercase', marginBottom: 14,
            }}>{current.eyebrow}</p>
          )}

          {/* Divider line */}
          <div style={{ width: 36, height: 1, background: 'rgba(200,176,144,0.35)', marginBottom: 18 }} />

          {/* Title */}
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(1.8rem, 4.5vw, 3.2rem)',
            fontWeight: 400, color: '#f0e8d8',
            lineHeight: 1.2, marginBottom: 18,
            whiteSpace: 'pre-line',
            textShadow: '0 2px 24px rgba(0,0,0,0.9)',
          }}>{current.title}</h1>

          {/* Body */}
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 17, fontStyle: 'italic',
            color: 'rgba(220,210,195,0.82)',
            lineHeight: 1.85, marginBottom: 16,
            whiteSpace: 'pre-line',
            textShadow: '0 1px 10px rgba(0,0,0,0.95)',
          }}>{current.body}</p>

          {/* Tag */}
          {current.tag && (
            <p style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: 11, letterSpacing: 2,
              color: 'rgba(200,176,144,0.55)',
              marginBottom: 28,
            }}>{current.tag}</p>
          )}

          {/* Next button */}
          <button onClick={goNext} style={{
            background: 'none',
            border: '1px solid rgba(200,176,144,0.35)',
            borderRadius: 3, padding: '11px 30px',
            color: 'rgba(200,176,144,0.85)',
            fontFamily: "'Special Elite', monospace",
            fontSize: 11, letterSpacing: 4,
            textTransform: 'uppercase', cursor: 'pointer',
            transition: 'all 0.3s',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(200,176,144,0.08)'
              e.currentTarget.style.borderColor = 'rgba(200,176,144,0.7)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'none'
              e.currentTarget.style.borderColor = 'rgba(200,176,144,0.35)'
            }}
          >
            {isLast ? 'Begin Investigation' : 'Continue →'}
          </button>
        </div>
      </div>

      {/* ── Watermark ── */}
      <div style={{
        position: 'absolute', bottom: 20, right: 24,
        fontFamily: "'Special Elite', monospace",
        fontSize: 9, letterSpacing: 3,
        color: 'rgba(255,255,255,0.12)',
      }}>CASE 00{caseId} — CLASSIFIED</div>
    </div>
  )
}