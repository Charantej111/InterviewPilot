export interface VerifiedSource {
  title: string;
  url: string;
  snippet: string;
  retrievalTimestamp: string;
  domainAuthority: 'official' | 'news' | 'industry' | 'general';
}

export interface VerifiedFact {
  fact: string;
  sourceUrl: string;
  retrievalTimestamp: string;
}

export interface StrategicInference {
  inference: string;
  rationale: string;
}

export interface CompanyResearchData {
  id?: string;
  userId?: string;
  companyName: string;
  role: string;
  overview: string;
  products: string[];
  businessModel: string;
  verifiedFacts: VerifiedFact[];
  strategicInferences: StrategicInference[];
  unavailableInformation: string[];
  sources: VerifiedSource[];
  status: 'analyzing' | 'completed' | 'failed';
  researchedAt: string;
}
