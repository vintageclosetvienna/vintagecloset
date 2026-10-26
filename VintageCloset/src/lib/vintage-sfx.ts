// Vintage launch jingle, synthesised in the browser (Web Audio): no audio file to download or license.
// Vinyl crackle bed, needle drop, a record scratch on the logo slap, a funky bass line and two wah horn stabs,
// faded in and out on one master. Browsers only allow sound after a tap/click/key, so the caller starts it
// from a user gesture (or tries on load and accepts that it may stay silent).

type Ctx = AudioContext;

const BPM = 112;
const S16 = 60 / BPM / 4; // one 16th note in seconds

function noiseBuffer(ctx: Ctx, seconds: number): AudioBuffer {
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

// Vinyl bed: soft hiss plus random pops
function crackle(ctx: Ctx, out: AudioNode, t: number, dur: number) {
  const hiss = ctx.createBufferSource();
  hiss.buffer = noiseBuffer(ctx, dur);
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 3200;
  band.Q.value = 0.6;
  const g = ctx.createGain();
  g.gain.value = 0.035;
  hiss.connect(band).connect(g).connect(out);
  hiss.start(t);

  const pops = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
  const d = pops.getChannelData(0);
  for (let i = 0; i < 38; i++) {
    const at = Math.floor(Math.random() * (d.length - 200));
    const amp = 0.25 + Math.random() * 0.6;
    for (let k = 0; k < 120; k++) d[at + k] += (Math.random() * 2 - 1) * amp * Math.exp(-k / 18);
  }
  const p = ctx.createBufferSource();
  p.buffer = pops;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 1500;
  const pg = ctx.createGain();
  pg.gain.value = 0.22;
  p.connect(hp).connect(pg).connect(out);
  p.start(t);
}

// Needle drop: a short low thump
function needle(ctx: Ctx, out: AudioNode, t: number) {
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(110, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.5, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.2);
}

// Record scratch: band-passed noise swept up and down ("wikka-wikka")
function scratch(ctx: Ctx, out: AudioNode, t: number) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 0.5);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 7;
  const f = bp.frequency;
  f.setValueAtTime(500, t);
  f.exponentialRampToValueAtTime(2600, t + 0.07);
  f.exponentialRampToValueAtTime(700, t + 0.14);
  f.exponentialRampToValueAtTime(3200, t + 0.2);
  f.exponentialRampToValueAtTime(400, t + 0.32);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.55, t + 0.02);
  g.gain.setValueAtTime(0.55, t + 0.13);
  g.gain.exponentialRampToValueAtTime(0.08, t + 0.15);
  g.gain.exponentialRampToValueAtTime(0.5, t + 0.18);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
  src.connect(bp).connect(g).connect(out);
  src.start(t);
  src.stop(t + 0.36);
}

// Funky bass: sawtooth through a plucky low-pass, slides into the last note
function bass(ctx: Ctx, out: AudioNode, t: number) {
  // E2 . E2 G2 | A2 . Bb2>A2 . E3 (16th steps)
  const notes: [number, number, number, number?][] = [
    // [step, length in 16ths, frequency, slideTo]
    [0, 1, 82.41], [2, 1, 82.41], [3, 1, 98.0], [4, 2, 110.0], [6, 1, 116.54, 110.0], [8, 1, 164.81],
  ];
  for (const [step, len, freq, slide] of notes) {
    const s = t + step * S16;
    const e = s + len * S16 * 0.92;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(freq, s);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, e);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 9;
    lp.frequency.setValueAtTime(1600, s);
    lp.frequency.exponentialRampToValueAtTime(220, s + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(0.42, s + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, e);
    o.connect(lp).connect(g).connect(out);
    o.start(s);
    o.stop(e + 0.02);
  }
}

// Horn stab: detuned squares in a 9th chord through a wah (band-pass swept up)
function stab(ctx: Ctx, out: AudioNode, t: number, root: number, len = 0.32) {
  const ratios = [1, 1.26, 1.78, 2.24]; // root, major 3rd, minor 7th, 9th
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 3.5;
  bp.frequency.setValueAtTime(450, t);
  bp.frequency.exponentialRampToValueAtTime(2400, t + len * 0.55);
  bp.frequency.exponentialRampToValueAtTime(900, t + len);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.2, t + 0.012);
  g.gain.setValueAtTime(0.2, t + len * 0.5);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  bp.connect(g).connect(out);
  for (const r of ratios) {
    for (const detune of [-9, 9]) {
      const o = ctx.createOscillator();
      o.type = 'square';
      o.frequency.value = root * r;
      o.detune.value = detune;
      o.connect(bp);
      o.start(t);
      o.stop(t + len + 0.02);
    }
  }
}

let current: { ctx: Ctx; master: GainNode } | null = null;

/**
 * Plays the launch jingle (about 2.8 s). `startAt` offsets it so it can join an intro that is already running.
 * Returns false when the browser has not allowed sound yet (no tap/click so far).
 */
export async function playVintageJingle(startAt = 0): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return false;
  if (current) return true;

  const ctx = new AC();
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      /* not allowed yet */
    }
  }
  if (ctx.state !== 'running') {
    void ctx.close();
    return false;
  }

  const master = ctx.createGain();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.ratio.value = 4;
  master.connect(comp).connect(ctx.destination);
  current = { ctx, master };

  const t0 = ctx.currentTime + 0.03 - startAt;
  const end = t0 + 2.9;
  const now = ctx.currentTime;
  // Fade in, hold, fade out
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.5, Math.max(now + 0.25, t0 + 0.25));
  master.gain.setValueAtTime(0.5, end - 0.8);
  master.gain.exponentialRampToValueAtTime(0.0001, end);

  const at = (s: number) => Math.max(now, t0 + s);
  crackle(ctx, master, now, Math.max(0.5, end - now));
  if (t0 + 0.05 >= now) needle(ctx, master, at(0.05));
  if (t0 + 0.72 >= now) scratch(ctx, master, at(0.72));
  if (t0 + 1.0 >= now) bass(ctx, master, at(1.0));
  if (t0 + 1.27 >= now) stab(ctx, master, at(1.27), 164.81);
  if (t0 + 1.8 >= now) stab(ctx, master, at(1.8), 196.0, 0.5);

  window.setTimeout(() => {
    void ctx.close();
    current = null;
  }, Math.max(0, (end - now) * 1000 + 200));
  return true;
}

/** Fades the jingle out early (e.g. the visitor skipped the intro). */
export function fadeOutVintageJingle(seconds = 0.4) {
  if (!current) return;
  const { ctx, master } = current;
  const t = ctx.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), t);
  master.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
}
