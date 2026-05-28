export interface LogEntry {
  id: string;
  creator_name: string;
  type: 'media_kit_update' | 'pitch_draft' | 'sponsorship_forecast' | 'agent_summary' | 'agent_error' | 'gmail_auth_error' | 'audience_insights' | 'contract_audit';
  content: any;
  insights: string;
  created_at: string;
}

export interface PitchDraft {
  brandName: string;
  brandEmail: string;
  status: 'lead' | 'draft_ready' | 'sent' | 'responded';
  pitchSubject: string;
  pitchContent: string;
  originalEmailFrom?: string;
  originalEmailSubject?: string;
  originalEmailSnippet?: string;
  sourceEmailSubject?: string;
  gmailId?: string;
  detectedAt?: string;
  sentAt?: string;
}

export interface PitchEntry {
  id: string;
  draft: PitchDraft;
  created_at: string;
}

export interface SponsorshipForecast {
  mention: { min: number; max: number; currency: string };
  dedicated: { min: number; max: number; currency: string };
  series: { min: number; max: number; currency: string };
  estimatedCpm: number;
  marketContext: string;
}

export interface ContractAudit {
  riskLevel: 'low' | 'medium' | 'high';
  redFlags: string[];
  suggestedNegotiationPoints: string[];
  estimatedFairRate: number | null;
  summary: string;
  contractType: string;
}

export interface Lead {
  id: string;
  brand_email: string;
  snippet: string;
  processed_at: string;
}

export type DealStatus = 'new' | 'draft_ready' | 'sent' | 'responded';

export interface UnifiedDeal {
  id: string;
  kind: 'lead' | 'pitch';
  status: DealStatus;
  brandName: string;
  brandEmail: string;
  snippet?: string;
  subject?: string;
  content?: string;
  originalEmailFrom?: string;
  originalEmailSubject?: string;
  originalEmailSnippet?: string;
  gmailId?: string;
  detectedAt?: string;
  sentAt?: string;
  createdAt: string;
  logId?: string; // reference to agent_logs id for pitches
}
