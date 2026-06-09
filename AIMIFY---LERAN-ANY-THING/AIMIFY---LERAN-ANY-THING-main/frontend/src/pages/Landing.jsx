import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSession } from '../context/SessionContext'
import { Loader2 } from 'lucide-react'
import HeroBackground3D from '../components/HeroBackground3D'
import LoadingButton from '../components/LoadingButton'
import { useApiCall } from '../hooks/useApiCall'

export default function Landing() {
  const [inputValue, setInputValue] = useState('')
  const { startSession } = useSession()
  const navigate = useNavigate()
  const { loading, error, call } = useApiCall()

  // Micro-animation: Typewriter effect for subtitle
  const [typedText, setTypedText] = useState('')
  const fullText = "An AI system with 5 specialized agents that diagnose your knowledge, build a personalized roadmap, and guide you concept by concept."

  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      setTypedText(fullText.slice(0, index + 1))
      index++
      if (index === fullText.length) clearInterval(interval)
    }, 20)
    return () => clearInterval(interval)
  }, [fullText])

  // Micro-animation: Social proof counter
  const [masteredCount, setMasteredCount] = useState(1200)
  
  useEffect(() => {
    let current = 1200
    const target = 1247
    const interval = setInterval(() => {
      if (current < target) {
        current += 1
        setMasteredCount(current)
      } else {
        clearInterval(interval)
      }
    }, 40)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return
    try {
      await call(async () => {
        await startSession("Student", inputValue.trim(), inputValue.trim())
        navigate("/diagnostic")
      })
    } catch (err) {
      console.error('Session creation failed:', err)
    }
  }

  const handlePillClick = (subject) => {
    setInputValue(subject)
  }

  return (
    <div className="min-h-screen bg-white text-dark font-sans selection:bg-orange-100 selection:text-orange-600">
      
      {/* SECTION 1 — Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-[90vh] px-6 text-center overflow-hidden">
        
        {/* Animated Background Agents & Particles */}
        <HeroBackground3D />

        <div className="relative z-10 w-full max-w-3xl flex flex-col items-center">
          <span className="section-label mb-6 text-orange-500 font-bold tracking-widest text-xs uppercase px-4 py-1.5 bg-orange-50 rounded-full border border-orange-100 shadow-sm">
            Agentic AI • Powered by Gemini 2.5
          </span>
          
          <h1 className="text-[48px] md:text-[72px] font-[800] leading-[1.1] tracking-[-0.02em] text-dark mb-6">
            Learn anything,<br/>
            <span className="text-[#FF6600]">adapted</span> to you.
          </h1>
          
          <p className="text-xl text-muted max-w-2xl mb-12 font-medium leading-relaxed min-h-[60px]">
            {typedText}
          </p>

          <form onSubmit={handleSubmit} className="w-full max-w-[500px] flex flex-col gap-3">
            <div className="relative w-full">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="What do you want to learn today?"
                className="input-field shadow-sm border-gray-200 text-lg py-4 px-6 focus:ring-orange-500 w-full rounded-2xl"
                required
              />
            </div>
            
            <LoadingButton 
              type="submit" 
              loading={loading}
              className="btn-primary w-full py-4 text-lg bg-orange-500 hover:bg-orange-600 text-white rounded-2xl flex items-center justify-center gap-2 mt-2 shadow-lg shadow-orange-500/30"
            >
              Start Learning <span>&rarr;</span>
            </LoadingButton>

            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium text-center">
                ⚠️ {error.includes('500') ? 'API quota exceeded — your Gemini API key has hit its daily limit. Try again tomorrow or use a different key.' : error}
              </div>
            )}

            <p className="text-sm text-gray-400 mt-2 font-medium">No account needed. Free. Instant.</p>
            
            {/* Quick Suggestions below input */}
            <div className="flex flex-wrap justify-center gap-2 mt-4 items-center">
              <span className="text-xs text-gray-400 uppercase tracking-widest font-bold mr-1">Try:</span>
              {["Machine Learning", "React Hooks", "Operating Systems"].map(subj => (
                <button
                  key={subj}
                  type="button"
                  onClick={() => handlePillClick(subj)}
                  className="text-xs bg-gray-50 hover:bg-orange-100 hover:text-orange-600 text-gray-600 px-3 py-1.5 rounded-full transition-colors font-medium border border-gray-200"
                >
                  {subj}
                </button>
              ))}
            </div>
          </form>

          {/* Social Proof */}
          <div className="mt-12 text-gray-500 font-bold text-sm flex items-center justify-center gap-2 bg-white/50 backdrop-blur border border-gray-100 px-4 py-2 rounded-full shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>{masteredCount.toLocaleString()} concepts mastered today</span>
          </div>
        </div>
      </section>

      {/* SECTION A — How it works */}
      <section className="py-24 px-6 md:px-12 bg-white border-t border-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            {[
              { num: "01", title: "Diagnose", desc: "5-7 adaptive questions reveal your exact knowledge gaps." },
              { num: "02", title: "Map", desc: "AI builds your personal concept DAG from scratch." },
              { num: "03", title: "Master", desc: "Concept-by-concept with real-time adaptation." }
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 flex flex-col items-center md:items-start"
              >
                <div className="text-5xl font-black text-orange-500 mb-6 tracking-tighter">{step.num}</div>
                <h3 className="text-2xl font-bold mb-3 text-dark tracking-tight">{step.title}</h3>
                <p className="text-muted text-lg leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION B — Agent showcase */}
      <section className="py-32 px-6 bg-[#0A0A0A] text-white overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black mb-16 text-center tracking-tight text-white"
          >
            5 agents. One goal.
          </motion.h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { name: "DiagnosticAgent", role: "Knowledge Scanner" },
              { name: "PathwayAgent", role: "Curriculum Architect" },
              { name: "TutorAgent", role: "Adaptive Explainer" },
              { name: "AssessmentAgent", role: "Understanding Verifier" },
              { name: "AdaptationAgent", role: "Learning Optimizer" }
            ].map((agent, i) => (
              <motion.div 
                key={agent.name} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-[#111111] border border-[#222222] p-6 rounded-2xl flex flex-col justify-start hover:border-orange-500/50 hover:bg-[#1a1a1a] transition-all duration-300 shadow-lg cursor-default"
              >
                <h4 className="text-[17px] font-bold mb-2 tracking-tight text-[#FF6600]">{agent.name}</h4>
                <p className="text-gray-400 text-sm font-medium leading-relaxed">{agent.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION C — Mastery Pills */}
      <section className="py-32 px-6 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black mb-14 text-dark tracking-tight"
          >
            What will you master today?
          </motion.h2>
          <div className="flex flex-wrap justify-center gap-4">
            {["Machine Learning", "React", "Operating Systems", "Calculus", "Data Structures", "System Design"].map((preset, i) => (
              <motion.button
                key={preset}
                initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                onClick={() => {
                  handlePillClick(preset)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="px-6 py-4 bg-white border-2 border-orange-500 text-orange-600 font-bold text-lg rounded-full hover:bg-orange-500 hover:text-white transition-colors duration-300 shadow-sm"
              >
                {preset}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
