import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, X } from 'lucide-react';
import type { PulseStatus } from '@/lib/pulse-context';

interface PulseButtonProps {
  onPulse: () => void;
  status: PulseStatus;
}

/* ========== ANIMATED DOTS LOADER ========== */
function DotsLoader() {
  return (
    <div className="flex gap-1.5 items-center justify-center">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-emerald-400"
          animate={{
            y: [-3, 3, -3],
            opacity: [0.5, 1, 0.5],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            repeat: Infinity,
            duration: 0.6,
            ease: 'easeInOut',
            delay: i * 0.12,
          }}
        />
      ))}
    </div>
  );
}

/* ========== ORGANIC RING SVG ========== */
function OrganicRing() {
  return (
    <svg className="absolute -inset-4 w-[calc(100%+32px)] h-[calc(100%+32px)] pointer-events-none" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="pulseRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EA5103" stopOpacity="0.5" />
          <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#EA5103" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <motion.circle
        cx="50" cy="50" r="46"
        fill="none"
        stroke="url(#pulseRingGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={{
          strokeDasharray: ['0 289', '289 0'],
          rotate: [0, 360],
        }}
        transition={{
          strokeDasharray: { duration: 3, repeat: Infinity, ease: 'easeInOut', repeatType: 'reverse' },
          rotate: { duration: 12, repeat: Infinity, ease: 'linear' },
        }}
        style={{ transformOrigin: 'center' }}
      />
    </svg>
  );
}

/* ========== RIPPLE RING ========== */
function RippleRing({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className="absolute inset-0 rounded-full border-2 border-emerald-400/30"
      animate={{
        scale: [1, 2.2],
        opacity: [0.5, 0],
        borderWidth: ['2px', '0px'],
      }}
      transition={{
        repeat: Infinity,
        duration: 2,
        ease: 'easeOut',
        delay,
      }}
    />
  );
}

/* ========== MAIN BUTTON ========== */
export function PulseButton({ onPulse, status }: PulseButtonProps) {
  const isPulsing = status === 'pulsing';
  const showSuccess = status === 'success';
  const showError = status === 'error';
  const isIdle = status === 'idle';

  return (
    <div className="relative">
      {/* Ambient glow behind */}
      {isIdle && (
        <motion.div
          className="absolute -inset-6 rounded-full blur-2xl pointer-events-none"
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [0.9, 1.05, 0.9],
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: 'easeInOut',
          }}
          style={{
            background: 'radial-gradient(circle, rgba(234, 81, 3, 0.4) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Ripple rings when pulsing */}
      {isPulsing && (
        <>
          <RippleRing delay={0} />
          <RippleRing delay={0.6} />
          <RippleRing delay={1.2} />
        </>
      )}

      {/* Organic ring when idle */}
      {isIdle && <OrganicRing />}

      <motion.button
        whileTap={isIdle ? { scale: 0.9 } : {}}
        onClick={isIdle ? onPulse : undefined}
        aria-label={isIdle ? 'Analizar canal' : isPulsing ? 'Análisis en progreso' : showSuccess ? 'Análisis completo' : showError ? 'Análisis falló' : 'Botón de análisis'}
        className="relative w-16 h-16 rounded-full flex items-center justify-center cursor-pointer"
        animate={{
          scale: isPulsing ? [1, 1.1, 1] : 1,
          boxShadow: isPulsing
            ? [
                '0 0 20px rgba(34, 197, 94, 0.3)',
                '0 0 40px rgba(34, 197, 94, 0.5)',
                '0 0 20px rgba(34, 197, 94, 0.3)',
              ]
            : isIdle
              ? [
                  '0 0 20px rgba(234, 81, 3, 0.3)',
                  '0 0 40px rgba(234, 81, 3, 0.5)',
                  '0 0 20px rgba(234, 81, 3, 0.3)',
                ]
              : showSuccess
                ? '0 0 30px rgba(34, 197, 94, 0.5)'
                : showError
                  ? '0 0 30px rgba(239, 68, 68, 0.5)'
                  : 'none',
        }}
        transition={{
          scale: { type: 'spring', stiffness: 300, damping: 15 },
          boxShadow: { repeat: isPulsing || isIdle ? Infinity : 0, duration: 2, ease: 'easeInOut' },
        }}
        style={{
          background: isPulsing
            ? 'conic-gradient(from 0deg, #22c55e, #4ade80, #22c55e)'
            : showSuccess
              ? 'conic-gradient(from 0deg, #22c55e, #4ade80, #22c55e)'
              : showError
                ? 'conic-gradient(from 0deg, #ef4444, #f87171, #ef4444)'
                : 'conic-gradient(from 0deg, #EA5103, #FF8F5C, #EA5103)',
          willChange: 'transform',
        }}
      >
        {/* Inner dark circle */}
        <div
          className="absolute inset-[2px] rounded-full flex items-center justify-center"
          style={{
            background: isPulsing
              ? 'rgba(3, 3, 5, 0.85)'
              : 'rgba(3, 3, 5, 0.9)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <AnimatePresence mode="wait">
            {/* IDLE */}
            {isIdle && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, rotate: -30, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 30, scale: 0.5 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="relative"
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                >
                  <Sparkles className="w-7 h-7" style={{ color: '#FF6B2C' }} strokeWidth={2} />
                </motion.div>
                {/* Mini glow orb */}
                <motion.div
                  className="absolute inset-0 rounded-full blur-md pointer-events-none"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  style={{ background: 'rgba(234, 81, 3, 0.3)' }}
                />
              </motion.div>
            )}

            {/* PULSING */}
            {isPulsing && (
              <motion.div
                key="pulsing"
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.3 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <DotsLoader />
              </motion.div>
            )}

            {/* SUCCESS */}
            {showSuccess && (
              <motion.div
                key="success"
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ opacity: 1, pathLength: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <Check className="w-7 h-7 text-emerald-400" strokeWidth={3} />
              </motion.div>
            )}

            {/* ERROR */}
            {showError && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.3, rotate: -45 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotate: 0,
                  x: [0, -4, 4, -3, 3, 0],
                }}
                exit={{ opacity: 0, scale: 0.3 }}
                transition={{
                  opacity: { duration: 0.2 },
                  scale: { type: 'spring', stiffness: 400, damping: 20 },
                  rotate: { duration: 0.3 },
                  x: { duration: 0.4, ease: 'easeInOut' },
                }}
              >
                <X className="w-7 h-7 text-red-400" strokeWidth={3} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.button>

      {/* Label tooltip */}
      {isIdle && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-semibold text-text-secondary whitespace-nowrap"
        >
          Analizar
        </motion.div>
      )}
    </div>
  );
}
