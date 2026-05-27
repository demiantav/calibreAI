import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Target, Award, Crown, BarChart4, Sparkles } from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import type { LogEntry, SponsorshipForecast } from '@/lib/types';

const LOGS_ENDPOINT = '/logs';

export default function Sponsorship() {
  const { data: logs, isLoading, error, refetch } = useApiFetch<LogEntry[]>(LOGS_ENDPOINT);

  const forecast = logs?.find((log) => log.type === 'sponsorship_forecast')?.content as SponsorshipForecast | undefined;

  if (isLoading) {
    return (
      <motion.div className="min-h-screen p-4 lg:p-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <header className="mb-10 lg:mb-12">
          <div className="h-8 bg-surface-raised rounded animate-pulse w-48 mb-2" />
          <div className="h-4 bg-surface-raised rounded animate-pulse w-72" />
        </header>
        <SkeletonCard className="mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 mb-8">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div className="min-h-screen p-4 lg:p-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <ErrorState message={error} onRetry={refetch} />
      </motion.div>
    );
  }

  if (!forecast) {
    return (
      <motion.div className="min-h-screen p-4 lg:p-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <header className="mb-10 lg:mb-12">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-display font-black text-text tracking-tight">Sponsorship Rates</h1>
          </div>
          <p className="text-sm font-light text-text-tertiary/60">AI-powered pricing based on market analysis</p>
        </header>
        <div className="rounded-[28px] p-8 lg:p-10 bg-surface border border-border text-center">
          <Sparkles className="w-10 h-10 text-text-tertiary mx-auto mb-4" />
          <p className="text-lg font-semibold text-text mb-2">Aún no hay tarifas estimadas</p>
          <p className="text-sm text-text-secondary max-w-md mx-auto">Analizá tu canal para generar pronósticos personalizados de tarifas de patrocinio.</p>
        </div>
      </motion.div>
    );
  }

  const f = forecast;

  return (
    <motion.div className="min-h-screen p-4 lg:p-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <header className="mb-10 lg:mb-12">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-display font-black text-text tracking-tight">Sponsorship Rates</h1>
        </div>
        <p className="text-sm font-light text-text-tertiary/60">AI-powered pricing based on market analysis</p>
      </header>

      {/* CPM Hero */}
      <motion.div
        className="rounded-[28px] p-8 lg:p-10 mb-8 lg:mb-10 relative overflow-hidden group bg-surface border border-border"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ ease: 'easeOut', duration: 0.5 }}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent/50 via-cyan-400/30 to-transparent" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8">
          <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center shrink-0 neon-glow">
            <DollarSign className="w-8 h-8 lg:w-10 lg:h-10 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.15em]">Your CPM</p>
            </div>
            <p className="text-4xl lg:text-5xl font-sans font-bold text-text tracking-tight">${f.estimatedCpm.toFixed(2)}</p>
            <p className="text-sm font-normal text-text-secondary mt-1.5">Cost per thousand impressions</p>
          </div>
        </div>
      </motion.div>

      {/* Rate cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 mb-8">
        {[
          { label: 'Mention', min: f.mention.min, max: f.mention.max, desc: 'Brief product mention in your regular content', icon: TrendingUp, delay: 0.2 },
          { label: 'Dedicated', min: f.dedicated.min, max: f.dedicated.max, desc: 'Full video dedicated to the product', icon: Target, delay: 0.25 },
          { label: 'Series', min: f.series.min, max: f.series.max, desc: 'Multi-video campaign over time', icon: Award, delay: 0.3 },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              className="rounded-[24px] p-7 lg:p-8 relative overflow-hidden group bg-surface border border-border transition-all duration-300 hover:border-border-accent/40 hover:-translate-y-1 glow-border"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ delay: item.delay * 0.5, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20">
                  <Icon className="w-5 h-5 text-accent" strokeWidth={2} />
                </div>
              </div>
              <p className="text-xs font-semibold text-text-tertiary uppercase tracking-[0.15em] mb-1">{item.label}</p>
              <p className="text-3xl lg:text-4xl font-sans font-bold text-text tracking-tight">
                ${item.min.toLocaleString()} <span className="text-lg text-text-tertiary font-light">&mdash;</span> ${item.max.toLocaleString()}
              </p>
              <p className="text-sm font-normal text-text-secondary mt-2 leading-relaxed">{item.desc}</p>
              <div className="mt-5 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-normal text-text-tertiary">Est. range</span>
                  <span className="font-semibold text-text">${item.min.toLocaleString()} — ${item.max.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Market context */}
      {f.marketContext && (
        <motion.div
          className="rounded-[24px] p-7 lg:p-8 bg-surface border border-border"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ delay: 0.15, ease: 'easeOut' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20">
              <BarChart4 className="w-5 h-5 text-accent" strokeWidth={2} />
            </div>
            <h2 className="text-base lg:text-lg font-sans font-bold text-text tracking-tight">Market Analysis</h2>
          </div>
          <p className="text-sm lg:text-[15px] font-normal text-text-secondary leading-[1.7]">{f.marketContext}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
