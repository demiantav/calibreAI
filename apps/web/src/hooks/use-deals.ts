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
      // Strategy 1: extract from email domain (best for real brand emails)
      const domain = lead.brand_email.split('@')[1]?.split('.')[0];
      const personalDomains = ['gmail', 'yahoo', 'hotmail', 'outlook', 'icloud', 'protonmail', 'live', 'aol', 'mail', 'yandex'];
      const isPersonal = !domain || personalDomains.includes(domain.toLowerCase());
      let brandName = !isPersonal
        ? domain.charAt(0).toUpperCase() + domain.slice(1)
        : '';

      // Strategy 2: for personal emails, try to extract brand from subject
      // "Propuesta de partner — Vercel" or "Colaboración con Notion"
      if (!brandName && lead.subject) {
        const separators = ['—', '–', '-', ':', '|', 'con', 'de'];
        const parts = lead.subject.split(new RegExp(`[${separators.join('')}]`));
        // Take the last part that looks like a brand (short, capitalized, not a verb)
        for (let i = parts.length - 1; i >= 0; i--) {
          const part = parts[i].trim();
          if (part.length >= 2 && part.length <= 25) {
            brandName = part;
            break;
          }
        }
      }

      // Fallback
      if (!brandName) {
        brandName = lead.brand_email;
      }

      result.push({
        id: lead.id,
        kind: 'lead',
        status: 'new' as DealStatus,
        brandName,
        brandEmail: lead.brand_email,
        snippet: lead.snippet,
        subject: lead.subject,
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
