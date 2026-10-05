import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Search, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  Zap, 
  Terminal, 
  Activity, 
  CheckCircle2, 
  Ban,
  Play,
  Pause,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { SecurityEvent } from '../types';
import { playClickSound, playLiveSonarSound, playSuccessSound } from '../utils/cyberAudio';

export const ActivityView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BLOCKED' | 'MASKED' | 'ALLOWED'>('ALL');
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>('trace-1');
  const [copiedPayloadId, setCopiedPayloadId] = useState<string | null>(null);
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);

  const [events, setEvents] = useState<SecurityEvent[]>([
    {
      id: 'trace-1',
      traceId: 'trc-9821a-sec',
      timestamp: '10:42:19',
      title: 'OpenAI API Key in system prompt injection vulnerability',
      source: 'developer-bot-worker #04',
      targetLlm: 'OpenAI GPT-4o',
      status: 'BLOCKED',
      riskLevel: 'CRITICAL',
      riskScore: 98,
      latencyMs: 14,
      entitiesCount: 1,
      policyCode: 'SEC-01 (API Credential Barrier)',
      policyTitle: 'Zero Payload Leakage',
      rawSample: 'Use api_key=sk-live-99a38f1b0c94... to complete user verification.',
      sanitizedSample: '[EGRESS_HALTED_CRITICAL_SECRET]',
      tokensList: ['[BLOCKED_SECRET_01]'],
    },
    {
      id: 'trace-2',
      traceId: 'trc-4182b-usr',
      timestamp: '10:41:53',
      title: 'Customer Support Prompt: 2 emails, 1 name, 1 phone',
      source: 'zendesk-ai-copilot',
      targetLlm: 'Anthropic Claude 3.5',
      status: 'TOKENIZED',
      riskLevel: 'MEDIUM',
      riskScore: 54,
      latencyMs: 18,
      entitiesCount: 3,
      policyCode: 'POL-USER-PII (Reversible Vault)',
      policyTitle: 'AES-256 VAULTED',
      rawSample: 'Customer Rahul Sharma at rahul@example.com requested refund on +91 9876543210.',
      sanitizedSample: 'Customer [PERSON_01] at [EMAIL_01] requested refund on [PHONE_01].',
      tokensList: ['[EMAIL_01]', '[EMAIL_02]', '[PERSON_01]'],
    },
    {
      id: 'trace-3',
      traceId: 'trc-1092c-pub',
      timestamp: '10:40:20',
      title: 'Public Python Documentation Query',
      source: 'internal-researcher',
      targetLlm: 'Anthropic Claude 3.5 Sonnet',
      status: 'ALLOWED',
      riskLevel: 'SAFE',
      riskScore: 4,
      latencyMs: 8,
      entitiesCount: 0,
      policyCode: 'POL-OPEN-ACCESS',
      policyTitle: 'Direct Passthrough',
      rawSample: 'What are the main concurrency primitives in Python asyncio module?',
      sanitizedSample: 'What are the main concurrency primitives in Python asyncio module?',
      tokensList: [],
    },
    {
      id: 'trace-4',
      traceId: 'trc-7729d-fin',
      timestamp: '10:39:14',
      title: 'Payroll Inquiry: Employee SSN & Bank Routing Info',
      source: 'hr-onboarding-assistant',
      targetLlm: 'Internal Llama 3',
      status: 'REDACTED',
      riskLevel: 'HIGH',
      riskScore: 78,
      latencyMs: 22,
      entitiesCount: 2,
      policyCode: 'FIN-04 (PCI & PII Shield)',
      policyTitle: 'Hard Redaction Profile',
      rawSample: 'Please check employee tax filing SSN 042-99-1234 routing 121000358.',
      sanitizedSample: 'Please check employee tax filing SSN [REDACTED_SSN] routing [REDACTED_ROUTING].',
      tokensList: ['[REDACTED_SSN_US]', '[REDACTED_ROUTING]'],
    },
  ]);

  // Live incoming event generator
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const randomId = Math.random().toString(36).substring(2, 7);

      const templates: Partial<SecurityEvent>[] = [
        {
          title: 'Customer Refund Inquiry with Visa Card Checksum',
          source: 'stripe-sync-worker',
          targetLlm: 'OpenAI GPT-4o',
          status: 'TOKENIZED',
          riskLevel: 'HIGH',
          riskScore: 75,
          latencyMs: 15,
          entitiesCount: 2,
          policyCode: 'PCI-01 (Card Vault)',
          policyTitle: 'Vault Tokenized',
          rawSample: 'Refund Visa card 4111 1111 1111 1111 for user rahul@demo.com',
          sanitizedSample: 'Refund Visa card [TOKEN_CARD_01] for user [EMAIL_01]',
          tokensList: ['[TOKEN_CARD_01]', '[EMAIL_01]'],
        },
        {
          title: 'Direct Documentation Lookup on TypeScript Generics',
          source: 'ide-copilot-plugin',
          targetLlm: 'Claude 3.5 Sonnet',
          status: 'ALLOWED',
          riskLevel: 'SAFE',
          riskScore: 0,
          latencyMs: 9,
          entitiesCount: 0,
          policyCode: 'POL-SAFE-PASS',
          policyTitle: 'Zero Identifiers',
          rawSample: 'How to write conditional types in TypeScript 5.8?',
          sanitizedSample: 'How to write conditional types in TypeScript 5.8?',
          tokensList: [],
        },
        {
          title: 'AWS Secret Token detected in CI/CD pipeline error log',
          source: 'github-actions-bot',
          targetLlm: 'OpenAI GPT-4o',
          status: 'BLOCKED',
          riskLevel: 'CRITICAL',
          riskScore: 95,
          latencyMs: 12,
          entitiesCount: 1,
          policyCode: 'SEC-01 (API Guard)',
          policyTitle: 'Halt Egress',
          rawSample: 'Deploy failed with AKIAIOSFODNN7EXAMPLE credentials',
          sanitizedSample: '[BLOCKED_CREDENTIAL_HALT]',
          tokensList: ['[AWS_KEY_BLOCKED]'],
        }
      ];

      const chosen = templates[Math.floor(Math.random() * templates.length)];
      const newEvent: SecurityEvent = {
        id: `trace-live-${Date.now()}`,
        traceId: `trc-${randomId}-live`,
        timestamp: timeStr,
        title: chosen.title!,
        source: chosen.source!,
        targetLlm: chosen.targetLlm!,
        status: chosen.status as any,
        riskLevel: chosen.riskLevel as any,
        riskScore: chosen.riskScore!,
        latencyMs: chosen.latencyMs!,
        entitiesCount: chosen.entitiesCount!,
        policyCode: chosen.policyCode!,
        policyTitle: chosen.policyTitle!,
        rawSample: chosen.rawSample!,
        sanitizedSample: chosen.sanitizedSample!,
        tokensList: chosen.tokensList!,
      };

      setEvents(prev => [newEvent, ...prev.slice(0, 15)]);
      playLiveSonarSound();
    }, 4500);

    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  const copyPayload = (id: string, text: string) => {
    playClickSound();
    navigator.clipboard.writeText(text);
    setCopiedPayloadId(id);
    playSuccessSound();
    setTimeout(() => setCopiedPayloadId(null), 2000);
  };

  const filteredEvents = events.filter(e => {
    if (statusFilter === 'BLOCKED' && e.status !== 'BLOCKED') return false;
    if (statusFilter === 'MASKED' && e.status !== 'TOKENIZED' && e.status !== 'REDACTED') return false;
    if (statusFilter === 'ALLOWED' && e.status !== 'ALLOWED') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        e.source.toLowerCase().includes(q) ||
        e.traceId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Top Banner with Real-time LLM Egress Buffer */}
      <div className="interactive-card rounded-2xl border border-slate-800 bg-[#0d131f]/95 p-5 backdrop-blur-md shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold tracking-tight text-white">Security Event Stream</h2>
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-300">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{isLiveStreaming ? 'LIVE STREAMING' : 'STREAM PAUSED'}</span>
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Live audit logging of all intercepted prompt egress payloads and policy transformations.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                playClickSound();
                setIsLiveStreaming(!isLiveStreaming);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-1.5 font-mono text-xs text-cyan-300 hover:border-cyan-500 transition-colors shadow-sm"
            >
              {isLiveStreaming ? <Pause className="h-3.5 w-3.5 text-amber-400" /> : <Play className="h-3.5 w-3.5 text-emerald-400" />}
              <span>{isLiveStreaming ? 'Pause Stream' : 'Resume Stream'}</span>
            </button>

            <div className="hidden sm:flex items-center gap-5 font-mono text-xs border-l border-slate-800 pl-4">
              <div>
                <div className="text-slate-400 text-[10px]">RATE</div>
                <div className="text-cyan-400 font-bold">42 req/min</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px]">CIPHER</div>
                <div className="text-emerald-400 font-bold">TLS 1.3</div>
              </div>
            </div>
          </div>
        </div>

        {/* Throughput Wave Graph */}
        <div className="mt-4 pt-1">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>INGESTION THROUGHPUT (DYNAMIC 60s WAVE)</span>
            <span className="text-emerald-400 font-bold">99.98% INTERCEPT RATE</span>
          </div>

          <div className="h-16 w-full overflow-hidden">
            <svg className="h-full w-full" viewBox="0 0 600 60" preserveAspectRatio="none">
              <defs>
                <linearGradient id="waveGradLive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,35 Q 50,15 100,38 T 200,28 T 300,45 T 400,18 T 500,35 T 600,20 L 600,60 L 0,60 Z"
                fill="url(#waveGradLive)"
              />
              <path
                d="M 0,35 Q 50,15 100,38 T 200,28 T 300,45 T 400,18 T 500,35 T 600,20"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Search & Filter pills */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by Trace ID, Entity, or User..."
            className="w-full rounded-xl border border-slate-800 bg-[#0c121d] py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-900/70 border border-slate-800/80 rounded-xl text-xs">
          <button
            onClick={() => {
              playClickSound();
              setStatusFilter('ALL');
            }}
            className={`rounded-lg px-3 py-1 font-mono text-xs font-medium transition-all ${
              statusFilter === 'ALL' ? 'bg-cyan-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({events.length})
          </button>
          <button
            onClick={() => {
              playClickSound();
              setStatusFilter('BLOCKED');
            }}
            className={`rounded-lg px-3 py-1 font-mono text-xs font-medium transition-all ${
              statusFilter === 'BLOCKED' ? 'bg-rose-500 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Blocked
          </button>
          <button
            onClick={() => {
              playClickSound();
              setStatusFilter('MASKED');
            }}
            className={`rounded-lg px-3 py-1 font-mono text-xs font-medium transition-all ${
              statusFilter === 'MASKED' ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Masked
          </button>
          <button
            onClick={() => {
              playClickSound();
              setStatusFilter('ALLOWED');
            }}
            className={`rounded-lg px-3 py-1 font-mono text-xs font-medium transition-all ${
              statusFilter === 'ALLOWED' ? 'bg-emerald-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Allowed
          </button>
        </div>
      </div>

      {/* Events Feed Cards with Smooth Transitions */}
      <div className="space-y-3">
        {filteredEvents.map(event => {
          const isExpanded = expandedTraceId === event.id;

          let badgeBg = 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]';
          if (event.status === 'TOKENIZED') badgeBg = 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
          if (event.status === 'ALLOWED') badgeBg = 'bg-slate-700 text-slate-200';
          if (event.status === 'REDACTED') badgeBg = 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.3)]';

          return (
            <div
              key={event.id}
              className="interactive-card rounded-2xl border border-slate-800 bg-[#0d131f]/90 p-4 transition-all duration-200 hover:border-slate-700"
            >
              {/* Event Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold ${badgeBg}`}>
                    {event.status}
                  </span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-400">
                    {event.riskLevel}
                  </span>
                  <span className="font-mono text-xs text-slate-400">{event.timestamp}</span>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                  <Zap className="h-3 w-3 text-cyan-400" />
                  <span>{event.latencyMs}ms</span>
                </div>
              </div>

              {/* Title & Origin */}
              <div className="mt-2.5">
                <h4 className="text-sm font-bold text-white tracking-tight">{event.title}</h4>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span>src: <strong className="text-slate-200">{event.source}</strong></span>
                  <span>•</span>
                  <span>Score: <strong className="text-cyan-400 font-mono">{event.riskScore}/100</strong></span>
                  <span>•</span>
                  <span className="text-slate-500 font-mono">{event.traceId}</span>
                </div>
              </div>

              {/* Tokens chips */}
              {event.tokensList.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {event.tokensList.map(tok => (
                    <span
                      key={tok}
                      className="rounded bg-slate-900 border border-slate-700/80 px-2 py-0.5 font-mono text-[11px] text-cyan-300 font-semibold"
                    >
                      {tok}
                    </span>
                  ))}
                </div>
              )}

              {/* Policy tag row */}
              <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-xs font-mono">
                <div className="text-cyan-400 font-semibold">{event.policyCode}</div>
                <div className="text-slate-400">{event.policyTitle}</div>
              </div>

              {/* Inspect Intercepted Trace accordion trigger */}
              <div className="mt-2.5 text-center">
                <button
                  onClick={() => {
                    playClickSound();
                    setExpandedTraceId(isExpanded ? null : event.id);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <span>{isExpanded ? 'Hide Intercepted Trace' : 'Inspect Intercepted Trace'}</span>
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Expanded Inspection Drawer */}
              {isExpanded && (
                <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 text-xs font-mono space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span>RAW EGRESS BUFFER:</span>
                      <button
                        onClick={() => copyPayload(event.id + '-raw', event.rawSample)}
                        className="text-[11px] text-cyan-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedPayloadId === event.id + '-raw' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <div className="rounded bg-slate-900/90 p-2 text-rose-300 break-words border border-rose-950/50">
                      {event.rawSample}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span>SANITIZED PAYLOAD TO {event.targetLlm.toUpperCase()}:</span>
                      <button
                        onClick={() => copyPayload(event.id + '-san', event.sanitizedSample)}
                        className="text-[11px] text-emerald-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedPayloadId === event.id + '-san' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <div className="rounded bg-slate-900/90 p-2 text-emerald-300 break-words border border-emerald-950/50">
                      {event.sanitizedSample}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
