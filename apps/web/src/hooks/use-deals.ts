import { useMemo } from 'react';
import { useApiFetch } from './use-api-fetch';
import type { LogEntry, UnifiedDeal, DealStatus } from '@/lib/types';

export function useDeals() {
  const { data: logs, isLoading, error, refetch } = useApiFetch<LogEntry[]>('/logs?type=pitch_draft');

  const deals: UnifiedDeal[] = useMemo(() => {
    const result: UnifiedDeal[] = [];

    // Only show pitches (draft_ready, sent, responded)
    // Leads without pitches are not shown in the Kanban since auto-pitch
    // generates them immediately. Option A: no "New" column.
    (logs || []).forEach((log) => {
      const draft = log.content;
      result.push({
        id: log.id,
        kind: 'pitch',
        status: draft.status || 'draft_ready',
        brandName: draft.brandName,
        brandEmail: draft.brandEmail,
        subject: draft.pitchSubject,
        content: draft.pitchContent,
        originalEmailFrom: draft.originalEmailFrom,
        originalEmailSubject: draft.originalEmailSubject,
        originalEmailSnippet: draft.originalEmailSnippet,
        gmailId: draft.gmailId,
        detectedAt: draft.detectedAt,
        sentAt: draft.sentAt,
        latestResponseSnippet: draft.latestResponseSnippet,
        latestResponseAt: draft.latestResponseAt,
        createdAt: log.created_at,
        logId: log.id,
      });
    });

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [logs]);

  const byStatus = useMemo(() => {
    const map: Record<DealStatus, UnifiedDeal[]> = {
      new: [],
      draft_ready: [],
      sent: [],
      responded: [],
    };
    deals.forEach((d) => {
      map[d.status]?.push(d);
    });
    return map;
  }, [deals]);

  return { deals, byStatus, isLoading, error, refetch };
}
