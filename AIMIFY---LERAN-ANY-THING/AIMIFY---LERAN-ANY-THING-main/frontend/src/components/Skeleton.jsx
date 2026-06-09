/* ═══════════════════════════════════════════
   Skeleton Loading Components
   ═══════════════════════════════════════════ */

/**
 * ConceptCardSkeleton — Mimics the TutorPage explanation card shape
 * Shows a header bar, title block, and several paragraph lines.
 */
export function ConceptCardSkeleton() {
  return (
    <div className="w-full animate-pulse space-y-6">
      {/* Header badge row */}
      <div className="flex items-center gap-3">
        <div className="h-6 w-24 bg-gray-200 rounded-full" />
        <div className="h-4 w-16 bg-gray-100 rounded" />
      </div>

      {/* Title */}
      <div className="space-y-2">
        <div className="h-10 w-3/4 bg-gray-200 rounded-lg" />
        <div className="h-10 w-1/2 bg-gray-100 rounded-lg" />
      </div>

      {/* Analogy section */}
      <div className="bg-gray-50 rounded-2xl p-6 space-y-3 border-l-4 border-gray-200">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-4 w-full bg-gray-100 rounded" />
        <div className="h-4 w-5/6 bg-gray-100 rounded" />
      </div>

      {/* Core explanation section */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-5 w-5 bg-gray-200 rounded" />
          <div className="h-5 w-28 bg-gray-200 rounded" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full bg-gray-100 rounded" />
          <div className="h-4 w-full bg-gray-100 rounded" />
          <div className="h-4 w-4/5 bg-gray-100 rounded" />
          <div className="h-4 w-full bg-gray-100 rounded" />
          <div className="h-4 w-3/4 bg-gray-100 rounded" />
        </div>
      </div>

      {/* Worked example section */}
      <div className="bg-gray-900 rounded-2xl p-8 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-5 w-5 bg-gray-700 rounded" />
          <div className="h-5 w-28 bg-gray-700 rounded" />
        </div>
        <div className="bg-gray-800 rounded-xl p-4 space-y-2">
          <div className="h-3 w-full bg-gray-700 rounded" />
          <div className="h-3 w-3/4 bg-gray-700 rounded" />
          <div className="h-3 w-5/6 bg-gray-700 rounded" />
        </div>
      </div>

      {/* Key takeaway section */}
      <div className="bg-gray-200 rounded-2xl p-8 space-y-3">
        <div className="h-5 w-32 bg-gray-300 rounded" />
        <div className="h-4 w-full bg-gray-300 rounded" />
        <div className="h-4 w-2/3 bg-gray-300 rounded" />
      </div>
    </div>
  )
}

/**
 * PathwaySkeleton — Mimics pathway concept node cards
 * Shows a staggered sequence of node shapes.
 */
export function PathwaySkeleton({ count = 6 }) {
  return (
    <div className="w-full animate-pulse space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-4 w-4 bg-gray-200 rounded" />
        <div className="h-4 w-36 bg-gray-200 rounded" />
      </div>

      {/* Concept nodes */}
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          {/* Circle indicator */}
          <div className="shrink-0 w-10 h-10 bg-gray-200 rounded-full" />

          {/* Node content */}
          <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded" style={{ width: `${55 + Math.random() * 30}%` }} />
              <div className="h-3 w-12 bg-gray-100 rounded" />
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
