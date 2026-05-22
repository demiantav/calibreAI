import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Layers, BarChart3, FileText, DollarSign, Sparkles } from 'lucide-react';
import type { LogEntry } from '@/lib/types';
import { RelativeTime } from '@/lib/use-relative-time';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonText } from '@/components/ui/skeleton-card';

type FilterType = 'all' | 'media_kit_update' | 'pitch_draft' | 'sponsorship_forecast' | 'agent_summary';

const filterConfig = [
  { value: 'all' as FilterType, label: 'All', icon: Layers },
  { value: 'media_kit_update' as FilterType, label: 'Analytics', icon: BarChart3 },
  { value: 'pitch_draft' as FilterType, label: 'Pitches', icon: FileText },
  { value: 'sponsorship_forecast' as FilterType, label: 'Forecasts', icon: DollarSign },
  { value: 'agent_summary' as FilterType, label: 'Brief', icon: Sparkles },
];

const typeLabels: Record<string, { label: string }> = {
  media_kit_update: { label: 'Analytics' },
  pitch_draft: { label: 'Pitch' },
  sponsorship_forecast: { label: 'Forecast' },
  agent_summary: { label: 'Brief' },
};

const typeIcons: Record<string, typeof BarChart3> = {
  media_kit_update: BarChart3,
  pitch_draft: FileText,
  sponsorship_forecast: DollarSign,
  agent_summary: Sparkles,
};

const LOGS_ENDPOINT = '/logs';

export default function Logs() {
  const { data: logs, isLoading, error, refetch } = useApiFetch<LogEntry[]>(LOGS_ENDPOINT);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter((log) => {
      const matchesFilter = filter === 'all' || log.type === filter;
      const matchesSearch = log.insights.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [logs, filter, searchQuery]);

  return (
    <motion.div className="min-h-screen p-4 lg:p-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-1 h-6 rounded-full bg-accent" />
          <h1 className="text-2xl font-display font-black text-text tracking-tight">Activity Log</h1>
        </div>
        <p className="text-sm font-bold text-text-tertiary mt-1 ml-4">Everything your AI agent has been working on</p>
      </header>

      {error && (
        <div className="mb-6">
          <ErrorState message={error} onRetry={refetch} />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search activity…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-3 bg-surface-hover/70 border border-border/50 rounded-2xl text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-accent/30 transition-colors font-bold backdrop-blur-sm"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {filterConfig.map((option) => {
            const Icon = option.icon;
            const isActive = filter === option.value;
            return (
              <motion.div whileTap={{ scale: 0.93 }} key={option.value}>
                <button
                  onClick={() => setFilter(option.value)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all min-h-[44px] ${
                    isActive ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-surface-hover/70 border border-border/50 text-text-tertiary hover:text-text hover:border-accent/20'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {option.label}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="max-w-2xl">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-border mt-2 shrink-0 animate-pulse" />
                <div className="flex-1 rounded-2xl p-5 space-y-2 bg-surface border border-border">
                  <SkeletonText width="20%" />
                  <SkeletonText width="100%" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredLogs.length > 0 ? (
          filteredLogs.map((entry, index) => {
            const typeStyle = typeLabels[entry.type] || typeLabels.media_kit_update;
            const Icon = typeIcons[entry.type] || BarChart3;
            return (
              <motion.div
                key={entry.id}
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <div className="flex flex-col items-center gap-0.5 pt-2">
                  <div className="w-3 h-3 rounded-full bg-accent-muted-soft border-2 border-accent-muted shrink-0" />
                  {index < filteredLogs.length - 1 && <div className="w-px flex-1 bg-border min-h-[24px]" />}
                </div>
                <div className="flex-1 rounded-2xl p-5 mb-3 bg-surface border border-border">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-xl bg-accent-muted-soft flex items-center justify-center">
                      <Icon className="w-3 h-3 text-accent-muted" />
                    </div>
                    <span className="text-xs font-black text-text-secondary">{typeStyle.label}</span>
                    <span className="w-1 h-1 rounded-full bg-text-tertiary" />
                    <span className="text-xs font-bold text-text-tertiary"><RelativeTime iso={entry.created_at} /></span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed font-medium">{entry.insights}</p>
                </div>
              </motion.div>
            );
          })
        ) : (
          <motion.div className="text-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="w-14 h-14 rounded-2xl bg-surface-hover/70 border border-border/50 mx-auto mb-4 flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="w-6 h-6 text-text-tertiary" />
            </div>
            <p className="text-base font-black text-text">No results found</p>
            <p className="text-sm font-bold text-text-tertiary mt-1">Try adjusting your search or filters</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
