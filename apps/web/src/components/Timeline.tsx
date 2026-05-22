import { motion } from 'framer-motion';
import { Activity, MessageSquare, TrendingUp, BarChart3, type LucideIcon } from 'lucide-react';
import { RelativeTime } from '@/lib/use-relative-time';
import type { LogEntry } from '@/lib/types';

const logTypeMeta: Record<string, { icon: LucideIcon; label: string; accentClass: string; softClass: string; borderClass: string }> = {
  media_kit_update: {
    icon: BarChart3,
    label: 'Analysis',
    accentClass: 'text-accent',
    softClass: 'bg-accent/10',
    borderClass: 'border-accent/20',
  },
  pitch_draft: {
    icon: MessageSquare,
    label: 'Pitch',
    accentClass: 'text-accent-muted',
    softClass: 'bg-accent-muted/10',
    borderClass: 'border-accent-muted/20',
  },
  sponsorship_forecast: {
    icon: TrendingUp,
    label: 'Forecast',
    accentClass: 'text-purple-400',
    softClass: 'bg-purple-400/10',
    borderClass: 'border-purple-400/20',
  },
  agent_summary: {
    icon: BarChart3,
    label: 'Brief',
    accentClass: 'text-warning',
    softClass: 'bg-warning/10',
    borderClass: 'border-warning/20',
  },
};

interface TimelineProps {
  logs: LogEntry[];
}

export function Timeline({ logs }: TimelineProps) {
  const activityLogs = logs.slice(0, 5);

  if (activityLogs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-text-tertiary">Run a pulse to see activity</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-border via-border to-transparent" />

      <div className="space-y-0">
        {activityLogs.map((log, i) => {
          const meta = logTypeMeta[log.type] || {
            icon: Activity,
            label: 'Event',
            accentClass: 'text-text-tertiary',
            softClass: 'bg-surface-raised',
            borderClass: 'border-border',
          };
          const Icon = meta.icon;

          return (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative flex items-start gap-4 py-3 group"
            >
              {/* Icon dot */}
              <div className="relative z-10 shrink-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${meta.softClass} ${meta.borderClass}`}
                >
                  <Icon className={`w-4 h-4 ${meta.accentClass}`} strokeWidth={2} />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-text">{meta.label}</span>
                  <span className="text-[10px] text-text-tertiary">
                    <RelativeTime iso={log.created_at} />
                  </span>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed truncate">
                  {log.insights}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
