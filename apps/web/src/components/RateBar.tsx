import { motion } from 'framer-motion';

interface RateBarProps {
  label: string;
  min: number;
  max: number;
  desc: string;
  index: number;
}

export function RateBar({ label, min, max, desc, index }: RateBarProps) {
  const mid = (min + max) / 2;
  const spread = min === 0 ? 0 : ((max - min) / min) * 100;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 * index, duration: 0.5 }}
      className="group"
    >
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-3">
          <span className="text-xs font-semibold text-text-tertiary uppercase tracking-[0.15em]">{label}</span>
          <span className="text-[10px] text-text-tertiary/50">{desc}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-sans font-bold text-text tabular-nums">${min.toLocaleString()}</span>
          <span className="text-xs text-text-tertiary">— ${max.toLocaleString()}</span>
        </div>
      </div>
      
      {/* Bar container */}
      <div className="relative h-2 bg-surface-raised rounded-full overflow-hidden">
        {/* Gradient bar */}
        <motion.div
          className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-accent/60 via-accent to-accent-secondary/80"
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.min(100, 30 + spread * 0.3)}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 * index, ease: 'easeOut' }}
        />
        
        {/* Glow effect */}
        <div 
          className="absolute top-0 h-full rounded-full bg-accent/30 blur-sm"
          style={{ width: `${Math.min(100, 30 + spread * 0.3)}%` }}
        />
      </div>
      
      {/* Range indicator */}
      <div className="flex items-center gap-1 mt-1.5">
        <span className="text-[10px] text-text-tertiary/70">Range: ${min.toLocaleString()} — ${max.toLocaleString()}</span>
      </div>
    </motion.div>
  );
}
