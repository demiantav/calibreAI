import { motion } from 'framer-motion';
import { Activity, MessageSquare, TrendingUp, BarChart3, type LucideIcon } from 'lucide-react';
import { RelativeTime } from '@/lib/use-relative-time';
import type { LogEntry } from '@/lib/types';

const logTypeMeta: Record<string, { icon: LucideIcon; label: string; color: string }> = {
  media_kit_update: { icon: BarChart3, label: 'Analysis', color: '#FF6B2C' },
  pitch_draft: { icon: MessageSquare, label: 'Pitch', color: '#22D3EE' },
  sponsorship_forecast: { icon: TrendingUp, label: 'Forecast', color: '#A78BFA' },
  agent_summary: { icon: BarChart3, label: 'Brief', color: '#FBBF24' },
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
          const meta = logTypeMeta[log.type] || { icon: Activity, label: 'Event', color: '#5A5A70' };
          const Icon = meta.icon;
          const isLast = i === activityLogs.length - 1;

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
                  className="w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300"
                  style={{ 
                    borderColor: `${meta.color}20`,
                    backgroundColor: `${meta.color}10`,
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: meta.color }} strokeWidth={2} />
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
                <p className="text-sm text-text-secondary leading-relaxed truncate group-hover:whitespace-normal group-hover:truncate-none transition-all">
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
