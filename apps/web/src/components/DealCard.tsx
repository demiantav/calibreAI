import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Eye, Send, CheckCircle2, CircleDot, Mail, MessageSquare } from 'lucide-react';
import type { UnifiedDeal, DealStatus } from '@/lib/types';
import { useMemo } from 'react';

interface DealCardProps {
  deal: UnifiedDeal;
  onSelect: () => void;
  onStatusChange: (dealId: string, newStatus: DealStatus) => void;
}

function daysSince(dateStr?: string): number | null {
  if (!dateStr) return null;
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  return days >= 0 ? days : null;
}

function urgencyBadge(deal: UnifiedDeal): { text: string; className: string } | null {
  const days = daysSince(deal.createdAt);
  if (days === null) return null;
  if (deal.status === 'responded') return null;
  if (days < 3) return null;
  if (days <= 7) return { text: `${days}d`, className: 'bg-warning/10 text-warning' };
  return { text: `${days}d`, className: 'bg-red-500/10 text-red-400' };
}

const statusConfig: Record<DealStatus, { label: string; icon: typeof CircleDot; className: string }> = {
  new: { label: 'New', icon: CircleDot, className: 'bg-text-tertiary/10 text-text-tertiary' },
  draft_ready: { label: 'Draft', icon: Eye, className: 'bg-warning/10 text-warning' },
  sent: { label: 'Sent', icon: Send, className: 'bg-accent/10 text-accent' },
  responded: { label: 'Responded', icon: CheckCircle2, className: 'bg-success/10 text-success' },
};

export default function DealCard({ deal, onSelect, onStatusChange }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const status = statusConfig[deal.status];
  const StatusIcon = status.icon;
  const urgency = urgencyBadge(deal);

  const quickAction = useMemo(() => {
    if (deal.status === 'new') {
      return { label: 'Generar pitch', icon: MessageSquare };
    }
    if (deal.status === 'draft_ready') {
      return { label: 'Enviar', icon: Send };
    }
    if (deal.status === 'sent') {
      return { label: 'Ver', icon: Eye };
    }
    return { label: 'Ver', icon: Eye };
  }, [deal.status]);

  const QuickIcon = quickAction.icon;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded-[16px] p-4 bg-surface border border-border hover:border-accent/20 cursor-grab active:cursor-grabbing transition-all group"
      whileHover={{ y: -2 }}
      onClick={(e) => {
        // Don't open detail if clicking the quick action button
        if ((e.target as HTMLElement).closest('button')) return;
        onSelect();
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-surface-raised border border-border flex items-center justify-center text-sm font-semibold text-text-secondary shrink-0">
            {deal.brandName.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-text truncate">{deal.brandName}</h3>
            <p className="flex items-center gap-1 text-[10px] font-bold text-text-tertiary">
              <Mail className="w-3 h-3 shrink-0" />
              <span className="truncate">{deal.brandEmail}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {urgency && (
            <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${urgency.className}`}>
              {urgency.text}
            </span>
          )}
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black ${status.className}`}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>
        </div>
      </div>

      {/* Subject / Snippet */}
      {deal.subject && (
        <p className="text-xs font-bold text-text mb-1 truncate">{deal.subject}</p>
      )}
      {deal.snippet && (
        <p className="text-[11px] font-medium text-text-tertiary leading-relaxed line-clamp-2">{deal.snippet}</p>
      )}

      {/* Quick action */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (deal.status === 'draft_ready' && deal.logId) {
            // For draft, we could trigger send — but let's just open detail for now
            onSelect();
          } else {
            onSelect();
          }
        }}
        className="w-full mt-2.5 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black text-white bg-accent hover:brightness-110 transition-all opacity-0 group-hover:opacity-100"
      >
        <QuickIcon className="w-3 h-3" />
        {quickAction.label}
      </button>
    </motion.div>
  );
}
