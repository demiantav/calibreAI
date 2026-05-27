import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { MetricCard } from '@/components/MetricCard';
import { GrowthChart } from '@/components/GrowthChart';
import { RateBar } from '@/components/RateBar';
import { Timeline } from '@/components/Timeline';
import {
  Users, Eye, DollarSign, ArrowRight, Activity,
  MessageSquare, BarChart3, Sparkles, TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePulse } from '@/lib/pulse-context';
import { RelativeTime } from '@/lib/use-relative-time';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { API_BASE_URL, getAuthHeaders } from '@/lib/api-config';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonMetric } from '@/components/ui/skeleton-card';
import type { LogEntry, SponsorshipForecast, PitchDraft } from '@/lib/types';

const LOGS_ENDPOINT = '/logs';
const POLL_INTERVAL_MS = 3000;
const POLL_INITIAL_DELAY_MS = 2000;
const POLL_TIMEOUT_MS = 60000;

export default function Dashboard() {
  const [isPulsing, setIsPulsing] = useState(false);
  const [pulseError, setPulseError] = useState('');
  const [gmailError, setGmailError] = useState('');
  const pollingRef = useRef<{ stopped: boolean; timeoutId: ReturnType<typeof setTimeout> | null }>({ stopped: false, timeoutId: null });

  const { lastPulseAt, setPulseStatus } = usePulse();
  const { data: logs, isLoading, error, refetch } = useApiFetch<LogEntry[]>(LOGS_ENDPOINT);

  const handleReconnectGmail = async () => {
    const token = localStorage.getItem('calibre-jwt');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/gmail/start`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Error starting Gmail OAuth:', err);
    }
  };

  useEffect(() => {
    if (!lastPulseAt) return;

    setIsPulsing(true);
    setPulseError('');
    const guard = pollingRef.current;
    guard.stopped = false;
    guard.timeoutId = null;

    const poll = async () => {
      if (guard.stopped) return;
      try {
        const res = await fetch(`${API_BASE_URL}${LOGS_ENDPOINT}`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data: LogEntry[] = await res.json();

          const hasNewSummary = data.some(
            (log) =>
              log.type === 'agent_summary' &&
              new Date(log.created_at).getTime() > lastPulseAt
          );
          if (hasNewSummary) {
            guard.stopped = true;
            if (guard.timeoutId) clearTimeout(guard.timeoutId);
            setIsPulsing(false);
            setPulseStatus('success');
            setPulseError('');
            refetch();
            return;
          }

          const newError = data.find(
            (log) =>
              log.type === 'agent_error' &&
              new Date(log.created_at).getTime() > lastPulseAt
          );
          if (newError) {
            guard.stopped = true;
            if (guard.timeoutId) clearTimeout(guard.timeoutId);
            setIsPulsing(false);
            setPulseStatus('error');
            setPulseError((newError.content as any)?.text || 'Error en el análisis');
            refetch();
            return;
          }

          const gmailAuthError = data.find(
            (log) =>
              log.type === 'gmail_auth_error' &&
              new Date(log.created_at).getTime() > lastPulseAt
          );
          if (gmailAuthError) {
            guard.stopped = true;
            if (guard.timeoutId) clearTimeout(guard.timeoutId);
            setIsPulsing(false);
            setPulseStatus('error');
            setGmailError((gmailAuthError.content as any)?.text || 'Gmail desconectado');
            refetch();
            return;
          }
        }
      } catch {
        // Polling errors are acceptable; safety timeout handles failure
      }

      if (!guard.stopped) {
        guard.timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    const initialDelay = setTimeout(poll, POLL_INITIAL_DELAY_MS);
    const safety = setTimeout(() => {
      guard.stopped = true;
      if (guard.timeoutId) clearTimeout(guard.timeoutId);
      setIsPulsing(false);
      setPulseStatus('error');
    }, POLL_TIMEOUT_MS);

    return () => {
      guard.stopped = true;
      if (guard.timeoutId) clearTimeout(guard.timeoutId);
      clearTimeout(initialDelay);
      clearTimeout(safety);
    };
  }, [lastPulseAt, setPulseStatus, refetch]);

  const latestAnalysis = logs?.find((log) => log.type === 'media_kit_update');
  const latestPitch = logs?.find((log) => log.type === 'pitch_draft');
  const forecastContent = logs?.find((log) => log.type === 'sponsorship_forecast')?.content as SponsorshipForecast | undefined;
  const latestSummary = logs?.find((log) => log.type === 'agent_summary');

  const pendingPitches = logs?.filter(
    (log) => log.type === 'pitch_draft' && (log.content as PitchDraft)?.status === 'draft_ready'
  ) ?? [];

  const analysisContent = latestAnalysis?.content as { subscribers?: number; totalViews?: number; engagementRate?: number } | undefined;
  const creatorName = latestAnalysis?.creator_name;
  const realSubs = analysisContent?.subscribers;
  const realViews = analysisContent?.totalViews;
  const realEngagement = analysisContent?.engagementRate;
  const hasMetrics = realSubs != null && realViews != null && realEngagement != null;
  const engDisplay = realEngagement == null ? null : realEngagement <= 0 ? '0' : realEngagement < 0.01 ? '<0.01' : realEngagement.toFixed(2);

  if (isLoading) {
    return (
      <motion.div className="min-h-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
        {/* Hero skeleton */}
        <section className="relative mb-16 lg:mb-24">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 lg:gap-12">
            <div className="flex items-end gap-5 lg:gap-7">
              <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-3xl bg-surface-raised animate-pulse" />
              <div className="pb-1 space-y-3">
                <div className="h-10 lg:h-16 bg-surface-raised rounded animate-pulse w-48 lg:w-72" />
                <div className="h-4 bg-surface-raised rounded animate-pulse w-64" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-surface-raised rounded animate-pulse w-32" />
              <div className="h-14 lg:h-20 bg-surface-raised rounded animate-pulse w-40" />
            </div>
          </div>
        </section>
        {/* Metrics skeleton */}
        <section className="mb-16 lg:mb-24">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <SkeletonMetric />
            <SkeletonMetric />
            <SkeletonMetric />
            <SkeletonMetric />
          </div>
        </section>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div className="min-h-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
        <ErrorState message={error} onRetry={refetch} />
      </motion.div>
    );
  }

  return (
    <motion.div className="min-h-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>

      {/* ========== HERO SECTION ========== */}
      <section className="relative mb-6 lg:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 lg:gap-12">
          {/* Left: Avatar + Name */}
          <div className="flex items-end gap-5 lg:gap-7">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-3xl bg-gradient-to-br from-accent via-accent-secondary to-accent-muted flex items-center justify-center text-white text-3xl lg:text-4xl font-black shadow-2xl relative z-10">
                {creatorName ? creatorName.charAt(0).toUpperCase() : '?'}
              </div>
              <svg className="absolute -inset-4 w-[calc(100%+32px)] h-[calc(100%+32px)] -z-10" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="heroRing" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#EA5103" stopOpacity="0.5" />
                    <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#EA5103" stopOpacity="0.5" />
                  </linearGradient>
                </defs>
                <motion.circle
                  cx="50" cy="50" r="46"
                  fill="none"
                  stroke="url(#heroRing)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  animate={{ strokeDasharray: ["0 289", "289 0"], rotate: [0, 360] }}
                  transition={{
                    strokeDasharray: { duration: 3, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" },
                    rotate: { duration: 12, repeat: Infinity, ease: "linear" },
                  }}
                  style={{ transformOrigin: "center" }}
                />
              </svg>
              <div className="absolute -inset-8 bg-accent/10 rounded-full blur-3xl -z-20" />
            </div>

            {/* Name + tagline */}
            <div className="pb-1">
              <motion.h1
                className="text-4xl lg:text-6xl xl:text-7xl font-display font-black text-text tracking-tighter leading-[0.95]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.7 }}
              >
                {creatorName ?? 'Your Channel'}
              </motion.h1>
            </div>
          </div>


        </div>
      </section>

      {/* ========== METRICS ROW ========== */}
      <section className="mb-10 lg:mb-14">
        {hasMetrics ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <MetricCard label="Followers" value={realSubs!} icon={Users} />
            <MetricCard label="Total Views" value={realViews!} icon={Eye} />
            <MetricCard label="Engagement" value={realEngagement!} suffix="%" icon={Activity} accent />
            <MetricCard label="Min. Rate" value={forecastContent?.mention?.min ?? 0} prefix="$" icon={DollarSign} />
          </div>
        ) : (
          <div className="rounded-[24px] p-8 bg-surface border border-border text-center">
            <Sparkles className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
            <p className="text-base font-semibold text-text mb-1">No metrics yet</p>
            <p className="text-sm text-text-secondary">Run a Pulse to analyze your channel and see your stats here.</p>
          </div>
        )}
      </section>

      {/* ========== PULSE ERROR ========== */}
      {pulseError && (
        <motion.div
          className="mb-6 lg:mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="font-semibold mb-1">Error en el análisis</p>
          <p className="text-text-secondary">{pulseError}</p>
        </motion.div>
      )}

      {/* ========== GMAIL AUTH ERROR ========== */}
      {gmailError && (
        <motion.div
          className="mb-6 lg:mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="font-semibold mb-1">Gmail desconectado</p>
          <p className="text-text-secondary mb-3">{gmailError}</p>
          <button
            onClick={handleReconnectGmail}
            className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 text-sm font-semibold hover:bg-amber-500/30 transition-colors"
          >
            Re-conectar Gmail
          </button>
        </motion.div>
      )}

      {/* ========== DAILY BRIEF ========== */}
      {latestSummary && (
        <motion.section
          className="mb-10 lg:mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.15em]">Daily Brief</span>
            <span className="text-[11px] text-text-tertiary">
              <RelativeTime iso={latestSummary?.created_at} />
            </span>
          </div>

          <div className="flex gap-4 max-w-4xl">
            {/* Agent Avatar */}
            <div className="shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent-muted flex items-center justify-center text-white text-sm font-bold shadow-lg">
                C
              </div>
            </div>

            {/* Chat Bubble */}
            <div className="flex-1">
              <div className="relative rounded-2xl rounded-tl-sm bg-surface-raised border border-border p-5 lg:p-6">
                <div className="absolute -left-1.5 top-0 w-3 h-3 bg-surface-raised border-l border-b border-border rotate-45" />
                <div className="space-y-3">
                  {((latestSummary.content as { text: string })?.text || latestSummary.insights || '')
                    .split('\n')
                    .filter((line) => line.trim().length > 0)
                    .map((paragraph, i) => (
                      <p key={i} className="text-base lg:text-lg text-text leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* ========== GROWTH CHART ========== */}
      {hasMetrics && (
        <motion.section
          className="mb-10 lg:mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <GrowthChart />
        </motion.section>
      )}

      {/* ========== TWO-COLUMN ASYMMETRIC LAYOUT ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-10 lg:mb-14">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-7 space-y-8 lg:space-y-10">

          {/* Rates */}
          {forecastContent ? (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-baseline justify-between mb-8">
                <div>
                  <h2 className="text-2xl lg:text-3xl font-display font-black text-text tracking-tight">Your Rates</h2>
                  <p className="text-sm text-text-secondary mt-1">Sponsorship pricing based on market analysis</p>
                </div>
                <Link to="/sponsorship" className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-accent hover:text-accent/80 transition-colors uppercase tracking-wider">
                  Details &rarr;
                </Link>
              </div>

              <div className="space-y-6">
                <RateBar
                  label="Mention"
                  min={forecastContent.mention?.min ?? 0}
                  max={forecastContent.mention?.max ?? 0}
                  desc="Brief product mention"
                  index={0}
                />
                <RateBar
                  label="Dedicated"
                  min={forecastContent.dedicated?.min ?? 0}
                  max={forecastContent.dedicated?.max ?? 0}
                  desc="Full dedicated video"
                  index={1}
                />
                <RateBar
                  label="Series"
                  min={forecastContent.series?.min ?? 0}
                  max={forecastContent.series?.max ?? 0}
                  desc="Multi-video campaign"
                  index={2}
                />
              </div>
            </motion.section>
          ) : (
            <div className="rounded-[24px] p-8 bg-surface border border-border text-center">
              <DollarSign className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
              <p className="text-base font-semibold text-text mb-1">No rates yet</p>
              <p className="text-sm text-text-secondary">Run a Pulse to generate sponsorship rate forecasts.</p>
            </div>
          )}

          {/* Timeline */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl lg:text-3xl font-display font-black text-text tracking-tight">Activity</h2>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-raised text-text-secondary text-[10px] font-semibold border border-border">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Live
              </span>
            </div>
            <Timeline logs={logs ?? []} />
          </motion.section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-5 space-y-6 lg:mt-8">

          {/* Pending Pitches */}
          {pendingPitches.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative rounded-[28px] p-8 overflow-hidden bg-gradient-to-br from-accent to-[#c43a00]"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-white/30 to-transparent" />
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />

              <div className="relative">
                <p className="text-[11px] font-semibold text-white/80 uppercase tracking-[0.15em] mb-4">Pending Pitches</p>
                <p className="text-7xl lg:text-8xl font-display font-black text-white tracking-tighter leading-none">
                  {pendingPitches.length}
                </p>
                <p className="text-sm text-white/90 mt-2">Drafts ready to send</p>

                <Link
                  to="/pitches"
                  className="inline-flex items-center gap-2 mt-6 px-5 py-3.5 bg-white/15 hover:bg-white/25 text-white rounded-2xl text-sm font-semibold transition-all border border-white/10 min-h-[44px]"
                >
                  Review All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          )}

          {/* Latest Pitch */}
          {latestPitch && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="rounded-[24px] p-7 bg-surface border border-border glow-border"
            >
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-4 h-4 text-accent-muted" />
                <span className="text-[10px] font-semibold text-accent-muted uppercase tracking-wider">Latest Pitch</span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed line-clamp-4">{latestPitch.insights}</p>
              <Link to="/pitches" className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-accent mt-4 hover:text-accent/80 transition-colors">
                View all pitches <ArrowRight className="w-3 h-3" />
              </Link>
            </motion.div>
          )}

          {/* Latest Analysis */}
          {latestAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="rounded-[24px] p-7 bg-surface border border-border"
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-accent" />
                <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Latest Insights</span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed line-clamp-4">{latestAnalysis.insights}</p>
              <p className="text-[10px] text-text-tertiary mt-3">
                <RelativeTime iso={latestAnalysis.created_at} />
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* ========== LOADING STATUS ========== */}
      {isLoading && (
        <motion.div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 rounded-2xl px-5 py-3 text-xs font-semibold text-text-secondary flex items-center gap-3 z-50 bg-surface border border-border shadow-lg"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          Loading data...
        </motion.div>
      )}
    </motion.div>
  );
}
