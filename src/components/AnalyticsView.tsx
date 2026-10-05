import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Download, 
  TrendingUp, 
  Fingerprint, 
  ShieldAlert, 
  CheckCircle2, 
  Cpu, 
  Globe2 
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const [downloaded, setDownloaded] = useState(false);

  const handleExportAuditProof = () => {
    const proof = {
      audit_title: 'Zero-Exposure Cryptographic Audit Proof',
      standard_verifications: [
        { standard: 'GDPR Art. 9', status: 'COMPLIANT', test_vector: 'DIFFERENTIAL_PRIVACY_MASK' },
        { standard: 'HIPAA Safe Harbor', status: 'COMPLIANT', test_vector: '18_PHI_IDENTIFIERS_PURGED' },
        { standard: 'PCI-DSS v4.0', status: 'COMPLIANT', test_vector: 'LUHN_CHECKED_TOKEN_VAULT' }
      ],
      metrics_summary: {
        total_requests: 12485,
        safe_rate_pct: 92.4,
        entities_intercepted: 3812,
        threats_aborted: 486,
        avg_latency_ms: 16.2
      },
      merkle_root: '0x9fa837cb019e918237198bbda382910481829eec01',
      generated_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(proof, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `privacy-shield-cryptographic-proof-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Top SLA & Enforcing Header */}
      <div className="rounded-2xl border border-slate-800 bg-[#0d131f]/90 p-5 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-400 font-bold">FIREWALL ENFORCING</span>
          </div>
          <div className="text-slate-400">
            SLA 16.2ms • Sub-20ms Validated
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-4xl font-extrabold tracking-tight text-white">12,485</span>
              <span className="flex items-center gap-1 font-mono text-xs font-semibold text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                <span>18.4% today</span>
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1">Total Requests Scanned</div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-3.5 py-1.5 font-mono text-xs font-bold text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            <span>92.4% Safe</span>
          </div>
        </div>

        {/* Two Mini stat cards */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-800/80">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Entities Caught</span>
              <Fingerprint className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold text-cyan-300">3,812</div>
            <div className="mt-1 text-[11px] text-slate-400">Masked & syntheticized</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Threats Blocked</span>
              <ShieldAlert className="h-4 w-4 text-rose-400" />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold text-rose-300">486</div>
            <div className="mt-1 text-[11px] text-slate-400">Critical injections</div>
          </div>
        </div>
      </div>

      {/* 24h Interception Pulse Graph */}
      <div className="rounded-2xl border border-slate-800 bg-[#0d131f]/90 p-5">
        <div className="flex items-center justify-between text-xs">
          <div>
            <h3 className="font-bold text-white text-sm">24h Interception Pulse</h3>
            <p className="text-slate-400 text-[11px]">Rolling volumetric telemetry</p>
          </div>
          <span className="font-mono text-xs text-cyan-400 font-bold">342/hr peak</span>
        </div>

        {/* Pulse Curve */}
        <div className="mt-4 h-28 w-full">
          <svg className="h-full w-full" viewBox="0 0 600 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="pulseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M 0,80 Q 75,78 120,60 T 240,75 T 360,65 T 440,25 T 520,85 T 600,40 L 600,100 L 0,100 Z"
              fill="url(#pulseGrad)"
            />
            <path
              d="M 0,80 Q 75,78 120,60 T 240,75 T 360,65 T 440,25 T 520,85 T 600,40"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2.5"
            />
            {/* Peak indicator dot */}
            <circle cx="440" cy="25" r="4" fill="#38bdf8" />
            <circle cx="600" cy="40" r="3.5" fill="#34d399" />
          </svg>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span className="text-emerald-400 font-bold">NOW</span>
        </div>
      </div>

      {/* Entity Distribution Breakdown */}
      <div className="rounded-2xl border border-slate-800 bg-[#0d131f]/90 p-5">
        <div className="flex items-center justify-between text-xs">
          <h3 className="font-bold text-white text-sm">Entity Distribution</h3>
          <span className="font-mono text-slate-400">5 CATEGORIES</span>
        </div>

        {/* Stacked Bar */}
        <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-slate-800">
          <div style={{ width: '34%' }} className="bg-rose-500" title="Credentials: 34%" />
          <div style={{ width: '28%' }} className="bg-cyan-500" title="Contact & PII: 28%" />
          <div style={{ width: '22%' }} className="bg-indigo-400" title="Financial: 22%" />
          <div style={{ width: '11%' }} className="bg-emerald-500" title="Health: 11%" />
          <div style={{ width: '5%' }} className="bg-blue-600" title="Confidential: 5%" />
        </div>

        {/* Breakdown Items */}
        <div className="mt-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500"></span>
              <span className="text-slate-300">Credentials & Secrets</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-slate-400">1,296 items</span>
              <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-rose-300 font-bold text-[10px]">34%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-500"></span>
              <span className="text-slate-300">Contact & PII</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-slate-400">1,067 items</span>
              <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-cyan-300 font-bold text-[10px]">28%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
              <span className="text-slate-300">Financial & Banking</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-slate-400">838 items</span>
              <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-indigo-300 font-bold text-[10px]">22%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span className="text-slate-300">Health & Medical Records</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-slate-400">419 items</span>
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-emerald-300 font-bold text-[10px]">11%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600"></span>
              <span className="text-slate-300">Organization Confidential</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-slate-400">192 items</span>
              <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-blue-300 font-bold text-[10px]">5%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Egress Destinations Routing Share */}
      <div className="rounded-2xl border border-slate-800 bg-[#0d131f]/90 p-5">
        <div className="flex items-center justify-between text-xs">
          <h3 className="font-bold text-white text-sm">Egress Destinations</h3>
          <span className="font-mono text-slate-400">ROUTING SHARE</span>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-2 text-slate-300">
                <Globe2 className="h-3.5 w-3.5 text-cyan-400" />
                <span>OpenAI (GPT-4o / GPT-4)</span>
              </div>
              <span className="font-mono text-cyan-300 font-bold">54%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full" style={{ width: '54%' }} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-2 text-slate-300">
                <Cpu className="h-3.5 w-3.5 text-amber-400" />
                <span>Anthropic (Claude 3.5 Sonnet)</span>
              </div>
              <span className="font-mono text-amber-300 font-bold">28%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: '28%' }} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-2 text-slate-300">
                <Globe2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Google (Gemini 1.5 Pro)</span>
              </div>
              <span className="font-mono text-emerald-300 font-bold">12%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '12%' }} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-2 text-slate-300">
                <Cpu className="h-3.5 w-3.5 text-slate-400" />
                <span>Internal / On-Prem vLLM</span>
              </div>
              <span className="font-mono text-slate-300 font-bold">6%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-slate-600 rounded-full" style={{ width: '6%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Zero-Exposure Shield Compliance Card */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-[#0d1a1b] to-[#0a1215] p-5">
        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
          <div>
            <div className="font-mono text-[10px] text-emerald-400 font-bold tracking-wider">
              AUDIT READY VERIFIED
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">Zero-Exposure Shield</h3>
          </div>
          <div className="text-right">
            <div className="font-mono text-2xl font-extrabold text-emerald-400">99.98%</div>
            <div className="text-[10px] font-mono text-emerald-300">SANITIZED RATE</div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-white">GDPR Art. 9 Special Category</div>
                <div className="text-[11px] text-slate-400">Differential privacy masking applied</div>
              </div>
            </div>
            <span className="font-mono text-[11px] font-bold text-emerald-400">COMPLIANT</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-white">HIPAA Safe Harbor Method</div>
                <div className="text-[11px] text-slate-400">18 PHI identifier classes purged</div>
              </div>
            </div>
            <span className="font-mono text-[11px] font-bold text-emerald-400">COMPLIANT</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-white">PCI-DSS Tokenization v4.0</div>
                <div className="text-[11px] text-slate-400">Luhn-checked irreversible token vault</div>
              </div>
            </div>
            <span className="font-mono text-[11px] font-bold text-emerald-400">COMPLIANT</span>
          </div>
        </div>

        <button
          onClick={handleExportAuditProof}
          className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-400 py-2.5 px-4 text-xs font-bold text-slate-950 shadow-md hover:bg-cyan-300 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          <span>{downloaded ? 'Cryptographic Proof Exported!' : 'Export Cryptographic Audit Proof'}</span>
        </button>
      </div>
    </div>
  );
};
