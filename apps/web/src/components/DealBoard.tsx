import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useDeals } from '@/hooks/use-deals';
import type { DealStatus, UnifiedDeal } from '@/lib/types';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import PipelineSummary from './PipelineSummary';
import DealColumn from './DealColumn';
import DealCard from './DealCard';
import DealDetailSheet from './DealDetailSheet';
import ViewToggle from './ViewToggle';
import { motion } from 'framer-motion';

const COLUMNS: { key: DealStatus; label: string; colorClass: string }[] = [
  { key: 'new', label: 'New', colorClass: 'text-text-tertiary' },
  { key: 'draft_ready', label: 'Draft', colorClass: 'text-warning' },
  { key: 'sent', label: 'Sent', colorClass: 'text-accent' },
  { key: 'responded', label: 'Responded', colorClass: 'text-success' },
];

export default function DealBoard() {
  const { deals, byStatus, isLoading, error, refetch } = useDeals();
  const [selectedDeal, setSelectedDeal] = useState<UnifiedDeal | null>(null);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [activeDeal, setActiveDeal] = useState<UnifiedDeal | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const deal = deals.find((d) => d.id === event.active.id);
    if (deal) setActiveDeal(deal);
  }, [deals]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over) return;

    const newStatus = over.id as DealStatus;
    const dealId = active.id as string;

    // Only update if status actually changed
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.status === newStatus) return;

    // For leads (kind='lead'), we can't update via /api/pitches since they don't have a logId
    // For pitches, use the logId
    const targetId = deal.logId || dealId;

    try {
      const res = await fetch(`/api/pitches/${targetId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('calibre-jwt') || ''}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      refetch();
    } catch (err) {
      console.error('Error updating deal status:', err);
    }
  }, [deals, refetch]);

  const handleStatusChange = useCallback(async (dealId: string, newStatus: DealStatus) => {
    try {
      const res = await fetch(`/api/pitches/${dealId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('calibre-jwt') || ''}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      refetch();
    } catch (err) {
      console.error('Error updating deal status:', err);
    }
  }, [refetch]);

  if (error) {
    return (
      <motion.div className="min-h-screen p-4 lg:p-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <ErrorState message={error} onRetry={refetch} />
      </motion.div>
    );
  }

  return (
    <motion.div className="min-h-screen p-4 lg:p-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full bg-accent" />
            <h1 className="text-2xl font-display font-black text-text tracking-tight">Deals</h1>
            <span className="px-3 py-1 rounded-full bg-surface-raised text-text-secondary text-xs font-semibold border border-border">
              {deals.length}
            </span>
          </div>
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>
        <p className="text-sm font-bold text-text-tertiary mt-1 ml-4">Tu pipeline de negociaciones con marcas</p>

        <PipelineSummary byStatus={byStatus} />
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : viewMode === 'board' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 lg:-mx-10 lg:px-10">
            {COLUMNS.map((col) => (
              <DealColumn
                key={col.key}
                status={col.key}
                label={col.label}
                colorClass={col.colorClass}
                deals={byStatus[col.key]}
                onSelectDeal={setSelectedDeal}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={null}>
            {activeDeal ? (
              <div className="opacity-80 rotate-2">
                <DealCard
                  deal={activeDeal}
                  onSelect={() => {}}
                  onStatusChange={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <DealListView deals={deals} onSelectDeal={setSelectedDeal} />
      )}

      <DealDetailSheet
        deal={selectedDeal}
        onClose={() => setSelectedDeal(null)}
        onStatusChange={handleStatusChange}
        onSent={refetch}
      />
    </motion.div>
  );
}

function DealListView({ deals, onSelectDeal }: { deals: UnifiedDeal[]; onSelectDeal: (d: UnifiedDeal) => void }) {
  return (
    <div className="space-y-3">
      {deals.map((deal, index) => (
        <motion.button
          key={deal.id}
          className="w-full text-left rounded-[20px] p-5 bg-surface border border-border hover:border-accent/30 transition-colors"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
          onClick={() => onSelectDeal(deal)}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-surface-raised border border-border flex items-center justify-center text-sm font-semibold text-text-secondary shrink-0">
              {deal.brandName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-text truncate">{deal.brandName}</p>
              <p className="text-xs font-bold text-text-tertiary truncate">{deal.brandEmail}</p>
            </div>
            <span className={`text-xs font-black uppercase tracking-wider ${
              deal.status === 'new' ? 'text-text-tertiary' :
              deal.status === 'draft_ready' ? 'text-warning' :
              deal.status === 'sent' ? 'text-accent' : 'text-success'
            }`}>
              {deal.status === 'draft_ready' ? 'Draft' : deal.status}
            </span>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
