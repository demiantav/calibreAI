import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/lib/use-count-up';

interface MetricCardProps {
  label: string;
  value: number;
  trend?: number;
  icon?: LucideIcon;
  suffix?: string;
  prefix?: string;
  accent?: boolean;
}

export function MetricCard({ label, value, trend, icon: Icon, suffix, prefix, accent }: MetricCardProps) {
  const animatedValue = useCountUp(value, 1800, suffix === '%' ? 2 : 0);

  return (
    <motion.div
      className="group relative"
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div className={cn(
        "relative overflow-hidden rounded-[24px] p-6 lg:p-7 bg-surface border border-border transition-all duration-300",
        "hover:border-border-accent/40 hover:bg-surface-hover",
        accent && "border-accent/20 bg-accent/[0.04]"
      )}>
        {/* Subtle top accent line */}
        <div className={cn(
          "absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-text-tertiary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700",
          accent && "via-accent/30"
        )} />

        <div className="flex items-start justify-between mb-5">
          {Icon && <div className={cn(
            "w-10 h-10 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center transition-all duration-500",
            accent ? "bg-accent/10 text-accent" : "bg-surface-raised text-text-tertiary group-hover:text-accent group-hover:bg-accent/10"
          )}>
            <Icon className="w-5 h-5" strokeWidth={2} />
          </div>}
          {trend !== undefined && (
            <div className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-tight",
              trend >= 0 ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-red-500/15 text-red-400 border border-red-500/20"
            )}>
              {trend >= 0 ? '+' : ''}{trend}%
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-text-tertiary uppercase tracking-[0.15em]">{label}</p>
          <div className="flex items-baseline gap-1.5">
            {prefix && <span className="text-lg font-light text-text-secondary">{prefix}</span>}
            <h3 className="text-3xl lg:text-4xl font-sans font-bold text-text tracking-tight tabular-nums">
              {typeof animatedValue === 'number' ? animatedValue.toLocaleString() : animatedValue}
            </h3>
            {suffix && <span className="text-sm font-medium text-accent">{suffix}</span>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
