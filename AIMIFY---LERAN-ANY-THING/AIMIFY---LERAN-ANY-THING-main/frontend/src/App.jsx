import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SessionProvider } from './context/SessionContext'
import Landing from './pages/Landing'
import Diagnostic from './pages/Diagnostic'
import Pathway from './pages/Pathway'
import Tutor from './pages/Tutor'
import Assessment from './pages/Assessment'
import Complete from './pages/Complete'
import FinalReport from './pages/FinalReport'
import ParticleBackground from './components/ParticleBackground'

export default function App() {
  return (
    <>
      <ParticleBackground />
      <BrowserRouter>
        <SessionProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/diagnostic" element={<Diagnostic />} />
            <Route path="/pathway" element={<Pathway />} />
            <Route path="/tutor" element={<Tutor />} />
            <Route path="/assessment" element={<Assessment />} />
            <Route path="/complete" element={<Complete />} />
            <Route path="/report" element={<FinalReport />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SessionProvider>
      </BrowserRouter>
    </>
  )
}
