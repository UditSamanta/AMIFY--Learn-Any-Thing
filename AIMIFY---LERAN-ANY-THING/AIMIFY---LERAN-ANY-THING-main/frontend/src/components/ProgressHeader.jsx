import { ChevronRight } from 'lucide-react'

export default function ProgressHeader({ subject, currentIndex, total, currentConceptName }) {
  const progressPercent = total > 0 ? Math.round((currentIndex / total) * 100) : 0

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 h-16 px-4 sm:px-6 flex items-center justify-between font-sans select-none">
      
      {/* Left — Logo */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shadow-sm">
          <span className="text-white text-xs font-extrabold tracking-tight">AT</span>
        </div>
        <span className="text-sm font-bold text-dark hidden sm:inline">Autonomous Tutor</span>
      </div>

      {/* Center — Breadcrumbs (hidden on mobile) */}
      <div className="hidden md:flex items-center gap-1.5 text-sm text-gray-400 font-medium truncate max-w-xs lg:max-w-md">
        <span className="truncate hover:text-dark transition-colors cursor-default">
          {subject || 'Subject'}
        </span>
        <ChevronRight className="w-3 h-3 shrink-0" />
        <span className="text-dark truncate font-semibold">
          {currentConceptName || '—'}
        </span>
      </div>

      {/* Right — Progress pill */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Progress bar pill */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1.5">
          <span className="text-xs font-bold text-muted whitespace-nowrap">
            {currentIndex} / {total}
            <span className="hidden sm:inline"> concepts</span>
          </span>
          <div className="w-16 sm:w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Percentage */}
        <span className="text-sm font-extrabold text-orange-500 tabular-nums w-10 text-right">
          {progressPercent}%
        </span>
      </div>
    </header>
  )
}
