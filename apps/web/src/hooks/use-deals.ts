import { useMemo } from 'react';
import { useApiFetch } from './use-api-fetch';
import type { LogEntry, Lead, UnifiedDeal, DealStatus } from '@/lib/types';

export function useDeals() {
  const { data: logs, isLoading: logsLoading, error: logsError, refetch: refetchLogs } = useApiFetch<LogEntry[]>('/logs?type=pitch_draft');
  const { data: leads, isLoading: leadsLoading, error: leadsError, refetch: refetchLeads } = useApiFetch<Lead[]>('/api/leads');

  const isLoading = logsLoading || leadsLoading;
  const error = logsError || leadsError;

  const deals: UnifiedDeal[] = useMemo(() => {
    const result: UnifiedDeal[] = [];

    // Add leads (New column)
    (leads || []).forEach((lead) => {
      result.push({
        id: lead.id,
        kind: 'lead',
        status: 'new' as DealStatus,
        brandName: lead.brand_email.split('@')[1]?.split('.')[0] || lead.brand_email,
        brandEmail: lead.brand_email,
        snippet: lead.snippet,
        createdAt: lead.processed_at,
      });
    });

    // Add pitches
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
        createdAt: log.created_at,
        logId: log.id,
      });
    });

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [logs, leads]);

  const refetch = () => {
    refetchLogs();
    refetchLeads();
  };

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
