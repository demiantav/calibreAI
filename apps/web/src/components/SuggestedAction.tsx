import { motion } from 'framer-motion';
import { ArrowRight, Send, TrendingDown, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { LogEntry } from '@/lib/types';

interface Props {
  pendingPitchesCount: number;
  latestSummary: LogEntry;
  lastPulseAt: number | null;
}

export function SuggestedAction({ pendingPitchesCount, latestSummary, lastPulseAt }: Props) {
  // Priority 1: Pitches pendientes
  if (pendingPitchesCount > 0) {
    return (
      <motion.div
        className="mb-6 lg:mb-8 p-4 rounded-2xl bg-accent/10 border border-accent/20"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
            <Send className="w-4 h-4 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-text mb-1">Acción sugerida</p>
            <p className="text-sm text-text-secondary">
              Tenés {pendingPitchesCount} {pendingPitchesCount === 1 ? 'propuesta' : 'propuestas'} de marca esperando revisión.
            </p>
            <Link
              to="/deals"
              className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-accent hover:text-accent/80 transition-colors"
            >
              Revisar deals <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  // Priority 2: Engagement dropped (detect from summary text)
  const summaryText = (latestSummary.content as any)?.text || '';
  if (summaryText.includes('engagement') && (summaryText.includes('bajó') || summaryText.includes('bajo') || summaryText.includes('lower'))) {
    return (
      <motion.div
        className="mb-6 lg:mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-text mb-1">Acción sugerida</p>
            <p className="text-sm text-text-secondary">
              Tu engagement bajó respecto al análisis anterior. Considerá publicar contenido más interactivo para reactivarlo.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Priority 3: No pulse in a while
  const hoursSincePulse = lastPulseAt ? (Date.now() - lastPulseAt) / 3600000 : Infinity;
  if (hoursSincePulse > 24) {
    return (
      <motion.div
        className="mb-6 lg:mb-8 p-4 rounded-2xl bg-surface border border-border"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-text mb-1">Acción sugerida</p>
            <p className="text-sm text-text-secondary">
              Hace más de 24 horas que no analizás tu canal. Mantenete al día con las métricas y oportunidades.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
}
