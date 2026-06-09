import { useEffect, useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSession } from '../context/SessionContext'
import {
  Zap, Clock, BarChart3, ArrowRight, Copy, RotateCcw,
  CheckCircle2, AlertTriangle, BookOpen, Youtube, Monitor,
  Wrench, Star, ExternalLink, Rocket, Target, ChevronRight,
  Home
} from 'lucide-react'

/* ═══════════════════════════════════════════
   Type Badge for Resources
   ═══════════════════════════════════════════ */
const typeBadge = {
  youtube:  { bg: '#FF000018', color: '#DC2626', icon: Youtube },
  course:   { bg: '#3B82F618', color: '#2563EB', icon: Monitor },
  book:     { bg: '#10B98118', color: '#059669', icon: BookOpen },
  platform: { bg: '#8B5CF618', color: '#7C3AED', icon: BarChart3 },
  tool:     { bg: '#F5950018', color: '#D97706', icon: Wrench },
}

function ResourceTypeBadge({ type }) {
  const badge = typeBadge[type?.toLowerCase()] || typeBadge.tool
  const Icon = badge.icon
  return (
    <span
      style={{ background: badge.bg, color: badge.color }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
    >
      <Icon className="w-3 h-3" />
      {type}
    </span>
  )
}

/* ═══════════════════════════════════════════
   Loading Skeleton
   ═══════════════════════════════════════════ */
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          className="w-16 h-16 mx-auto mb-6 border-4 border-orange-500/30 border-t-orange-500 rounded-full"
        />
        <h2 className="text-2xl font-bold text-white mb-2">Generating Your Roadmap</h2>
        <p className="text-gray-400">Our AI agents are building your personalized plan...</p>
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   Phase Card
   ═══════════════════════════════════════════ */
function PhaseCard({ phase, resources, index }) {
  const phaseResources = resources?.phase_resources?.find(
    pr => pr.phase_number === phase.phase_number
  )?.resources || []

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.1 }}
      className="bg-[#111111] border border-[#1F1F1F] rounded-2xl overflow-hidden"
    >
      {/* Phase Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/15 flex items-center justify-center flex-shrink-0">
            <span className="text-orange-500 font-black text-lg">{phase.phase_number}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">{phase.title}</h3>
            <div className="flex flex-wrap gap-3 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {phase.duration_weeks} weeks
              </span>
              <span className="flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5" />
                {phase.daily_hours}h/day
              </span>
            </div>
          </div>
        </div>

        <p className="text-gray-300 text-sm leading-relaxed mb-4">{phase.focus}</p>

        {/* Key Activities */}
        <div className="space-y-2 mb-4">
          {phase.key_activities?.map((activity, i) => (
            <div key={i} className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
              <span className="text-sm text-gray-300">{activity}</span>
            </div>
          ))}
        </div>

        {/* Milestone */}
        {phase.milestone && (
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">
                Milestone — Week {phase.milestone.week}
              </span>
            </div>
            <p className="text-sm font-semibold text-white">{phase.milestone.title}</p>
            <p className="text-xs text-gray-400 mt-1">{phase.milestone.how_to_verify}</p>
          </div>
        )}
      </div>

      {/* Honest Note */}
      {phase.honest_note && (
        <div className="mx-6 mb-4 border-l-2 border-orange-500/50 pl-4 py-2">
          <p className="text-sm text-gray-400 italic">{phase.honest_note}</p>
        </div>
      )}

      {/* Resources for this phase */}
      {phaseResources.length > 0 && (
        <div className="border-t border-[#1F1F1F] px-6 py-4">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Resources for this phase
          </h4>
          <div className="space-y-3">
            {phaseResources.map((resource, ri) => (
              <div key={ri} className="bg-[#0A0A0A] rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-sm font-bold text-white">{resource.name}</span>
                  <div className="flex items-center gap-2">
                    <ResourceTypeBadge type={resource.type} />
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      resource.is_free
                        ? 'bg-green-500/15 text-green-400'
                        : 'bg-yellow-500/15 text-yellow-400'
                    }`}>
                      {resource.is_free ? 'FREE' : 'PAID'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 italic">"Why for you:" {resource.why_for_you}</p>
                <div className="flex items-center justify-between text-xs">
                  <code className="text-gray-500 bg-[#111] px-2 py-1 rounded font-mono">
                    {resource.search_hint}
                  </code>
                  <span className="text-gray-500">~{resource.estimated_hours}h</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

/* ═══════════════════════════════════════════
   FinalReport Page
   ═══════════════════════════════════════════ */
export default function FinalReport() {
  const {
    sessionId, aim, subject, roadmap, resources,
    loadRoadmap, loading
  } = useSession()
  const navigate = useNavigate()
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    if (sessionId && !roadmap) {
      loadRoadmap().catch(console.error)
    }
  }, [sessionId, roadmap, loadRoadmap])

  if (!sessionId) return <Navigate to="/" replace />
  if (loading || !roadmap) return <LoadingSkeleton />

  const displayAim = roadmap.aim || aim || subject || 'your goal'

  /* Copy roadmap to clipboard */
  const handleCopy = () => {
    const text = [
      `🎯 PERSONALIZED ROADMAP TO: ${displayAim}`,
      `Level: ${roadmap.student_level} | Timeline: ${roadmap.total_weeks} weeks | ${roadmap.daily_commitment_hours}h/day`,
      '',
      `⚡ IMMEDIATE NEXT ACTION:`,
      roadmap.immediate_next_action,
      '',
      ...roadmap.phases.map(p => [
        `── Phase ${p.phase_number}: ${p.title} (${p.duration_weeks} weeks, ${p.daily_hours}h/day) ──`,
        p.focus,
        ...p.key_activities.map(a => `  • ${a}`),
        `  📍 Milestone week ${p.milestone.week}: ${p.milestone.title}`,
        p.honest_note ? `  💡 ${p.honest_note}` : '',
        ''
      ]).flat(),
      '⚠️ MISTAKES TO AVOID:',
      ...roadmap.common_mistakes.map(m => `  ✗ ${m}`),
      '',
      '✅ SUCCESS METRICS:',
      ...roadmap.success_metrics.map(m => `  ✓ ${m}`),
      '',
      `📝 ${roadmap.realistic_timeline_note}`
    ].join('\n')

    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    })
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-orange-500/30">

      {/* ─── SECTION 1: Hero Header ─── */}
      <section className="relative px-6 pt-20 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 text-xs font-bold text-orange-500 uppercase tracking-widest mb-6 bg-orange-500/10 px-4 py-2 rounded-full border border-orange-500/20"
          >
            <Rocket className="w-3.5 h-3.5" />
            AI-Generated Personalized Roadmap
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[36px] md:text-[52px] font-[800] leading-[1.1] tracking-tight mb-6"
          >
            Your Roadmap to:{' '}
            <span className="text-orange-500">{displayAim}</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-4"
          >
            <span className="px-3 py-1.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-full text-sm font-semibold text-gray-300">
              Level: <span className="text-orange-400">{roadmap.student_level}</span>
            </span>
            <span className="px-3 py-1.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-full text-sm font-semibold text-gray-300">
              <Clock className="w-3.5 h-3.5 inline mr-1" />
              {roadmap.total_weeks} weeks
            </span>
            <span className="px-3 py-1.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-full text-sm font-semibold text-gray-300">
              {roadmap.daily_commitment_hours}h/day
            </span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-500 text-sm"
          >
            Generated based on your diagnostic assessment and learning session
          </motion.p>
        </div>
      </section>

      {/* ─── SECTION 2: Immediate Action ─── */}
      <section className="px-6 pb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-3xl mx-auto bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 shadow-2xl shadow-orange-500/20"
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-white" />
            <span className="text-sm font-bold text-white/80 uppercase tracking-wider">
              Start here. Do this in the next 24 hours:
            </span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-white leading-relaxed">
            {roadmap.immediate_next_action}
          </p>
        </motion.div>
      </section>

      {/* ─── SECTION 3: Timeline Overview ─── */}
      <section className="px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-0 overflow-x-auto pb-2"
          >
            {roadmap.phases?.map((phase, i) => (
              <div key={i} className="flex items-center shrink-0">
                <div className="flex flex-col items-center px-4 py-3 bg-[#111] border border-[#1F1F1F] rounded-xl min-w-[140px] text-center">
                  <span className="text-xs text-orange-500 font-bold mb-1">Phase {phase.phase_number}</span>
                  <span className="text-sm font-bold text-white text-center">{phase.title}</span>
                  <span className="text-xs text-gray-500 mt-1">Wk {phase.milestone?.week || '—'}</span>
                </div>
                {i < roadmap.phases.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-orange-500/50 mx-1 shrink-0" />
                )}
              </div>
            ))}
            <div className="flex items-center shrink-0">
              <ArrowRight className="w-5 h-5 text-orange-500/50 mx-1" />
              <div className="flex flex-col items-center px-4 py-3 bg-orange-500/15 border border-orange-500/30 rounded-xl min-w-[140px] text-center">
                <Star className="w-4 h-4 text-orange-500 mb-1" />
                <span className="text-sm font-bold text-orange-400">AIM ACHIEVED</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── SECTION 4: Phases + Resources ─── */}
      <section className="px-6 pb-12">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2 text-center">
            Your Learning Phases
          </h2>
          {roadmap.phases?.map((phase, i) => (
            <PhaseCard
              key={phase.phase_number}
              phase={phase}
              resources={resources}
              index={i}
            />
          ))}
        </div>
      </section>

      {/* ─── SECTION 5: Free Starter Pack ─── */}
      {resources?.free_starter_pack?.length > 0 && (
        <section className="px-6 pb-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-6 text-center">
              Start learning TODAY for free
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {resources.free_starter_pack.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="bg-[#111] border-2 border-orange-500/30 rounded-xl p-5 text-center"
                >
                  <div className="w-10 h-10 mx-auto mb-3 bg-orange-500/15 rounded-full flex items-center justify-center">
                    <ExternalLink className="w-4 h-4 text-orange-500" />
                  </div>
                  <p className="text-sm font-semibold text-white leading-relaxed">{item}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── SECTION 6: Mistakes to Avoid ─── */}
      {roadmap.common_mistakes?.length > 0 && (
        <section className="px-6 pb-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-6 text-center">
              Mistakes to Avoid
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roadmap.common_mistakes.map((mistake, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="bg-[#111] border border-red-500/20 rounded-xl p-4 flex items-start gap-3"
                >
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">{mistake}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── SECTION 7: Success Metrics ─── */}
      {roadmap.success_metrics?.length > 0 && (
        <section className="px-6 pb-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-6 text-center">
              How to know you're on track
            </h2>
            <div className="space-y-3">
              {roadmap.success_metrics.map((metric, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.08 }}
                  className="flex items-start gap-3 bg-[#111] border border-green-500/15 rounded-xl p-4"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">{metric}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Realistic Timeline Note ─── */}
      {roadmap.realistic_timeline_note && (
        <section className="px-6 pb-12">
          <div className="max-w-3xl mx-auto bg-[#111] border border-orange-500/20 rounded-2xl p-6">
            <p className="text-sm text-gray-400 leading-relaxed italic">
              📝 {roadmap.realistic_timeline_note}
            </p>
          </div>
        </section>
      )}

      {/* ─── SECTION 8: Actions ─── */}
      <section className="px-6 pb-24">
        <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            onClick={handleCopy}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-lg font-bold rounded-2xl transition-all duration-300 ${
              copySuccess
                ? 'bg-green-500 text-white'
                : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30'
            }`}
          >
            {copySuccess ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copy Roadmap
              </>
            )}
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            onClick={() => navigate('/')}
            className="flex-1 flex items-center justify-center gap-2 py-4 text-lg font-bold rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] text-gray-300 hover:bg-[#222] hover:border-orange-500/30 transition-all duration-300"
          >
            <Home className="w-5 h-5" />
            Start New Aim
          </motion.button>
        </div>
      </section>
    </div>
  )
}
