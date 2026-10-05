import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Plus, 
  SlidersHorizontal, 
  Search, 
  Check, 
  Ban, 
  EyeOff, 
  KeyRound, 
  Lock, 
  Shuffle, 
  Server, 
  Globe, 
  AlertCircle 
} from 'lucide-react';
import { PolicyAction, PolicyRule } from '../types';

interface PoliciesViewProps {
  policies: PolicyRule[];
  onUpdatePolicyAction: (ruleId: string, action: PolicyAction) => void;
  onToggleRule: (ruleId: string) => void;
  sandboxMode: boolean;
  onToggleSandbox: () => void;
}

export const PoliciesView: React.FC<PoliciesViewProps> = ({
  policies,
  onUpdatePolicyAction,
  onToggleRule,
  sandboxMode,
  onToggleSandbox,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'TOKENIZED'>('ALL');
  const [showNewRuleModal, setShowNewRuleModal] = useState(false);
  const [customRuleName, setCustomRuleName] = useState('');
  const [customRuleSig, setCustomRuleSig] = useState('');
  const [customRuleAction, setCustomRuleAction] = useState<PolicyAction>('REDACT');

  const filteredPolicies = policies.filter(p => {
    if (activeTab === 'CRITICAL' && p.priority !== 'P0') return false;
    if (activeTab === 'HIGH' && (p.priority !== 'P1' && p.priority !== 'P2')) return false;
    if (activeTab === 'TOKENIZED' && p.currentAction !== 'TOKENIZE') return false;

    if (filterQuery) {
      const q = filterQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchSig = p.signatures.some(s => s.toLowerCase().includes(q));
      return matchName || matchDesc || matchSig;
    }
    return true;
  });

  const actionMatrix = [
    {
      action: 'BLOCK' as PolicyAction,
      icon: <Ban className="h-3.5 w-3.5 text-rose-400" />,
      title: 'BLOCK',
      desc: 'Prompt halted at gateway perimeter',
      color: 'border-rose-500/40 bg-rose-950/30 text-rose-300',
    },
    {
      action: 'REDACT' as PolicyAction,
      icon: <EyeOff className="h-3.5 w-3.5 text-amber-400" />,
      title: 'REDACT',
      desc: 'Total erasure with cryptographic blackbox',
      color: 'border-amber-500/40 bg-amber-950/30 text-amber-300',
    },
    {
      action: 'TOKENIZE' as PolicyAction,
      icon: <KeyRound className="h-3.5 w-3.5 text-cyan-400" />,
      title: 'TOKENIZE',
      desc: 'Deterministic reversible vault mapping',
      color: 'border-cyan-500/40 bg-cyan-950/30 text-cyan-300',
    },
    {
      action: 'MASK' as PolicyAction,
      icon: <Lock className="h-3.5 w-3.5 text-blue-400" />,
      title: 'MASK',
      desc: 'Partial obfuscation preserving format',
      color: 'border-blue-500/40 bg-blue-950/30 text-blue-300',
    },
    {
      action: 'ANONYMIZE' as PolicyAction,
      icon: <Shuffle className="h-3.5 w-3.5 text-emerald-400" />,
      title: 'ANONYMIZE',
      desc: 'Synthetic realistic entity replacement',
      color: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300',
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-white">Enforcement Policies</h2>
            <span className="rounded-full border border-cyan-500/40 bg-cyan-950/40 px-2.5 py-0.5 font-mono text-[11px] font-bold text-cyan-300">
              14 Active
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Runtime interception rules & sanitization protocols evaluated per prompt egress.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewRuleModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-950/50"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Rule</span>
          </button>
        </div>
      </div>

      {/* Simulation Sandbox Card */}
      <div className="flex items-center justify-between rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/30 via-slate-900/60 to-slate-900/40 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Simulation Sandbox</span>
              <span className="rounded bg-indigo-500/30 px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-300">
                SHADOW RUN
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Dry-run newly introduced policy rules without actively blocking or terminating outbound prompts.
            </p>
          </div>
        </div>

        <button
          onClick={onToggleSandbox}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            sandboxMode ? 'bg-indigo-600' : 'bg-slate-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              sandboxMode ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Search & Filter pills */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            placeholder="Search triggers, tags, signatures, or actions..."
            className="w-full rounded-xl border border-slate-800 bg-[#0c121d] py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-900/70 border border-slate-800/80 rounded-xl text-xs">
          {(['ALL', 'CRITICAL', 'HIGH', 'TOKENIZED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-1 font-mono text-xs font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-slate-800 text-cyan-300 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'ALL' ? 'All (14)' : tab === 'CRITICAL' ? 'Critical (2)' : tab === 'HIGH' ? 'High Risk (3)' : 'Tokenized'}
            </button>
          ))}
        </div>
      </div>

      {/* Interception Actions Matrix banner */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>INTERCEPTION ACTIONS MATRIX</span>
          <span>5 METHODS ACTIVE</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {actionMatrix.map(m => (
            <div
              key={m.title}
              className={`rounded-xl border p-2.5 text-xs transition-all ${m.color}`}
            >
              <div className="flex items-center gap-1.5 font-bold font-mono">
                {m.icon}
                <span>{m.title}</span>
              </div>
              <p className="mt-1 text-[11px] leading-tight text-slate-400">
                {m.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Interception Priority Rules (P0 - P4) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>INTERCEPTION ORDER (Top down priority P0 → P4)</span>
          <span>STRICT ENFORCEMENT</span>
        </div>

        {filteredPolicies.map(rule => (
          <div
            key={rule.id}
            className={`rounded-2xl border bg-[#0d131f]/90 p-4 transition-all ${
              rule.enabled ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/40 opacity-60'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800/80 font-mono text-xs font-bold text-cyan-400">
                  {rule.priority}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{rule.name}</h4>
                    <span className="text-[11px] text-slate-500">Updated by SecOps</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{rule.description}</p>
                </div>
              </div>

              {/* Action Dropdown & Toggle switch */}
              <div className="flex items-center gap-3 self-end sm:self-center">
                <select
                  value={rule.currentAction}
                  onChange={e => onUpdatePolicyAction(rule.id, e.target.value as PolicyAction)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 font-mono text-xs font-bold text-cyan-300 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="BLOCK">BLOCK</option>
                  <option value="REDACT">REDACT</option>
                  <option value="TOKENIZE">TOKENIZE</option>
                  <option value="MASK">MASK</option>
                  <option value="ANONYMIZE">ANONYMIZE</option>
                  <option value="ALLOW">ALLOW</option>
                </select>

                <button
                  onClick={() => onToggleRule(rule.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    rule.enabled ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 transition-transform ${
                      rule.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Signature tags */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-800/60 text-xs">
              <span className="font-mono text-[11px] text-slate-500">SIGNATURES:</span>
              {rule.signatures.map(sig => (
                <span
                  key={sig}
                  className="rounded bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-300 border border-slate-800"
                >
                  {sig}
                </span>
              ))}
              <span className="ml-auto font-mono text-[11px] text-emerald-400 font-semibold">
                ● {rule.metricsText}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Model Routing Overrides */}
      <div className="rounded-2xl border border-slate-800 bg-[#0d131f]/90 p-5">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Model Routing Overrides</h3>
          </div>
          <span className="font-mono text-xs text-cyan-400 cursor-pointer hover:underline">
            + Add Provider
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-rose-900/30 bg-[#120f18]/80 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Globe className="h-4 w-4 text-cyan-400" />
                <span>External: OpenAI / Anthropic</span>
              </div>
              <span className="rounded bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-300">
                STRICT
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Maximum Defense & Strict Isolation. All P0 and P1 credentials enforce hard abort. No plaintext PII allowed beyond edge DMZ.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-900/30 bg-[#0d1618]/80 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Server className="h-4 w-4 text-emerald-400" />
                <span>On-Prem: Llama 3 Cluster (VPC-04)</span>
              </div>
              <span className="rounded bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                PERMISSIVE
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Permissive Internal Bypass. Masking relaxed for debugging traces; confidential internal domains allowed without alteration.
            </p>
          </div>
        </div>
      </div>

      {/* New Rule Modal Dialog */}
      {showNewRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0d131f] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white">Create Custom Detection Rule</h3>
            <p className="mt-1 text-xs text-slate-400">
              Define a local rule-based regex signature and action profile.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300">Rule Name</label>
                <input
                  type="text"
                  value={customRuleName}
                  onChange={e => setCustomRuleName(e.target.value)}
                  placeholder="e.g. Internal Employee ID"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Signature / Keyword Pattern</label>
                <input
                  type="text"
                  value={customRuleSig}
                  onChange={e => setCustomRuleSig(e.target.value)}
                  placeholder="e.g. EMP-[0-9]{6}"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Default Action</label>
                <select
                  value={customRuleAction}
                  onChange={e => setCustomRuleAction(e.target.value as PolicyAction)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-cyan-300 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="BLOCK">BLOCK</option>
                  <option value="REDACT">REDACT</option>
                  <option value="TOKENIZE">TOKENIZE</option>
                  <option value="MASK">MASK</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowNewRuleModal(false)}
                className="rounded-lg px-3 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowNewRuleModal(false);
                  setCustomRuleName('');
                  setCustomRuleSig('');
                }}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
              >
                Save Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
