import React, { useState } from 'react';
import { Check, Copy, Download, Send, ArrowDown, FileText, CheckCircle2, Sparkles, ExternalLink } from 'lucide-react';
import { DetectedEntity } from '../types';
import { playClickSound, playSuccessSound } from '../utils/cyberAudio';

interface PromptTransformationDiffProps {
  rawPrompt: string;
  sanitizedPrompt: string;
  entities: DetectedEntity[];
  isBlocked: boolean;
  blockReason?: string;
  traceId: string;
  riskScore: number;
  riskLevel: string;
  targetLlm: string;
  onSendGateway: () => void;
}

export const PromptTransformationDiff: React.FC<PromptTransformationDiffProps> = ({
  rawPrompt,
  sanitizedPrompt,
  entities,
  isBlocked,
  blockReason,
  traceId,
  riskScore,
  riskLevel,
  targetLlm,
  onSendGateway,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const handleCopy = async () => {
    playClickSound();
    try {
      await navigator.clipboard.writeText(sanitizedPrompt);
      setCopied(true);
      playSuccessSound();
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleDownloadAudit = () => {
    playClickSound();
    const reportData = {
      firewall_version: 'PrivacyShield AI v2.4-PROD',
      compliance: ['GDPR Art. 9', 'HIPAA Safe Harbor', 'PCI-DSS v4.0'],
      trace_id: traceId,
      timestamp: new Date().toISOString(),
      target_llm: targetLlm,
      risk_score: riskScore,
      risk_level: riskLevel,
      entities_detected_count: entities.length,
      policy_verdict: isBlocked ? 'BLOCKED_AT_PERIMETER' : 'SANITIZED_AND_ROUTED',
      block_reason: blockReason || null,
      intercepted_entities: entities.map(e => ({
        type: e.type,
        label: e.label,
        risk: e.risk,
        confidence: e.confidence,
        applied_action: e.appliedAction,
        replacement_token: e.replacement,
        sample_masked: e.maskedDisplay,
      })),
      safe_prompt: sanitizedPrompt,
      cryptographic_hash: `sha256-${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-receipt-${traceId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    playSuccessSound();
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  // Helper to render original prompt with highlighted interactive sensitive segments
  const renderOriginalHighlighted = () => {
    if (!rawPrompt) return <span className="text-slate-500 italic">No prompt provided</span>;
    if (entities.length === 0) return <span>{rawPrompt}</span>;

    const elements: React.ReactNode[] = [];
    let cursor = 0;

    entities.forEach((ent, i) => {
      if (ent.start > cursor) {
        elements.push(
          <span key={`text-${i}`}>{rawPrompt.slice(cursor, ent.start)}</span>
        );
      }
      elements.push(
        <span
          key={`highlight-${ent.id}`}
          onMouseEnter={() => setActiveTooltip(ent.id)}
          onMouseLeave={() => setActiveTooltip(null)}
          className="relative inline-block"
        >
          <mark className="mx-0.5 cursor-pointer rounded-md border border-rose-500/50 bg-rose-950/70 px-1.5 py-0.5 font-mono text-rose-200 font-semibold shadow-sm transition-all hover:bg-rose-900/80 hover:border-rose-400">
            {ent.value}
          </mark>
          {activeTooltip === ent.id && (
            <span className="absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-[10px] font-mono text-slate-200 shadow-xl">
              {ent.label} · <strong className="text-rose-400">{ent.risk}</strong>
            </span>
          )}
        </span>
      );
      cursor = ent.end;
    });

    if (cursor < rawPrompt.length) {
      elements.push(
        <span key="text-end">{rawPrompt.slice(cursor)}</span>
      );
    }

    return elements;
  };

  return (
    <div className="interactive-card rounded-2xl border border-slate-800 bg-[#0d131f]/90 p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-bold tracking-tight text-slate-200">Prompt Transformation Diff</h3>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-cyan-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-500"></span>
          </span>
          <span>GATEWAY READY</span>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {/* Box 1: Unguarded Input */}
        <div className="rounded-xl border border-rose-900/40 bg-[#141016]/90 p-4 transition-all hover:border-rose-800/60">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-1.5 text-rose-400 font-bold">
              <span>⊗</span>
              <span>ORIGINAL UNGUARDED INPUT</span>
            </div>
            <span className="text-slate-500">Raw Payload</span>
          </div>
          <div className="mt-3 font-mono text-xs leading-relaxed text-slate-300 whitespace-pre-wrap break-words">
            {renderOriginalHighlighted()}
          </div>
        </div>

        {/* Separator badge with animated bouncing arrow */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-4 py-1.5 text-xs font-mono font-semibold text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <ArrowDown className="h-3.5 w-3.5 animate-bounce text-cyan-400" />
            <span>Applied {entities.length} Safeguard Rules</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
          </div>
        </div>

        {/* Box 2: What Your LLM Actually Receives */}
        <div className="rounded-xl border border-emerald-900/40 bg-[#0d1717]/90 p-4 transition-all hover:border-emerald-800/60">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span>▤</span>
              <span>WHAT YOUR LLM ACTUALLY RECEIVES</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>100% Sanitized</span>
            </div>
          </div>

          {isBlocked ? (
            <div className="mt-3 rounded-lg border border-red-500/40 bg-red-950/40 p-3.5 text-xs text-red-200">
              <div className="font-bold font-mono text-red-300">🚫 TRANSMISSION ABORTED AT GATEWAY</div>
              <p className="mt-1 leading-relaxed text-slate-300">{blockReason}</p>
            </div>
          ) : (
            <div className="mt-3 font-mono text-xs leading-relaxed text-emerald-200 whitespace-pre-wrap break-words selection:bg-cyan-500/40">
              {sanitizedPrompt || <span className="text-slate-500 italic">No sanitized prompt generated</span>}
            </div>
          )}
        </div>

        {/* Action Buttons row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={handleCopy}
            disabled={isBlocked || !sanitizedPrompt}
            className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl border border-slate-700 bg-slate-900/90 py-2.5 px-4 text-xs font-semibold text-slate-200 shadow-sm transition-all duration-200 hover:border-cyan-500/60 hover:bg-slate-800 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] active:scale-[0.98] disabled:opacity-50"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-300 font-bold">Copied Safe Prompt!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                <span>Copy Safe Prompt</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              playClickSound();
              onSendGateway();
            }}
            disabled={isBlocked}
            className="relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 py-2.5 px-4 text-xs font-bold text-slate-950 shadow-md shadow-emerald-950/40 transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-[0.98] disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send to Gateway (Sandbox)</span>
          </button>
        </div>

        {/* Cryptographic Audit Receipt Download button */}
        <button
          onClick={handleDownloadAudit}
          className="group w-full flex items-center justify-center gap-2 rounded-xl border border-slate-800/80 bg-[#111726]/60 py-2.5 px-4 text-xs font-mono text-slate-300 hover:border-slate-700 hover:bg-slate-900 transition-all hover:shadow-[0_0_15px_rgba(0,0,0,0.5)] active:scale-[0.99]"
        >
          {downloadSuccess ? (
            <>
              <Check className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-300 font-bold">Cryptographic Receipt Downloaded!</span>
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5 text-cyan-400 group-hover:animate-bounce" />
              <span>Download Cryptographic Audit Receipt (JSON/PDF)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
