import { useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSession } from '../context/SessionContext'
import { api } from '../api/client'
import AgentFeed from '../components/AgentFeed'
import TutorBackground3D from '../components/TutorBackground3D'
import { Lightbulb, BookOpen, Zap, Sparkles, AlertCircle, ChevronRight, CheckCircle2, Loader2, BookMarked, Map } from 'lucide-react'

export default function Tutor() {
  const { 
    sessionId, pathway, currentConcept, explanation, 
    loadCurrentConcept, loading, error,
    agentEvents, addAgentEvent 
  } = useSession()
  const navigate = useNavigate()

  useEffect(() => {
    if (!sessionId) return
    const unsubscribe = api.streamEvents(sessionId, (event) => {
      addAgentEvent(event)
    })
    return () => unsubscribe()
  }, [sessionId, addAgentEvent])

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false
    const load = async () => {
      if (!cancelled && !explanation && !loading) {
        try {
          const data = await loadCurrentConcept()
          if (!cancelled && (data?.completed || data?.next_state === 'COMPLETE')) {
            navigate('/complete')
          }
        } catch (error) {
          console.error(error)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [sessionId])

  if (!sessionId) return <Navigate to="/" replace />

  // Loading state
  if (!explanation) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
        {!error ? (
          <>
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-dark mb-2">Generating your lesson...</h2>
            <p className="text-muted">TutorAgent is crafting a personalized explanation.</p>
          </>
        ) : (
          <>
            <AlertCircle className="w-12 h-12 text-red-500 mb-6" />
            <h2 className="text-2xl font-bold text-dark mb-2">Lesson Generation Failed</h2>
            <p className="text-red-500 max-w-md text-center">
              {error.includes('500') || error.includes('exceeded') 
                ? 'Your Gemini API key has hit its daily rate limit again. You will need a new key with full quota to continue.' 
                : error}
            </p>
            <button 
              onClick={() => navigate('/')}
              className="mt-6 btn-secondary px-6 py-2 rounded-xl"
            >
              Back to Home
            </button>
          </>
        )}
        
        {/* Simplified feed while loading */}
        <div className="w-full max-w-sm mt-12 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
           <AgentFeed events={agentEvents} />
        </div>
      </div>
    )
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  }

  // Paragraph splitting for core explanation
  const coreParagraphs = explanation.core_explanation
    .split(/\n+/)
    .filter(p => p.trim() !== '')

  return (
    <div className="min-h-screen bg-white text-dark font-sans selection:bg-orange-100 selection:text-orange-600 relative overflow-hidden">
      
      {/* 3D Atmospheric Background */}
      <TutorBackground3D />
      
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
          <BookMarked className="w-4 h-4 text-orange-500" />
          <span className="hover:text-dark cursor-pointer transition-colors" onClick={() => navigate('/pathway')}>
            {pathway?.subject || "Subject"}
          </span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-dark">{currentConcept?.concept || explanation.concept}</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
           <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Session Active</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row min-h-[calc(100vh-65px)]">
        
        {/* LEFT COLUMN: Main Content Area */}
        <div className="flex-1 lg:w-2/3 px-6 py-12 lg:py-20 flex justify-center">
          <div className="w-full max-w-[680px]">
            
            {/* Header Area */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-xs font-bold uppercase tracking-widest border border-orange-200 shadow-sm">
                  {currentConcept?.depth_level === 1 ? 'Beginner' : currentConcept?.depth_level === 2 ? 'Intermediate' : 'Advanced'}
                </span>
                <span className="text-sm font-medium text-gray-400">~{currentConcept?.estimated_minutes || 15} min read</span>
              </div>
              
              <h1 className="text-[40px] md:text-[48px] font-[800] leading-[1.1] tracking-tight text-dark mb-4">
                {explanation.concept}
              </h1>
            </motion.div>

            {/* Explanation Content */}
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-12 pb-24">
              
              {/* SECTION 1 — Analogy */}
              <motion.section variants={itemVariants} className="bg-orange-50 border-l-4 border-orange-500 p-8 rounded-r-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-4 text-orange-600">
                  <Lightbulb className="w-6 h-6" />
                  <h3 className="font-bold text-lg tracking-tight">The Analogy</h3>
                </div>
                <p className="text-lg leading-relaxed text-dark/90 font-medium">
                  {explanation.analogy}
                </p>
              </motion.section>

              {/* SECTION 2 — Core Explanation */}
              <motion.section variants={itemVariants} className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-6 text-dark">
                  <BookOpen className="w-6 h-6 text-orange-500" />
                  <h3 className="font-bold text-xl tracking-tight">The Explanation</h3>
                </div>
                <div className="space-y-6 text-lg leading-loose text-gray-700">
                  {coreParagraphs.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </motion.section>

              {/* SECTION 3 — Worked Example */}
              <motion.section variants={itemVariants} className="bg-[#1A1A1A] p-8 md:p-10 rounded-3xl shadow-sm border border-gray-800 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-transparent"></div>
                <div className="flex items-center gap-3 mb-6 text-white">
                  <Zap className="w-6 h-6 text-orange-400" />
                  <h3 className="font-bold text-xl tracking-tight">Worked Example</h3>
                </div>
                <div className="font-mono text-[15px] leading-relaxed text-gray-300 p-6 bg-[#111111] rounded-2xl border border-[#333333] overflow-x-auto whitespace-pre-wrap">
                  {explanation.worked_example}
                </div>
              </motion.section>

              {/* SECTION 4 — Key Takeaway */}
              <motion.section variants={itemVariants} className="bg-orange-500 p-8 md:p-10 rounded-3xl shadow-sm text-white">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                  <h3 className="font-bold text-xl tracking-tight">Key Takeaway</h3>
                </div>
                <p className="text-xl font-medium leading-relaxed">
                  {explanation.key_takeaway}
                </p>
              </motion.section>

              {/* Question Preview & Action Area */}
              <motion.div variants={itemVariants} className="pt-8 border-t border-gray-200 flex flex-col items-center text-center">
                <div className="bg-white text-gray-500 px-6 py-4 rounded-xl font-medium text-sm mb-8 flex items-start gap-3 w-full border border-gray-200">
                  <AlertCircle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                  <div className="text-left">
                    <span className="block font-bold text-gray-700 mb-1">Preview Question:</span>
                    <span className="italic">{explanation.check_question}</span>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/assessment')}
                  className="btn-primary w-full md:w-auto px-12 py-5 text-xl font-bold rounded-2xl flex items-center justify-center gap-3 group hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Take the Quiz 
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>

            </motion.div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar (Progress & Agent Feed) */}
        <div className="w-full lg:w-1/3 bg-white border-l border-gray-200 flex flex-col min-h-screen">
          
          {/* Progress Mini-Map */}
          <div className="p-6 border-b border-gray-200 bg-white">
            <h4 className="font-bold text-xs text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6">
              <Map className="w-3 h-3" /> Pathway Sequence
            </h4>
            
            <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
              {pathway?.concepts.map((concept, idx) => {
                // Determine state: past (completed), present (active), future (pending)
                const isCurrent = currentConcept?.concept === concept.concept;
                // Assuming logic: if not current, and occurs before current, it's "completed"
                const activeIndex = pathway.concepts.findIndex(c => c.concept === currentConcept?.concept);
                const isCompleted = idx < activeIndex;

                return (
                  <div key={concept.concept} className={`flex items-start gap-3 text-sm font-medium transition-all ${
                    isCurrent ? 'text-orange-600 scale-105 origin-left' : 
                    isCompleted ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <div className="shrink-0 mt-0.5">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : isCurrent ? (
                        <div className="w-4 h-4 rounded-full border-4 border-orange-500 shadow-[0_0_10px_rgba(255,102,0,0.3)]"></div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                      )}
                    </div>
                    <span className={`${isCurrent ? 'font-bold' : ''} leading-tight`}>{concept.concept}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Live Agent Feed - Takes remaining height */}
          <div className="flex-1 p-6 flex flex-col">
             <AgentFeed events={agentEvents} />
          </div>

        </div>

      </div>
    </div>
  )
}
