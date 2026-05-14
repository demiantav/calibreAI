import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface PulseButtonProps {
  onPulse: () => void;
}

export function PulseButton({ onPulse }: PulseButtonProps) {
  return (
    <div className="pulse-btn-wrapper">
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={onPulse}
        className="relative w-14 h-14 rounded-full shadow-xl flex items-center justify-center pulse-btn-float"
        style={{
          background: `conic-gradient(from 90deg at 50% 50%, var(--accent) 0deg, var(--accent-secondary) 360deg)`,
          willChange: 'transform',
        }}
      >
        <div className="absolute inset-0 rounded-full bg-surface/80 flex items-center justify-center">
          <Sparkles className="w-6 h-6 pulse-btn-star" style={{ color: 'var(--accent)' }} />
        </div>
      </motion.button>
    </div>
  );
}
