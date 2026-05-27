import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AgentIndicatorProps {
  logsCount?: number;
  pitchCount?: number;
}

export function AgentIndicator({ logsCount = 0, pitchCount = 0 }: AgentIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <Link
        to="/logs"
        className="group inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-surface-hover/70 border border-border/50 hover:bg-accent-soft hover:border-accent/20 transition-all duration-300 min-h-[44px]"
      >
        <div className="relative flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <motion.div
            className="absolute w-4 h-4 rounded-full bg-accent/20"
            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <span className="text-xs sm:text-sm font-semibold text-text-secondary group-hover:text-text transition-colors">
          Calibre activo
        </span>
        <span className="w-px h-3 bg-border hidden sm:block" />
        <span className="text-[10px] sm:text-xs font-medium text-text-tertiary hidden sm:inline">
          {logsCount} logs · {pitchCount} pitches
        </span>
        <Activity className="w-4 h-4 text-text-tertiary group-hover:text-accent transition-colors" />
      </Link>
    </motion.div>
  );
}
