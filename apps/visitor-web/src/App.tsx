import { Routes, Route } from 'react-router-dom'
import Start from './pages/Start'
import Interest from './pages/Interest'
import Narrative from './pages/Narrative'
import CheckIn from './pages/CheckIn'
import Reward from './pages/Reward'
import Complete from './pages/Complete'

function App() {
  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <Routes>
        <Route path="/" element={<Start />} />
        <Route path="/interest" element={<Interest />} />
        <Route path="/narrative" element={<Narrative />} />
        <Route path="/check-in" element={<CheckIn />} />
        <Route path="/reward" element={<Reward />} />
        <Route path="/complete" element={<Complete />} />
      </Routes>
    </div>
  )
}

export default App
