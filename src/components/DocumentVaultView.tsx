import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  ShieldCheck, 
  Check, 
  Copy, 
  FileCode, 
  FileSpreadsheet, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { PolicyRule } from '../types';
import { executeFirewallScan } from '../engine/privacyFirewall';
import { playClickSound, playSuccessSound } from '../utils/cyberAudio';

interface DocumentVaultViewProps {
  policies: PolicyRule[];
}

const SAMPLE_DOCS = [
  {
    name: 'production.env',
    type: 'env',
    content: `# Production Environment Config
NODE_ENV=production
PORT=8080
DATABASE_URL=postgres://admin:P@ssw0rd9982!@192.168.1.45:5432/core_db
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=akia_live_99f3810a9c84918239019
OPENAI_API_KEY=sk-live-99a38f1b0c9482710381920
ALERT_EMAIL=ops.lead@enterprise.com
EMERGENCY_PHONE=+1 (555) 987-6543
`,
  },
  {
    name: 'user_records.csv',
    type: 'csv',
    content: `id,full_name,email,phone,card_number,aadhaar_uid
1,Rahul Sharma,rahul.sharma@enterprise.com,+91 9876543210,4111 1111 1111 1111,2345 6789 0123
2,Jane Smith,jane.smith@partner.io,+1 (555) 019-2834,4111-1111-1111-1111,8765 4321 0987
3,John Doe,john.doe@demo.org,9876543210,4111111111111111,4321 8765 2109
`,
  },
  {
    name: 'incident_report.txt',
    type: 'txt',
    content: `SECURITY INCIDENT LOG:
User contact: Mr. Rahul Sharma (email: rahul@example.com, phone: 9876543210).
The employee SSN on file is 042-99-1234.
Server hostname: 192.168.1.10.
Action taken: Tokenized credential and alerted security response group.
`,
  },
];

export const DocumentVaultView: React.FC<DocumentVaultViewProps> = ({ policies }) => {
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [customFileContent, setCustomFileContent] = useState<string | null>(null);
  const [customFileName, setCustomFileName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activeContent = customFileContent || SAMPLE_DOCS[selectedDocIndex].content;
  const activeFileName = customFileName || SAMPLE_DOCS[selectedDocIndex].name;

  // Run redaction scan
  const scanResult = executeFirewallScan(activeContent, policies, 'Enterprise Vault');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playClickSound();
    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      setCustomFileContent(text);
      setCustomFileName(file.name);
      playSuccessSound();
    };
    reader.readAsText(file);
  };

  const handleDownloadSanitized = () => {
    playClickSound();
    const blob = new Blob([scanResult.sanitizedPrompt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sanitized-${activeFileName}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    playSuccessSound();
  };

  const handleCopy = async () => {
    playClickSound();
    await navigator.clipboard.writeText(scanResult.sanitizedPrompt);
    setCopied(true);
    playSuccessSound();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/20 via-slate-900/60 to-slate-900/40 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <h2 className="text-xl font-bold tracking-tight text-white">Document Vault & Bulk Redaction</h2>
              <span className="rounded bg-cyan-500 px-1.5 py-0.5 font-mono text-[10px] font-extrabold text-slate-950">
                LOCAL SANDBOX
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Bulk-scan configuration files, spreadsheets, logs, and credentials before uploading them into context windows.
            </p>
          </div>

          {/* Quick upload input */}
          <label className="flex items-center gap-2 cursor-pointer rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-950/40">
            <Upload className="h-4 w-4" />
            <span>Upload Local File</span>
            <input
              type="file"
              accept=".txt,.csv,.json,.env,.log,.yaml,.yml"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Sample Docs Chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/80 text-xs">
          <span className="font-mono text-[11px] text-slate-500">PRE-LOADED FILES:</span>
          {SAMPLE_DOCS.map((doc, idx) => (
            <button
              key={doc.name}
              onClick={() => {
                playClickSound();
                setCustomFileContent(null);
                setCustomFileName(null);
                setSelectedDocIndex(idx);
              }}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 font-mono text-xs transition-all ${
                !customFileName && selectedDocIndex === idx
                  ? 'border-cyan-500/50 bg-cyan-950/40 text-cyan-300 font-bold'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="h-3.5 w-3.5 text-cyan-400" />
              <span>{doc.name}</span>
            </button>
          ))}
          {customFileName && (
            <span className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-1 font-mono text-xs text-emerald-300 font-bold">
              Uploaded: {customFileName}
            </span>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-800 bg-[#0d131f]/90 p-3.5">
          <div className="text-[11px] font-mono text-slate-400">ENTITIES PURGED</div>
          <div className="mt-1 font-mono text-2xl font-bold text-rose-400">
            {scanResult.entities.length}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#0d131f]/90 p-3.5">
          <div className="text-[11px] font-mono text-slate-400">THREAT SCORE</div>
          <div className="mt-1 font-mono text-2xl font-bold text-cyan-300">
            {scanResult.riskScore} / 100
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#0d131f]/90 p-3.5">
          <div className="text-[11px] font-mono text-slate-400">SANITIZATION RATE</div>
          <div className="mt-1 font-mono text-2xl font-bold text-emerald-400">
            100%
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#0d131f]/90 p-3.5">
          <div className="text-[11px] font-mono text-slate-400">PROCESSING</div>
          <div className="mt-1 font-mono text-2xl font-bold text-slate-200">
            {scanResult.latencyMs}ms
          </div>
        </div>
      </div>

      {/* Side-by-Side Document Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Raw Document */}
        <div className="rounded-2xl border border-slate-800 bg-[#0d131f]/90 p-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-rose-400 font-bold">
              <span>⊗</span>
              <span>UNGUARDED FILE: {activeFileName}</span>
            </div>
            <span className="text-slate-500">{activeContent.length} chars</span>
          </div>
          <div className="mt-3 max-h-[380px] overflow-y-auto rounded-xl border border-rose-950/40 bg-[#120f18] p-3 font-mono text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">
            {activeContent}
          </div>
        </div>

        {/* Right: Sanitized Document */}
        <div className="rounded-2xl border border-slate-800 bg-[#0d131f]/90 p-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span>▤</span>
              <span>SANITIZED VAULT EXPORT</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
          <div className="mt-3 max-h-[380px] overflow-y-auto rounded-xl border border-emerald-950/40 bg-[#0d1717] p-3 font-mono text-xs leading-relaxed text-emerald-200 whitespace-pre-wrap">
            {scanResult.sanitizedPrompt}
          </div>
        </div>
      </div>

      {/* Download action button */}
      <button
        onClick={handleDownloadSanitized}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 py-3 px-4 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-950/50 hover:brightness-110 active:scale-[0.99] transition-all"
      >
        <Download className="h-4 w-4" />
        <span>Download Sanitized Document ({activeFileName})</span>
      </button>
    </div>
  );
};
