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
  const pollingRef = useRef<{ stopped: boolean; timeoutId: ReturnType<typeof setTimeout> | null }>({ stopped: false, timeoutId: null });

  const { lastPulseAt, setPulseStatus } = usePulse();
  const { data: logs, isLoading, error, refetch } = useApiFetch<LogEntry[]>(LOGS_ENDPOINT);

  useEffect(() => {
    if (!lastPulseAt) return;

    setIsPulsing(true);
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
      <section className="relative mb-16 lg:mb-24">
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
              <motion.p
                className="text-sm lg:text-base text-text-secondary mt-2 font-normal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {hasMetrics ? (
                  <>
                    Creator &middot; {realSubs!.toLocaleString()} followers &middot; {engDisplay}% engagement
                  </>
                ) : (
                  'Run a Pulse to load your channel metrics'
                )}
              </motion.p>
            </div>
          </div>

          {/* Right: Hero Metric */}
          {hasMetrics && (
            <motion.div
              className="lg:text-right"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.15em] mb-1">Engagement Rate</p>
              <p className="text-6xl lg:text-8xl font-display font-black text-accent tracking-tighter tabular-nums leading-none">
                {engDisplay}<span className="text-3xl lg:text-5xl text-accent/60">%</span>
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* ========== DAILY BRIEF ========== */}
      {latestSummary && (
        <motion.section
          className="mb-16 lg:mb-24"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-[11px] font-semibold text-accent uppercase tracking-[0.15em]">Daily Brief</span>
            <span className="text-[11px] text-text-tertiary">
              <RelativeTime iso={latestSummary?.created_at} />
            </span>
          </div>

          <div className="max-w-4xl">
            <p className="text-xl lg:text-2xl xl:text-3xl font-normal text-text leading-[1.5] lg:leading-[1.45]">
              {(latestSummary.content as { text: string })?.text || latestSummary.insights}
            </p>
          </div>

          <div className="mt-8 h-px bg-gradient-to-r from-border via-border to-transparent max-w-2xl" />
        </motion.section>
      )}

      {/* ========== GROWTH CHART ========== */}
      {hasMetrics && (
        <motion.section
          className="mb-16 lg:mb-24"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <GrowthChart />
        </motion.section>
      )}

      {/* ========== METRICS ROW ========== */}
      <section className="mb-16 lg:mb-24">
        {hasMetrics ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <MetricCard label="Followers" value={realSubs!} icon={Users} accent />
            <MetricCard label="Total Views" value={realViews!} icon={Eye} />
            <MetricCard label="Engagement" value={realEngagement!} suffix="%" icon={Activity} />
            <MetricCard label="Min. Rate" value={forecastContent?.mention?.min ?? 0} prefix="$" icon={DollarSign} accent />
          </div>
        ) : (
          <div className="rounded-[24px] p-8 bg-surface border border-border text-center">
            <Sparkles className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
            <p className="text-base font-semibold text-text mb-1">No metrics yet</p>
            <p className="text-sm text-text-secondary">Run a Pulse to analyze your channel and see your stats here.</p>
          </div>
        )}
      </section>

      {/* ========== TWO-COLUMN ASYMMETRIC LAYOUT ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16 lg:mb-24">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-7 space-y-12 lg:space-y-16">

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
        <div className="lg:col-span-5 space-y-8 lg:mt-12">

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

      {/* ========== PULSE STATUS ========== */}
      {(isLoading || isPulsing) && (
        <motion.div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 rounded-2xl px-5 py-3 text-xs font-semibold text-text-secondary flex items-center gap-3 z-50 bg-surface border border-border shadow-lg"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          {isPulsing ? (
            <><Sparkles className="w-3.5 h-3.5 text-accent" /> Pulse in progress...</>
          ) : (
            'Loading data...'
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
