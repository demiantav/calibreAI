export interface BrandDeal {
  brandName: string;
  brandEmail: string;
  status: 'lead' | 'draft_ready' | 'sent' | 'responded';
  sourceEmailSubject?: string;
  originalEmailFrom?: string;
  originalEmailSubject?: string;
  originalEmailSnippet?: string;
  gmailId?: string;
  pitchContent?: string;
  pitchSubject?: string;
  detectedAt: string;
  sentAt?: string;
}
