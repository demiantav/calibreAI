export interface LogEntry {
  id: string;
  creator_name: string;
  type: 'media_kit_update' | 'pitch_draft' | 'sponsorship_forecast' | 'agent_summary';
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
