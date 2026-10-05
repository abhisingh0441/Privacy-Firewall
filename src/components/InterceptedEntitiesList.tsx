import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, Tag, Lock, Ban, KeyRound } from 'lucide-react';
import { DetectedEntity } from '../types';

interface InterceptedEntitiesListProps {
  entities: DetectedEntity[];
}

export const InterceptedEntitiesList: React.FC<InterceptedEntitiesListProps> = ({ entities }) => {
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  const toggleReveal = (id: string) => {
    setRevealedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (entities.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0d131f]/80 p-5 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-emerald-400" />
        <h4 className="mt-2 text-sm font-semibold text-slate-200">No Sensitive Entities Intercepted</h4>
        <p className="mt-1 text-xs text-slate-400">
          The prompt was verified against PII, credentials, cards, Aadhaar, and secret signatures with zero matches.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0d131f]/90 p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-bold tracking-tight text-slate-200">Intercepted Entities</h3>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-400">
          <span>✓</span>
          <span>All Handled</span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {entities.map(entity => {
          const isRevealed = !!revealedIds[entity.id];
          const displayValue = isRevealed ? entity.value : entity.maskedDisplay;

          let confBadgeClass = 'border-cyan-500/30 bg-cyan-950/40 text-cyan-300';
          if (entity.risk === 'CRITICAL') {
            confBadgeClass = 'border-rose-500/40 bg-rose-950/50 text-rose-300';
          } else if (entity.risk === 'HIGH') {
            confBadgeClass = 'border-orange-500/40 bg-orange-950/50 text-orange-300';
          }

          let actionIcon = <ShieldCheck className="h-3.5 w-3.5" />;
          let actionText = `ACTION: ${entity.appliedAction}`;
          let actionClass = 'text-cyan-400';

          if (entity.appliedAction === 'BLOCK') {
            actionIcon = <Ban className="h-3.5 w-3.5" />;
            actionText = 'ACTION: HARD BLOCK';
            actionClass = 'text-rose-400';
          } else if (entity.appliedAction === 'TOKENIZE') {
            actionIcon = <KeyRound className="h-3.5 w-3.5" />;
            actionText = 'ACTION: REVERSIBLE TOKENIZE';
            actionClass = 'text-cyan-300';
          } else if (entity.appliedAction === 'MASK') {
            actionIcon = <Lock className="h-3.5 w-3.5" />;
            actionText = 'ACTION: VAULT MASK';
            actionClass = 'text-amber-400';
          } else if (entity.appliedAction === 'ANONYMIZE') {
            actionIcon = <ShieldCheck className="h-3.5 w-3.5" />;
            actionText = 'ACTION: PSEUDONYMIZE';
            actionClass = 'text-emerald-400';
          }

          return (
            <div
              key={entity.id}
              className="group rounded-xl border border-slate-800/80 bg-[#121927]/90 p-3.5 transition-all hover:border-slate-700/80"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-100 selection:bg-rose-500/30">
                    {displayValue}
                  </span>
                  <button
                    onClick={() => toggleReveal(entity.id)}
                    title={isRevealed ? 'Mask value' : 'Reveal unmasked value'}
                    className="text-slate-500 transition-colors hover:text-slate-300"
                  >
                    {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <div className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold ${confBadgeClass}`}>
                  {Math.round(entity.confidence * 100)}% CONF
                </div>
              </div>

              <div className="mt-1 text-xs text-slate-400">{entity.label}</div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/60 pt-2 text-xs font-mono">
                <div className={`flex items-center gap-1.5 font-semibold ${actionClass}`}>
                  {actionIcon}
                  <span>{actionText}</span>
                </div>
                <div className="rounded bg-slate-900/90 px-2 py-0.5 font-mono text-[11px] font-bold text-cyan-300 border border-slate-700/60">
                  {entity.replacement}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
