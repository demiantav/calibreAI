import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { UnifiedDeal, DealStatus } from '@/lib/types';
import DealCard from './DealCard';

interface DealColumnProps {
  status: DealStatus;
  label: string;
  colorClass: string;
  deals: UnifiedDeal[];
  onSelectDeal: (deal: UnifiedDeal) => void;
  onStatusChange: (dealId: string, newStatus: DealStatus) => void;
}

export default function DealColumn({ status, label, colorClass, deals, onSelectDeal, onStatusChange }: DealColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-[280px] lg:w-[300px] rounded-[20px] border border-border bg-surface/50 flex flex-col max-h-[calc(100vh-220px)] transition-colors ${
        isOver ? 'bg-accent/5 border-accent/30' : ''
      }`}
    >
      {/* Column header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-border/50 sticky top-0 bg-surface/50 rounded-t-[20px] backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${
            status === 'new' ? 'bg-text-tertiary' :
            status === 'draft_ready' ? 'bg-warning' :
            status === 'sent' ? 'bg-accent' : 'bg-success'
          }`} />
          <span className={`text-xs font-black uppercase tracking-wider ${colorClass}`}>{label}</span>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-surface-raised text-text-tertiary text-[10px] font-black border border-border">
          {deals.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onSelect={() => onSelectDeal(deal)}
              onStatusChange={onStatusChange}
            />
          ))}
        </SortableContext>

        {deals.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-xs font-bold text-text-tertiary">Sin deals</p>
          </div>
        )}
      </div>
    </div>
  );
}
