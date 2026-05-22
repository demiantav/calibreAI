import { useEffect, useState, useCallback, useRef } from 'react';
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

  const pendingPitches = logs.filter(
    (log) => log.type === 'pitch_draft' && (log.content as PitchDraft)?.status === 'draft_ready'
  );

  const analysisContent = latestAnalysis?.content as { subscribers?: number; totalViews?: number; engagementRate?: number } | undefined;
  const creatorName = latestAnalysis?.creator_name ?? 'Sarah Chen';
  const realSubs = analysisContent?.subscribers ?? 127500;
  const realViews = analysisContent?.totalViews ?? 4825000;
  const realEngagement = analysisContent?.engagementRate ?? 4.5;
  const engDisplay = realEngagement <= 0 ? '0' : realEngagement < 0.01 ? '<0.01' : realEngagement.toFixed(2);

  return (
    <motion.div className="min-h-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>

      {/* ========== HERO SECTION ========== */}
      <section className="relative mb-16 lg:mb-24">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 lg:gap-12">
          {/* Left: Avatar + Name */}
          <div className="flex items-end gap-5 lg:gap-7">
            {/* Avatar — prominent, artistic */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-3xl bg-gradient-to-br from-accent via-accent-secondary to-accent-muted flex items-center justify-center text-white text-3xl lg:text-4xl font-black shadow-2xl relative z-10">
                {creatorName.charAt(0).toUpperCase()}
              </div>
              {/* Organic aura ring */}
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
              {/* Glow orb behind */}
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
                {creatorName}
              </motion.h1>
              <motion.p 
                className="text-sm lg:text-base text-text-secondary mt-2 font-normal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Creator &middot; {realSubs.toLocaleString()} followers &middot; {engDisplay}% engagement
              </motion.p>
            </div>
          </div>

          {/* Right: Hero Metric — Engagement as centerpiece */}
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
            <div className="flex items-center lg:justify-end gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                <TrendingUp className="w-3 h-3" />+15% vs last month
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========== DAILY BRIEF — Editorial Section ========== */}
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

          {/* Subtle divider */}
          <div className="mt-8 h-px bg-gradient-to-r from-border via-border to-transparent max-w-2xl" />
        </motion.section>
      )}

      {/* ========== GROWTH CHART — Prominent ========== */}
      <motion.section
        className="mb-16 lg:mb-24"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <GrowthChart />
      </motion.section>

      {/* ========== METRICS ROW — Subtle, horizontal ========== */}
      <section className="mb-16 lg:mb-24">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <MetricCard label="Followers" value={realSubs} icon={Users} accent />
          <MetricCard label="Total Views" value={realViews} icon={Eye} />
          <MetricCard label="Engagement" value={realEngagement} suffix="%" icon={Activity} />
          <MetricCard label="Min. Rate" value={forecastContent?.mention?.min ?? 850} prefix="$" icon={DollarSign} accent />
        </div>
      </section>

      {/* ========== TWO-COLUMN ASYMMETRIC LAYOUT ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16 lg:mb-24">
        
        {/* LEFT COLUMN — Rates + Timeline (wider) */}
        <div className="lg:col-span-7 space-y-12 lg:space-y-16">
          
          {/* Rates — Horizontal Bars */}
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
              <Link to="/sponsorship" className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors uppercase tracking-wider">
                Details &rarr;
              </Link>
            </div>
            
            <div className="space-y-6">
              <RateBar 
                label="Mention" 
                min={forecastContent?.mention?.min ?? 850} 
                max={forecastContent?.mention?.max ?? 1200}
                desc="Brief product mention"
                index={0}
              />
              <RateBar 
                label="Dedicated" 
                min={forecastContent?.dedicated?.min ?? 2500} 
                max={forecastContent?.dedicated?.max ?? 4000}
                desc="Full dedicated video"
                index={1}
              />
              <RateBar 
                label="Series" 
                min={forecastContent?.series?.min ?? 6000} 
                max={forecastContent?.series?.max ?? 10000}
                desc="Multi-video campaign"
                index={2}
              />
            </div>
          </motion.section>

          {/* Timeline */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl lg:text-3xl font-display font-black text-text tracking-tight">Activity</h2>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-muted-soft text-accent-muted text-[10px] font-semibold border border-accent-muted/20">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-muted animate-pulse" />
                Live
              </span>
            </div>
            <Timeline logs={logs} />
          </motion.section>
        </div>

        {/* RIGHT COLUMN — Pending Pitches + Latest Pitch (narrower, offset) */}
        <div className="lg:col-span-5 space-y-8 lg:mt-12">
          
          {/* Pending Pitches — Bold feature card */}
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
                <p className="text-[11px] font-semibold text-white/50 uppercase tracking-[0.15em] mb-4">Pending Pitches</p>
                <p className="text-7xl lg:text-8xl font-display font-black text-white tracking-tighter leading-none">
                  {pendingPitches.length}
                </p>
                <p className="text-sm text-white/70 mt-2">Drafts ready to send</p>
                
                <Link
                  to="/pitches"
                  className="inline-flex items-center gap-2 mt-6 px-5 py-3 bg-white/15 hover:bg-white/25 text-white rounded-2xl text-sm font-semibold transition-all backdrop-blur-sm border border-white/10"
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
              className="rounded-[24px] p-7 bg-surface border border-border backdrop-blur-2xl glow-border"
            >
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-4 h-4 text-accent-muted" />
                <span className="text-[10px] font-semibold text-accent-muted uppercase tracking-wider">Latest Pitch</span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed line-clamp-4">{latestPitch.insights}</p>
              <Link to="/pitches" className="inline-flex items-center gap-1 text-xs font-semibold text-accent mt-4 hover:text-accent/80 transition-colors">
                View all pitches <ArrowRight className="w-3 h-3" />
              </Link>
            </motion.div>
          )}

          {/* Latest Analysis snippet */}
          {latestAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="rounded-[24px] p-7 bg-surface border border-border backdrop-blur-2xl"
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
          className="fixed bottom-6 right-6 glass-card rounded-2xl px-5 py-3 text-xs font-semibold text-text-secondary flex items-center gap-3 z-50"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          {isPulsing ? (
            <><Sparkles className="w-3.5 h-3.5 text-accent" /> Pulse en progreso...</>
          ) : (
            'Loading data...'
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
