export interface BrandDeal {
  brandName: string;
  brandEmail: string;
  status: 'lead' | 'pitched';
  sourceEmailSubject?: string;
  pitchContent?: string;
  pitchSubject?: string;
  detectedAt: string;
}
