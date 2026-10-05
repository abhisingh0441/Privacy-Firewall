import React from 'react';
import { ArrowRight, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { RiskLevel } from '../types';

interface DefensePipelineProps {
  isScanning: boolean;
  hasScanned: boolean;
  riskLevel: RiskLevel;
  entityCount: number;
}

export const DefensePipeline: React.FC<DefensePipelineProps> = ({
  isScanning,
  hasScanned,
  riskLevel,
  entityCount,
}) => {
  const steps = [
    { label: 'Input', sub: 'Raw Egress' },
    { label: 'Detect', sub: 'Regex & Luhn' },
    { label: 'Classify', sub: 'PII / Secrets' },
    { label: 'Risk', sub: 'Threat Index' },
    { label: 'Policy', sub: 'Rule Matrix' },
    { label: 'Safe Prompt', sub: 'Sanitized' },
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d131f]/80 p-3.5 backdrop-blur-sm">
      <div className="mb-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-mono font-semibold tracking-wider text-slate-300">
          <span className="text-cyan-400">ZERO-LEAKAGE</span>
          <span>DEFENSE PIPELINE</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="font-bold">LIVE ENFORCEMENT</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {steps.map((step, idx) => {
          const isDone = hasScanned && !isScanning;
          const isActive = isScanning;
          return (
            <div
              key={step.label}
              className={`relative flex items-center gap-2 rounded-lg border p-2 text-xs transition-all ${
                isDone
                  ? 'border-cyan-500/30 bg-cyan-950/20 text-cyan-200'
                  : isActive
                  ? 'border-amber-500/40 bg-amber-950/20 text-amber-200 animate-pulse'
                  : 'border-slate-800/80 bg-slate-900/50 text-slate-400'
              }`}
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-mono text-cyan-400 font-bold">
                {isDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                ) : (
                  idx + 1
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate font-semibold text-slate-200">{step.label}</div>
                <div className="truncate text-[10px] text-slate-400">{step.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
