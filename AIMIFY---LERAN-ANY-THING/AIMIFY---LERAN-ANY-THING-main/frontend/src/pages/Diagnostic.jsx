import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from '../context/SessionContext'
import { api } from '../api/client'
import { Loader2, BrainCircuit } from 'lucide-react'
import ErrorToast from '../components/ErrorToast'
import LoadingButton from '../components/LoadingButton'
import { useApiCall } from '../hooks/useApiCall'

export default function Diagnostic() {
  const { 
    sessionId, subject, questions, 
    submitDiagnostic, 
    agentEvents, addAgentEvent 
  } = useSession()
  const navigate = useNavigate()
  const { loading, call } = useApiCall()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selectedOption, setSelectedOption] = useState(null)
  const [localError, setLocalError] = useState(null)
  
  useEffect(() => {
    if (!sessionId) return
    const unsubscribe = api.streamEvents(sessionId, (event) => {
      addAgentEvent(event)
    })
    return () => unsubscribe()
  }, [sessionId, addAgentEvent])

  if (!questions || questions.length === 0) {
    return <Navigate to="/" replace />
  }

  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1

  const handleNext = async () => {
    if (selectedOption === null) return

    const newAnswer = {
      question_index: currentIndex,
      selected_index: selectedOption
    }
    const newAnswers = [...answers, newAnswer]
    setAnswers(newAnswers)

    if (isLastQuestion) {
      try {
        await call(async () => {
          await submitDiagnostic(newAnswers)
          navigate('/pathway')
        })
      } catch (err) {
        setLocalError(err.response?.data?.error || err.message || "An error occurred. Please try again.")
      }
    } else {
      setSelectedOption(null)
      setCurrentIndex(prev => prev + 1)
    }
  }

  const progressPercent = ((currentIndex) / questions.length) * 100

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans text-dark">
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center pt-8 px-6 relative">
        
        {/* Top Progress Bar & Subject */}
        <div className="w-full max-w-2xl mb-12">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-semibold text-muted uppercase tracking-wider">{subject}</span>
            <span className="text-sm font-semibold text-orange-500">
              {currentIndex + 1} of {questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <motion.div 
              className="bg-orange-500 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Question Card Container */}
        <div className="w-full max-w-2xl relative min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-200"
            >
              <div className="mb-6 inline-block px-3 py-1 bg-orange-50 text-orange-600 font-semibold text-xs rounded-full uppercase tracking-wide">
                {currentQuestion.concept_cluster}
              </div>
              
              <h2 className="text-2xl md:text-3xl font-[600] leading-tight mb-10 text-dark">
                {currentQuestion.question}
              </h2>

              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedOption(idx)}
                      className={`w-full text-left px-6 py-4 rounded-xl border-2 transition-all duration-200 font-medium ${
                        isSelected 
                          ? 'bg-orange-500 border-orange-500 text-white shadow-sm' 
                          : 'bg-white border-gray-200 text-dark hover:border-orange-200 hover:bg-orange-50'
                      }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>

              <div className="mt-12 flex justify-end">
                <LoadingButton
                  onClick={handleNext}
                  loading={isLastQuestion && loading}
                  disabled={selectedOption === null}
                  className={`btn-primary flex items-center gap-2 ${selectedOption === null ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLastQuestion ? "Complete Diagnosis →" : "Next →"}
                </LoadingButton>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Full Screen Loading Overlay for Submission */}
        <AnimatePresence>
          {loading && isLastQuestion && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl"
            >
              <div className="relative w-20 h-20 mb-6">
                <Loader2 className="w-20 h-20 text-orange-200 animate-spin absolute" strokeWidth={2} />
                <Loader2 className="w-20 h-20 text-orange-500 animate-spin absolute" style={{ animationDirection: 'reverse', animationDuration: '2s' }} strokeWidth={2} />
                <BrainCircuit className="w-8 h-8 text-orange-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h3 className="text-2xl font-bold text-dark mb-2">Analyzing your knowledge...</h3>
              <p className="text-muted font-medium">DiagnosticAgent is building your profile.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Sidebar: Live Agent Feed */}
      <div className="hidden lg:flex w-80 bg-white border-l border-gray-200 p-6 flex-col z-10">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <h3 className="font-bold text-sm tracking-widest uppercase text-gray-400">Live AI Feed</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          <AnimatePresence initial={false}>
            {agentEvents.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="p-4 bg-white border border-gray-200 rounded-2xl"
              >
                <div className="text-xs font-bold text-orange-500 mb-1">{event.agent}</div>
                <div className="text-sm font-medium text-dark leading-snug">{event.message}</div>
              </motion.div>
            ))}
          </AnimatePresence>
          {agentEvents.length === 0 && (
            <div className="text-sm text-gray-400 italic text-center mt-10">Listening for agent actions...</div>
          )}
        </div>
      </div>

      <ErrorToast error={localError} onClose={() => setLocalError(null)} />
    </div>
  )
}
