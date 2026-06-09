import { motion, AnimatePresence } from 'framer-motion'
import { PulseLoader } from 'react-spinners' // Optional: if you want a nice spinner, or we can build a pure tailwind one
import { CheckCircle, Search, Map, BookOpen, RefreshCw, Settings, Activity } from 'lucide-react'

const AGENT_COLORS = {
  diagnostic: '#FF6600',
  pathway: '#FF8533', 
  tutor: '#FFB380',
  assessment: '#FF6600',
  adaptation: '#E65C00',
  orchestrator: '#9CA3AF'
}

const AGENT_ICONS = {
  diagnostic: <Search size={16} />,
  pathway: <Map size={16} />,
  tutor: <BookOpen size={16} />,
  assessment: <CheckCircle size={16} />,
  adaptation: <RefreshCw size={16} />,
  orchestrator: <Settings size={16} />
}

export default function AgentFeed({ events = [] }) {
  // Only show the last 8 events
  const displayEvents = [...events].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 8)

  const formatAgentName = (name) => {
    if (!name) return 'System'
    return name.replace(/_?agent$/i, '').charAt(0).toUpperCase() + name.replace(/_?agent$/i, '').slice(1)
  }

  const getAgentType = (name) => {
    if (!name) return 'orchestrator'
    return name.toLowerCase().replace(/_?agent$/, '')
  }

  const timeAgo = (dateInput) => {
    if (!dateInput) return 'just now'
    const date = new Date(dateInput)
    const seconds = Math.floor((new Date() - date) / 1000)
    if (seconds < 5) return 'just now'
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return 'older'
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#1A1A1A] border border-gray-800 rounded-2xl overflow-hidden shadow-md">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#222222]">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </div>
          <h3 className="text-sm font-semibold text-white tracking-wide">Live Agent Activity</h3>
        </div>
        <Activity className="w-4 h-4 text-gray-400" />
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        <AnimatePresence initial={false}>
          {displayEvents.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8"
            >
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
              </div>
              <p className="text-sm text-gray-500 font-medium">Waiting for agents...</p>
            </motion.div>
          ) : (
            displayEvents.map((event, index) => {
              const isLatest = index === 0;
              const type = getAgentType(event.agent);
              const color = AGENT_COLORS[type] || AGENT_COLORS.orchestrator;
              const icon = AGENT_ICONS[type] || AGENT_ICONS.orchestrator;
              
              return (
                <motion.div
                  key={event.id || `${event.timestamp}-${index}`}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: isLatest ? 1 : 0.6, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
                  className={`relative pl-4 py-3 rounded-lg border flex flex-col gap-1 transition-all ${
                    isLatest 
                      ? 'bg-[#222222] border-gray-700 shadow-sm' 
                      : 'bg-transparent border-transparent hover:bg-[#222222] hover:opacity-100'
                  }`}
                >
                  {/* Active Indicator Line */}
                  <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-colors ${isLatest ? 'bg-green-500' : 'bg-gray-700'}`}></div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span style={{ color }} className="opacity-90">{icon}</span>
                      <span style={{ color }} className="font-bold text-xs tracking-wider uppercase">
                        {formatAgentName(event.agent)}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {timeAgo(event.timestamp)}
                    </span>
                  </div>

                  <p className={`text-sm leading-snug pl-6 ${isLatest ? 'text-gray-200' : 'text-gray-400'}`}>
                    {event.message}
                  </p>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

    </div>
  )
}
