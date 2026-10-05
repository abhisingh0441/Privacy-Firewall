// Procedural Web Audio API sound generator for futuristic cybersecurity interactions

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('privacy_sound_fx', enabled ? '1' : '0');
  }
}

export function isSoundEnabled(): boolean {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('privacy_sound_fx');
    if (stored !== null) return stored === '1';
  }
  return soundEnabled;
}

// Crisp scanner blip
export function playScanSound() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(380, now);
  osc.frequency.exponentialRampToValueAtTime(1400, now + 0.15);

  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.19);
}

// Success chime
export function playSuccessSound() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 clean ascending chord
  notes.forEach((freq, idx) => {
    const now = ctx.currentTime + idx * 0.06;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  });
}

// HIGH-INTENSITY THREAT & RISK ALARM SOUND (Audible Cybersecurity Breach Siren)
export function playThreatSound(severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'CRITICAL') {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (severity === 'CRITICAL' || severity === 'HIGH') {
    // 2-Pulse High Alert Siren (Tactical Perimeter Alarm)
    [0, 0.16].forEach(delay => {
      const pulseTime = now + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, pulseTime);
      osc.frequency.exponentialRampToValueAtTime(320, pulseTime + 0.12);

      gain.gain.setValueAtTime(0.12, pulseTime);
      gain.gain.exponentialRampToValueAtTime(0.001, pulseTime + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(pulseTime);
      osc.stop(pulseTime + 0.15);
    });

    // Secondary sub-bass alert rumble
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(60, now + 0.35);
    subGain.gain.setValueAtTime(0.08, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.36);
  } else {
    // Medium / Low Warning Beep
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(440, now + 0.08); // A4

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.24);
  }
}

// Gentle tactile click
export function playClickSound() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(900, now);
  osc.frequency.exponentialRampToValueAtTime(450, now + 0.035);

  gain.gain.setValueAtTime(0.03, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.045);
}

// Soft submarine ping for live streaming event ingestion
export function playLiveSonarSound() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1250, now);

  gain.gain.setValueAtTime(0.015, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.13);
}
