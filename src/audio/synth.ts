// Sound effects and music for Realm of Code, synthesised from code.
// Pure functions that return mono Float32Array samples, so the same code plays in
// the browser (WebAudio) and is exported to .wav by scripts/export-assets.ts.

export const RATE = 44100;

type Wave = 'sine' | 'square' | 'saw' | 'triangle' | 'noise';

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
}

function osc(wave: Wave, phase: number, noise: () => number) {
  const p = phase - Math.floor(phase);
  switch (wave) {
    case 'sine': return Math.sin(2 * Math.PI * p);
    case 'square': return p < 0.5 ? 0.6 : -0.6;
    case 'saw': return 2 * p - 1;
    case 'triangle': return 1 - 4 * Math.abs(p - 0.5);
    case 'noise': return noise();
  }
}

interface Tone {
  wave: Wave;
  freq: number;          // start frequency (Hz)
  freqEnd?: number;      // slide to
  start?: number;        // seconds
  dur: number;           // seconds
  vol?: number;
  attack?: number;
  release?: number;
  vibrato?: number;      // Hz
  lowpass?: number;      // 0..1 smoothing for noise
}

function render(tones: Tone[], total?: number): Float32Array {
  const len = Math.ceil((total ?? Math.max(...tones.map((t) => (t.start ?? 0) + t.dur)) + 0.05) * RATE);
  const out = new Float32Array(len);
  tones.forEach((t, ti) => {
    const noise = rng(ti * 97 + 13);
    const s0 = Math.floor((t.start ?? 0) * RATE);
    const n = Math.floor(t.dur * RATE);
    const a = (t.attack ?? 0.005) * RATE;
    const r = (t.release ?? t.dur * 0.6) * RATE;
    let phase = 0;
    let lp = 0;
    for (let i = 0; i < n && s0 + i < len; i++) {
      const k = i / n;
      let f = t.freqEnd ? t.freq * Math.pow(t.freqEnd / t.freq, k) : t.freq;
      if (t.vibrato) f *= 1 + 0.012 * Math.sin(2 * Math.PI * t.vibrato * (i / RATE));
      phase += f / RATE;
      let v = osc(t.wave, phase, noise);
      if (t.lowpass) { lp += (v - lp) * t.lowpass; v = lp; }
      const env = Math.min(1, i / a) * (i > n - r ? Math.max(0, (n - i) / r) : 1);
      out[s0 + i] += v * env * (t.vol ?? 0.3);
    }
  });
  return out;
}

const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12); // MIDI -> Hz

export const SFX = {
  click: () => render([{ wave: 'square', freq: 880, freqEnd: 660, dur: 0.05, vol: 0.12 }]),
  hover: () => render([{ wave: 'triangle', freq: 1200, dur: 0.03, vol: 0.06 }]),
  cast: () => render([
    { wave: 'triangle', freq: 440, freqEnd: 1320, dur: 0.25, vol: 0.2 },
    { wave: 'sine', freq: 1760, start: 0.12, dur: 0.2, vol: 0.08, vibrato: 12 },
    { wave: 'noise', freq: 1, dur: 0.3, vol: 0.05, lowpass: 0.3 },
  ]),
  step: () => render([{ wave: 'noise', freq: 1, dur: 0.06, vol: 0.2, lowpass: 0.08, release: 0.05 }]),
  bump: () => render([
    { wave: 'square', freq: 110, freqEnd: 70, dur: 0.12, vol: 0.18 },
    { wave: 'noise', freq: 1, dur: 0.08, vol: 0.15, lowpass: 0.1 },
  ]),
  gem: () => render([
    { wave: 'square', freq: NOTE(83), dur: 0.08, vol: 0.12 },
    { wave: 'square', freq: NOTE(88), start: 0.07, dur: 0.25, vol: 0.12 },
    { wave: 'sine', freq: NOTE(100), start: 0.07, dur: 0.25, vol: 0.05 },
  ]),
  coin: () => render([
    { wave: 'square', freq: NOTE(88), dur: 0.06, vol: 0.1 },
    { wave: 'square', freq: NOTE(95), start: 0.06, dur: 0.2, vol: 0.1 },
  ]),
  key: () => render([
    { wave: 'triangle', freq: NOTE(79), dur: 0.1, vol: 0.2 },
    { wave: 'triangle', freq: NOTE(84), start: 0.08, dur: 0.1, vol: 0.2 },
    { wave: 'triangle', freq: NOTE(91), start: 0.16, dur: 0.25, vol: 0.2 },
  ]),
  door: () => render([
    { wave: 'saw', freq: 90, freqEnd: 140, dur: 0.5, vol: 0.12, lowpass: 0.05 },
    { wave: 'noise', freq: 1, start: 0.45, dur: 0.15, vol: 0.25, lowpass: 0.08 },
  ]),
  swing: () => render([{ wave: 'noise', freq: 1, dur: 0.18, vol: 0.25, lowpass: 0.35, attack: 0.05 }]),
  hit: () => render([
    { wave: 'noise', freq: 1, dur: 0.15, vol: 0.35, lowpass: 0.5 },
    { wave: 'square', freq: 220, freqEnd: 60, dur: 0.2, vol: 0.2 },
  ]),
  splash: () => render([
    { wave: 'noise', freq: 1, dur: 0.6, vol: 0.35, lowpass: 0.2, attack: 0.01 },
    { wave: 'sine', freq: 600, freqEnd: 200, dur: 0.25, vol: 0.1 },
  ]),
  say: () => render([
    { wave: 'square', freq: 520, dur: 0.04, vol: 0.06 },
    { wave: 'square', freq: 620, start: 0.05, dur: 0.04, vol: 0.06 },
  ]),
  error: () => render([
    { wave: 'saw', freq: 160, dur: 0.15, vol: 0.12, lowpass: 0.2 },
    { wave: 'saw', freq: 120, start: 0.16, dur: 0.25, vol: 0.12, lowpass: 0.2 },
  ]),
  fail: () => render([
    { wave: 'triangle', freq: NOTE(67), dur: 0.2, vol: 0.22 },
    { wave: 'triangle', freq: NOTE(63), start: 0.2, dur: 0.2, vol: 0.22 },
    { wave: 'triangle', freq: NOTE(60), start: 0.4, dur: 0.5, vol: 0.22, vibrato: 5 },
  ]),
  victory: () => render([
    // a little brass fanfare: C E G C'
    { wave: 'saw', freq: NOTE(60), dur: 0.14, vol: 0.12, lowpass: 0.25 },
    { wave: 'saw', freq: NOTE(64), start: 0.14, dur: 0.14, vol: 0.12, lowpass: 0.25 },
    { wave: 'saw', freq: NOTE(67), start: 0.28, dur: 0.14, vol: 0.12, lowpass: 0.25 },
    { wave: 'saw', freq: NOTE(72), start: 0.42, dur: 0.7, vol: 0.14, lowpass: 0.25, vibrato: 6 },
    { wave: 'square', freq: NOTE(48), start: 0.42, dur: 0.7, vol: 0.06 },
    { wave: 'triangle', freq: NOTE(76), start: 0.42, dur: 0.7, vol: 0.1, vibrato: 6 },
  ]),
  levelup: () => render([
    ...[60, 64, 67, 72, 76, 79, 84].map((n, i) => ({ wave: 'square' as Wave, freq: NOTE(n), start: i * 0.07, dur: 0.12, vol: 0.09 })),
    { wave: 'triangle', freq: NOTE(84), start: 0.5, dur: 0.8, vol: 0.18, vibrato: 7 },
    { wave: 'sine', freq: NOTE(96), start: 0.5, dur: 0.8, vol: 0.06 },
  ]),
  achievement: () => render([
    // bell chime
    { wave: 'sine', freq: NOTE(84), dur: 1.0, vol: 0.2, release: 0.95 },
    { wave: 'sine', freq: NOTE(84) * 2.76, dur: 0.6, vol: 0.05, release: 0.55 },
    { wave: 'sine', freq: NOTE(91), start: 0.15, dur: 1.0, vol: 0.16, release: 0.95 },
    { wave: 'sine', freq: NOTE(91) * 2.76, start: 0.15, dur: 0.5, vol: 0.04, release: 0.45 },
  ]),
  page: () => render([{ wave: 'noise', freq: 1, dur: 0.22, vol: 0.12, lowpass: 0.6, attack: 0.08 }]),
  unlock: () => render([
    { wave: 'triangle', freq: NOTE(72), dur: 0.12, vol: 0.2 },
    { wave: 'triangle', freq: NOTE(79), start: 0.1, dur: 0.3, vol: 0.2 },
    { wave: 'noise', freq: 1, dur: 0.05, vol: 0.2, lowpass: 0.4 },
  ]),
  arrow: () => render([
    { wave: 'noise', freq: 1, dur: 0.15, vol: 0.18, lowpass: 0.6 },
    { wave: 'sine', freq: 900, freqEnd: 300, dur: 0.15, vol: 0.08 },
  ]),
  thunk: () => render([
    { wave: 'square', freq: 180, freqEnd: 90, dur: 0.08, vol: 0.2 },
    { wave: 'noise', freq: 1, dur: 0.06, vol: 0.2, lowpass: 0.2 },
  ]),
  tick: () => render([{ wave: 'square', freq: 1500, dur: 0.02, vol: 0.05 }]),
  correct: () => render([
    { wave: 'triangle', freq: NOTE(76), dur: 0.09, vol: 0.25 },
    { wave: 'triangle', freq: NOTE(84), start: 0.08, dur: 0.28, vol: 0.25 },
    { wave: 'sine', freq: NOTE(96), start: 0.08, dur: 0.28, vol: 0.07 },
  ]),
  wrong: () => render([
    { wave: 'square', freq: NOTE(52), dur: 0.14, vol: 0.1 },
    { wave: 'square', freq: NOTE(47), start: 0.13, dur: 0.26, vol: 0.1 },
  ]),
  // lightbulb: a rising sparkle
  hint: () => render([
    { wave: 'sine', freq: NOTE(79), dur: 0.12, vol: 0.15 },
    { wave: 'sine', freq: NOTE(86), start: 0.07, dur: 0.12, vol: 0.15 },
    { wave: 'sine', freq: NOTE(91), start: 0.14, dur: 0.3, vol: 0.15, vibrato: 7 },
    { wave: 'triangle', freq: NOTE(98), start: 0.2, dur: 0.25, vol: 0.05 },
  ]),
  // torch: a soft whoosh of fire
  whoosh: () => render([
    { wave: 'noise', freq: 1, dur: 0.45, vol: 0.22, lowpass: 0.12, attack: 0.15 },
    { wave: 'sine', freq: 140, freqEnd: 260, dur: 0.4, vol: 0.08 },
  ]),
  // card flip
  flip: () => render([
    { wave: 'noise', freq: 1, dur: 0.07, vol: 0.18, lowpass: 0.5 },
    { wave: 'triangle', freq: 600, freqEnd: 900, dur: 0.06, vol: 0.06 },
  ]),
  // potion: glug glug
  drink: () => render([
    { wave: 'sine', freq: 300, freqEnd: 520, dur: 0.1, vol: 0.2 },
    { wave: 'sine', freq: 280, freqEnd: 560, start: 0.14, dur: 0.1, vol: 0.2 },
    { wave: 'sine', freq: NOTE(84), start: 0.3, dur: 0.35, vol: 0.1, vibrato: 5 },
  ]),
};

export type SfxName = keyof typeof SFX;

// ---------- Music: a calm lute tune (Karplus-Strong plucked strings) over a drone ----------
function pluck(out: Float32Array, start: number, freq: number, dur: number, vol: number, seed: number) {
  const period = Math.max(2, Math.round(RATE / freq));
  const buf = new Float32Array(period);
  const noise = rng(seed);
  for (let i = 0; i < period; i++) buf[i] = noise();
  const s0 = Math.floor(start * RATE);
  const n = Math.floor(dur * RATE);
  let idx = 0;
  for (let i = 0; i < n && s0 + i < out.length; i++) {
    const next = (idx + 1) % period;
    const v = buf[idx];
    buf[idx] = 0.996 * 0.5 * (buf[idx] + buf[next]);
    idx = next;
    out[s0 + i] += v * vol * (i > n - 2000 ? (n - i) / 2000 : 1);
  }
}

/** A 16-bar tune in D dorian. `seed` changes the melody. */
export function music(seed = 3): Float32Array {
  const bpm = 84;
  const beat = 60 / bpm;
  const bars = 16;
  const total = bars * 4 * beat;
  const out = new Float32Array(Math.ceil(total * RATE));
  const scale = [62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79];
  const chords = [[50, 57, 62], [48, 55, 60], [50, 57, 62], [45, 52, 57], [46, 53, 58], [48, 55, 60], [45, 52, 57], [50, 57, 62]];
  const r = rng(seed);
  let deg = 4;
  for (let bar = 0; bar < bars; bar++) {
    const chord = chords[bar % chords.length];
    const t0 = bar * 4 * beat;
    // bass + chord arpeggio
    pluck(out, t0, NOTE(chord[0] - 12), beat * 2, 0.22, bar * 11 + 1);
    [0, 1, 2, 1].forEach((ci, i) => pluck(out, t0 + (i + 0.5) * beat, NOTE(chord[ci]), beat * 1.5, 0.1, bar * 31 + i));
    pluck(out, t0 + 2 * beat, NOTE(chord[0] - 12), beat * 2, 0.16, bar * 13 + 5);
    // melody: a gentle random walk on the scale, resting on chord tones
    const rhythm = bar % 4 === 3 ? [2, 2] : r() > 0.5 ? [1, 1, 1, 1] : [1.5, 0.5, 1, 1];
    let t = t0;
    rhythm.forEach((len, i) => {
      deg = Math.max(0, Math.min(scale.length - 1, deg + Math.round(r() * 2.4 - 1.2)));
      if (i === rhythm.length - 1 && bar % 4 === 3) deg = 4;
      pluck(out, t, NOTE(scale[deg]), len * beat + 0.3, 0.16, bar * 53 + i * 7);
      t += len * beat;
    });
  }
  // soft drone (open fifth)
  for (let i = 0; i < out.length; i++) {
    const tt = i / RATE;
    const swell = 0.5 + 0.5 * Math.sin((2 * Math.PI * tt) / (beat * 8));
    out[i] += 0.025 * swell * (Math.sin(2 * Math.PI * NOTE(38) * tt) + 0.6 * Math.sin(2 * Math.PI * NOTE(45) * tt));
  }
  // simple echo for a "great hall" feel
  const d = Math.floor(beat * 0.75 * RATE);
  for (let i = d; i < out.length; i++) out[i] += out[i - d] * 0.25;
  let peak = 0;
  for (let i = 0; i < out.length; i++) peak = Math.max(peak, Math.abs(out[i]));
  if (peak > 0.9) for (let i = 0; i < out.length; i++) out[i] *= 0.9 / peak;
  return out;
}
