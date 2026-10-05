/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  FileText, 
  Lock, 
  Radio, 
  BarChart3, 
  SlidersHorizontal, 
  Volume2, 
  VolumeX, 
  User, 
  Zap, 
  Check, 
  Sparkles,
  ArrowRight,
  RefreshCw,
  FolderLock,
  AlertTriangle,
  Flame,
  Activity
} from 'lucide-react';
import { Firewall3D } from './components/Firewall3D';
import { DefensePipeline } from './components/DefensePipeline';
import { RiskAssessmentCard } from './components/RiskAssessmentCard';
import { InterceptedEntitiesList } from './components/InterceptedEntitiesList';
import { PromptTransformationDiff } from './components/PromptTransformationDiff';
import { PoliciesView } from './components/PoliciesView';
import { ActivityView } from './components/ActivityView';
import { AnalyticsView } from './components/AnalyticsView';
import { ConfigView } from './components/ConfigView';
import { DocumentVaultView } from './components/DocumentVaultView';
import { DEFAULT_POLICIES, executeFirewallScan, generateReplacement } from './engine/privacyFirewall';
import { DetectedEntity, PolicyAction, PolicyRule, ScanResult } from './types';
import { 
  playClickSound, 
  playScanSound, 
  playSuccessSound, 
  playThreatSound, 
  isSoundEnabled, 
  setSoundEnabled 
} from './utils/cyberAudio';

export default function App() {
  const [activeTab, setActiveTab] = useState<'scan' | 'policies' | 'activity' | 'analytics' | 'config'>('scan');
  const [scannerMode, setScannerMode] = useState<'prompt' | 'vault'>('prompt');
  const [targetLlm, setTargetLlm] = useState('OpenAI GPT-4o');
  const [sandboxMode, setSandboxMode] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [threatAlertActive, setThreatAlertActive] = useState(false);

  // Prompt input state
  const defaultPrompt =
    'Send an email to Rahul Sharma at rahul.sharma@enterprise.com. His phone number is +1 (555) 987-6543, employee SSN is 042-99-1234, and corporate AWS secret is akia_live_99f3810a9c. Target LLM: GPT-4o.';
  
  const [promptInput, setPromptInput] = useState(defaultPrompt);
  const [policies, setPolicies] = useState<PolicyRule[]>(DEFAULT_POLICIES);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [gatewaySentToast, setGatewaySentToast] = useState(false);

  // Initialize audio state
  useEffect(() => {
    setSoundOn(isSoundEnabled());
    const result = executeFirewallScan(defaultPrompt, DEFAULT_POLICIES, targetLlm);
    setScanResult(result);
  }, []);

  const triggerThreatAlert = (severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW') => {
    playThreatSound(severity);
    setThreatAlertActive(true);
    setTimeout(() => setThreatAlertActive(false), 1200);
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playClickSound();
  };

  const handleScan = () => {
    if (!promptInput.trim()) return;
    playScanSound();
    setIsScanning(true);

    setTimeout(() => {
      const result = executeFirewallScan(promptInput, policies, targetLlm);
      setScanResult(result);
      setIsScanning(false);

      if (result.isBlocked || result.riskScore >= 60) {
        triggerThreatAlert(result.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH');
      } else if (result.riskScore > 0) {
        triggerThreatAlert('MEDIUM');
      } else {
        playSuccessSound();
      }
    }, 450);
  };

  const handleUpdatePolicyAction = (ruleId: string, action: PolicyAction) => {
    playClickSound();
    const updated = policies.map(p => (p.id === ruleId ? { ...p, currentAction: action } : p));
    setPolicies(updated);
    if (promptInput) {
      const result = executeFirewallScan(promptInput, updated, targetLlm);
      setScanResult(result);
      if (result.isBlocked || result.riskScore >= 60) {
        triggerThreatAlert(result.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH');
      }
    }
  };

  const handleToggleRule = (ruleId: string) => {
    playClickSound();
    const updated = policies.map(p => (p.id === ruleId ? { ...p, enabled: !p.enabled } : p));
    setPolicies(updated);
    if (promptInput) {
      const result = executeFirewallScan(promptInput, updated, targetLlm);
      setScanResult(result);
    }
  };

  // Interactive: Change single detected entity action on the fly!
  const handleSingleEntityActionChange = (entityId: string, newAction: PolicyAction) => {
    if (!scanResult) return;
    const updatedEntities = scanResult.entities.map((e, idx) => {
      if (e.id === entityId) {
        const replacement = generateReplacement(e.type, newAction, idx, e.value);
        return {
          ...e,
          appliedAction: newAction,
          replacement,
        };
      }
      return e;
    });

    // Reconstruct sanitized prompt
    let newSanitized = '';
    let cursor = 0;
    updatedEntities.forEach(ent => {
      newSanitized += scanResult.rawPrompt.slice(cursor, ent.start);
      newSanitized += ent.replacement;
      cursor = ent.end;
    });
    newSanitized += scanResult.rawPrompt.slice(cursor);

    const hasBlock = updatedEntities.some(e => e.appliedAction === 'BLOCK');

    setScanResult({
      ...scanResult,
      entities: updatedEntities,
      sanitizedPrompt: newSanitized,
      isBlocked: hasBlock,
      blockReason: hasBlock ? 'Request blocked: Entity configured under strict BLOCK policy.' : undefined,
    });

    playSuccessSound();
  };

  // Interactive: Whitelist/Ignore detected entity
  const handleSingleEntityWhitelist = (entityId: string) => {
    if (!scanResult) return;
    const updatedEntities = scanResult.entities.filter(e => e.id !== entityId);

    // Reconstruct sanitized prompt
    let newSanitized = '';
    let cursor = 0;
    updatedEntities.forEach(ent => {
      newSanitized += scanResult.rawPrompt.slice(cursor, ent.start);
      newSanitized += ent.replacement;
      cursor = ent.end;
    });
    newSanitized += scanResult.rawPrompt.slice(cursor);

    const hasBlock = updatedEntities.some(e => e.appliedAction === 'BLOCK');
    const newScore = Math.max(0, scanResult.riskScore - 20);

    setScanResult({
      ...scanResult,
      entities: updatedEntities,
      sanitizedPrompt: newSanitized,
      riskScore: newScore,
      isBlocked: hasBlock,
    });

    playSuccessSound();
  };

  const loadDemo = (type: 'pii' | 'secrets' | 'finance' | 'aadhaar' | 'safe') => {
    playClickSound();
    let text = '';
    if (type === 'pii') {
      text =
        'Send an email to Rahul Sharma at rahul.sharma@enterprise.com. His phone number is +1 (555) 987-6543, employee SSN is 042-99-1234, and corporate AWS secret is akia_live_99f3810a9c. Target LLM: GPT-4o.';
    } else if (type === 'secrets') {
      text =
        'Execute deployment pipeline with api_key=sk-live-99a38f1b0c9482710381920 and AWS token AKIAIOSFODNN7EXAMPLE to host 192.168.1.10.';
    } else if (type === 'finance') {
      text =
        'Customer requested billing reconciliation for Visa credit card 4111 1111 1111 1111 with password: SecretTempPass123! and email finance@acme.org.';
    } else if (type === 'aadhaar') {
      text =
        'Contact applicant Rahul at rahul.demo@example.com, phone 9876543210. His Aadhaar national identity is 2345 6789 0123.';
    } else {
      text =
        'Explain the best architectural patterns for constructing high-throughput pre-LLM privacy firewall gateways in distributed cloud systems.';
    }

    setPromptInput(text);
    setIsScanning(true);
    playScanSound();

    setTimeout(() => {
      const result = executeFirewallScan(text, policies, targetLlm);
      setScanResult(result);
      setIsScanning(false);
      if (result.isBlocked || result.riskScore >= 60) {
        triggerThreatAlert(result.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH');
      } else if (result.riskScore > 0) {
        triggerThreatAlert('MEDIUM');
      } else {
        playSuccessSound();
      }
    }, 380);
  };

  const handleSendToGateway = () => {
    playSuccessSound();
    setGatewaySentToast(true);
    setTimeout(() => setGatewaySentToast(false), 3000);
  };

  return (
    <div className={`min-h-screen bg-[#070a10] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 cyber-bg-grid relative overflow-x-hidden transition-all duration-300 ${
      threatAlertActive ? 'ring-4 ring-rose-500/60 shadow-[inset_0_0_50px_rgba(244,63,94,0.3)]' : ''
    }`}>
      {/* Background ambient lighting effects */}
      <div className="pointer-events-none fixed -top-40 -left-40 h-96 w-96 rounded-full ambient-glow-cyan blur-3xl opacity-60"></div>
      <div className="pointer-events-none fixed top-1/2 -right-40 h-96 w-96 rounded-full ambient-glow-rose blur-3xl opacity-40"></div>

      {/* ULTRA-ANIMATED TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#090e17]/95 px-4 py-3 backdrop-blur-md shadow-2xl transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Brand lockup with animated rotating radar */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-700 shadow-lg shadow-cyan-950/80 p-1.5 transition-transform hover:scale-110 active:rotate-12">
              <Shield className="h-5 w-5 text-white" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-cyan-200 animate-ping opacity-80"></div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white drop-shadow-sm">
                  PrivacyShield AI
                </span>
                <span className="rounded-full bg-cyan-950/90 border border-cyan-500/50 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                  v2.4-PROD
                </span>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-cyan-400 animate-pulse" />
                <span>
                  {activeTab === 'scan' && 'Scan Playground'}
                  {activeTab === 'policies' && 'Enforcement Policies (14 Rules)'}
                  {activeTab === 'activity' && 'Security Event Stream (Live)'}
                  {activeTab === 'analytics' && 'Operational Analytics & Telemetry'}
                  {activeTab === 'config' && 'Gateway Configuration'}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Animated Segmented Nav Pills */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-inner">
            {[
              { id: 'scan', label: 'Scan', icon: Shield },
              { id: 'policies', label: 'Policies', icon: Lock },
              { id: 'activity', label: 'Activity', icon: Radio },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'config', label: 'Config', icon: SlidersHorizontal },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    playClickSound();
                    setActiveTab(tab.id as any);
                  }}
                  className={`relative flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-lg shadow-cyan-950/60 scale-[1.04]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80 hover:scale-[1.02]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-white animate-pulse"></span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right quick actions: Animated Audio equalizer toggle & status */}
          <div className="flex items-center gap-3">
            {/* Animated sound toggle with audio waves */}
            <button
              onClick={toggleSound}
              title={soundOn ? 'Mute sound alerts' : 'Enable sound alerts'}
              className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 transition-all shadow-sm"
            >
              {soundOn ? (
                <>
                  <Volume2 className="h-4 w-4 text-cyan-400" />
                  <div className="flex items-end gap-0.5 h-3">
                    <span className="h-2 w-0.5 bg-cyan-400 animate-pulse"></span>
                    <span className="h-3 w-0.5 bg-cyan-300 animate-pulse delay-75"></span>
                    <span className="h-1.5 w-0.5 bg-cyan-400 animate-pulse delay-150"></span>
                  </div>
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-500 text-[10px]">MUTED</span>
                </>
              )}
            </button>

            <div className="hidden lg:flex items-center gap-1.5 font-mono text-[11px] text-cyan-400 border border-cyan-500/30 rounded-xl px-3 py-1 bg-cyan-950/20 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
              <Zap className="h-3 w-3 animate-bounce" />
              <span>TLS 1.3 LOCAL</span>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-cyan-400 border border-slate-700 hover:scale-105 transition-transform">
              <User className="h-4 w-4" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-5 pb-24 md:pb-12 z-10">
        {/* VIEW 1: SCAN PLAYGROUND */}
        {activeTab === 'scan' && (
          <div className="space-y-6">
            {/* Mode Switcher: Prompt Scanner vs Document Vault */}
            <div className="flex items-center justify-between">
              <div className="inline-flex p-1 rounded-xl bg-slate-900/80 border border-slate-800/90 text-xs font-medium shadow-sm">
                <button
                  onClick={() => {
                    playClickSound();
                    setScannerMode('prompt');
                  }}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg transition-all duration-200 ${
                    scannerMode === 'prompt'
                      ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 font-bold shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Prompt Scanner</span>
                </button>
                <button
                  onClick={() => {
                    playClickSound();
                    setScannerMode('vault');
                  }}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg transition-all duration-200 ${
                    scannerMode === 'vault'
                      ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 font-bold shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FolderLock className="h-3.5 w-3.5" />
                  <span>Document Vault</span>
                  <span className="rounded bg-cyan-500 px-1 py-0.2 text-[9px] text-slate-950 font-extrabold animate-pulse">
                    NEW
                  </span>
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-emerald-400">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>ZERO-EGRESS GUARANTEE</span>
              </div>
            </div>

            {/* If in Document Vault Mode, render Vault View */}
            {scannerMode === 'vault' ? (
              <DocumentVaultView policies={policies} />
            ) : (
              <>
                {/* Hero Heading Banner matching screenshot */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="flex items-center gap-1 text-cyan-400 font-semibold">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
                      PRE-LLM PROTECTION
                    </span>
                    <span className="text-slate-600">/</span>
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <Zap className="h-3 w-3" />
                      REAL-TIME DETECTION
                    </span>
                    <span className="text-slate-600">/</span>
                    <span className="flex items-center gap-1 text-indigo-400 font-semibold">
                      <Shield className="h-3 w-3" />
                      POLICY ENFORCED
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                    Your prompt should reach the AI.{' '}
                    <span className="text-cyan-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                      Your private data shouldn't.
                    </span>
                  </h1>
                  <p className="max-w-3xl text-xs sm:text-sm text-slate-400 leading-relaxed">
                    PrivacyShield AI detects sensitive data before it reaches an LLM, evaluates privacy risk, enforces protection policies, and produces a safe version of your input.
                  </p>
                </div>

                {/* Top Grid: 3D Firewall Visualizer & Pipeline */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  <div className="lg:col-span-6 flex flex-col">
                    <Firewall3D
                      riskLevel={scanResult?.riskLevel || 'SAFE'}
                      riskScore={scanResult?.riskScore || 0}
                      entityCount={scanResult?.entities.length || 0}
                      latencyMs={scanResult?.latencyMs || 14}
                      isScanning={isScanning}
                      charCount={promptInput.length}
                    />
                  </div>

                  <div className="lg:col-span-6 flex flex-col justify-between gap-4">
                    <DefensePipeline
                      isScanning={isScanning}
                      hasScanned={!!scanResult}
                      riskLevel={scanResult?.riskLevel || 'SAFE'}
                      entityCount={scanResult?.entities.length || 0}
                    />

                    {/* Pre-loaded Demo Test Cases with interactive click */}
                    <div className="interactive-card rounded-xl border border-slate-800 bg-[#0d131f]/80 p-4">
                      <div className="flex items-center justify-between text-xs font-mono mb-2.5">
                        <span className="text-slate-300 font-semibold">PRE-LOADED DEMO TEST CASES</span>
                        <span className="text-cyan-400 font-bold">Tap to trigger & test</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => loadDemo('pii')}
                          className="rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-200 transition-all duration-200 hover:border-cyan-500/60 hover:text-cyan-300 hover:scale-[1.03] active:scale-[0.97]"
                        >
                          👤 Customer Support (PII)
                        </button>
                        <button
                          onClick={() => loadDemo('secrets')}
                          className="rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-200 transition-all duration-200 hover:border-cyan-500/60 hover:text-cyan-300 hover:scale-[1.03] active:scale-[0.97]"
                        >
                          🔑 Dev Secrets (AWS/JWT)
                        </button>
                        <button
                          onClick={() => loadDemo('finance')}
                          className="rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-200 transition-all duration-200 hover:border-cyan-500/60 hover:text-cyan-300 hover:scale-[1.03] active:scale-[0.97]"
                        >
                          💳 Financial (Credit Card)
                        </button>
                        <button
                          onClick={() => loadDemo('aadhaar')}
                          className="rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-200 transition-all duration-200 hover:border-cyan-500/60 hover:text-cyan-300 hover:scale-[1.03] active:scale-[0.97]"
                        >
                          🇮🇳 Govt ID & Aadhaar
                        </button>
                        <button
                          onClick={() => loadDemo('safe')}
                          className="rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-200 transition-all duration-200 hover:border-emerald-500/60 hover:text-emerald-300 hover:scale-[1.03] active:scale-[0.97]"
                        >
                          ✓ Safe Python Query
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Prompt Input Box */}
                <div className="interactive-card rounded-2xl border border-slate-800 bg-[#0d131f]/95 p-5 shadow-2xl backdrop-blur-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                        <FileText className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Untrusted Prompt Input</h3>
                        <p className="text-[11px] text-slate-400">Enter text that you would normally send to an LLM</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400">TARGET:</span>
                      <select
                        value={targetLlm}
                        onChange={e => {
                          playClickSound();
                          setTargetLlm(e.target.value);
                        }}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 font-mono text-xs font-semibold text-cyan-300 focus:border-cyan-500 focus:outline-none transition-colors"
                      >
                        <option value="OpenAI GPT-4o">OpenAI GPT-4o (Strict DMZ)</option>
                        <option value="Anthropic Claude 3.5">Anthropic Claude 3.5</option>
                        <option value="Google Gemini 1.5 Pro">Google Gemini 1.5 Pro</option>
                        <option value="On-Prem Llama 3">On-Prem Llama 3 (VPC-04)</option>
                      </select>
                    </div>
                  </div>

                  <div className="relative mt-3">
                    <textarea
                      value={promptInput}
                      onChange={e => setPromptInput(e.target.value)}
                      placeholder="Example: Send an email to Rahul at rahul@example.com. His phone number is 9876543210 and his card number is 4111 1111 1111 1111."
                      rows={4}
                      className="w-full rounded-xl border border-slate-800 bg-[#090d16] p-3.5 font-mono text-xs leading-relaxed text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors duration-200"
                    />

                    <div className="absolute right-3 bottom-3 flex items-center gap-2 text-[11px] font-mono text-slate-500">
                      <button
                        onClick={() => {
                          playClickSound();
                          setPromptInput('');
                        }}
                        className="hover:text-rose-400 transition-colors uppercase font-bold"
                      >
                        Clear
                      </button>
                      <span>•</span>
                      <span>{promptInput.length} chars</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Your input is processed locally in this prototype and is not sent to an external AI API.</span>
                    </div>

                    <button
                      onClick={handleScan}
                      disabled={isScanning || !promptInput.trim()}
                      className="relative overflow-hidden w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 px-6 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg shadow-cyan-950/60 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      <span className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent"></span>
                      <Shield className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
                      <span>{isScanning ? 'Analyzing Prompt...' : '🛡 Analyze & Sanitize Prompt'}</span>
                    </button>
                  </div>
                </div>

                {/* Results Grid: Risk Assessment + Intercepted Entities */}
                {scanResult && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <div className="lg:col-span-5">
                      <RiskAssessmentCard
                        score={scanResult.riskScore}
                        level={scanResult.riskLevel}
                        entityCount={scanResult.entities.length}
                        isBlocked={scanResult.isBlocked}
                        categoryRisks={scanResult.categoryRisks}
                      />
                    </div>

                    <div className="lg:col-span-7">
                      <InterceptedEntitiesList
                        entities={scanResult.entities}
                        onEntityActionChange={handleSingleEntityActionChange}
                        onEntityWhitelist={handleSingleEntityWhitelist}
                      />
                    </div>
                  </div>
                )}

                {/* Prompt Transformation Diff */}
                {scanResult && (
                  <PromptTransformationDiff
                    rawPrompt={scanResult.rawPrompt}
                    sanitizedPrompt={scanResult.sanitizedPrompt}
                    entities={scanResult.entities}
                    isBlocked={scanResult.isBlocked}
                    blockReason={scanResult.blockReason}
                    traceId={scanResult.traceId}
                    riskScore={scanResult.riskScore}
                    riskLevel={scanResult.riskLevel}
                    targetLlm={targetLlm}
                    onSendGateway={handleSendToGateway}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* VIEW 2: POLICIES */}
        {activeTab === 'policies' && (
          <PoliciesView
            policies={policies}
            onUpdatePolicyAction={handleUpdatePolicyAction}
            onToggleRule={handleToggleRule}
            sandboxMode={sandboxMode}
            onToggleSandbox={() => {
              playClickSound();
              setSandboxMode(!sandboxMode);
            }}
          />
        )}

        {/* VIEW 3: SECURITY EVENT STREAM */}
        {activeTab === 'activity' && <ActivityView />}

        {/* VIEW 4: ANALYTICS */}
        {activeTab === 'analytics' && <AnalyticsView />}

        {/* VIEW 5: CONFIG */}
        {activeTab === 'config' && <ConfigView />}
      </main>

      {/* Simulated Gateway Toast */}
      {gatewaySentToast && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/90 p-4 shadow-2xl backdrop-blur-md text-emerald-200 font-mono text-xs animate-bounce">
          <Check className="h-5 w-5 text-emerald-400" />
          <div>
            <div className="font-bold text-white">Safe Gateway Payload Dispatched</div>
            <div className="text-[11px] text-emerald-300">Sanitized tokens forwarded to {targetLlm}. Zero PII leaked.</div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar matching screenshot */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-[#090d16]/95 backdrop-blur-lg px-2 py-2">
        <div className="grid grid-cols-5 gap-1">
          {[
            { id: 'scan', label: 'Scan', icon: Shield },
            { id: 'policies', label: 'Policies', icon: Lock },
            { id: 'activity', label: 'Activity', icon: Radio },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'config', label: 'Config', icon: SlidersHorizontal },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  playClickSound();
                  setActiveTab(tab.id as any);
                }}
                className={`flex flex-col items-center justify-center py-1.5 rounded-lg transition-all ${
                  isActive ? 'text-cyan-400 font-bold bg-cyan-950/40 scale-105' : 'text-slate-400'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[10px] mt-1">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
