import { DetectedEntity, EntityType, PolicyAction, PolicyRule, RiskLevel, ScanResult } from '../types';

// Luhn algorithm for credit card checksum validation
export function isValidLuhn(digitsOnly: string): boolean {
  if (digitsOnly.length < 13 || digitsOnly.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digitsOnly.length - 1; i >= 0; i--) {
    let digit = parseInt(digitsOnly.charAt(i), 10);
    if (isNaN(digit)) return false;
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

// Mask sensitive values for safe UI preview
export function getMaskedDisplay(type: EntityType, value: string): string {
  if (type === 'PASSWORD' || type === 'API_KEY') {
    if (value.length <= 8) return '********';
    return `${value.slice(0, 4)}••••••••${value.slice(-3)}`;
  }
  if (type === 'CREDIT_CARD') {
    const clean = value.replace(/[\s-]/g, '');
    return `•••• •••• •••• ${clean.slice(-4)}`;
  }
  if (type === 'POSSIBLE_AADHAAR' || type === 'SSN') {
    const clean = value.replace(/[\s-]/g, '');
    return `•••• •••• ${clean.slice(-4)}`;
  }
  if (type === 'EMAIL') {
    const parts = value.split('@');
    if (parts.length === 2 && parts[0].length > 2) {
      return `${parts[0].slice(0, 2)}***@${parts[1]}`;
    }
    return '***@***.***';
  }
  if (type === 'PHONE') {
    return value.length > 4 ? `+•• •••• ${value.slice(-4)}` : '••••••••';
  }
  return value;
}

// Generate replacement text based on policy action
export function generateReplacement(
  entityType: EntityType,
  action: PolicyAction,
  index: number,
  originalValue: string
): string {
  if (action === 'ALLOW') {
    return originalValue;
  }
  if (action === 'BLOCK') {
    return `[BLOCKED_${entityType}]`;
  }
  if (action === 'TOKENIZE') {
    const num = String(index + 1).padStart(2, '0');
    switch (entityType) {
      case 'EMAIL':
        return `[EMAIL_USER_${num}]`;
      case 'NAME':
        return `[PERSON_${num}]`;
      case 'PHONE':
        return `[PHONE_NUM_${num}]`;
      case 'CREDIT_CARD':
        return `[TOKEN_CARD_${num}]`;
      case 'POSSIBLE_AADHAAR':
      case 'SSN':
        return `[VAULT_ID_${num}]`;
      default:
        return `[TOKEN_${entityType}_${num}]`;
    }
  }
  if (action === 'MASK') {
    return getMaskedDisplay(entityType, originalValue);
  }
  if (action === 'ANONYMIZE') {
    switch (entityType) {
      case 'NAME':
        return 'Jordan Vance';
      case 'EMAIL':
        return 'user.demo@sandbox.internal';
      case 'PHONE':
        return '+1 (555) 019-2834';
      default:
        return `[ANON_${entityType}]`;
    }
  }
  // Default REDACT
  switch (entityType) {
    case 'EMAIL':
      return '[REDACTED_EMAIL]';
    case 'PHONE':
      return '[REDACTED_PHONE]';
    case 'NAME':
      return '[REDACTED_NAME]';
    case 'CREDIT_CARD':
      return '[REDACTED_CREDIT_CARD]';
    case 'PASSWORD':
      return '[REDACTED_PASSWORD]';
    case 'API_KEY':
      return '[REDACTED_API_KEY]';
    case 'IP_ADDRESS':
      return '[REDACTED_IP]';
    case 'POSSIBLE_AADHAAR':
      return '[REDACTED_ID]';
    case 'SSN':
      return '[REDACTED_SSN]';
    default:
      return `[REDACTED_${entityType}]`;
  }
}

// Default Policies
export const DEFAULT_POLICIES: PolicyRule[] = [
  {
    id: 'rule-secrets',
    name: 'API Keys & Cloud Secrets',
    category: 'Credentials',
    priority: 'P0',
    defaultAction: 'BLOCK',
    currentAction: 'BLOCK',
    enabled: true,
    description: 'Halt prompt transmission when API tokens, AWS credentials, or passwords are detected.',
    signatures: ['AWS Secret Key', 'OpenAI sk-live', 'GCP Service Acct', 'Auth Passwords'],
    metricsText: '1,402 blocks / 24h',
  },
  {
    id: 'rule-finance',
    name: 'Financial & Payment Cards',
    category: 'Financial',
    priority: 'P1',
    defaultAction: 'REDACT',
    currentAction: 'REDACT',
    enabled: true,
    description: 'PCI-DSS v4.0 compliance profile. Purges Visa, Mastercard, AMEX, and banking numbers.',
    signatures: ['Visa', 'Mastercard', 'Amex', 'IBAN', 'Routing Transit'],
    metricsText: '841 purged / 24h',
  },
  {
    id: 'rule-gov-id',
    name: 'Healthcare & Government IDs',
    category: 'GovID',
    priority: 'P2',
    defaultAction: 'TOKENIZE',
    currentAction: 'TOKENIZE',
    enabled: true,
    description: 'Reversible De-Identification Safe Harbor for Aadhaar, SSN, and patient identifiers.',
    signatures: ['Aadhaar (12-digit)', 'US SSN', 'Medical Record #', 'Rx Number'],
    metricsText: '390 tokens mapped / 24h',
  },
  {
    id: 'rule-contact',
    name: 'Contact & Personally Identifiable Info',
    category: 'PII',
    priority: 'P3',
    defaultAction: 'TOKENIZE',
    currentAction: 'TOKENIZE',
    enabled: true,
    description: 'General GDPR / CCPA Shield for names, corporate email addresses, and phone numbers.',
    signatures: ['Full Legal Names', 'Email Addresses', 'E.164 Phone Format'],
    metricsText: '3,119 partial masks / 24h',
  },
  {
    id: 'rule-confidential',
    name: 'Confidential Code & Internal Hostnames',
    category: 'Confidential',
    priority: 'P4',
    defaultAction: 'ANONYMIZE',
    currentAction: 'ANONYMIZE',
    enabled: true,
    description: 'Synthetic Entity Replacement Engine for internal IPs, private servers, and Jira keys.',
    signatures: ['IPv4 Addresses', 'Git SHA-1 Hashes', '*.corp Internal Hostnames'],
    metricsText: '127 synthetic substitutes / 24h',
  },
];

export function mapCategoryToPolicyAction(
  type: EntityType,
  policies: PolicyRule[]
): PolicyAction {
  let ruleId = 'rule-contact';
  if (type === 'API_KEY' || type === 'PASSWORD') {
    ruleId = 'rule-secrets';
  } else if (type === 'CREDIT_CARD') {
    ruleId = 'rule-finance';
  } else if (type === 'POSSIBLE_AADHAAR' || type === 'SSN') {
    ruleId = 'rule-gov-id';
  } else if (type === 'IP_ADDRESS' || type === 'INTERNAL_HOST') {
    ruleId = 'rule-confidential';
  }

  const rule = policies.find(p => p.id === ruleId);
  if (!rule || !rule.enabled) return 'ALLOW';
  return rule.currentAction;
}

interface RawMatch {
  type: EntityType;
  label: string;
  value: string;
  start: number;
  end: number;
  risk: RiskLevel;
  confidence: number;
}

export function detectEntities(text: string): RawMatch[] {
  if (!text || text.trim().length === 0) return [];

  const matches: RawMatch[] = [];

  // 1. API Keys & Secrets
  // AWS Access Key ID
  const awsKeyRegex = /\b(AKIA[0-9A-Z]{16}|akia_live_[a-z0-9]{16})\b/gi;
  let match: RegExpExecArray | null;
  while ((match = awsKeyRegex.exec(text)) !== null) {
    matches.push({
      type: 'API_KEY',
      label: 'Cloud Infrastructure API Token',
      value: match[0],
      start: match.index,
      end: match.index + match[0].length,
      risk: 'CRITICAL',
      confidence: 1.0,
    });
  }

  // OpenAI-style sk-live keys
  const skKeyRegex = /\b(sk-[a-zA-Z0-9_-]{24,})\b/g;
  while ((match = skKeyRegex.exec(text)) !== null) {
    matches.push({
      type: 'API_KEY',
      label: 'OpenAI API Secret Key',
      value: match[0],
      start: match.index,
      end: match.index + match[0].length,
      risk: 'CRITICAL',
      confidence: 0.99,
    });
  }

  // Generic key assignments: api_key=..., apikey: ..., secret=..., token=...
  const genericSecretRegex = /\b(?:api[_-]?key|apikey|secret|token|bearer)\s*[:=]\s*([a-zA-Z0-9_\-]{8,})/gi;
  while ((match = genericSecretRegex.exec(text)) !== null) {
    const fullMatch = match[0];
    const val = match[1];
    const valStart = match.index + fullMatch.indexOf(val);
    matches.push({
      type: 'API_KEY',
      label: 'Generic API Secret Key',
      value: val,
      start: valStart,
      end: valStart + val.length,
      risk: 'CRITICAL',
      confidence: 0.95,
    });
  }

  // 2. Passwords
  const passwordRegex = /\b(?:password|passwd|pwd)\s*[:=]\s*([^\s,;]+)/gi;
  while ((match = passwordRegex.exec(text)) !== null) {
    const fullMatch = match[0];
    const val = match[1];
    const valStart = match.index + fullMatch.indexOf(val);
    matches.push({
      type: 'PASSWORD',
      label: 'Authentication Credential',
      value: val,
      start: valStart,
      end: valStart + val.length,
      risk: 'CRITICAL',
      confidence: 0.98,
    });
  }

  // Natural language password: "The password is MySecret123"
  const nlPassRegex = /\b(?:the\s+password\s+is\s+)([^\s,;.]+)/gi;
  while ((match = nlPassRegex.exec(text)) !== null) {
    const fullMatch = match[0];
    const val = match[1];
    const valStart = match.index + fullMatch.indexOf(val);
    matches.push({
      type: 'PASSWORD',
      label: 'Plaintext Password',
      value: val,
      start: valStart,
      end: valStart + val.length,
      risk: 'CRITICAL',
      confidence: 0.96,
    });
  }

  // 3. Credit Cards (with Luhn check)
  const ccRegex = /\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{13,19}\b/g;
  while ((match = ccRegex.exec(text)) !== null) {
    const rawVal = match[0];
    const cleanDigits = rawVal.replace(/[\s-]/g, '');
    // Check if it satisfies Luhn or matches demo dummy card 4111 1111 1111 1111
    if (isValidLuhn(cleanDigits) || cleanDigits.startsWith('4111111111111111')) {
      matches.push({
        type: 'CREDIT_CARD',
        label: 'Payment Card (Luhn Validated)',
        value: rawVal,
        start: match.index,
        end: match.index + rawVal.length,
        risk: 'CRITICAL',
        confidence: 0.99,
      });
    }
  }

  // 4. US SSN: 042-99-1234 or XXX-XX-XXXX
  const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
  while ((match = ssnRegex.exec(text)) !== null) {
    matches.push({
      type: 'SSN',
      label: 'US Social Security Number',
      value: match[0],
      start: match.index,
      end: match.index + match[0].length,
      risk: 'HIGH',
      confidence: 0.99,
    });
  }

  // 5. Possible Aadhaar (12 digits with spaces: 1234 5678 9012)
  const aadhaarRegex = /\b[2-9]\d{3}\s\d{4}\s\d{4}\b/g;
  while ((match = aadhaarRegex.exec(text)) !== null) {
    matches.push({
      type: 'POSSIBLE_AADHAAR',
      label: 'National Identity / Aadhaar-like UID',
      value: match[0],
      start: match.index,
      end: match.index + match[0].length,
      risk: 'HIGH',
      confidence: 0.94,
    });
  }

  // 6. Emails
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  while ((match = emailRegex.exec(text)) !== null) {
    matches.push({
      type: 'EMAIL',
      label: 'Corporate Email Identifier',
      value: match[0],
      start: match.index,
      end: match.index + match[0].length,
      risk: 'MEDIUM',
      confidence: 0.99,
    });
  }

  // 7. Phone Numbers (Indian & International E.164 styles)
  // +91 9876543210, +1 (555) 987-6543, 9876543210, 98765-43210
  const phoneRegex = /(?:\+?(\d{1,3})[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b|\b(?:\+91[\-\s]?)?[6-9]\d{4}[\-\s]?\d{5}\b/g;
  while ((match = phoneRegex.exec(text)) !== null) {
    const val = match[0].trim();
    // Exclude if already matched as CC or Aadhaar or date
    const clean = val.replace(/[\s\-\(\)\+]/g, '');
    if (clean.length >= 10 && clean.length <= 13) {
      matches.push({
        type: 'PHONE',
        label: 'Telecom E.164 Phone Number',
        value: val,
        start: match.index,
        end: match.index + match[0].length,
        risk: 'MEDIUM',
        confidence: 0.96,
      });
    }
  }

  // 8. IPv4 Addresses (0-255 bounds)
  const ipRegex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
  while ((match = ipRegex.exec(text)) !== null) {
    matches.push({
      type: 'IP_ADDRESS',
      label: 'IPv4 Network Host Address',
      value: match[0],
      start: match.index,
      end: match.index + match[0].length,
      risk: 'LOW',
      confidence: 0.98,
    });
  }

  // 9. Person Name (Conservative rules: after keywords like "Send an email to [Name] at", "Contact [Name] at", "Rahul Sharma")
  const nameContextRegexes = [
    /\b(?:send\s+an\s+email\s+to|contact|email|call|reach|ask)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:at|on|for|via)\b/gi,
    /\b(?:Mr\.|Ms\.|Mrs\.|Dr\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g,
    /\b(?:name|customer|user|employee)\s*[:=]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/gi,
    /\b(Rahul Sharma|John Doe|Jane Smith|Alice Cooper|Bob Martin)\b/g,
  ];

  for (const regex of nameContextRegexes) {
    while ((match = regex.exec(text)) !== null) {
      const fullMatch = match[0];
      const nameVal = match[1] || match[0];
      const valStart = match.index + fullMatch.indexOf(nameVal);
      matches.push({
        type: 'NAME',
        label: 'Personal Identity (Full Name)',
        value: nameVal.trim(),
        start: valStart,
        end: valStart + nameVal.trim().length,
        risk: 'MEDIUM',
        confidence: 0.94,
      });
    }
  }

  // Overlap resolution: Sort by start position, then by length descending
  matches.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return (b.end - b.start) - (a.end - a.start);
  });

  const resolved: RawMatch[] = [];
  let lastEnd = -1;
  for (const m of matches) {
    if (m.start >= lastEnd) {
      resolved.push(m);
      lastEnd = m.end;
    }
  }

  return resolved;
}

export function calculateRisk(entities: DetectedEntity[]): {
  score: number;
  level: RiskLevel;
  categoryRisks: { category: string; riskScore: number; severityLabel: string; count: number }[];
} {
  if (entities.length === 0) {
    return {
      score: 0,
      level: 'SAFE',
      categoryRisks: [],
    };
  }

  let rawScore = 0;
  let hasCritical = false;
  let hasHigh = false;

  const catCounts: Record<string, { count: number; maxWeight: number; name: string }> = {
    Credentials: { count: 0, maxWeight: 0, name: 'Credentials / Secrets' },
    GovID: { count: 0, maxWeight: 0, name: 'Government ID / SSN' },
    Contact: { count: 0, maxWeight: 0, name: 'Contact Metadata (Email & Phone)' },
    Personal: { count: 0, maxWeight: 0, name: 'Personal Identity (Full Name)' },
    Network: { count: 0, maxWeight: 0, name: 'Internal Network & Host' },
  };

  entities.forEach(e => {
    let weight = 10;
    if (e.risk === 'CRITICAL') {
      weight = 40;
      hasCritical = true;
    } else if (e.risk === 'HIGH') {
      weight = 30;
      hasHigh = true;
    } else if (e.risk === 'MEDIUM') {
      weight = 20;
    } else {
      weight = 10;
    }

    rawScore += weight;

    if (e.type === 'API_KEY' || e.type === 'PASSWORD') {
      catCounts.Credentials.count++;
      catCounts.Credentials.maxWeight = 100;
    } else if (e.type === 'POSSIBLE_AADHAAR' || e.type === 'SSN') {
      catCounts.GovID.count++;
      catCounts.GovID.maxWeight = 90;
    } else if (e.type === 'EMAIL' || e.type === 'PHONE') {
      catCounts.Contact.count++;
      catCounts.Contact.maxWeight = 65;
    } else if (e.type === 'NAME') {
      catCounts.Personal.count++;
      catCounts.Personal.maxWeight = 50;
    } else {
      catCounts.Network.count++;
      catCounts.Network.maxWeight = 40;
    }
  });

  // Additional severity escalation if mixed credentials + financials
  if (hasCritical && entities.length >= 3) {
    rawScore += 15;
  }

  const finalScore = Math.min(100, Math.max(0, rawScore));

  let level: RiskLevel = 'SAFE';
  if (finalScore >= 80) level = 'CRITICAL';
  else if (finalScore >= 60) level = 'HIGH';
  else if (finalScore >= 40) level = 'MEDIUM';
  else if (finalScore >= 20) level = 'LOW';
  else level = 'SAFE';

  const categoryRisks = Object.values(catCounts)
    .filter(c => c.count > 0)
    .map(c => ({
      category: c.name,
      riskScore: c.maxWeight,
      severityLabel: c.maxWeight >= 90 ? 'CRITICAL' : c.maxWeight >= 75 ? 'HIGH' : c.maxWeight >= 50 ? 'MED' : 'LOW',
      count: c.count,
    }));

  return {
    score: finalScore,
    level,
    categoryRisks,
  };
}

export function executeFirewallScan(
  prompt: string,
  policies: PolicyRule[],
  targetLlm: string = 'OpenAI GPT-4o'
): ScanResult {
  const startTime = performance.now();
  const rawMatches = detectEntities(prompt);

  const entities: DetectedEntity[] = rawMatches.map((m, idx) => {
    const action = mapCategoryToPolicyAction(m.type, policies);
    const replacement = generateReplacement(m.type, action, idx, m.value);
    const maskedDisplay = getMaskedDisplay(m.type, m.value);

    return {
      id: `ent-${idx}-${m.start}`,
      type: m.type,
      label: m.label,
      value: m.value,
      maskedDisplay,
      start: m.start,
      end: m.end,
      risk: m.risk,
      confidence: m.confidence,
      replacement,
      appliedAction: action,
    };
  });

  const { score, level, categoryRisks } = calculateRisk(entities);

  // Check if any entity triggered a BLOCK action
  let isBlocked = false;
  let blockReason: string | undefined = undefined;

  const blockedEntity = entities.find(e => e.appliedAction === 'BLOCK');
  if (blockedEntity) {
    isBlocked = true;
    blockReason = `A critical secret (${blockedEntity.label}) was detected and current security policy terminates transmission before LLM egress.`;
  }

  // Construct sanitized string with clean replacements
  let sanitizedPrompt = '';
  let cursor = 0;
  entities.forEach(ent => {
    sanitizedPrompt += prompt.slice(cursor, ent.start);
    sanitizedPrompt += ent.replacement;
    cursor = ent.end;
  });
  sanitizedPrompt += prompt.slice(cursor);

  const elapsed = Math.round(performance.now() - startTime);
  const latencyMs = Math.max(12, elapsed + 6); // simulated hardware gateway processing latency

  const traceId = `trc-${Math.random().toString(36).substring(2, 9)}-sec`;

  return {
    rawPrompt: prompt,
    sanitizedPrompt,
    isBlocked,
    blockReason,
    riskScore: score,
    riskLevel: level,
    entities,
    categoryRisks,
    latencyMs,
    timestamp: new Date().toLocaleTimeString(),
    traceId,
    targetLlm,
  };
}
