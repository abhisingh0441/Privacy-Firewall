export type RiskLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type PolicyAction = 'BLOCK' | 'REDACT' | 'TOKENIZE' | 'MASK' | 'ANONYMIZE' | 'ALLOW';

export type EntityType = 
  | 'EMAIL'
  | 'PHONE'
  | 'NAME'
  | 'CREDIT_CARD'
  | 'PASSWORD'
  | 'API_KEY'
  | 'IP_ADDRESS'
  | 'POSSIBLE_AADHAAR'
  | 'SSN'
  | 'INTERNAL_HOST';

export interface DetectedEntity {
  id: string;
  type: EntityType;
  label: string;
  value: string;
  maskedDisplay: string;
  start: number;
  end: number;
  risk: RiskLevel;
  confidence: number;
  replacement: string;
  appliedAction: PolicyAction;
}

export interface ScanResult {
  rawPrompt: string;
  sanitizedPrompt: string;
  isBlocked: boolean;
  blockReason?: string;
  riskScore: number;
  riskLevel: RiskLevel;
  entities: DetectedEntity[];
  categoryRisks: {
    category: string;
    riskScore: number;
    severityLabel: string;
    count: number;
  }[];
  latencyMs: number;
  timestamp: string;
  traceId: string;
  targetLlm: string;
}

export interface PolicyRule {
  id: string;
  name: string;
  category: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  defaultAction: PolicyAction;
  currentAction: PolicyAction;
  enabled: boolean;
  description: string;
  signatures: string[];
  metricsText: string;
}

export interface SecurityEvent {
  id: string;
  traceId: string;
  timestamp: string;
  title: string;
  source: string;
  targetLlm: string;
  status: 'BLOCKED' | 'TOKENIZED' | 'ALLOWED' | 'REDACTED';
  riskLevel: RiskLevel;
  riskScore: number;
  latencyMs: number;
  entitiesCount: number;
  policyCode: string;
  policyTitle: string;
  rawSample: string;
  sanitizedSample: string;
  tokensList: string[];
}
