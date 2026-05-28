import type { DealStatus, UnifiedDeal } from '@/lib/types';
import { CircleDot, Eye, Send, CheckCircle2 } from 'lucide-react';

interface PipelineSummaryProps {
  byStatus: Record<DealStatus, UnifiedDeal[]>;
}

export default function PipelineSummary({ byStatus }: PipelineSummaryProps) {
  const total = Object.values(byStatus).reduce((sum, arr) => sum + (arr as UnifiedDeal[]).length, 0);
  const responded = byStatus.responded?.length || 0;
  const sent = byStatus.sent?.length || 0;
  const draft = byStatus.draft_ready?.length || 0;
  const newLeads = byStatus.new?.length || 0;

  // Win rate calculation (responded / total non-new)
  const activeDeals = sent + responded + draft;
  const winRate = activeDeals > 0 ? Math.round((responded / activeDeals) * 100) : 0;

  const items = [
    { key: 'new' as DealStatus, label: 'New', count: newLeads, icon: CircleDot, color: 'bg-text-tertiary' },
    { key: 'draft_ready' as DealStatus, label: 'Draft', count: draft, icon: Eye, color: 'bg-warning' },
    { key: 'sent' as DealStatus, label: 'Sent', count: sent, icon: Send, color: 'bg-accent' },
    { key: 'responded' as DealStatus, label: 'Responded', count: responded, icon: CheckCircle2, color: 'bg-success' },
  ];

  return (
    <div className="mt-5 ml-4 flex items-center gap-6 flex-wrap">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.key} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${item.color}`} />
            <Icon className="w-3.5 h-3.5 text-text-tertiary" />
            <span className="text-xs font-black text-text">{item.count}</span>
            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">{item.label}</span>
          </div>
        );
      })}

      <div className="h-4 w-px bg-border/50" />

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Total</span>
        <span className="text-xs font-black text-text">{total}</span>
      </div>

      {activeDeals > 0 && (
        <>
          <div className="h-4 w-px bg-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Win Rate</span>
            <span className="text-xs font-black text-success">{winRate}%</span>
          </div>
        </>
      )}
    </div>
  );
}
