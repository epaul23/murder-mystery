export default function SuspectProfile({ suspect, colors, hasBegun = false }) {
  if (!suspect) return null

  const initials = suspect.name
    .split(' ')
    .map(part => part[0])
    .join('')

  return (
    <section style={{
      maxWidth: 680,
      width: '100%',
      background: 'rgba(13,13,10,0.9)',
      border: '1px solid #2a2520',
      borderRadius: 10,
      padding: '1.25rem',
      boxShadow: '0 18px 45px rgba(0,0,0,0.28)',
    }}>
      <p style={{ fontSize: 10, color: '#5a4535', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 14 }}>
        Person of interest
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <div style={{
          width: 46,
          height: 46,
          borderRadius: '50%',
          background: colors.bg,
          color: colors.text,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 600,
          flexShrink: 0,
        }}>
          {initials}
        </div>
        <div>
          <h2 style={{ fontSize: 19, fontWeight: 400, color: '#e8e0d0', marginBottom: 3 }}>{suspect.name}</h2>
          <p style={{ fontSize: 12, color: '#8b7355' }}>{suspect.role}</p>
        </div>
      </div>

      <div className="suspect-profile-details" style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 0.8fr) minmax(220px, 1.2fr)', gap: 18 }}>
        <div>
          <p style={{ fontSize: 10, color: '#4a3f35', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>
            Relationship to victim
          </p>
          <p style={{ fontSize: 14, color: '#c8b090', lineHeight: 1.6 }}>{suspect.relationship}</p>
        </div>
        <div>
          <p style={{ fontSize: 10, color: '#4a3f35', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>
            Case-file note
          </p>
          <p style={{ fontSize: 14, color: '#9a9085', lineHeight: 1.6 }}>{suspect.publicBio}</p>
        </div>
      </div>

      <p style={{ borderTop: '1px solid #1a1a15', marginTop: 18, paddingTop: 12, color: '#4a3f35', fontSize: 12, fontStyle: 'italic' }}>
        {hasBegun
          ? 'Case-file profile reopened—viewing it does not use one of your questions.'
          : 'The interview has not begun. Ask naturally—this briefing does not use one of your questions.'}
      </p>
    </section>
  )
}
