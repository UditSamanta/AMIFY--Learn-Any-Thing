import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, AlertTriangle } from 'lucide-react'

export default function ErrorToast({ error, onClose }) {
  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => onClose?.(), 5000)
    return () => clearTimeout(timer)
  }, [error, onClose])

  return (
    <AnimatePresence>
      {error && (
        <motion.div
          key="error-toast"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-6 right-6 z-[200] max-w-sm w-full"
        >
          <div className="bg-white border border-red-200 rounded-2xl shadow-xl p-4 flex items-start gap-3">
            {/* Icon */}
            <div className="shrink-0 w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-4.5 h-4.5 text-red-500" />
            </div>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-0.5">Error</p>
              <p className="text-sm text-dark font-medium leading-snug line-clamp-3">{error}</p>
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="shrink-0 w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Auto-dismiss progress bar */}
          <motion.div
            className="h-0.5 bg-red-400 rounded-b-full mt-0"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 5, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
