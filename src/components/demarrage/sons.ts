/**
 * Sons de la séquence de démarrage, synthétisés avec la Web Audio API (aucun fichier).
 * Le navigateur n'autorise le son qu'après une interaction : appeler `activer()` dans un clic ou une touche.
 */

let ctx: AudioContext | null = null;
let sortie: GainNode | null = null;
let muet = false;
let derniereTouche = 0;
let ambiance: { stop: (fondu?: number) => void } | null = null;

const CLE_MUET = "borrel-son-coupe";

export function estMuet() {
  try {
    muet = localStorage.getItem(CLE_MUET) === "1";
  } catch {}
  return muet;
}

export function basculerMuet() {
  muet = !muet;
  try {
    localStorage.setItem(CLE_MUET, muet ? "1" : "0");
  } catch {}
  if (sortie && ctx) sortie.gain.setTargetAtTime(muet ? 0 : 0.6, ctx.currentTime, 0.05);
  return muet;
}

/** À appeler dans un geste de l'utilisateur. */
export function activer() {
  if (!ctx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    ctx = new Ctx();
    const compresseur = ctx.createDynamicsCompressor();
    sortie = ctx.createGain();
    sortie.gain.value = estMuet() ? 0 : 0.6;
    sortie.connect(compresseur).connect(ctx.destination);
  }
  void ctx.resume();
}

function pret() {
  return ctx && sortie && ctx.state === "running" ? { ctx, out: sortie } : null;
}

function bruit(c: AudioContext, duree: number) {
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * duree), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  return src;
}

function enveloppe(c: AudioContext, debut: number, volume: number, attaque: number, chute: number) {
  const g = c.createGain();
  g.gain.setValueAtTime(0, debut);
  g.gain.linearRampToValueAtTime(volume, debut + attaque);
  g.gain.exponentialRampToValueAtTime(0.0001, debut + attaque + chute);
  return g;
}

function osc(c: AudioContext, type: OscillatorType, freq: number) {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  return o;
}

/** Clic de clavier mécanique (limité pour ne pas saturer quand la frappe est très rapide). */
export function touche() {
  const a = pret();
  if (!a) return;
  const { ctx: c, out } = a;
  const t = c.currentTime;
  if (t - derniereTouche < 0.035) return;
  derniereTouche = t;

  const n = bruit(c, 0.04);
  const filtre = c.createBiquadFilter();
  filtre.type = "bandpass";
  filtre.frequency.value = 2200 + Math.random() * 2600;
  filtre.Q.value = 1.4;
  n.connect(filtre).connect(enveloppe(c, t, 0.35, 0.001, 0.03)).connect(out);
  n.start(t);

  const choc = osc(c, "sine", 120 + Math.random() * 60);
  choc.connect(enveloppe(c, t, 0.25, 0.001, 0.025)).connect(out);
  choc.start(t);
  choc.stop(t + 0.05);
}

/** Bip de validation « [ OK ] ». */
export function ok() {
  const a = pret();
  if (!a) return;
  const { ctx: c, out } = a;
  const t = c.currentTime;
  const o = osc(c, "square", 1320);
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 3000;
  o.connect(f).connect(enveloppe(c, t, 0.08, 0.002, 0.07)).connect(out);
  o.start(t);
  o.stop(t + 0.1);
}

/** Buzzer d'alerte. */
export function alerte() {
  const a = pret();
  if (!a) return;
  const { ctx: c, out } = a;
  const t = c.currentTime;
  for (let i = 0; i < 3; i++) {
    const d = t + i * 0.14;
    const o = osc(c, "sawtooth", i % 2 ? 180 : 230);
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 1400;
    o.connect(f).connect(enveloppe(c, d, 0.16, 0.005, 0.11)).connect(out);
    o.start(d);
    o.stop(d + 0.13);
  }
}

/** Démarrage : montée électrique + choc sourd. */
export function allumage() {
  const a = pret();
  if (!a) return;
  const { ctx: c, out } = a;
  const t = c.currentTime;
  const monte = osc(c, "sawtooth", 60);
  monte.frequency.exponentialRampToValueAtTime(880, t + 0.5);
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.setValueAtTime(300, t);
  f.frequency.exponentialRampToValueAtTime(4000, t + 0.5);
  monte.connect(f).connect(enveloppe(c, t, 0.12, 0.05, 0.5)).connect(out);
  monte.start(t);
  monte.stop(t + 0.6);

  const choc = osc(c, "sine", 90);
  choc.frequency.exponentialRampToValueAtTime(35, t + 0.4);
  choc.connect(enveloppe(c, t, 0.5, 0.005, 0.45)).connect(out);
  choc.start(t);
  choc.stop(t + 0.5);
}

/** Grondement grave continu pendant toute la séquence. */
export function demarrerAmbiance() {
  const a = pret();
  if (!a || ambiance) return;
  const { ctx: c, out } = a;
  const t = c.currentTime;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.09, t + 1.5);
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 220;
  f.connect(g).connect(out);

  const oscs = [55, 55.6, 82.4].map((freq) => {
    const o = osc(c, "sawtooth", freq);
    o.connect(f);
    o.start(t);
    return o;
  });
  // Léger battement du filtre.
  const lfo = osc(c, "sine", 0.25);
  const lfoGain = c.createGain();
  lfoGain.gain.value = 80;
  lfo.connect(lfoGain).connect(f.frequency);
  lfo.start(t);

  ambiance = {
    stop: (fondu = 0.6) => {
      const n = c.currentTime;
      g.gain.cancelScheduledValues(n);
      g.gain.setValueAtTime(g.gain.value, n);
      g.gain.linearRampToValueAtTime(0, n + fondu);
      [...oscs, lfo].forEach((o) => o.stop(n + fondu + 0.05));
      ambiance = null;
    },
  };
}

/** « SIMULATION PRÊTE » : impact grave + accord lumineux. */
export function impact() {
  const a = pret();
  if (!a) return;
  const { ctx: c, out } = a;
  const t = c.currentTime;
  const boom = osc(c, "sine", 130);
  boom.frequency.exponentialRampToValueAtTime(38, t + 0.9);
  boom.connect(enveloppe(c, t, 0.7, 0.005, 1)).connect(out);
  boom.start(t);
  boom.stop(t + 1.1);

  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.setValueAtTime(5000, t);
  f.frequency.exponentialRampToValueAtTime(400, t + 1.4);
  f.connect(enveloppe(c, t, 0.12, 0.01, 1.4)).connect(out);
  [220, 277.2, 329.6, 440].forEach((freq) => {
    const o = osc(c, "sawtooth", freq);
    o.detune.value = Math.random() * 10 - 5;
    o.connect(f);
    o.start(t);
    o.stop(t + 1.5);
  });

  const souffle = bruit(c, 0.6);
  const fb = c.createBiquadFilter();
  fb.type = "highpass";
  fb.frequency.value = 3000;
  souffle.connect(fb).connect(enveloppe(c, t, 0.12, 0.01, 0.5)).connect(out);
  souffle.start(t);
}

/** Extinction façon vieil écran : sifflement qui descend + grésillement. */
export function extinction() {
  const a = pret();
  if (!a) return;
  const { ctx: c, out } = a;
  const t = c.currentTime;
  ambiance?.stop(0.4);

  const o = osc(c, "sine", 2400);
  o.frequency.exponentialRampToValueAtTime(40, t + 0.7);
  o.connect(enveloppe(c, t, 0.18, 0.005, 0.7)).connect(out);
  o.start(t);
  o.stop(t + 0.8);

  const n = bruit(c, 0.5);
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = 1200;
  n.connect(f).connect(enveloppe(c, t + 0.25, 0.25, 0.005, 0.35)).connect(out);
  n.start(t + 0.25);
}

/** Entrée sur le site : aspiration montante, puis déflagration grave et souffle qui s'éloigne. */
export function deflagration(delai = 0.25) {
  const a = pret();
  if (!a) return;
  const { ctx: c, out } = a;
  const t = c.currentTime;
  const choc = t + delai;

  // Aspiration juste avant l'explosion.
  const aspire = bruit(c, delai + 0.05);
  const fa = c.createBiquadFilter();
  fa.type = "bandpass";
  fa.Q.value = 3;
  fa.frequency.setValueAtTime(300, t);
  fa.frequency.exponentialRampToValueAtTime(5000, choc);
  aspire.connect(fa).connect(enveloppe(c, t, 0.2, delai, 0.04)).connect(out);
  aspire.start(t);

  // Coup sourd.
  const boom = osc(c, "sine", 110);
  boom.frequency.setValueAtTime(110, choc);
  boom.frequency.exponentialRampToValueAtTime(28, choc + 1.2);
  boom.connect(enveloppe(c, choc, 0.9, 0.004, 1.3)).connect(out);
  boom.start(choc);
  boom.stop(choc + 1.4);

  // Craquement + souffle qui s'éloigne.
  const souffle = bruit(c, 1.6);
  const fs = c.createBiquadFilter();
  fs.type = "lowpass";
  fs.frequency.setValueAtTime(9000, choc);
  fs.frequency.exponentialRampToValueAtTime(200, choc + 1.5);
  souffle.connect(fs).connect(enveloppe(c, choc, 0.35, 0.003, 1.5)).connect(out);
  souffle.start(choc);

  // Accord électrique bref, en écho à « SIMULATION PRÊTE ».
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.setValueAtTime(6000, choc);
  f.frequency.exponentialRampToValueAtTime(300, choc + 0.9);
  f.connect(enveloppe(c, choc, 0.08, 0.01, 0.9)).connect(out);
  [110, 164.8, 220, 329.6].forEach((freq) => {
    const o = osc(c, "sawtooth", freq);
    o.detune.value = Math.random() * 14 - 7;
    o.connect(f);
    o.start(choc);
    o.stop(choc + 1);
  });
}
