import { Routes, Route } from 'react-router-dom'
import CaseSelect from './pages/CaseSelect.jsx'
import Game from './pages/Game.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CaseSelect />} />
      <Route path="/case/:caseId" element={<Game />} />
    </Routes>
  )
}