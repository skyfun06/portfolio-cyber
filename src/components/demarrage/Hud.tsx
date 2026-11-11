"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;
const hasard = (min: number, max: number) => min + Math.random() * (max - min);
const hex = (n: number, l = 2) => Math.floor(n).toString(16).toUpperCase().padStart(l, "0");

/* ---------- Énergie partagée : la frappe et les bips font réagir l'oscilloscope ---------- */

let energie = 0;
/** Donne une impulsion à l'oscilloscope (frappe, validation, alerte…). */
export function pulser(force = 0.2) {
  energie = Math.min(3, energie + force);
}

/* ---------- Horloge ---------- */

export function Horloge() {
  const [t, setT] = useState("--:--:--");
  useEffect(() => {
    const maj = () => setT(new Intl.DateTimeFormat("fr-FR", { timeStyle: "medium", timeZone: "Europe/Paris" }).format(new Date()));
    maj();
    const i = setInterval(maj, 1000);
    return () => clearInterval(i);
  }, []);
  return <span className="tabular-nums">{t}</span>;
}

/* ---------- Panneau ---------- */

/**
 * Cadre de l'interface qui s'assemble : les bords se tracent, les coins s'allument,
 * puis le contenu s'affiche en scintillant.
 */
export function Panneau({
  titre,
  info,
  delai = 0,
  className = "",
  children,
}: {
  titre: string;
  info?: ReactNode;
  delai?: number;
  className?: string;
  children: ReactNode;
}) {
  const trait = (origine: string, axe: "x" | "y") => ({
    initial: axe === "x" ? { scaleX: 0 } : { scaleY: 0 },
    animate: axe === "x" ? { scaleX: 1 } : { scaleY: 1 },
    transition: { delay: delai, duration: 0.55, ease: EASE },
    style: { transformOrigin: origine },
  });
  return (
    <div className={`relative ${className}`}>
      <motion.span {...trait("left", "x")} className="absolute inset-x-0 top-0 h-px bg-neon/35" />
      <motion.span {...trait("right", "x")} className="absolute inset-x-0 bottom-0 h-px bg-neon/20" />
      <motion.span {...trait("top", "y")} className="absolute inset-y-0 left-0 w-px bg-neon/25" />
      <motion.span {...trait("bottom", "y")} className="absolute inset-y-0 right-0 w-px bg-neon/15" />
      {["-top-px -left-px border-t-2 border-l-2", "-top-px -right-px border-t-2 border-r-2", "-bottom-px -left-px border-b-2 border-l-2", "-right-px -bottom-px border-r-2 border-b-2"].map((c) => (
        <motion.span
          key={c}
          className={`absolute size-2.5 border-neon ${c}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.2, 1] }}
          transition={{ delay: delai + 0.35, duration: 0.3, times: [0, 0.3, 0.6, 1] }}
        />
      ))}
      {/* Étiquette posée sur le bord haut */}
      <motion.div
        className="absolute -top-2 right-3 left-3 flex items-center justify-between font-mono text-[9px] leading-none tracking-[0.25em] uppercase md:text-[10px]"
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: delai + 0.3, duration: 0.3 }}
      >
        <span className="bg-black px-1.5 text-neon">
          <span className="mr-1.5 inline-block size-1.5 translate-y-[-1px] bg-neon shadow-[0_0_6px_#ff2a2a]" />
          {titre}
        </span>
        {info && <span className="bg-black px-1.5 text-neon/45">{info}</span>}
      </motion.div>
      <motion.div
        className="relative size-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.3, 1] }}
        transition={{ delay: delai + 0.45, duration: 0.35, times: [0, 0.3, 0.55, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* ---------- Compteur géant ---------- */

/** Pourcentage géant avec images fantômes décalées et barre segmentée. */
export function Compteur({ valeur, segments = 36 }: { valeur: number; segments?: number }) {
  const v = Math.round(Math.min(100, Math.max(0, valeur)));
  const texte = String(v).padStart(3, "0");
  const pleins = Math.round((v / 100) * segments);
  return (
    <div className="flex h-full flex-col justify-end gap-3 p-4 pt-6">
      <div className="flex items-start self-end">
        <div className="relative font-display text-[clamp(3.5rem,6.5vw,7rem)] leading-[0.8] font-bold tabular-nums">
          <span className="absolute inset-0 translate-x-[4px] text-neon/50 blur-[1px]" aria-hidden>
            {texte}
          </span>
          <span className="absolute inset-0 -translate-x-[3px] text-white/20" aria-hidden>
            {texte}
          </span>
          <span className="relative text-neon [text-shadow:0_0_30px_rgb(255_42_42/0.6)]">{texte}</span>
        </div>
        <span className="ml-1 font-mono text-lg text-neon/60">%</span>
      </div>
      <div className="flex gap-[3px]">
        {Array.from({ length: segments }, (_, i) => (
          <span
            key={i}
            className={`h-3 flex-1 transition-colors duration-150 ${
              i < pleins - 1 ? "bg-neon/80" : i === pleins - 1 ? "bg-white shadow-[0_0_10px_#ff2a2a]" : "bg-neon/10"
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between font-mono text-[9px] tracking-[0.25em] text-neon/45 uppercase">
        <span>Synchronisation</span>
        <span>{v === 100 ? "Terminée" : `${hex(v * 655.35, 4)} / FFFF`}</span>
      </div>
    </div>
  );
}

/* ---------- Flux hexadécimal ---------- */

function ligneHex(adresse: number) {
  const octets = Array.from({ length: 4 }, () => hex(Math.random() * 256)).join(" ");
  return `${hex(adresse, 6)}  ${octets}`;
}

/** Colonne de mémoire qui défile en continu. */
export function FluxHex({ lignes = 46 }: { lignes?: number }) {
  const ref = useRef<HTMLPreElement>(null);
  useEffect(() => {
    let adresse = 0x7f3a00;
    const tampon = Array.from({ length: lignes }, () => ligneHex((adresse += 4)));
    const id = setInterval(() => {
      for (let i = 0; i < 2; i++) {
        tampon.shift();
        tampon.push(ligneHex((adresse += 4)));
      }
      if (ref.current) ref.current.textContent = tampon.join("\n");
    }, 45);
    return () => clearInterval(id);
  }, [lignes]);
  return (
    <div className="relative h-full overflow-hidden px-3 pt-5">
      <pre ref={ref} className="font-mono text-[9px] leading-[1.45] text-neon/35" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black to-transparent" />
    </div>
  );
}

/* ---------- Télémétrie ---------- */

const MESURES = [
  { nom: "CPU", unite: "%", base: 38, ecart: 30 },
  { nom: "MÉM", unite: "%", base: 52, ecart: 14 },
  { nom: "RÉS", unite: "Mb/s", base: 640, ecart: 360 },
  { nom: "GPU", unite: "°C", base: 61, ecart: 9 },
];

/** Jauges système qui s'agitent ; elles montent avec l'avancement. */
export function Telemetrie({ avancement }: { avancement: number }) {
  const [valeurs, setValeurs] = useState(() => MESURES.map((m) => m.base));
  const avance = useRef(avancement);
  avance.current = avancement;
  useEffect(() => {
    const id = setInterval(() => {
      setValeurs(MESURES.map((m) => Math.max(0, m.base * (0.6 + 0.6 * avance.current) + hasard(-m.ecart, m.ecart) / 2)));
    }, 140);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex h-full flex-col justify-center gap-2.5 p-4 pt-6 font-mono text-[10px] tracking-[0.15em] text-neon/70 uppercase">
      {MESURES.map((m, i) => {
        const max = m.unite === "%" ? 100 : m.unite === "°C" ? 95 : 1200;
        const part = Math.min(1, valeurs[i] / max);
        return (
          <div key={m.nom} className="flex items-center gap-3">
            <span className="w-8 text-neon/45">{m.nom}</span>
            <span className="relative h-1.5 flex-1 bg-neon/10">
              <span className="absolute inset-y-0 left-0 bg-neon/75 transition-[width] duration-150" style={{ width: `${part * 100}%` }} />
              <span className="absolute inset-y-0 w-px bg-white shadow-[0_0_6px_#fff]" style={{ left: `${part * 100}%` }} />
            </span>
            <span className="w-20 text-right tabular-nums">
              {Math.round(valeurs[i])}
              <span className="text-neon/40"> {m.unite}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Oscilloscope ---------- */

/** Onde rouge qui s'emballe à chaque frappe (voir `pulser`). */
export function Oscillo({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let [L, H] = [0, 0];
    const redim = () => {
      const r = canvas.getBoundingClientRect();
      [L, H] = [r.width, r.height];
      canvas.width = L * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    redim();
    const ro = new ResizeObserver(redim);
    ro.observe(canvas);
    let raf = 0;
    let lisse = 0;
    const dessiner = (t: number) => {
      energie *= 0.94;
      lisse += (energie - lisse) * 0.25;
      ctx.clearRect(0, 0, L, H);
      // Grille
      ctx.strokeStyle = "rgba(255,42,42,0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x < L; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, H);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, H / 2 + 0.5);
      ctx.lineTo(L, H / 2 + 0.5);
      ctx.stroke();
      // Onde
      const amp = H * (0.06 + 0.16 * lisse);
      for (const [alpha, largeur, decalage] of [[0.25, 4, 0.6], [1, 1.2, 0]] as const) {
        ctx.strokeStyle = `rgba(255,42,42,${alpha})`;
        ctx.lineWidth = largeur;
        ctx.beginPath();
        for (let x = 0; x <= L; x += 2) {
          const u = x / L;
          const enveloppe = Math.sin(u * Math.PI);
          const y =
            H / 2 +
            enveloppe *
              amp *
              (Math.sin(u * 22 + t * 0.008 + decalage) + 0.5 * Math.sin(u * 61 - t * 0.013) + lisse * (Math.random() - 0.5) * 1.6);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      raf = requestAnimationFrame(dessiner);
    };
    raf = requestAnimationFrame(dessiner);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);
  return <canvas ref={ref} className={className} aria-hidden />;
}

/* ---------- Écran cathodique ---------- */

/** Grain, lignes de balayage, vignettage et léger scintillement par-dessus toute la séquence. */
export function EcranCRT() {
  const [grain, setGrain] = useState<string>();
  useEffect(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 160;
    const g = c.getContext("2d")!;
    const img = g.createImageData(160, 160);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = v;
      img.data[i + 1] = v * 0.4;
      img.data[i + 2] = v * 0.4;
      img.data[i + 3] = Math.random() < 0.5 ? 22 : 0;
    }
    g.putImageData(img, 0, 0);
    setGrain(c.toDataURL());
  }, []);
  return (
    <div className="pointer-events-none absolute inset-0 z-50" aria-hidden>
      {grain && <div className="crt-grain absolute -inset-[160px] opacity-60" style={{ backgroundImage: `url(${grain})` }} />}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgb(0_0_0/0.35)_0_1px,transparent_1px_3px)]" />
      <div className="cyber-balayage absolute inset-x-0 h-40 bg-gradient-to-b from-transparent via-neon/[0.05] to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(0_0_0/0.85)_100%)]" />
      <div className="crt-scintille absolute inset-0 bg-neon/[0.015]" />
    </div>
  );
}

/* ---------- Bandeau de danger ---------- */

/** Bande à rayures qui traverse l'écran, avec un message. */
export function Bandeau({ texte, className = "" }: { texte: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="danger-rayures absolute inset-0" />
      <div className="relative flex h-full items-center justify-center gap-6 overflow-hidden whitespace-nowrap">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className="bg-black px-4 py-1 font-display text-sm font-bold tracking-[0.3em] text-neon uppercase md:text-base">
            {texte}
          </span>
        ))}
      </div>
    </div>
  );
}
