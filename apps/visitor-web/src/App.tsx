import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Start from './pages/Start'
import Interest from './pages/Interest'
import Explore from './pages/Explore'
import Narrative from './pages/Narrative'
import Navigate from './pages/Navigate'
import Complete from './pages/Complete'

function PageTransition({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 30)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className={`transition-all duration-500 ease-out ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {children}
    </div>
  )
}

function App() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-paper font-body text-ink paper-texture">
      <div className="mx-auto min-h-screen w-full max-w-[480px] relative">
        {/* Subtle top ink wash - very light for paper background */}
        <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-[180px] z-0 ink-wash-top" />

        {/* Bottom ink wash */}
        <div className="pointer-events-none fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-[120px] z-0 ink-wash-bottom" />

        {/* Paper grain overlay */}
        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '128px',
          }}
        />

        <div className="relative z-10">
          <Routes location={location}>
            <Route path="/" element={<PageTransition><Start /></PageTransition>} />
            <Route path="/interest" element={<PageTransition><Interest /></PageTransition>} />
            <Route path="/explore" element={<PageTransition><Explore /></PageTransition>} />
            <Route path="/navigate" element={<PageTransition><Navigate /></PageTransition>} />
            <Route path="/narrative" element={<PageTransition><Narrative /></PageTransition>} />
            <Route path="/complete" element={<PageTransition><Complete /></PageTransition>} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default App
