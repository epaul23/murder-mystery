import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CaseBriefing from '../components/CaseBriefing.jsx' // already added

// Difficulty badge colors
const DIFF_COLOR = { easy: '#4ade80', medium: '#facc15', hard: '#f87171' }

// Max questions allowed per case
const MAX_QUESTIONS = 20

// Avatar colors for each suspect
const AVATAR_COLORS = [
  { bg: '#2a1a3a', text: '#9f7aea' },
  { bg: '#0f2a1a', text: '#4ade80' },
  { bg: '#2a1a0a', text: '#facc15' },
  { bg: '#2a0a0a', text: '#f87171' },
]

// Returns rank label + color based on final score
function getRank(score) {
  if (score >= 900) return { label: 'Master Detective', color: '#facc15' }
  if (score >= 750) return { label: 'Senior Investigator', color: '#4ade80' }
  if (score >= 600) return { label: 'Detective', color: '#60a5fa' }
  return { label: 'Rookie', color: '#f87171' }
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

  // NEW: show briefing before game starts
  const [showBriefing, setShowBriefing] = useState(true)

  // Player tools
  const [notes, setNotes] = useState('')

  // Accusation state — now includes method + motive
  const [accuseMode, setAccuseMode] = useState(false)
  const [accusedName, setAccusedName] = useState('')
  const [accusedMethod, setAccusedMethod] = useState('')
  const [accusedMotive, setAccusedMotive] = useState('')
  const [reasoning, setReasoning] = useState('')

  // Results
  const [reveal, setReveal] = useState(null)

  // Scoring
  const [questionCounts, setQuestionCounts] = useState({})
  const [score, setScore] = useState(1000)

  const chatRef = useRef(null)

  const totalQuestions = Object.values(questionCounts).reduce((a, b) => a + b, 0)
  const questionsLeft = MAX_QUESTIONS - totalQuestions
  const rank = getRank(score)

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

  if (!caseData) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#6b6055' }}>Loading case file...</p>
    </div>
  )

  // NEW: Show case briefing before game starts
  if (showBriefing)
    return (
      <CaseBriefing
        caseId={Number(caseId)}
        caseData={caseData}
        onStart={() => setShowBriefing(false)}
      />
    )

  const currentHistory = selectedSuspect ? histories[selectedSuspect] || [] : []

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', flexDirection: 'column' }}>
      {/* rest of your code stays EXACTLY the same */}
    </div>
  )
}