export interface LogEntry {
  id: string;
  creator_name: string;
  type: 'media_kit_update' | 'pitch_draft' | 'sponsorship_forecast';
  content: any;
  insights: string;
  created_at: string;
}

export interface PitchDraft {
  brandName: string;
  brandEmail: string;
  status: 'lead' | 'pitched';
  pitchSubject: string;
  pitchContent: string;
}

export interface SponsorshipForecast {
  mention: { min: number; max: number; currency: string };
  dedicated: { min: number; max: number; currency: string };
  series: { min: number; max: number; currency: string };
  estimatedCpm: number;
  marketContext: string;
}
