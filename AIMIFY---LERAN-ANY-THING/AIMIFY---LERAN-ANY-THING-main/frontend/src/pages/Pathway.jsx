import { useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSession } from '../context/SessionContext'
import { ChevronRight, Clock, Star, BrainCircuit } from 'lucide-react'
import LoadingButton from '../components/LoadingButton'
import { useApiCall } from '../hooks/useApiCall'

export default function Pathway() {
  const { pathway, knowledgeProfile, loadCurrentConcept } = useSession()
  const navigate = useNavigate()
  const { loading, call } = useApiCall()

  if (!pathway || !knowledgeProfile) {
    return <Navigate to="/" replace />
  }

  const { subject, concepts, total_estimated_minutes } = pathway
  const { overall_score, level, scores } = knowledgeProfile

  const handleStart = async () => {
    await call(async () => {
      await loadCurrentConcept()
      navigate('/tutor')
    })
  }

  // Group concepts by depth level for graph rendering
  const maxDepth = Math.max(...concepts.map(c => c.depth_level), 3)
  const depthLevels = Array.from({ length: maxDepth }, (_, i) => i + 1)

  // Stagger animation setup
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3
      }
    }
  }

  const nodeVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white font-sans selection:bg-orange-900 selection:text-orange-50">
      
      {/* Top Header */}
      <div className="pt-20 px-8 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-[800] tracking-tight mb-3">Your Learning Pathway</h1>
          <p className="text-gray-400 text-lg flex items-center gap-3">
            <span className="text-white font-medium">{subject}</span>
            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
            <span>{concepts.length} concepts</span>
            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> ~{total_estimated_minutes} min</span>
          </p>
        </div>

        <LoadingButton 
          onClick={handleStart}
          loading={loading}
          className="mt-8 md:mt-0 bg-[#FF6600] hover:bg-[#E65C00] text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-[0_0_20px_rgba(255,102,0,0.3)] hover:shadow-[0_0_30px_rgba(255,102,0,0.5)] flex items-center gap-3"
        >
          Start Learning <ChevronRight className="w-5 h-5" />
        </LoadingButton>
      </div>

      <div className="max-w-7xl mx-auto px-8 flex flex-col lg:flex-row gap-12 pb-24">
        
        {/* Main Graph Area */}
        <div className="flex-1 bg-[#222222] border border-[#333333] rounded-[32px] p-8 md:p-12 relative overflow-hidden">
          
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="show"
            className="flex flex-col gap-12 relative z-10"
          >
            {depthLevels.map(depth => {
              const levelConcepts = concepts.filter(c => c.depth_level === depth)
              if (levelConcepts.length === 0) return null

              return (
                <div key={depth} className="flex flex-col relative">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 ml-2">{depth === 1 ? 'Foundations' : depth === 2 ? 'Intermediate' : 'Advanced'}</div>
                  <div className="flex flex-wrap gap-4 md:gap-6 justify-center md:justify-start">
                    {levelConcepts.map((concept, idx) => (
                      <motion.div 
                        key={concept.concept}
                        variants={nodeVariants}
                        className={`relative w-full sm:w-[280px] p-5 rounded-2xl flex flex-col justify-between ${
                          concept.is_optional 
                            ? 'bg-transparent border-2 border-dashed border-[#444444] opacity-70' 
                            : 'bg-[#2A2A2A] border border-[#444444] shadow-lg'
                        }`}
                      >
                        {/* Connecting line to prerequisite (Simulated top border for visual effect in flow layout) */}
                        {depth > 1 && !concept.is_optional && (
                          <div className="absolute -top-12 left-1/2 w-0.5 h-12 bg-gradient-to-b from-transparent to-[#FF6600]/50 -translate-x-1/2"></div>
                        )}
                        
                        <div>
                          {concept.is_optional && (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#333333] text-gray-400 mb-3">Optional</span>
                          )}
                          <h3 className="font-semibold text-lg leading-tight text-white mb-2">{concept.concept}</h3>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-gray-400 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {concept.estimated_minutes} min
                          </div>
                          {concept.confidence > 0 && (
                            <div className="w-16 h-1 border border-[#444444] rounded-full overflow-hidden">
                              <div className="h-full bg-[#FF6600]" style={{ width: `${concept.confidence * 100}%` }}></div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )
            })}
          </motion.div>

          {/* Abstract Orange Gradient Splashes relative to the container */}
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#FF6600]/10 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-[#FF6600]/5 blur-[100px] rounded-full pointer-events-none"></div>
        </div>

        {/* Right Sidebar: Knowledge Profile */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1 }}
          className="w-full lg:w-80 flex flex-col gap-6"
        >
          <div className="bg-[#222222] border border-[#333333] rounded-3xl p-8 shadow-xl">
            <h3 className="font-bold text-gray-400 uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4" /> Knowledge Profile
            </h3>
            
            <div className="flex items-end gap-3 mb-8 pb-8 border-b border-[#333333]">
              <div className="text-[64px] font-[800] leading-none tracking-tighter text-white">
                {Math.min(100, Math.max(0, Math.round(Number(overall_score) || 0)))}<span className="text-2xl text-gray-500">%</span>
              </div>
              <div className="mb-2">
                <span className="inline-block px-3 py-1 bg-[#FF6600]/20 text-[#FF6600] text-xs font-bold uppercase tracking-widest rounded-full border border-[#FF6600]/30 shadow-[0_0_10px_rgba(255,102,0,0.1)]">
                  {level}
                </span>
              </div>
            </div>

            <div className="space-y-5">
              <h4 className="text-sm font-semibold text-gray-300 mb-4">Cluster Strengths</h4>
              {Object.entries(scores).map(([cluster, score]) => {
                const percent = Math.min(100, Math.max(0, Math.round(Number(score) || 0)));
                const colorClass = percent >= 80 ? 'bg-green-500' : percent >= 40 ? 'bg-[#FF6600]' : 'bg-red-500';
                return (
                  <div key={cluster} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-300">{cluster}</span>
                      <span className="text-gray-500">{percent}%</span>
                    </div>
                    <div className="w-full bg-[#111111] h-1.5 rounded-full overflow-hidden border border-[#333]">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${Math.min(100, percent)}%` }}
                        transition={{ duration: 1, delay: 1.5 }}
                        className={`h-full rounded-full ${colorClass}`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
