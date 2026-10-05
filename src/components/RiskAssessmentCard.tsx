import React from 'react';
import { AlertTriangle, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { RiskLevel } from '../types';

interface RiskAssessmentCardProps {
  score: number;
  level: RiskLevel;
  entityCount: number;
  isBlocked: boolean;
  categoryRisks: {
    category: string;
    riskScore: number;
    severityLabel: string;
    count: number;
  }[];
}

export const RiskAssessmentCard: React.FC<RiskAssessmentCardProps> = ({
  score,
  level,
  entityCount,
  isBlocked,
  categoryRisks,
}) => {
  // SVG circular gauge math
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let gaugeColor = '#10b981'; // safe
  let levelBadgeStyle = 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300';
  let headingText = 'Clean & Safe for LLM Transmission';
  let headingClass = 'text-emerald-400';

  if (level === 'CRITICAL' || isBlocked) {
    gaugeColor = '#f43f5e'; // rose red
    levelBadgeStyle = 'border-rose-500/50 bg-rose-950/60 text-rose-300';
    headingText = isBlocked ? 'Blocked: Critical Security Breach' : 'Extreme Risk: Transmission Prohibited';
    headingClass = 'text-rose-400';
  } else if (level === 'HIGH') {
    gaugeColor = '#f97316'; // orange
    levelBadgeStyle = 'border-orange-500/40 bg-orange-950/50 text-orange-300';
    headingText = 'Unsafe for LLM Transmission';
    headingClass = 'text-orange-400';
  } else if (level === 'MEDIUM') {
    gaugeColor = '#eab308'; // yellow/amber
    levelBadgeStyle = 'border-amber-500/40 bg-amber-950/50 text-amber-300';
    headingText = 'Moderate Exposure Detected';
    headingClass = 'text-amber-400';
  } else if (level === 'LOW') {
    gaugeColor = '#06b6d4'; // cyan
    levelBadgeStyle = 'border-cyan-500/40 bg-cyan-950/50 text-cyan-300';
    headingText = 'Low Risk: Minor Identifiers';
    headingClass = 'text-cyan-400';
  }

  const defaultCategories = [
    { category: 'Credentials / Secrets', riskScore: isBlocked ? 100 : 0, severityLabel: 'CRITICAL', count: 0 },
    { category: 'Government ID / SSN / Aadhaar', riskScore: 0, severityLabel: 'HIGH', count: 0 },
    { category: 'Contact Metadata (Email & Phone)', riskScore: 0, severityLabel: 'MED', count: 0 },
    { category: 'Personal Identity (Full Name)', riskScore: 0, severityLabel: 'MED', count: 0 },
  ];

  const displayCategories = categoryRisks.length > 0 ? categoryRisks : defaultCategories;

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0d131f]/90 p-5 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
          <ShieldAlert className="h-4 w-4 text-cyan-400" />
          <span>Privacy Risk Assessment</span>
        </div>
        <div className={`flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-mono font-bold tracking-wide ${levelBadgeStyle}`}>
          {level === 'CRITICAL' ? <ShieldX className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
          <span>{level} RISK</span>
        </div>
      </div>

      {/* Main Dial & Verdict Row */}
      <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row">
        {/* Radial Dial */}
        <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 130 130">
            {/* Background track */}
            <circle
              cx="65"
              cy="65"
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Value fill */}
            <circle
              cx="65"
              cy="65"
              r={radius}
              stroke={gaugeColor}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
              style={{
                filter: `drop-shadow(0 0 8px ${gaugeColor}66)`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-mono text-3xl font-extrabold tracking-tight text-white">
              {score}
            </span>
            <span className="text-[11px] font-mono text-slate-400">/ 100</span>
          </div>
        </div>

        {/* Narrative & stats tags */}
        <div className="flex-1 text-center sm:text-left">
          <h4 className={`text-lg font-bold tracking-tight ${headingClass}`}>
            {headingText}
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            {entityCount > 0
              ? `Deterministic threat assessment identified ${entityCount} sensitive token ${
                  entityCount === 1 ? 'instance' : 'instances'
                }. Policies applied before LLM egress.`
              : 'Zero sensitive tokens detected. Clean payload ready for LLM submission.'}
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] font-mono">
            <div className="rounded border border-rose-500/40 bg-rose-950/30 px-2.5 py-1 text-rose-300 font-semibold">
              {entityCount} {entityCount === 1 ? 'LEAK INTERCEPTED' : 'LEAKS INTERCEPTED'}
            </div>
            <div className="rounded border border-cyan-500/40 bg-cyan-950/30 px-2.5 py-1 text-cyan-300 font-semibold">
              TOKENIZED & VAULTED
            </div>
            {isBlocked && (
              <div className="rounded border border-red-500/60 bg-red-950/60 px-2.5 py-1 text-red-200 font-bold animate-pulse">
                EGRESS HALTED
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category breakdown bars */}
      <div className="mt-5 space-y-2.5 border-t border-slate-800/80 pt-4">
        {displayCategories.map(cat => {
          let barBg = 'bg-cyan-500';
          let textColor = 'text-cyan-400';
          if (cat.severityLabel === 'CRITICAL') {
            barBg = 'bg-rose-500';
            textColor = 'text-rose-400';
          } else if (cat.severityLabel === 'HIGH') {
            barBg = 'bg-orange-500';
            textColor = 'text-orange-400';
          } else if (cat.severityLabel === 'MED') {
            barBg = 'bg-amber-500';
            textColor = 'text-amber-400';
          }

          return (
            <div key={cat.category} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-300">{cat.category}</span>
                <span className={`font-mono text-[11px] font-semibold ${textColor}`}>
                  {cat.riskScore}% ({cat.severityLabel})
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${barBg}`}
                  style={{ width: `${Math.max(4, cat.riskScore)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
