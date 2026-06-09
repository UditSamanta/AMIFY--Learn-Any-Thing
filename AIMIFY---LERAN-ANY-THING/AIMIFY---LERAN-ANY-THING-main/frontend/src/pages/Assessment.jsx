import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from '../context/SessionContext'
import { api } from '../api/client'
import AgentFeed from '../components/AgentFeed'
import LoadingButton from '../components/LoadingButton'
import { useApiCall } from '../hooks/useApiCall'
import { CheckCircle2, XCircle, ArrowRight, ArrowLeft, RefreshCw, Layers, SkipForward, Loader2 } from 'lucide-react'

const OPTION_LABELS = ['A', 'B', 'C', 'D']

export default function Assessment() {
  const { 
    sessionId, currentConcept, explanation, mcqSet,
    submitAssessment, loadCurrentConcept, 
    agentEvents, addAgentEvent 
  } = useSession()
  const navigate = useNavigate()
  const { loading, call } = useApiCall()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({}) // { questionIndex: selectedOptionIndex }
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!sessionId) return
    const unsubscribe = api.streamEvents(sessionId, (event) => {
      addAgentEvent(event)
    })
    return () => unsubscribe()
  }, [sessionId, addAgentEvent])

  if (!sessionId || !explanation) {
    return <Navigate to="/tutor" replace />
  }

  const questions = mcqSet?.questions || []
  
  if (questions.length === 0) {
    return <Navigate to="/tutor" replace />
  }

  const currentQuestion = questions[currentIndex]
  const selectedAnswer = answers[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1
  const allAnswered = questions.every((_, i) => answers[i] !== undefined)

  const handleSelectOption = (optionIndex) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: optionIndex }))
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      await call(async () => {
        const answersArray = questions.map((_, i) => answers[i])
        const res = await submitAssessment(answersArray)
        setResult(res)

        if (res.next_state === 'COMPLETE') {
          setTimeout(() => navigate('/complete'), 2000)
        }
      })
    } catch (e) {
      // Don't leave user stuck — they can retry
      console.error('Assessment submit failed:', e)
    }
  }

  // "Next Concept" button handler — NEVER leave user stuck
  const handleNextConcept = async () => {
    try {
      await call(async () => {
        const data = await loadCurrentConcept()
        if (data?.completed || data?.next_state === 'COMPLETE') {
          navigate('/complete')
        } else {
          navigate('/tutor')
        }
      })
    } catch (e) {
      // Even if loadCurrentConcept fails, navigate so user isn't stuck
      console.error('Failed to load next concept:', e)
      navigate('/tutor')
    }
  }

  // "Try Again" button handler (failed, attempts < 2) — also never leaves user stuck
  const handleRetry = async () => {
    try {
      await call(async () => {
        const data = await loadCurrentConcept()
        if (data?.completed || data?.next_state === 'COMPLETE') {
          navigate('/complete')
        } else {
          navigate('/tutor')
        }
      })
    } catch (e) {
      console.error('Failed to reload concept:', e)
      navigate('/tutor')
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row relative font-sans text-dark">
      
      {/* LEFT COLUMN: Main Assessment Area */}
      <div className="flex-1 flex flex-col items-center pt-16 px-6 relative z-10">
        
        {/* Header & Progress */}
        <div className="w-full max-w-3xl mb-10">
          <div className="flex justify-between items-end mb-4">
            <div>
              <div className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-1">Knowledge Check</div>
              <h1 className="text-3xl font-[800] tracking-tight text-dark">{currentConcept?.concept || mcqSet?.concept}</h1>
            </div>
            <div className="text-sm font-semibold text-gray-400">
              Question {currentIndex + 1} of {questions.length}
            </div>
          </div>
          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              className="bg-orange-500 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="w-full max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="mb-8"
            >
              {/* Question Text */}
              <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-200 mb-6">
                <h2 className="text-[22px] font-[600] leading-snug text-dark">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Option Cards */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, optIdx) => {
                  const isSelected = selectedAnswer === optIdx
                  return (
                    <motion.button
                      key={optIdx}
                      onClick={() => handleSelectOption(optIdx)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-start gap-4 cursor-pointer ${
                        isSelected
                          ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-orange-50 hover:border-orange-300'
                      }`}
                    >
                      <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {OPTION_LABELS[optIdx]}
                      </span>
                      <span className="text-[16px] font-medium leading-relaxed pt-0.5">
                        {option}
                      </span>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center mb-16">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0 || loading}
              className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-xl transition-colors ${
                currentIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-dark hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="w-5 h-5" /> Previous
            </button>

            {isLastQuestion ? (
              <LoadingButton
                onClick={handleSubmit}
                loading={loading}
                disabled={!allAnswered}
                className="btn-primary px-8 py-4 flex items-center gap-3 text-lg"
              >
                Submit Answers
              </LoadingButton>
            ) : (
              <button
                onClick={handleNext}
                disabled={selectedAnswer === undefined || loading}
                className="btn-primary px-8 py-3 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Next <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Sidebar (Desktop) */}
      <div className="hidden lg:flex w-80 bg-white border-l border-gray-200 p-6 flex-col shrink-0">
        <AgentFeed events={agentEvents} />
      </div>

      {/* FULL SCREEN LOADING OVERLAY */}
      <AnimatePresence>
        {loading && !result && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center"
          >
            <Loader2 className="w-16 h-16 text-orange-500 animate-spin mb-6" strokeWidth={2} />
            <h2 className="text-3xl font-bold tracking-tight text-dark mb-2">Evaluating...</h2>
            <p className="text-muted font-medium text-lg">Checking your answers...</p>
            
            <div className="w-full max-w-md mt-12 bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
               <AgentFeed events={agentEvents} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULL SCREEN RESULT OVERLAY */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-50 bg-white overflow-y-auto"
          >
            <div className="min-h-screen flex flex-col items-center justify-start p-6 py-20">
              <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-[32px] shadow-md p-10 md:p-14">
                
                {/* Result Header */}
                <div className="flex flex-col items-center text-center mb-10">
                  {result.next_state === 'COMPLETE' ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </motion.div>
                  ) : result.passed ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </motion.div>
                  ) : (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                      <XCircle className="w-12 h-12 text-orange-500" />
                    </motion.div>
                  )}
                  
                  <h1 className="text-4xl font-[800] tracking-tight mb-2">
                    {result.next_state === 'COMPLETE' 
                      ? "🎉 You've completed this subject!" 
                      : result.passed 
                        ? "Concept Mastered! 🎉" 
                        : "Not quite yet..."}
                  </h1>
                  <p className="text-gray-500 font-medium text-lg">
                    {result.next_state === 'COMPLETE'
                      ? "Amazing work! Heading to your results..."
                      : result.feedback || result.result?.feedback}
                  </p>
                </div>

                {/* Score Bar */}
                {result.score !== undefined && (
                  <div className="mb-10">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Score</span>
                      <span className="text-2xl font-bold text-dark">
                        {result.result?.correct_count ?? Math.round(result.score * (questions.length))}/{result.result?.total_count ?? questions.length} correct
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${Math.min(100, result.score * 100)}%` }} transition={{ duration: 1, delay: 0.5 }}
                        className={`h-full rounded-full ${result.passed ? 'bg-green-500' : 'bg-orange-500'}`}
                      />
                    </div>
                  </div>
                )}

                {/* Per-Question Results */}
                {result.per_question_results && (
                  <div className="space-y-4 mb-12">
                    <h3 className="font-bold text-sm text-gray-400 uppercase tracking-widest mb-4">Question Results</h3>
                    
                    {result.per_question_results.map((qr, i) => {
                      const question = questions[i]
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + i * 0.15 }}
                          className={`p-6 rounded-2xl border ${
                            qr.correct 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <div className="flex items-start gap-3 mb-3">
                            {qr.correct ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className={`font-semibold text-[15px] mb-2 ${qr.correct ? 'text-green-800' : 'text-red-800'}`}>
                                {question?.question}
                              </p>
                              
                              {!qr.correct && question && (
                                <div className="mb-2 text-sm">
                                  <span className="text-red-600 font-medium">Your answer: </span>
                                  <span className="text-red-700">{OPTION_LABELS[qr.selected_index]}. {question.options[qr.selected_index]}</span>
                                  <br />
                                  <span className="text-green-600 font-medium">Correct answer: </span>
                                  <span className="text-green-700">{OPTION_LABELS[qr.correct_index]}. {question.options[qr.correct_index]}</span>
                                </div>
                              )}

                              <p className={`text-sm font-medium ${qr.correct ? 'text-green-700' : 'text-red-700'}`}>
                                💡 {qr.explanation}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}

                {/* Adaptation Decision Card (If failed multiple times) */}
                {result.adaptation && (
                  <div className="bg-[#1A1A1A] text-white p-6 rounded-2xl shadow-xl mb-12 border border-orange-500/30">
                    <h4 className="font-bold text-orange-400 mb-2 text-sm uppercase tracking-widest">Tutor Adaptation</h4>
                    <div className="flex items-center gap-4">
                      {result.adaptation.decision === 'SIMPLIFY' && <RefreshCw className="w-8 h-8 text-orange-500" />}
                      {result.adaptation.decision === 'INSERT_PREREQ' && <Layers className="w-8 h-8 text-orange-500" />}
                      {result.adaptation.decision === 'SKIP' && <SkipForward className="w-8 h-8 text-orange-500" />}
                      
                      <div>
                        <p className="font-bold text-lg">
                          {result.adaptation.decision === 'SIMPLIFY' && "Simplifying the explanation for you..."}
                          {result.adaptation.decision === 'INSERT_PREREQ' && "Adding a prerequisite concept first..."}
                          {result.adaptation.decision === 'SKIP' && "Moving on — you'll revisit this later."}
                        </p>
                        {result.adaptation.reason && (
                          <p className="text-gray-400 text-sm mt-1">{result.adaptation.reason}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions — depends on state */}
                <div className="flex justify-center">
                  {result.next_state === 'COMPLETE' ? (
                    <LoadingButton
                      onClick={() => navigate('/complete')}
                      loading={false}
                      className="btn-primary w-full py-4 text-xl flex items-center justify-center gap-2"
                    >
                      View Your Progress →
                    </LoadingButton>
                  ) : result.passed ? (
                    <LoadingButton
                      onClick={handleNextConcept}
                      loading={loading}
                      className="btn-primary w-full py-4 text-xl flex items-center justify-center gap-2"
                    >
                      Next Concept →
                    </LoadingButton>
                  ) : result.next_state === 'TEACH' ? (
                    <LoadingButton
                      onClick={handleNextConcept}
                      loading={loading}
                      className="btn-primary w-full py-4 text-xl flex items-center justify-center gap-2"
                    >
                      Continue →
                    </LoadingButton>
                  ) : (
                    <LoadingButton
                      onClick={handleRetry}
                      loading={loading}
                      className="btn-secondary w-full py-4 text-xl flex items-center justify-center gap-2"
                    >
                      Re-read & Try Again
                    </LoadingButton>
                  )}
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
