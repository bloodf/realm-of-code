// Plays the synthesised sounds with WebAudio. Buffers are built on first use.
import { SFX, music, RATE, type SfxName } from './synth';

let ctx: AudioContext | null = null;
let sfxGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let musicSrc: AudioBufferSourceNode | null = null;
const buffers = new Map<string, AudioBuffer>();
const settings = { sfx: true, music: true, sfxVolume: 0.8, musicVolume: 0.35 };

const BOOST: Partial<Record<SfxName, number>> = { step: 2.2, coin: 1.8, click: 1.5, say: 1.6, tick: 1.5 };

function audio() {
  if (!ctx) {
    ctx = new AudioContext();
    sfxGain = ctx.createGain();
    musicGain = ctx.createGain();
    sfxGain.connect(ctx.destination);
    musicGain.connect(ctx.destination);
    applyVolumes();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function toBuffer(key: string, make: () => Float32Array) {
  let b = buffers.get(key);
  if (!b) {
    const data = make();
    b = audio().createBuffer(1, data.length, RATE);
    b.getChannelData(0).set(data);
    buffers.set(key, b);
  }
  return b;
}

function applyVolumes() {
  if (sfxGain) sfxGain.gain.value = settings.sfx ? settings.sfxVolume : 0;
  if (musicGain) musicGain.gain.value = settings.music ? settings.musicVolume : 0;
}

export function play(name: SfxName, rate = 1) {
  if (!settings.sfx) return;
  try {
    const c = audio();
    const src = c.createBufferSource();
    src.buffer = toBuffer(name, SFX[name]);
    src.playbackRate.value = rate;
    const g = c.createGain();
    g.gain.value = BOOST[name] ?? 1;
    src.connect(g).connect(sfxGain!);
    src.start();
  } catch { /* audio not available */ }
}

export function startMusic() {
  if (!settings.music || musicSrc) return;
  try {
    const c = audio();
    const src = c.createBufferSource();
    src.buffer = toBuffer('music', () => music(3));
    src.loop = true;
    src.connect(musicGain!);
    src.start();
    musicSrc = src;
  } catch { /* ignore */ }
}

export function stopMusic() {
  musicSrc?.stop();
  musicSrc = null;
}

export function configureSound(s: Partial<typeof settings>) {
  Object.assign(settings, s);
  applyVolumes();
  if (!settings.music) stopMusic();
  else if (ctx) startMusic();
}
