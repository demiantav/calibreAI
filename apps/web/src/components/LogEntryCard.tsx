import { motion } from 'framer-motion';
import { FileText, BarChart3, DollarSign, Clock } from 'lucide-react';
import type { LogEntry } from '@/lib/types';
import { RelativeTime } from '@/lib/use-relative-time';

const typeConfig = {
  media_kit_update: {
    label: 'Analytics',
    icon: BarChart3,
    bgColor: 'bg-gradient-to-br from-blue-soft to-blue-muted/30',
    pillBg: 'bg-blue',
    textColor: 'text-white',
    borderColor: 'border-blue/20',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face',
  },
  pitch_draft: {
    label: 'Pitch',
    icon: FileText,
    bgColor: 'bg-gradient-to-br from-pink-soft to-pink-muted/30',
    pillBg: 'bg-gradient-to-r from-pink to-coral',
    textColor: 'text-white',
    borderColor: 'border-pink/20',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face',
  },
  sponsorship_forecast: {
    label: 'Forecast',
    icon: DollarSign,
    bgColor: 'bg-gradient-to-br from-mint-soft to-mint-muted/30',
    pillBg: 'bg-mint',
    textColor: 'text-foreground',
    borderColor: 'border-mint/20',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
  },
};

interface LogEntryCardProps {
  entry: LogEntry;
  index: number;
}

export function LogEntryCard({ entry, index }: LogEntryCardProps) {
  const config = typeConfig[entry.type as keyof typeof typeConfig] || typeConfig.media_kit_update;
  const Icon = config.icon;

  return (
    <motion.article
      className={`${config.bgColor} ${config.borderColor} border rounded-[24px] p-5 hover:shadow-xl transition-all duration-300`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      whileHover={{ scale: 1.01, x: 4 }}
    >
      <div className="flex items-start gap-4">
        <div className="relative">
          <img
            src={config.avatar}
            alt="Agent"
            width={52}
            height={52}
            className="rounded-xl object-cover ring-2 ring-white shadow-lg"
          />
          <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-lg ${config.pillBg} flex items-center justify-center shadow-md`}>
            <Icon className={`w-3.5 h-3.5 ${config.textColor}`} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${config.pillBg} ${config.textColor}`}>{config.label}</span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Clock className="w-3 h-3" />
              <RelativeTime iso={entry.created_at} />
            </span>
          </div>
          <p className="text-sm text-foreground leading-relaxed font-medium">{entry.insights}</p>
        </div>
      </div>
    </motion.article>
  );
}
