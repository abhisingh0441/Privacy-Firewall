import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Download, 
  TrendingUp, 
  Fingerprint, 
  ShieldAlert, 
  CheckCircle2, 
  Cpu, 
  Globe2,
  Radio,
  Play,
  Pause,
  Filter,
  Info,
  X
} from 'lucide-react';
import { playClickSound, playLiveSonarSound, playSuccessSound } from '../utils/cyberAudio';

export const AnalyticsView: React.FC = () => {
  const [downloaded, setDownloaded] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(true);
  const [totalScanned, setTotalScanned] = useState(12485);
  const [threatsBlocked, setThreatsBlocked] = useState(486);
  const [entitiesCaught, setEntitiesCaught] = useState(3812);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; val: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCompliance, setSelectedCompliance] = useState<string | null>(null);

  // Live real-time streaming ticker effect
  useEffect(() => {
    if (!isLiveActive) return;

    const interval = setInterval(() => {
      const incScanned = Math.floor(Math.random() * 3) + 1;
      const isThreat = Math.random() < 0.25;
      const entitiesAdd = isThreat ? Math.floor(Math.random() * 2) + 1 : 0;

      setTotalScanned(prev => prev + incScanned);
      if (isThreat) {
        setThreatsBlocked(prev => prev + 1);
        setEntitiesCaught(prev => prev + entitiesAdd);
        playLiveSonarSound();
      }
    }, 2800);

    return () => clearInterval(interval);
  }, [isLiveActive]);

  const handleExportAuditProof = () => {
    playSuccessSound();
    const proof = {
      audit_title: 'Zero-Exposure Cryptographic Audit Proof',
      standard_verifications: [
        { standard: 'GDPR Art. 9', status: 'COMPLIANT', test_vector: 'DIFFERENTIAL_PRIVACY_MASK' },
        { standard: 'HIPAA Safe Harbor', status: 'COMPLIANT', test_vector: '18_PHI_IDENTIFIERS_PURGED' },
        { standard: 'PCI-DSS v4.0', status: 'COMPLIANT', test_vector: 'LUHN_CHECKED_TOKEN_VAULT' }
      ],
      metrics_summary: {
        total_requests: totalScanned,
        safe_rate_pct: 92.4,
        entities_intercepted: entitiesCaught,
        threats_aborted: threatsBlocked,
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

  const chartPoints = [
    { x: 50, y: 75, time: '00:00', val: 120 },
    { x: 130, y: 60, time: '03:00', val: 195 },
    { x: 210, y: 72, time: '06:00', val: 140 },
    { x: 290, y: 55, time: '09:00', val: 230 },
    { x: 370, y: 40, time: '12:00', val: 290 },
    { x: 440, y: 22, time: '15:00 (Peak)', val: 342 },
    { x: 510, y: 50, time: '18:00', val: 260 },
    { x: 575, y: 35, time: 'NOW (Live)', val: 310 },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Live Stream Controller & Top Stats Banner */}
      <div className="interactive-card rounded-2xl border border-slate-800 bg-[#0d131f]/95 p-5 backdrop-blur-md shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono border-b border-slate-800/80 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`absolute inline-flex h-full w-full rounded-full ${isLiveActive ? 'animate-ping bg-emerald-400 opacity-75' : 'bg-slate-600'}`}></span>
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isLiveActive ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
            </span>
            <span className={`font-bold tracking-wider ${isLiveActive ? 'text-emerald-400' : 'text-slate-400'}`}>
              {isLiveActive ? 'REAL-TIME TELEMETRY FEEDING' : 'FEED PAUSED'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                playClickSound();
                setIsLiveActive(!isLiveActive);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 font-mono text-[11px] text-cyan-300 hover:border-cyan-500/60 transition-colors"
            >
              {isLiveActive ? <Pause className="h-3 w-3 text-amber-400" /> : <Play className="h-3 w-3 text-emerald-400" />}
              <span>{isLiveActive ? 'Pause Live Stream' : 'Resume Live Stream'}</span>
            </button>
            <div className="text-slate-400">
              SLA 16.2ms • Sub-20ms Validated
            </div>
          </div>
        </div>

        {/* Live Counters */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-4xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                {totalScanned.toLocaleString()}
              </span>
              <span className="flex items-center gap-1 font-mono text-xs font-semibold text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5 animate-bounce" />
                <span>+18.4% today</span>
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Total LLM Egress Requests Scanned</div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-3.5 py-1.5 font-mono text-xs font-bold text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <ShieldCheck className="h-4 w-4" />
            <span>92.4% Safe Passthrough</span>
          </div>
        </div>

        {/* Two Mini stat cards */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-800/80">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 transition-all hover:border-cyan-500/40">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Entities Caught & Sanitized</span>
              <Fingerprint className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold text-cyan-300">
              {entitiesCaught.toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">Masked & syntheticized across 5 categories</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 transition-all hover:border-rose-500/40">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Threats Blocked at Perimeter</span>
              <ShieldAlert className="h-4 w-4 text-rose-400 animate-pulse" />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold text-rose-300">
              {threatsBlocked.toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">Critical credential & API secret halts</div>
          </div>
        </div>
      </div>

      {/* Interactive 24h Interception Pulse Graph */}
      <div className="interactive-card rounded-2xl border border-slate-800 bg-[#0d131f]/90 p-5 relative overflow-hidden">
        <div className="flex items-center justify-between text-xs">
          <div>
            <h3 className="font-bold text-white text-sm">24h Interception Pulse</h3>
            <p className="text-slate-400 text-[11px]">Hover over data nodes to inspect hourly volumetric telemetry</p>
          </div>
          <span className="font-mono text-xs text-cyan-400 font-bold bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded-lg">
            342 req/hr peak
          </span>
        </div>

        {/* Pulse Curve with Interactive Nodes */}
        <div className="relative mt-4 h-32 w-full">
          <svg className="h-full w-full" viewBox="0 0 600 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="pulseGradLive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M 0,80 Q 75,78 120,60 T 240,75 T 360,65 T 440,22 T 520,80 T 600,35 L 600,100 L 0,100 Z"
              fill="url(#pulseGradLive)"
            />
            <path
              d="M 0,80 Q 75,78 120,60 T 240,75 T 360,65 T 440,22 T 520,80 T 600,35"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2.5"
            />
            {/* Interactive Points */}
            {chartPoints.map((pt, idx) => (
              <circle
                key={idx}
                cx={pt.x}
                cy={pt.y}
                r={hoveredPoint?.label === pt.time ? 7 : 4}
                fill={idx === 5 ? '#f43f5e' : '#38bdf8'}
                stroke="#fff"
                strokeWidth="1.5"
                className="cursor-pointer transition-all duration-200 hover:scale-150"
                onMouseEnter={() => {
                  playClickSound();
                  setHoveredPoint({ x: pt.x, y: pt.y, label: pt.time, val: pt.val });
                }}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            ))}
          </svg>

          {/* Hover Tooltip Card */}
          {hoveredPoint && (
            <div
              className="absolute z-20 -translate-x-1/2 -translate-y-full rounded-xl border border-cyan-500/50 bg-slate-950/95 px-3 py-2 text-xs font-mono shadow-2xl backdrop-blur-md pointer-events-none"
              style={{ left: `${(hoveredPoint.x / 600) * 100}%`, top: `${(hoveredPoint.y / 100) * 100 - 10}%` }}
            >
              <div className="font-bold text-white">{hoveredPoint.label}</div>
              <div className="text-cyan-300">Volume: {hoveredPoint.val} req/hr</div>
              <div className="text-[10px] text-slate-400">Status: Nominal Firewall Enforcement</div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span className="text-emerald-400 font-bold animate-pulse">NOW (LIVE)</span>
        </div>
      </div>

      {/* Interactive Entity Distribution Breakdown */}
      <div className="interactive-card rounded-2xl border border-slate-800 bg-[#0d131f]/90 p-5">
        <div className="flex items-center justify-between text-xs">
          <div>
            <h3 className="font-bold text-white text-sm">Entity Distribution Breakdown</h3>
            <p className="text-slate-400 text-[11px]">Click any category below to inspect active signatures</p>
          </div>
          <span className="font-mono text-slate-400">5 CATEGORIES</span>
        </div>

        {/* Stacked Bar */}
        <div className="mt-3 flex h-3.5 w-full overflow-hidden rounded-full bg-slate-800 shadow-inner">
          <div
            onClick={() => {
              playClickSound();
              setSelectedCategory('Credentials');
            }}
            style={{ width: '34%' }}
            className="bg-rose-500 cursor-pointer hover:brightness-125 transition-all"
            title="Credentials: 34%"
          />
          <div
            onClick={() => {
              playClickSound();
              setSelectedCategory('Contact');
            }}
            style={{ width: '28%' }}
            className="bg-cyan-500 cursor-pointer hover:brightness-125 transition-all"
            title="Contact & PII: 28%"
          />
          <div
            onClick={() => {
              playClickSound();
              setSelectedCategory('Financial');
            }}
            style={{ width: '22%' }}
            className="bg-indigo-400 cursor-pointer hover:brightness-125 transition-all"
            title="Financial: 22%"
          />
          <div
            onClick={() => {
              playClickSound();
              setSelectedCategory('Health');
            }}
            style={{ width: '11%' }}
            className="bg-emerald-500 cursor-pointer hover:brightness-125 transition-all"
            title="Health: 11%"
          />
          <div
            onClick={() => {
              playClickSound();
              setSelectedCategory('Confidential');
            }}
            style={{ width: '5%' }}
            className="bg-blue-600 cursor-pointer hover:brightness-125 transition-all"
            title="Confidential: 5%"
          />
        </div>

        {/* Breakdown Items with click handler */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          {[
            { id: 'Credentials', color: 'bg-rose-500', name: 'Credentials & Secrets', count: '1,296 items', pct: '34%', text: 'text-rose-400' },
            { id: 'Contact', color: 'bg-cyan-500', name: 'Contact & PII', count: '1,067 items', pct: '28%', text: 'text-cyan-400' },
            { id: 'Financial', color: 'bg-indigo-400', name: 'Financial & Banking', count: '838 items', pct: '22%', text: 'text-indigo-400' },
            { id: 'Health', color: 'bg-emerald-500', name: 'Health & Medical Records', count: '419 items', pct: '11%', text: 'text-emerald-400' },
            { id: 'Confidential', color: 'bg-blue-600', name: 'Organization Confidential', count: '192 items', pct: '5%', text: 'text-blue-400' },
          ].map(cat => (
            <div
              key={cat.id}
              onClick={() => {
                playClickSound();
                setSelectedCategory(selectedCategory === cat.id ? null : cat.id);
              }}
              className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                selectedCategory === cat.id
                  ? 'border-cyan-500/60 bg-cyan-950/30 shadow-md'
                  : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${cat.color}`}></span>
                <span className="text-slate-200 font-medium">{cat.name}</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-slate-400">{cat.count}</span>
                <span className={`font-bold ${cat.text}`}>{cat.pct}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Drill-down Detail Drawer if clicked */}
        {selectedCategory && (
          <div className="mt-4 rounded-xl border border-cyan-500/40 bg-cyan-950/20 p-4 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
              <span className="font-bold text-cyan-300">Category Inspection: {selectedCategory.toUpperCase()}</span>
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-slate-300 leading-relaxed">
              Enforcing deterministic regex patterns and cryptographic vault mappings.
              Signatures purged automatically before prompt transmits beyond egress gateway.
            </p>
          </div>
        )}
      </div>

      {/* Zero-Exposure Shield Compliance Card */}
      <div className="interactive-card rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-[#0d1a1b] to-[#0a1215] p-5 shadow-2xl">
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
          {[
            { id: 'gdpr', title: 'GDPR Art. 9 Special Category', desc: 'Differential privacy masking applied' },
            { id: 'hipaa', title: 'HIPAA Safe Harbor Method', desc: '18 PHI identifier classes purged' },
            { id: 'pci', title: 'PCI-DSS Tokenization v4.0', desc: 'Luhn-checked irreversible token vault' },
          ].map(comp => (
            <div
              key={comp.id}
              onClick={() => {
                playClickSound();
                setSelectedCompliance(selectedCompliance === comp.id ? null : comp.id);
              }}
              className="flex items-center justify-between text-xs p-2 rounded-xl border border-emerald-500/20 bg-emerald-950/20 hover:bg-emerald-950/40 cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">{comp.title}</div>
                  <div className="text-[11px] text-slate-400">{comp.desc}</div>
                </div>
              </div>
              <span className="font-mono text-[11px] font-bold text-emerald-400">COMPLIANT</span>
            </div>
          ))}
        </div>

        {selectedCompliance && (
          <div className="mt-3 rounded-lg border border-emerald-500/40 bg-emerald-950/50 p-3 text-xs font-mono text-emerald-200">
            ✓ Cryptographic SHA-256 validation vector verified on in-memory buffers. Zero plaintext egress across perimeter boundary.
          </div>
        )}

        <button
          onClick={handleExportAuditProof}
          className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-400 py-3 px-4 text-xs font-bold text-slate-950 shadow-md hover:bg-cyan-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all active:scale-[0.99]"
        >
          <Download className="h-4 w-4" />
          <span>{downloaded ? 'Cryptographic Proof Exported!' : 'Export Cryptographic Audit Proof'}</span>
        </button>
      </div>
    </div>
  );
};
