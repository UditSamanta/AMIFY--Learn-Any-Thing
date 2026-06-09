import { useEffect, useState, useMemo } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSession } from '../context/SessionContext'
import ConceptGraph3D from '../components/ConceptGraph3D'
import {
  CheckCircle2, Clock, Brain, Sparkles,
  RotateCcw, ArrowRight, Share2, Home,
  ChevronRight, SkipForward
} from 'lucide-react'

/* ═══════════════════════════════════════════
   CSS-only Confetti
   ═══════════════════════════════════════════ */
const confettiColors = ['#FF6600', '#FF8533', '#FFD4B3', '#FFFFFF', '#FFF3EB', '#E65C00']

function ConfettiPiece({ index }) {
  const style = useMemo(() => {
    const left = Math.random() * 100
    const delay = Math.random() * 3
    const duration = 2.5 + Math.random() * 2
    const size = 6 + Math.random() * 6
    const color = confettiColors[index % confettiColors.length]
    const rotation = Math.random() * 360

    return {
      position: 'absolute',
      left: `${left}%`,
      top: '-10px',
      width: `${size}px`,
      height: `${size * 1.6}px`,
      backgroundColor: color,
      borderRadius: '2px',
      opacity: 0,
      transform: `rotate(${rotation}deg)`,
      animation: `confettiFall ${duration}s ease-in ${delay}s infinite`,
      pointerEvents: 'none',
    }
  }, [index])

  return <div style={style} />
}

function Confetti() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {Array.from({ length: 40 }).map((_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════
   Animated Checkmark
   ═══════════════════════════════════════════ */
function AnimatedCheck() {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
      className="relative"
    >
      {/* Outer ring glow */}
      <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping" />
      <div className="w-28 h-28 rounded-full bg-orange-500 flex items-center justify-center shadow-sm">
        <motion.div
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <CheckCircle2 className="w-14 h-14 text-white" strokeWidth={2.5} />
        </motion.div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════
   Stat Card
   ═══════════════════════════════════════════ */
function StatCard({ icon: Icon, label, value, sub, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 100 }}
      className="flex-1 bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="w-10 h-10 mx-auto mb-3 bg-orange-50 rounded-xl flex items-center justify-center">
        <Icon className="w-5 h-5 text-orange-500" />
      </div>
      <p className="text-3xl font-extrabold text-dark tracking-tight">{value}</p>
      <p className="text-sm font-semibold text-muted mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </motion.div>
  )
}

/* ═══════════════════════════════════════════
   Timeline Item
   ═══════════════════════════════════════════ */
function TimelineItem({ concept, index, total }) {
  const statusIcon = () => {
    if (concept.status === 'PASSED') return <CheckCircle2 className="w-5 h-5 text-orange-500" />
    if (concept.status === 'SKIPPED') return <SkipForward className="w-5 h-5 text-gray-400" />
    if (concept.attempts > 1) return <RotateCcw className="w-5 h-5 text-orange-400" />
    return <ArrowRight className="w-5 h-5 text-gray-400" />
  }

  const score = concept.score ?? 0
  const isLast = index === total - 1

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8 + index * 0.08 }}
      className="flex items-start gap-4"
    >
      {/* Timeline spine */}
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
          concept.status === 'PASSED'
            ? 'border-orange-500 bg-orange-50'
            : concept.status === 'SKIPPED'
            ? 'border-gray-300 bg-gray-50'
            : 'border-gray-300 bg-white'
        }`}>
          {statusIcon()}
        </div>
        {!isLast && (
          <div className={`w-0.5 h-12 ${
            concept.status === 'PASSED' ? 'bg-orange-200' : 'bg-gray-200'
          }`} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-center justify-between mb-1.5">
          <h4 className={`font-bold text-sm ${
            concept.status === 'SKIPPED' ? 'text-gray-400 line-through' : 'text-dark'
          }`}>
            {concept.name}
          </h4>
          {concept.attempts > 0 && (
            <span className="text-xs text-gray-400 font-medium">
              {concept.attempts} attempt{concept.attempts !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Score bar */}
        {concept.status !== 'SKIPPED' && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-orange-500"
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(score * 100)}%` }}
                transition={{ delay: 1 + index * 0.08, duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs font-bold text-orange-500 w-10 text-right">
              {Math.round(score * 100)}%
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════
   Complete Page
   ═══════════════════════════════════════════ */
export default function Complete() {
  const {
    sessionId, subject, pathway, progress,
    refreshProgress, loading
  } = useSession()
  const navigate = useNavigate()
  const [sessionMinutes, setSessionMinutes] = useState(0)

  // On mount — refresh progress & calculate session time
  useEffect(() => {
    if (sessionId) {
      refreshProgress().catch(console.error)
    }
  }, [sessionId, refreshProgress])

  // Calculate session time from progress data
  useEffect(() => {
    if (progress?.session_created_at) {
      const created = new Date(progress.session_created_at)
      const now = new Date()
      setSessionMinutes(Math.max(1, Math.round((now - created) / 60000)))
    } else if (pathway) {
      // Fallback: estimate from concept count
      const mins = (pathway.concepts?.length || 5) * 3
      setSessionMinutes(mins)
    }
  }, [progress, pathway])

  // Guard: if no session, redirect home
  if (!sessionId) return <Navigate to="/" replace />

  // Guard: if state isn't COMPLETE, redirect to tutor
  if (progress && progress.state && progress.state !== 'COMPLETE') {
    return <Navigate to="/tutor" replace />
  }

  const concepts = pathway?.concepts || []
  const conceptsCompleted = concepts.length

  // Build concept timeline data from progress
  const timelineData = useMemo(() => {
    return concepts.map((concept) => {
      const cp = progress?.concept_progress?.find(
        (p) => p.concept_name === concept.concept || p.concept_id === concept.concept
      )
      return {
        name: concept.concept,
        status: cp?.status || 'NOT_STARTED',
        score: cp?.score ?? 0,
        attempts: cp?.attempts ?? 0,
      }
    })
  }, [concepts, progress])

  // All progress entries for the 3D graph
  const graphProgress = progress?.concept_progress || []

  // Knowledge level label
  const knowledgeLabel = useMemo(() => {
    const overall = progress?.knowledge_profile?.overall_score
    if (overall == null) return { before: 'Beginner', after: 'Advanced' }
    const before = overall < 0.4 ? 'Beginner' : overall < 0.7 ? 'Intermediate' : 'Advanced'
    return { before, after: 'Advanced' }
  }, [progress])

  return (
    <div className="min-h-screen bg-white text-dark font-sans relative overflow-hidden">
      {/* Confetti keyframes */}
      <style>{`
        @keyframes confettiFall {
          0%   { opacity: 1; transform: translateY(0) rotate(0deg); }
          100% { opacity: 0; transform: translateY(100vh) rotate(720deg); }
        }
      `}</style>

      {/* ─── SECTION 1: Hero ─── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-20 pb-16 min-h-[50vh]">
        <Confetti />

        <div className="relative z-10 flex flex-col items-center">
          <AnimatedCheck />

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 80 }}
            className="text-[36px] md:text-[48px] font-[800] leading-[1.1] tracking-tight mt-8 text-dark"
          >
            You mastered {subject || 'the subject'}!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-lg text-muted mt-4 max-w-md"
          >
            Completed in <span className="font-bold text-dark">{sessionMinutes} minutes</span> across{' '}
            <span className="font-bold text-dark">{conceptsCompleted} concepts</span>
          </motion.p>
        </div>
      </section>

      {/* ─── SECTION 2: Stats Row ─── */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <div className="flex flex-col sm:flex-row gap-4">
          <StatCard
            icon={Brain}
            label="Concepts Mastered"
            value={conceptsCompleted}
            delay={0.6}
          />
          <StatCard
            icon={Clock}
            label="Total Time"
            value={`${sessionMinutes}m`}
            sub="Learning time"
            delay={0.7}
          />
          <StatCard
            icon={Sparkles}
            label="Knowledge Gain"
            value={`${knowledgeLabel.before} → ${knowledgeLabel.after}`}
            delay={0.8}
          />
        </div>
      </section>

      {/* ─── SECTION 3: Concept Journey Timeline ─── */}
      <section className="max-w-xl mx-auto px-6 pb-16">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-8 text-center"
        >
          Your Learning Journey
        </motion.h2>

        <div>
          {timelineData.map((concept, i) => (
            <TimelineItem
              key={concept.name}
              concept={concept}
              index={i}
              total={timelineData.length}
            />
          ))}
        </div>
      </section>

      {/* ─── SECTION 4: 3D Graph ─── */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-6 text-center"
        >
          Your Completed Knowledge Graph
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="bg-[#1A1A1A] rounded-2xl border border-gray-800 overflow-hidden"
          style={{ height: 420 }}
        >
          <ConceptGraph3D
            concepts={concepts}
            progress={graphProgress}
            currentConceptIndex={-1}
            onNodeClick={() => {}}
          />
        </motion.div>
      </section>

      {/* ─── SECTION 5: CTAs ─── */}
      <section className="max-w-lg mx-auto px-6 pb-24">
        <div className="flex flex-col sm:flex-row gap-4">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            onClick={() => navigate('/report')}
            className="btn-primary flex-1 flex items-center justify-center gap-2 py-4 text-base font-bold rounded-2xl whitespace-nowrap"
          >
            Personalized Roadmap
            <ArrowRight className="w-5 h-5 shrink-0" />
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            onClick={() => navigate('/')}
            className="btn-secondary flex-1 flex items-center justify-center gap-2 py-4 text-base font-bold rounded-2xl whitespace-nowrap"
          >
            <Home className="w-5 h-5 shrink-0" />
            Start New Aim
          </motion.button>
        </div>
      </section>
    </div>
  )
}
