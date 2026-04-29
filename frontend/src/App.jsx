import { Routes, Route } from 'react-router-dom'
import CaseSelect from './pages/CaseSelect.jsx'
import Game from './pages/Game.jsx'
import Leaderboard from './pages/Leaderboard.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CaseSelect />} />
      <Route path="/case/:caseId" element={<Game />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
    </Routes>
  )
}