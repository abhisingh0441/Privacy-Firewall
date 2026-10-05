/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  FileText, 
  Settings, 
  BarChart3, 
  Radio, 
  SlidersHorizontal, 
  Sparkles, 
  RotateCcw, 
  ChevronRight, 
  User, 
  Bell, 
  Check, 
  Send, 
  Lock, 
  Zap, 
  Cpu, 
  Layers 
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
import { DEFAULT_POLICIES, executeFirewallScan } from './engine/privacyFirewall';
import { PolicyAction, PolicyRule, ScanResult } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'scan' | 'policies' | 'activity' | 'analytics' | 'config'>('scan');
  const [scannerMode, setScannerMode] = useState<'prompt' | 'vault'>('prompt');
  const [targetLlm, setTargetLlm] = useState('OpenAI GPT-4o');
  const [sandboxMode, setSandboxMode] = useState(false);

  // Prompt input state
  const defaultPrompt =
    'Send an email to Rahul Sharma at rahul.sharma@enterprise.com. His phone number is +1 (555) 987-6543, employee SSN is 042-99-1234, and corporate AWS secret is akia_live_99f3810a9c. Target LLM: GPT-4o.';
  
  const [promptInput, setPromptInput] = useState(defaultPrompt);
  const [policies, setPolicies] = useState<PolicyRule[]>(DEFAULT_POLICIES);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [gatewaySentToast, setGatewaySentToast] = useState(false);

  // Initial scan on load
  useEffect(() => {
    const result = executeFirewallScan(defaultPrompt, DEFAULT_POLICIES, targetLlm);
    setScanResult(result);
  }, []);

  const handleScan = () => {
    if (!promptInput.trim()) return;
    setIsScanning(true);
    setTimeout(() => {
      const result = executeFirewallScan(promptInput, policies, targetLlm);
      setScanResult(result);
      setIsScanning(false);
    }, 450);
  };

  const handleUpdatePolicyAction = (ruleId: string, action: PolicyAction) => {
    const updated = policies.map(p => (p.id === ruleId ? { ...p, currentAction: action } : p));
    setPolicies(updated);
    if (promptInput) {
      const result = executeFirewallScan(promptInput, updated, targetLlm);
      setScanResult(result);
    }
  };

  const handleToggleRule = (ruleId: string) => {
    const updated = policies.map(p => (p.id === ruleId ? { ...p, enabled: !p.enabled } : p));
    setPolicies(updated);
    if (promptInput) {
      const result = executeFirewallScan(promptInput, updated, targetLlm);
      setScanResult(result);
    }
  };

  const loadDemo = (type: 'pii' | 'secrets' | 'finance' | 'aadhaar' | 'safe') => {
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
    setTimeout(() => {
      const result = executeFirewallScan(text, policies, targetLlm);
      setScanResult(result);
      setIsScanning(false);
    }, 350);
  };

  const handleSendToGateway = () => {
    setGatewaySentToast(true);
    setTimeout(() => setGatewaySentToast(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#070a10] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Bar matching screenshot */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#090e17]/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Brand lockup */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 shadow-md shadow-cyan-950/60 p-1">
              <Shield className="h-4 w-4 text-white" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-cyan-200 animate-ping opacity-75"></div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold tracking-tight text-white">
                  PrivacyShield AI
                </span>
                <span className="rounded bg-cyan-950/90 border border-cyan-500/40 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                  v2.4-PROD
                </span>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {activeTab === 'scan' && 'Scan Playground'}
                {activeTab === 'policies' && 'Enforcement Policies'}
                {activeTab === 'activity' && 'Security Event Stream'}
                {activeTab === 'analytics' && 'Operational Analytics'}
                {activeTab === 'config' && 'Gateway Configuration'}
              </div>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-900/80 border border-slate-800/80 rounded-xl">
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'scan'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Scan</span>
            </button>
            <button
              onClick={() => setActiveTab('policies')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'policies'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Policies</span>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'activity'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="h-3.5 w-3.5" />
              <span>Activity</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'analytics'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'config'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Config</span>
            </button>
          </nav>

          {/* Right quick actions */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] text-cyan-400 border border-cyan-500/30 rounded-lg px-2.5 py-1 bg-cyan-950/20">
              <Zap className="h-3 w-3" />
              <span>TLS 1.3 LOCAL</span>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-cyan-400 border border-slate-700">
              <User className="h-4 w-4" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-5 pb-24 md:pb-12">
        {/* VIEW 1: SCAN PLAYGROUND */}
        {activeTab === 'scan' && (
          <div className="space-y-6">
            {/* Mode Switcher: Prompt Scanner vs Document Vault */}
            <div className="flex items-center justify-between">
              <div className="inline-flex p-1 rounded-xl bg-slate-900/80 border border-slate-800/90 text-xs font-medium">
                <button
                  onClick={() => setScannerMode('prompt')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                    scannerMode === 'prompt'
                      ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Prompt Scanner</span>
                </button>
                <button
                  onClick={() => setScannerMode('vault')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                    scannerMode === 'vault'
                      ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Document Vault</span>
                  <span className="rounded bg-cyan-500 px-1 py-0.2 text-[9px] text-slate-950 font-extrabold">NEW</span>
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-emerald-400">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>ZERO-EGRESS GUARANTEE</span>
              </div>
            </div>

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
                <span className="text-cyan-400">Your private data shouldn't.</span>
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

                {/* Pre-loaded Demo Test Cases */}
                <div className="rounded-xl border border-slate-800 bg-[#0d131f]/80 p-4">
                  <div className="flex items-center justify-between text-xs font-mono mb-2.5">
                    <span className="text-slate-300 font-semibold">PRE-LOADED DEMO TEST CASES</span>
                    <span className="text-cyan-400 font-bold">Tap to populate</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => loadDemo('pii')}
                      className="rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-200 hover:border-cyan-500/60 hover:text-cyan-300 transition-colors"
                    >
                      👤 Customer Support (PII)
                    </button>
                    <button
                      onClick={() => loadDemo('secrets')}
                      className="rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-200 hover:border-cyan-500/60 hover:text-cyan-300 transition-colors"
                    >
                      🔑 Dev Secrets (AWS/JWT)
                    </button>
                    <button
                      onClick={() => loadDemo('finance')}
                      className="rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-200 hover:border-cyan-500/60 hover:text-cyan-300 transition-colors"
                    >
                      💳 Financial (Credit Card)
                    </button>
                    <button
                      onClick={() => loadDemo('aadhaar')}
                      className="rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-200 hover:border-cyan-500/60 hover:text-cyan-300 transition-colors"
                    >
                      🇮🇳 Govt ID & Aadhaar
                    </button>
                    <button
                      onClick={() => loadDemo('safe')}
                      className="rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-200 hover:border-emerald-500/60 hover:text-emerald-300 transition-colors"
                    >
                      ✓ Safe Python Query
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Prompt Input Box */}
            <div className="rounded-2xl border border-slate-800 bg-[#0d131f]/95 p-5 shadow-2xl backdrop-blur-md">
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
                    onChange={e => setTargetLlm(e.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 font-mono text-xs font-semibold text-cyan-300 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="OpenAI GPT-4o">OpenAI GPT-4o</option>
                    <option value="Anthropic Claude 3.5">Anthropic Claude 3.5</option>
                    <option value="Google Gemini 1.5 Pro">Google Gemini 1.5 Pro</option>
                    <option value="On-Prem Llama 3">On-Prem Llama 3</option>
                  </select>
                </div>
              </div>

              <div className="relative mt-3">
                <textarea
                  value={promptInput}
                  onChange={e => setPromptInput(e.target.value)}
                  placeholder="Example: Send an email to Rahul at rahul@example.com. His phone number is 9876543210 and his card number is 4111 1111 1111 1111."
                  rows={4}
                  className="w-full rounded-xl border border-slate-800 bg-[#090d16] p-3.5 font-mono text-xs leading-relaxed text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />

                <div className="absolute right-3 bottom-3 flex items-center gap-2 text-[11px] font-mono text-slate-500">
                  <button
                    onClick={() => setPromptInput('')}
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
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 px-6 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg shadow-cyan-950/60 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <Shield className="h-4 w-4" />
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
                  <InterceptedEntitiesList entities={scanResult.entities} />
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
          </div>
        )}

        {/* VIEW 2: POLICIES */}
        {activeTab === 'policies' && (
          <PoliciesView
            policies={policies}
            onUpdatePolicyAction={handleUpdatePolicyAction}
            onToggleRule={handleToggleRule}
            sandboxMode={sandboxMode}
            onToggleSandbox={() => setSandboxMode(!sandboxMode)}
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
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/90 p-4 shadow-2xl backdrop-blur-md text-emerald-200 font-mono text-xs">
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
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-lg transition-colors ${
              activeTab === 'scan' ? 'text-cyan-400 font-bold bg-cyan-950/40' : 'text-slate-400'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span className="text-[10px] mt-1">Scan</span>
          </button>

          <button
            onClick={() => setActiveTab('policies')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-lg transition-colors ${
              activeTab === 'policies' ? 'text-cyan-400 font-bold bg-cyan-950/40' : 'text-slate-400'
            }`}
          >
            <Lock className="h-4 w-4" />
            <span className="text-[10px] mt-1">Policies</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-lg transition-colors ${
              activeTab === 'activity' ? 'text-cyan-400 font-bold bg-cyan-950/40' : 'text-slate-400'
            }`}
          >
            <Radio className="h-4 w-4" />
            <span className="text-[10px] mt-1">Activity</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-lg transition-colors ${
              activeTab === 'analytics' ? 'text-cyan-400 font-bold bg-cyan-950/40' : 'text-slate-400'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span className="text-[10px] mt-1">Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-lg transition-colors ${
              activeTab === 'config' ? 'text-cyan-400 font-bold bg-cyan-950/40' : 'text-slate-400'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="text-[10px] mt-1">Config</span>
          </button>
        </div>
      </div>
    </div>
  );
}
