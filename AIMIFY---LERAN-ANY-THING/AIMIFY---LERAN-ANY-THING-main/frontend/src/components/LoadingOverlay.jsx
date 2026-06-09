import { AnimatePresence, motion } from 'framer-motion'

export default function LoadingOverlay({ visible, message = 'Loading...' }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loading-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 px-10 py-8 flex flex-col items-center text-center max-w-xs"
          >
            {/* Spinner */}
            <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-orange-500 animate-spin mb-5" />

            {/* Message */}
            <p className="text-base font-bold text-dark mb-1.5">{message}</p>
            <p className="text-sm text-muted">This usually takes 5–10 seconds</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
