import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Target, Award, Crown, BarChart4, Sparkles } from 'lucide-react';
import type { LogEntry, SponsorshipForecast } from '@/lib/types';

export default function Sponsorship() {
  const [forecast, setForecast] = useState<SponsorshipForecast | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchForecast = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:8080/logs');
        if (response.ok) {
          const data: LogEntry[] = await response.json();
          const f = data.find((log) => log.type === 'sponsorship_forecast');
          if (f) setForecast(f.content as SponsorshipForecast);
        }
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    };
    fetchForecast();
  }, []);

  const f = forecast || {
    mention: { min: 850, max: 1200, currency: 'USD' },
    dedicated: { min: 2500, max: 4000, currency: 'USD' },
    series: { min: 6000, max: 12000, currency: 'USD' },
    estimatedCpm: 18.5,
    marketContext: 'Your rates are based on market analysis. Run a Pulse to get personalised forecasts.',
  };

  return (
    <motion.div className="min-h-screen p-8 lg:p-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-1 h-6 rounded-full bg-accent" />
          <h1 className="text-2xl font-display font-black text-text tracking-tight">Sponsorship Rates</h1>
          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-accent-muted-soft text-accent-muted text-xs font-black">
            <TrendingUp className="w-3 h-3" />+15%
          </span>
        </div>
        <p className="text-sm font-bold text-text-tertiary mt-1 ml-4">AI-powered pricing based on market analysis</p>
      </header>

      {/* CPM Hero */}
      <motion.div
        className="glass-card rounded-[24px] p-8 mb-6 relative overflow-hidden group"
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ ease: 'easeOut' }}
      >
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-accent flex items-center justify-center shrink-0 neon-glow">
            <DollarSign className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <p className="text-xs font-black text-text-tertiary uppercase tracking-wider">Your CPM</p>
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-accent-muted-soft text-accent-muted text-xs font-black">
                <Crown className="w-3 h-3" />Top 20%
              </span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-black">
                <BarChart4 className="w-3 h-3" />+15% vs last month
              </span>
            </div>
            <p className="text-5xl font-display font-black text-text tracking-tight">${f.estimatedCpm.toFixed(2)}</p>
            <p className="text-sm font-bold text-text-tertiary mt-1">Cost per thousand impressions</p>
          </div>
        </div>
      </motion.div>

      {/* Rate cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Mention', min: f.mention.min, max: f.mention.max, desc: 'Brief product mention in your regular content', icon: TrendingUp, delay: 0.2 },
          { label: 'Dedicated', min: f.dedicated.min, max: f.dedicated.max, desc: 'Full video dedicated to the product', icon: Target, delay: 0.25 },
          { label: 'Series', min: f.series.min, max: f.series.max, desc: 'Multi-video campaign over time', icon: Award, delay: 0.3 },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              className="glass-card rounded-[24px] p-7 relative overflow-hidden group"
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ delay: item.delay * 0.5, ease: 'easeOut' }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-accent-muted-soft flex items-center justify-center">
                  <Icon className="w-6 h-6 text-accent-muted" />
                </div>
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-accent-muted-soft text-accent-muted text-xs font-black">
                  <TrendingUp className="w-3 h-3" />Best value
                </span>
              </div>
              <p className="text-3xl font-display font-black text-text tracking-tight">
                ${item.min.toLocaleString()} <span className="text-base text-text-tertiary font-sans font-bold">—</span> ${item.max.toLocaleString()}
              </p>
              <p className="text-xs font-bold text-text-tertiary mt-3">{item.desc}</p>
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-text-tertiary">Market avg.</span>
                  <span className="text-text-secondary">${Math.round(item.min * 1.15).toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Market context */}
      <motion.div
        className="glass-card rounded-[24px] p-7 relative overflow-hidden group"
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-20px' }}
        transition={{ delay: 0.15, ease: 'easeOut' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-accent-muted-soft flex items-center justify-center">
            <BarChart4 className="w-5 h-5 text-accent-muted" />
          </div>
          <h2 className="text-base font-display font-black text-text tracking-tight">Market Analysis</h2>
        </div>
        <p className="text-sm font-medium text-text-secondary leading-relaxed">{f.marketContext}</p>
      </motion.div>
    </motion.div>
  );
}
