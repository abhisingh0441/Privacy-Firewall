import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Terminal, 
  Copy, 
  Check, 
  Lock, 
  Cpu, 
  Sliders, 
  AlertTriangle, 
  FileCode2 
} from 'lucide-react';

export const ConfigView: React.FC = () => {
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [luhnStrict, setLuhnStrict] = useState(true);
  const [aadhaarRegexMode, setAadhaarRegexMode] = useState(true);
  const [syntheticSalt, setSyntheticSalt] = useState('salt_sec_09fa81bc3');

  const copyRunCmd = () => {
    navigator.clipboard.writeText('streamlit run app.py');
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Local Processing Guarantee */}
      <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/20 via-slate-900/60 to-slate-900/40 p-5">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Local Execution Guarantee</h3>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                100% IN-MEMORY
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              Your input is processed strictly locally inside this prototype. Zero bytes are transmitted to any external AI provider, cloud database, or remote telemetry server.
            </p>
          </div>
        </div>
      </div>

      {/* Standalone Python Streamlit Application Card */}
      <div className="rounded-2xl border border-slate-800 bg-[#0d131f]/90 p-5">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <FileCode2 className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Python + Streamlit Standalone Engine</h3>
          </div>
          <span className="font-mono text-xs text-emerald-400 font-semibold">
            app.py READY
          </span>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-slate-400">
          The complete privacy firewall is also generated as a single-file Python script in <code className="text-cyan-300 font-mono">app.py</code> with zero cloud dependencies or paid APIs. Run it locally via:
        </p>

        <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs">
          <div className="flex items-center gap-2 text-cyan-300">
            <span className="text-slate-500">$</span>
            <span>streamlit run app.py</span>
          </div>
          <button
            onClick={copyRunCmd}
            className="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white"
          >
            {copiedCmd ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Engine Detection Parameters */}
      <div className="rounded-2xl border border-slate-800 bg-[#0d131f]/90 p-5">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <Sliders className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Detection Engine Parameters</h3>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-200">Strict Luhn Mod-10 Check for Cards</div>
              <div className="text-[11px] text-slate-400">Eliminates false positives on random 16-digit strings</div>
            </div>
            <button
              onClick={() => setLuhnStrict(!luhnStrict)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                luhnStrict ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 transition-transform ${
                  luhnStrict ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800/60">
            <div>
              <div className="font-semibold text-slate-200">Aadhaar 12-Digit Spaced Format</div>
              <div className="text-[11px] text-slate-400">Flags potential 12-digit Indian national identity numbers</div>
            </div>
            <button
              onClick={() => setAadhaarRegexMode(!aadhaarRegexMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                aadhaarRegexMode ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 transition-transform ${
                  aadhaarRegexMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="pt-3 border-t border-slate-800/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-200">Pseudonym Token Salt</span>
              <span className="font-mono text-cyan-400 text-[11px]">{syntheticSalt}</span>
            </div>
            <input
              type="text"
              value={syntheticSalt}
              onChange={e => setSyntheticSalt(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Prototype Disclaimer */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-200/90">
        <div className="flex items-center gap-2 font-bold text-amber-300">
          <AlertTriangle className="h-4 w-4" />
          <span>Prototype Disclaimer</span>
        </div>
        <p className="mt-1 leading-relaxed text-amber-300/80">
          This is a rule-based cybersecurity prototype for demonstration purposes. Regex-based pattern matching and Luhn validation cannot guarantee detection of every novel permutation of sensitive information and may produce false positives or false negatives.
        </p>
      </div>
    </div>
  );
};
