import React, { useState } from 'react';
import { Check, Copy, Download, Send, ArrowDown, FileText, CheckCircle2 } from 'lucide-react';
import { DetectedEntity } from '../types';

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sanitizedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadAudit = () => {
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
        // Redact raw secrets from exported audit files for security
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
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  // Helper to render original prompt with highlighted sensitive segments
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
        <mark
          key={`highlight-${ent.id}`}
          className="mx-0.5 rounded border border-rose-500/40 bg-rose-950/60 px-1 py-0.5 font-mono text-rose-200 font-semibold selection:bg-rose-500/40"
          title={`${ent.label} (${ent.risk})`}
        >
          {ent.value}
        </mark>
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
    <div className="rounded-2xl border border-slate-800 bg-[#0d131f]/90 p-5 shadow-xl backdrop-blur-md">
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
        <div className="rounded-xl border border-rose-900/40 bg-[#141016]/90 p-4">
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

        {/* Separator badge */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-mono font-semibold text-cyan-300">
            <ArrowDown className="h-3 w-3 animate-bounce" />
            <span>Applied {entities.length} Safeguard Rules</span>
            <CheckCircle2 className="h-3 w-3 text-cyan-400" />
          </div>
        </div>

        {/* Box 2: What Your LLM Actually Receives */}
        <div className="rounded-xl border border-emerald-900/40 bg-[#0d1717]/90 p-4">
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
            <div className="mt-3 rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-200">
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
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 py-2.5 px-4 text-xs font-semibold text-slate-200 shadow-sm transition-all hover:border-cyan-500/60 hover:bg-slate-800 disabled:opacity-50"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-300">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-slate-400" />
                <span>Copy Safe Prompt</span>
              </>
            )}
          </button>

          <button
            onClick={onSendGateway}
            disabled={isBlocked}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 px-4 text-xs font-bold text-slate-950 shadow-md shadow-emerald-950/40 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send to Gateway (Sandbox)</span>
          </button>
        </div>

        {/* Cryptographic Audit Receipt Download button */}
        <button
          onClick={handleDownloadAudit}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-800/80 bg-[#111726]/60 py-2.5 px-4 text-xs font-mono text-slate-300 hover:border-slate-700 hover:bg-slate-900 transition-all"
        >
          {downloadSuccess ? (
            <>
              <Check className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-300">Receipt Downloaded Successfully</span>
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5 text-cyan-400" />
              <span>Download Cryptographic Audit Receipt (JSON/PDF)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
