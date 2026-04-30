import { useState, useEffect } from 'react'

// Case briefing data — one page per slide
const BRIEFINGS = {
  1: [
    {
      type: 'header',
      label: 'Case File #001',
      title: 'The Blackwood Manor Incident',
      subtitle: 'October 14th, 1923 — Devonshire, England',
    },
    {
      type: 'incident',
      heading: 'Incident Report',
      body: 'Lord Edmund Blackwood, 58, was found dead in his private study at Blackwood Manor at approximately 11:00 PM. The household butler discovered the body during his nightly rounds. Initial examination suggests poisoning. The study was locked from the inside — the window latch was found open.',
    },
    {
      type: 'victim',
      heading: 'Victim Profile',
      name: 'Lord Edmund Blackwood',
      details: [
        { label: 'Age', value: '58' },
        { label: 'Occupation', value: 'Landowner, retired MP' },
        { label: 'Cause of death', value: 'Arsenic poisoning (preliminary)' },
        { label: 'Time of death', value: 'Between 22:00 and 23:00' },
        { label: 'Location', value: 'Private study, east wing' },
      ],
    },
    {
      type: 'suspects',
      heading: 'Persons of Interest',
      suspects: [
        { name: 'Victoria Blackwood', role: 'The Widow', note: 'Stands to inherit the entire estate. Unusually composed.' },
        { name: 'Dr. Edmund Hale', role: 'Family Doctor', note: 'Called to the manor that evening. Medical bag unaccounted for.' },
        { name: 'Clara Finch', role: 'Head Maid', note: '10 years of service. Nervous. Avoided eye contact with officers.' },
        { name: 'Reginald Cross', role: 'Business Partner', note: 'Public dispute over finances last month. Claims it was resolved.' },
      ],
    },
    {
      type: 'instructions',
      heading: 'Your Mission',
      body: 'You have been assigned as lead detective on this case. Interrogate each suspect carefully. You have 20 questions total — use them wisely. Find the killer, identify the motive, and make your accusation.',
      warning: 'The guilty party has had time to prepare their story. Listen for contradictions.',
    },
  ],
  2: [
    {
      type: 'header',
      label: 'Case File #002',
      title: 'Death on the Orient Express Lounge',
      subtitle: 'November 3rd, 1934 — Somewhere over the Alps',
    },
    {
      type: 'incident',
      heading: 'Incident Report',
      body: 'Ambassador Henri Duval, 52, was found stabbed in his private cabin aboard the Orient Express at 11:45 PM. His letter opener was used as the weapon. The cabin door was unlocked. His wallet and watch were missing — but curiously, his briefcase containing sensitive documents was left untouched.',
    },
    {
      type: 'victim',
      heading: 'Victim Profile',
      name: 'Ambassador Henri Duval',
      details: [
        { label: 'Age', value: '52' },
        { label: 'Occupation', value: 'French Ambassador' },
        { label: 'Cause of death', value: 'Single stab wound to the chest' },
        { label: 'Time of death', value: 'Between 23:00 and 23:30' },
        { label: 'Location', value: 'Cabin 14, Orient Express' },
      ],
    },
    {
      type: 'suspects',
      heading: 'Persons of Interest',
      suspects: [
        { name: 'Sophia Vance', role: 'Personal Secretary', note: 'Worked with Duval for 5 years. Claims she left at 11pm. Timeline disputed.' },
        { name: 'Colonel Marsh', role: 'Retired Military', note: 'Old friend of victim. Evasive about his whereabouts. Knows too much.' },
        { name: 'Madame Leclair', role: 'French Socialite', note: 'Was seen near cabin 14 at 11:10. Claims she was in the dining car all night.' },
        { name: 'The Porter', role: 'Train Porter', note: 'Heard arguing at 11:15. Saw someone leave cabin 14 at 11:22. Scared to talk.' },
      ],
    },
    {
      type: 'instructions',
      heading: 'Your Mission',
      body: 'The train cannot be stopped. Every passenger is a suspect until cleared. You have 20 questions — choose wisely. The killer staged this as a robbery. Find out why.',
      warning: 'Someone on this train is lying about their timeline. Find the contradiction.',
    },
  ],
  3: [
    {
      type: 'header',
      label: 'Case File #003',
      title: 'The Silicon Valley Shutdown',
      subtitle: 'March 7th, 2024 — San Francisco, California',
    },
    {
      type: 'incident',
      heading: 'Incident Report',
      body: 'Marcus Webb, 39, CEO of NexGen AI, collapsed in his office at approximately 10:00 AM and was pronounced dead at 10:47 AM. Toxicology confirmed a lethal dose of sedatives in his protein shake. The shake was prepared in the office kitchen. Security footage from the kitchen is missing — the hard drive was wiped.',
    },
    {
      type: 'victim',
      heading: 'Victim Profile',
      name: 'Marcus Webb',
      details: [
        { label: 'Age', value: '39' },
        { label: 'Occupation', value: 'CEO, NexGen AI ($200M valuation)' },
        { label: 'Cause of death', value: 'Sedative overdose — roxyphenol' },
        { label: 'Time of death', value: '10:47 AM' },
        { label: 'Location', value: 'Executive office, 4th floor' },
      ],
    },
    {
      type: 'suspects',
      heading: 'Persons of Interest',
      suspects: [
        { name: 'Jordan Kim', role: 'Co-founder & CTO', note: 'Being pushed out by Webb. Claims to have been in a meeting 8:30–9:30. Disputed.' },
        { name: 'Priya Sharma', role: 'Head of Product', note: 'Public argument with Webb last week. Openly hostile. May be a distraction.' },
        { name: 'Derek Osei', role: 'Office Manager', note: 'Knows everyone\'s schedule. Nervous when certain names come up. Hiding something.' },
        { name: 'Natalie Cruz', role: 'Head of Legal', note: 'Was drafting termination papers that morning. Knows about an IP dispute.' },
      ],
    },
    {
      type: 'instructions',
      heading: 'Your Mission',
      body: 'This looks like an accident. It isn\'t. Someone with insider access and medical knowledge planned this carefully. You have 20 questions. The killer covered their tracks — but not perfectly.',
      warning: 'Watch for gaps in timelines. The 12 minutes between 8:42 and 8:54 AM are key.',
    },
  ],
}

export default function CaseBriefing({ caseId, caseData, onStart }) {
  const [page, setPage] = useState(0)
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const pages = BRIEFINGS[caseId] || []
  const current = pages[page]
  const isLast = page === pages.length - 1

  // Fade in on mount and page change
  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [page])

  const next = () => {
    if (isLast) {
      // Fade out and start game
      setLeaving(true)
      setTimeout(() => onStart(), 600)
    } else {
      setVisible(false)
      setTimeout(() => setPage(p => p + 1), 300)
    }
  }

  const skip = () => {
    setLeaving(true)
    setTimeout(() => onStart(), 600)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#050508',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', zIndex: 100,
      opacity: leaving ? 0 : 1, transition: 'opacity 0.6s',
    }}>
      {/* Page counter + skip */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 11, color: '#2a2520', letterSpacing: 2 }}>{page + 1} / {pages.length}</span>
        <button onClick={skip} style={{ background: 'none', border: 'none', color: '#3a3530', fontSize: 12, cursor: 'pointer', letterSpacing: 1 }}>SKIP →</button>
      </div>

      {/* Page dots */}
      <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
        {pages.map((_, i) => (
          <div key={i} style={{ width: i === page ? 20 : 6, height: 6, borderRadius: 3, background: i === page ? '#8b7355' : '#1a1a15', transition: 'all 0.3s' }} />
        ))}
      </div>

      {/* Card */}
      <div style={{
        maxWidth: 580, width: '100%',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.4s, transform 0.4s',
      }}>
        {/* ── Header page ── */}
        {current?.type === 'header' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <p style={{ fontSize: 10, color: '#5a4535', letterSpacing: 6, textTransform: 'uppercase', marginBottom: 20 }}>
              {current.label} — Confidential
            </p>
            <div style={{ width: 40, height: 1, background: '#2a2520', margin: '0 auto 24px' }} />
            <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', color: '#e8e0d0', fontWeight: 400, fontFamily: 'Georgia, serif', marginBottom: 16, lineHeight: 1.3 }}>
              {current.title}
            </h1>
            <p style={{ fontSize: 14, color: '#4a3f35', marginBottom: 40 }}>{current.subtitle}</p>
            <div style={{ display: 'inline-block', border: '2px solid #3a1515', borderRadius: 4, padding: '6px 20px', transform: 'rotate(-2deg)' }}>
              <p style={{ fontSize: 13, color: '#5a2525', letterSpacing: 4, textTransform: 'uppercase', fontWeight: 700 }}>Classified</p>
            </div>
          </div>
        )}

        {/* ── Incident report page ── */}
        {current?.type === 'incident' && (
          <div style={{ background: '#080808', border: '1px solid #1a1a15', borderRadius: 8, padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 3, height: 24, background: '#8b7355', borderRadius: 2 }} />
              <p style={{ fontSize: 11, color: '#8b7355', letterSpacing: 3, textTransform: 'uppercase' }}>{current.heading}</p>
            </div>
            <p style={{ fontSize: 15, color: '#c8c0b0', lineHeight: 1.9, fontFamily: 'Georgia, serif' }}>{current.body}</p>
          </div>
        )}

        {/* ── Victim profile page ── */}
        {current?.type === 'victim' && (
          <div style={{ background: '#080808', border: '1px solid #1a1a15', borderRadius: 8, padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 3, height: 24, background: '#f87171', borderRadius: 2 }} />
              <p style={{ fontSize: 11, color: '#f87171', letterSpacing: 3, textTransform: 'uppercase' }}>{current.heading}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              {/* Victim photo placeholder */}
              <div style={{ width: 64, height: 64, borderRadius: 4, background: '#0a0a0f', border: '1px solid #2a2520', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <line x1="3" y1="3" x2="21" y2="21" stroke="#3a2520" strokeWidth="1.5" />
                  <line x1="21" y1="3" x2="3" y2="21" stroke="#3a2520" strokeWidth="1.5" />
                </svg>
                <p style={{ fontSize: 8, color: '#2a2520', marginTop: 4, letterSpacing: 1 }}>PHOTO</p>
              </div>
              <div>
                <p style={{ fontSize: 18, color: '#e8e0d0', fontFamily: 'Georgia, serif', marginBottom: 4 }}>{current.name}</p>
                <p style={{ fontSize: 12, color: '#4a3f35' }}>DECEASED</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {current.details.map(d => (
                <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #0f0f0c', paddingBottom: 10 }}>
                  <span style={{ fontSize: 12, color: '#4a3f35', textTransform: 'uppercase', letterSpacing: 1 }}>{d.label}</span>
                  <span style={{ fontSize: 13, color: '#c8c0b0' }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Suspects page ── */}
        {current?.type === 'suspects' && (
          <div style={{ background: '#080808', border: '1px solid #1a1a15', borderRadius: 8, padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 3, height: 24, background: '#facc15', borderRadius: 2 }} />
              <p style={{ fontSize: 11, color: '#facc15', letterSpacing: 3, textTransform: 'uppercase' }}>{current.heading}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {current.suspects.map((s, i) => (
                <div key={s.name} style={{ display: 'flex', gap: 14, padding: '12px', background: '#0a0a0f', borderRadius: 6, border: '1px solid #111' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: ['#2a1a3a', '#0f2a1a', '#2a1a0a', '#2a0a0a'][i], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: ['#9f7aea', '#4ade80', '#facc15', '#f87171'][i] }}>{s.name.split(' ').map(w => w[0]).join('')}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, color: '#e8e0d0', marginBottom: 2 }}>{s.name} <span style={{ color: '#4a3f35', fontSize: 11 }}>— {s.role}</span></p>
                    <p style={{ fontSize: 12, color: '#5a5050', lineHeight: 1.5 }}>{s.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Instructions page ── */}
        {current?.type === 'instructions' && (
          <div style={{ background: '#080808', border: '1px solid #1a1a15', borderRadius: 8, padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 3, height: 24, background: '#4ade80', borderRadius: 2 }} />
              <p style={{ fontSize: 11, color: '#4ade80', letterSpacing: 3, textTransform: 'uppercase' }}>{current.heading}</p>
            </div>
            <p style={{ fontSize: 15, color: '#c8c0b0', lineHeight: 1.9, fontFamily: 'Georgia, serif', marginBottom: 20 }}>{current.body}</p>
            <div style={{ background: '#0f0a08', border: '1px solid #3a2515', borderRadius: 6, padding: '12px 16px' }}>
              <p style={{ fontSize: 12, color: '#8b7355' }}>⚠ {current.warning}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          <button onClick={next} style={{
            background: isLast ? '#1a1510' : 'none',
            border: `1px solid ${isLast ? '#8b7355' : '#2a2520'}`,
            borderRadius: 8, color: isLast ? '#8b7355' : '#4a3f35',
            fontSize: 13, padding: '10px 28px', cursor: 'pointer',
            letterSpacing: 1, transition: 'all 0.2s',
          }}>
            {isLast ? 'Begin Investigation →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}