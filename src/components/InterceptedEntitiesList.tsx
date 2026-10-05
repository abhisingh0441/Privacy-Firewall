import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, Tag, Lock, Ban, KeyRound, Copy, Check, Trash2, Sliders } from 'lucide-react';
import { DetectedEntity, PolicyAction } from '../types';
import { playClickSound, playSuccessSound } from '../utils/cyberAudio';

interface InterceptedEntitiesListProps {
  entities: DetectedEntity[];
  onEntityActionChange?: (entityId: string, newAction: PolicyAction) => void;
  onEntityWhitelist?: (entityId: string) => void;
}

export const InterceptedEntitiesList: React.FC<InterceptedEntitiesListProps> = ({
  entities,
  onEntityActionChange,
  onEntityWhitelist,
}) => {
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  const toggleReveal = (id: string) => {
    playClickSound();
    setRevealedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToken = (id: string, token: string) => {
    playClickSound();
    navigator.clipboard.writeText(token);
    setCopiedTokenId(id);
    playSuccessSound();
    setTimeout(() => setCopiedTokenId(null), 1800);
  };

  if (entities.length === 0) {
    return (
      <div className="interactive-card rounded-2xl border border-slate-800 bg-[#0d131f]/80 p-8 text-center transition-all">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h4 className="mt-3 text-base font-bold text-white">No Sensitive Entities Intercepted</h4>
        <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
          The prompt was verified against PII, credentials, payment cards, national IDs, and secret signatures with zero matches.
        </p>
      </div>
    );
  }

  return (
    <div className="interactive-card rounded-2xl border border-slate-800 bg-[#0d131f]/90 p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-bold tracking-tight text-slate-200">Intercepted Entities</h3>
          <span className="rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 font-mono text-[10px] text-cyan-300 font-bold">
            {entities.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-400">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Interactive Enforcement</span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {entities.map(entity => {
          const isRevealed = !!revealedIds[entity.id];
          const displayValue = isRevealed ? entity.value : entity.maskedDisplay;
          const isCopied = copiedTokenId === entity.id;

          let confBadgeClass = 'border-cyan-500/30 bg-cyan-950/40 text-cyan-300';
          if (entity.risk === 'CRITICAL') {
            confBadgeClass = 'border-rose-500/40 bg-rose-950/50 text-rose-300';
          } else if (entity.risk === 'HIGH') {
            confBadgeClass = 'border-orange-500/40 bg-orange-950/50 text-orange-300';
          }

          return (
            <div
              key={entity.id}
              className="group relative rounded-xl border border-slate-800/80 bg-[#121927]/90 p-3.5 transition-all duration-200 hover:border-slate-700 hover:bg-[#151e30] hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-100 selection:bg-rose-500/30">
                    {displayValue}
                  </span>
                  <button
                    onClick={() => toggleReveal(entity.id)}
                    title={isRevealed ? 'Mask value' : 'Reveal unmasked value'}
                    className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-cyan-300"
                  >
                    {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <div className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold ${confBadgeClass}`}>
                  {Math.round(entity.confidence * 100)}% CONF
                </div>
              </div>

              <div className="mt-1 flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>{entity.label}</span>
                {onEntityWhitelist && (
                  <button
                    onClick={() => {
                      playClickSound();
                      onEntityWhitelist(entity.id);
                    }}
                    className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1"
                    title="Whitelist / Ignore this entity"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Ignore</span>
                  </button>
                )}
              </div>

              {/* Action row with Interactive Dropdown */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/60 pt-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">ACTION:</span>
                  <select
                    value={entity.appliedAction}
                    onChange={e => {
                      playClickSound();
                      if (onEntityActionChange) {
                        onEntityActionChange(entity.id, e.target.value as PolicyAction);
                      }
                    }}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-xs font-bold text-cyan-300 focus:border-cyan-500 focus:outline-none transition-colors"
                  >
                    <option value="REDACT">REDACT</option>
                    <option value="TOKENIZE">TOKENIZE</option>
                    <option value="MASK">MASK</option>
                    <option value="ANONYMIZE">ANONYMIZE</option>
                    <option value="BLOCK">BLOCK</option>
                    <option value="ALLOW">ALLOW</option>
                  </select>
                </div>

                <button
                  onClick={() => copyToken(entity.id, entity.replacement)}
                  title="Copy replacement token"
                  className="flex items-center gap-1.5 rounded bg-slate-900/90 px-2 py-0.5 font-mono text-[11px] font-bold text-cyan-300 border border-slate-700/60 transition-all hover:border-cyan-500/60 hover:text-white"
                >
                  <span>{entity.replacement}</span>
                  {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-slate-500 group-hover:text-cyan-400" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
