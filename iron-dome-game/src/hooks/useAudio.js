// ============================================================
// AUDIO ENGINE — Web Audio API (no external files needed)
// ============================================================
import { useRef, useCallback } from 'react';

export function useAudio() {
  const ctxRef = useRef(null);

  function getCtx() {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume if suspended (browser autoplay policy)
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }

  // צבע אדום — Red Alert siren
  const playRedAlert = useCallback(() => {
    try {
      const ctx = getCtx();
      const freqs = [440, 880, 660, 330, 550, 880];
      let time = ctx.currentTime;
      for (const freq of freqs) {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.3, time + 0.1);
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.linearRampToValueAtTime(0, time + 0.2);
        osc.start(time);
        osc.stop(time + 0.2);
        time += 0.12;
      }
    } catch { /* silently fail */ }
  }, []);

  // יירוט מוצלח — intercept boom
  const playIntercept = useCallback(() => {
    try {
      const ctx = getCtx();
      const t   = ctx.currentTime;

      // Thump
      const osc1  = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(200, t);
      osc1.frequency.exponentialRampToValueAtTime(40, t + 0.3);
      gain1.gain.setValueAtTime(0.5, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.3);

      // Crackle (noise burst)
      const bufSize = ctx.sampleRate * 0.15;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
      const src   = ctx.createBufferSource();
      const gain2 = ctx.createGain();
      src.buffer  = buf;
      gain2.gain.setValueAtTime(0.6, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      src.connect(gain2);
      gain2.connect(ctx.destination);
      src.start(t);
    } catch { /* silently fail */ }
  }, []);

  // פגיעה בעיר — city hit (deep boom)
  const playCityHit = useCallback(() => {
    try {
      const ctx = getCtx();
      const t   = ctx.currentTime;
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, t);
      osc.frequency.exponentialRampToValueAtTime(20, t + 0.8);
      gain.gain.setValueAtTime(0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.8);
    } catch { /* silently fail */ }
  }, []);

  // שיגור מיירט — launch click
  const playLaunch = useCallback(() => {
    try {
      const ctx = getCtx();
      const t   = ctx.currentTime;
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(1200, t + 0.05);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    } catch { /* silently fail */ }
  }, []);

  // COMBO sound
  const playCombo = useCallback((combo) => {
    try {
      const ctx = getCtx();
      const t   = ctx.currentTime;
      const baseFreq = 440 + combo * 60;
      for (let i = 0; i < 3; i++) {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(baseFreq * (1 + i * 0.3), t + i * 0.08);
        gain.gain.setValueAtTime(0.25, t + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + i * 0.08);
        osc.stop(t + i * 0.08 + 0.15);
      }
    } catch { /* silently fail */ }
  }, []);

  return { playRedAlert, playIntercept, playCityHit, playLaunch, playCombo };
}
