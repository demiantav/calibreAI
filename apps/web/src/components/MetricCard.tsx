import { LucideIcon } from 'lucide-react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], accent ? ["7deg", "-7deg"] : ["3deg", "-3deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], accent ? ["-7deg", "7deg"] : ["-3deg", "3deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      style={accent ? { rotateX, rotateY, transformStyle: "preserve-3d" } : undefined}
      onMouseMove={accent ? handleMouseMove : undefined}
      onMouseLeave={accent ? handleMouseLeave : undefined}
      className="group relative"
    >
      <div className={cn(
        "glass-card rounded-[24px] p-6 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-accent/10 group-hover:border-accent/30 card-glow",
        accent && "border-accent/20"
      )}>
        <div className="flex items-start justify-between mb-4">
          {Icon && <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3",
            accent ? "bg-accent text-white neon-glow" : "bg-accent-muted-soft text-accent-muted group-hover:rotate-3"
          )}>
            <Icon className="w-6 h-6" strokeWidth={2.5} />
          </div>}
          {trend !== undefined && (
            <div className={cn(
              "px-2.5 py-1 rounded-full text-[11px] font-black tracking-tight",
              trend >= 0 ? "bg-success/10 text-success" : "bg-red-500/10 text-red-500"
            )}>
              {trend >= 0 ? '+' : ''}{trend}%
            </div>
          )}
        </div>

        <div>
          <p className="text-[11px] font-black text-text-tertiary uppercase tracking-[0.1em] mb-1">{label}</p>
          <div className="flex items-baseline gap-1">
            {prefix && <span className="text-xl font-black text-text-secondary">{prefix}</span>}
            <h3 className="text-3xl font-display font-black text-text tracking-tighter">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </h3>
            {suffix && <span className="text-sm font-black text-accent">{suffix}</span>}
          </div>
        </div>

        <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </motion.div>
  );
}
