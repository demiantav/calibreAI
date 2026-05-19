import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { MetricCard } from '@/components/MetricCard';
import {
  Users, Eye, DollarSign, ArrowRight, Activity,
  MessageSquare, TrendingUp, BarChart3, Target, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePulse } from '@/lib/pulse-context';
import type { LogEntry, SponsorshipForecast, PitchDraft } from '@/lib/types';

export default function Dashboard() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const pollingRef = useRef<{ stopped: boolean }>({ stopped: false });

  const { lastPulseAt, setPulseStatus } = usePulse();

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8080/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    if (!lastPulseAt) return;

    setIsPulsing(true);
    const guard = pollingRef.current;
    guard.stopped = false;

    const poll = async () => {
      if (guard.stopped) return;
      try {
        const res = await fetch('http://localhost:8080/logs');
        if (res.ok) {
          const data = await res.json();
          setLogs(data);

          const hasNewSummary = data.some(
            (log: LogEntry) =>
              log.type === 'agent_summary' &&
              new Date(log.created_at).getTime() > lastPulseAt
          );
          if (hasNewSummary) {
            guard.stopped = true;
            setIsPulsing(false);
            setPulseStatus('success');
            return;
          }
        }
      } catch { /* silent */ }

      if (!guard.stopped) setTimeout(poll, 3000);
    };

    const initialDelay = setTimeout(poll, 2000);
    const safety = setTimeout(() => {
      guard.stopped = true;
      setIsPulsing(false);
      setPulseStatus('error');
    }, 60000);

    return () => {
      guard.stopped = true;
      clearTimeout(initialDelay);
      clearTimeout(safety);
    };
  }, [lastPulseAt]);

  const latestAnalysis = logs.find((log) => log.type === 'media_kit_update');
  const latestPitch = logs.find((log) => log.type === 'pitch_draft');
  const forecastContent = logs.find((log) => log.type === 'sponsorship_forecast')?.content as SponsorshipForecast | undefined;
  const latestSummary = logs.find((log) => log.type === 'agent_summary');
  const activityLogs = logs.slice(0, 4);

  const pendingPitches = logs.filter(
    (log) => log.type === 'pitch_draft' && (log.content as PitchDraft)?.status === 'draft_ready'
  );
  const analysisContent = latestAnalysis?.content as { subscribers?: number; totalViews?: number; engagementRate?: number; lastVideoViews?: number; lastVideoLikes?: number; lastVideoComments?: number } | undefined;
  const creatorName = latestAnalysis?.creator_name ?? 'Sarah Chen';
  const realSubs = analysisContent?.subscribers ?? 127500;
  const realViews = analysisContent?.totalViews ?? 4825000;
  const realEngagement = analysisContent?.engagementRate ?? 2.86;
  const engDisplay = realEngagement <= 0 ? '0' : realEngagement < 0.01 ? '<0.01' : realEngagement.toFixed(2);

  const logTypeMeta: Record<string, { icon: typeof Activity; label: string }> = {
    media_kit_update: { icon: BarChart3, label: 'Analysis' },
    pitch_draft: { icon: MessageSquare, label: 'Pitch' },
    sponsorship_forecast: { icon: TrendingUp, label: 'Forecast' },
    agent_summary: { icon: BarChart3, label: 'Brief' },
  };

  return (
    <motion.div className="min-h-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

      {/* Profile bar with animated avatar ring */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center text-white text-xl font-black shadow-lg relative z-10">
              {creatorName.charAt(0).toUpperCase()}
            </div>
            <motion.div
              className="absolute -inset-1.5 rounded-2xl border-2 border-accent/30 -z-10"
              animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.2, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -inset-3 rounded-2xl border border-accent/10 -z-20"
              animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.05, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-black text-text tracking-tight">{creatorName}</h1>
              <span className="px-3 py-1 rounded-full bg-accent-muted-soft text-accent-muted text-xs font-black uppercase tracking-wider">Pro Creator</span>
            </div>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-sm font-bold text-text-secondary">{realSubs.toLocaleString()} Followers</p>
              <span className="w-1 h-1 rounded-full bg-text-tertiary" />
              <p className="text-sm font-bold text-text-secondary">{engDisplay}% Eng. Rate</p>
              <span className="w-1 h-1 rounded-full bg-text-tertiary" />
              <p className="text-sm font-bold text-text-secondary">${forecastContent?.mention?.min ?? 850} Min. Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Brief — agent summary */}
      {latestSummary && (
        <motion.div
          className="relative mb-8 rounded-[24px] overflow-hidden"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-accent-soft to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-accent-muted to-transparent" />
          <div className="relative glass-card rounded-[24px] p-7 border border-accent/10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center neon-glow shrink-0">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-lg font-display font-black text-text tracking-tight">Daily Brief</h2>
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-muted-soft text-accent-muted text-[10px] font-black uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-muted ai-active-dot" />
                    AI Report
                  </span>
                </div>
                <p className="text-sm font-medium text-text-secondary leading-relaxed whitespace-pre-line">
                  {(latestSummary.content as { text: string })?.text || latestSummary.insights}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Followers" value={realSubs} icon={Users} accent />
        <MetricCard label="Total Views" value={realViews} icon={Eye} />
        <MetricCard label="Engagement" value={realEngagement} suffix="%" icon={Activity} />
        <MetricCard label="Min. Rate" value={forecastContent?.mention?.min ?? 850} prefix="$" icon={DollarSign} accent />
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Latest Insights */}
        {latestAnalysis && (
          <motion.section
            className="lg:col-span-8 glass-card rounded-[24px] p-7 relative overflow-hidden group card-glow"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-muted via-accent-muted to-transparent" />
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center neon-glow shrink-0">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-display font-black text-text tracking-tight">Latest Insights</h3>
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-muted-soft text-accent-muted text-[10px] font-black uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-muted animate-pulse" />
                    New
                  </span>
                </div>
                <p className="text-xs font-bold text-text-tertiary">Just now · Media Kit Analysis</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed max-w-prose">{latestAnalysis.insights}</p>
          </motion.section>
        )}

        {/* Agent Status */}
        <motion.section
          className="lg:col-span-4 glass-card rounded-[24px] p-7 relative overflow-hidden group card-glow"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-muted/60 to-transparent" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-muted/5 rounded-full blur-3xl" />
          <div className="flex items-center gap-2 mb-5">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-muted-soft text-accent-muted text-xs font-black ai-active-glow">
              <span className="w-2 h-2 rounded-full bg-accent-muted ai-active-dot" />
              AI Active
            </span>
          </div>
          <h3 className="text-base font-display font-black text-text tracking-tight mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {activityLogs.length > 0 ? (
              activityLogs.map((log, i) => {
                const meta = logTypeMeta[log.type] || { icon: Activity, label: 'Event' };
                const Icon = meta.icon;
                return (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-7 h-7 rounded-xl bg-accent-muted-soft flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5 text-accent-muted" />
                      </div>
                      {i < activityLogs.length - 1 && <div className="w-px flex-1 bg-border" />}
                    </div>
                    <div className="flex-1 min-w-0 pb-1.5">
                      <p className="text-sm font-black text-text truncate">{meta.label}</p>
                      <p className="text-xs font-bold text-text-secondary truncate">{log.insights}</p>
                    </div>
                  </div>
                );
              })
            ) : activityLogs.length === 0 && (
              <p className="text-sm text-text-tertiary font-bold">Run a pulse to see activity</p>
            )}
          </div>
          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-white/40 dark:border-border">
            <motion.div whileTap={{ scale: 0.96 }} className="inline-block">
              <Link to="/pitches" className="flex items-center gap-1.5 px-5 py-2.5 bg-accent text-white rounded-2xl text-xs font-black hover:brightness-110 transition-all shadow-lg shadow-accent/20">
                View Pitches
                <motion.span
                  className="inline-flex"
                  whileHover={{ x: 2 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <ArrowRight className="w-3 h-3" />
                </motion.span>
              </Link>
            </motion.div>
            <motion.div whileTap={{ scale: 0.96 }} className="inline-block">
              <Link to="/logs" className="flex items-center gap-1.5 px-5 py-2.5 bg-surface-hover text-text-secondary rounded-2xl text-xs font-black hover:text-text transition-all border border-border/50">
                Activity Log
              </Link>
            </motion.div>
          </div>
        </motion.section>

        {/* Latest Pitch */}
        {latestPitch && (
          <motion.section
            className="lg:col-span-7 glass-card rounded-[24px] p-7 relative overflow-hidden group card-glow"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-muted/40 to-transparent" />
            <div className="absolute left-0 top-4 bottom-4 w-1 rounded-full bg-accent-muted/40 group-hover:bg-accent transition-colors duration-300" />
            <div className="flex items-center gap-2 mb-4 ml-3">
              <span className="px-3 py-1.5 rounded-full bg-accent-muted-soft text-accent-muted text-xs font-black">Latest Pitch</span>
              <span className="px-3 py-1.5 rounded-full bg-surface-hover text-text-tertiary text-xs font-black border border-border/50">High Priority</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed ml-3">{latestPitch.insights}</p>
            <Link to="/pitches" className="inline-flex items-center gap-1 text-xs font-black text-accent hover:text-accent/80 mt-4 ml-3 transition-colors">
              View all pitches
              <ArrowRight className="w-3 h-3" />
            </Link>
          </motion.section>
        )}

        {/* Rates */}
        <motion.section
          className="lg:col-span-5 glass-card rounded-[24px] p-7 relative overflow-hidden group card-glow"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-muted/40 to-transparent" />
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-accent-muted-soft flex items-center justify-center">
                <Target className="w-5.5 h-5.5 text-accent-muted" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-base font-display font-black text-text tracking-tight">Your Rates</h3>
                <p className="text-xs font-bold text-text-tertiary">Market analysis</p>
              </div>
            </div>
            <Link to="/sponsorship" className="text-xs font-black text-accent hover:text-accent/80 transition-colors">Details</Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Mention', value: forecastContent?.mention?.min ?? 850 },
              { label: 'Dedicated', value: forecastContent?.dedicated?.min ?? 2500 },
              { label: 'Series', value: forecastContent?.series?.min ?? 6000 },
            ].map((item, i) => (
              <div key={item.label} className="text-center p-4 rounded-2xl bg-surface-hover border border-border/50 hover:border-accent/20 hover:bg-accent-soft/30 transition-all duration-200 group/rate">
                <p className="text-xl font-display font-black text-text group-hover/rate:text-accent transition-colors">${item.value.toLocaleString()}</p>
                <p className="text-[10px] text-text-tertiary font-black uppercase tracking-wide mt-1">{item.label}</p>
                <div className="mt-2 h-1 rounded-full bg-border/50 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-accent-muted/40"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(i + 1) * 30}%` }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Pending Pitches — solid orange card */}
        {pendingPitches.length > 0 && (
          <motion.section
            className="lg:col-span-4 rounded-[24px] p-7 relative overflow-hidden bg-accent/15 border border-accent/25"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent/60 to-accent/10" />
            <div className="flex flex-col items-center text-center gap-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-6xl font-display font-black text-accent">
                  {pendingPitches.length}
                </span>
                <span className="text-sm font-black text-accent/70 self-end mb-2">
                  pending
                </span>
              </div>
              <div>
                <p className="text-sm font-display font-black text-text tracking-tight">Pending Pitches</p>
                <p className="text-xs font-bold text-text-tertiary">Drafts ready to send</p>
              </div>
              <Link
                to="/pitches"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-accent/20 hover:bg-accent/30 text-accent rounded-2xl text-xs font-black transition-all"
              >
                Review All
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.section>
        )}
      </div>

      {(isLoading || isPulsing) && (
        <motion.div
          className="fixed bottom-6 right-6 glass-card rounded-2xl px-5 py-3 text-xs font-bold text-text-secondary flex items-center gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          {isPulsing ? (
            <><Sparkles className="w-3.5 h-3.5 text-accent" /> Pulse en progreso…</>
          ) : (
            'Loading data…'
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
