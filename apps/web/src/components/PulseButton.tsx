import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, X } from 'lucide-react';
import type { PulseStatus } from '@/lib/pulse-context';

interface PulseButtonProps {
  onPulse: () => void;
  status: PulseStatus;
}

function DotsLoader() {
  return (
    <div className="flex gap-1 items-center justify-center">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-green-400"
          animate={{ y: [-2, 3, -2] }}
          transition={{ repeat: Infinity, duration: 0.5, ease: 'easeInOut', delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

export function PulseButton({ onPulse, status }: PulseButtonProps) {
  const isPulsing = status === 'pulsing';
  const showSuccess = status === 'success';
  const showError = status === 'error';

  return (
    <div className="pulse-btn-wrapper relative">
      {/* Anillo de ondas expansivas — solo en pulsing */}
      {isPulsing && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-green-400/40"
          animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeOut' }}
        />
      )}
      {isPulsing && (
        <motion.div
          className="absolute inset-0 rounded-full border border-green-400/20"
          animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut', delay: 0.4 }}
        />
      )}

      <motion.button
        whileTap={status === 'idle' ? { scale: 0.93 } : {}}
        onClick={status === 'idle' ? onPulse : undefined}
        className="relative w-14 h-14 rounded-full shadow-xl flex items-center justify-center pulse-btn-float"
        animate={{
          scale: isPulsing ? 1.2 : 1,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        style={{
          background: isPulsing
            ? 'rgba(34, 197, 94, 0.15)'
            : `conic-gradient(from 90deg at 50% 50%, var(--accent) 0deg, var(--accent-secondary) 360deg)`,
          boxShadow: isPulsing ? '0 0 24px rgba(34, 197, 94, 0.25)' : undefined,
          willChange: 'transform',
          border: isPulsing ? '2px solid rgba(34, 197, 94, 0.4)' : 'none',
        }}
      >
        <div
          className="absolute inset-0 rounded-full flex items-center justify-center"
          style={{
            background: isPulsing ? 'rgba(0, 0, 0, 0.4)' : 'var(--surface)',
          }}
        >
          <AnimatePresence mode="wait">
            {isPulsing && (
              <motion.div
                key="pulsing"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
              >
                <DotsLoader />
              </motion.div>
            )}

            {showSuccess && (
              <motion.div
                key="success"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <Check className="w-6 h-6 text-green-400" strokeWidth={3} />
              </motion.div>
            )}

            {showError && (
              <motion.div
                key="error"
                initial={{ scale: 0 }}
                animate={{ scale: 1, x: [0, -3, 3, -2, 2, 0] }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <X className="w-6 h-6 text-red-400" strokeWidth={3} />
              </motion.div>
            )}

            {status === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Sparkles className="w-6 h-6 pulse-btn-star" style={{ color: 'var(--accent)' }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.button>
    </div>
  );
}
