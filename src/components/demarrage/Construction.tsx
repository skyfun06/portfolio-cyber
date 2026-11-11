"use client";

import { useEffect, useRef } from "react";

type V3 = [number, number, number];
const ROUGE = "255, 42, 42";

/** Générateur pseudo-aléatoire déterministe : la cité est la même à chaque visite. */
function graine(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Tour = { x: number; z: number; l: number; h: number; debut: number };

// Plan de la cité : tours sur une grille, plus hautes au centre, construites du centre vers l'extérieur.
const hasard = graine(6);
const tours: Tour[] = [];
for (let i = -4; i <= 4; i++)
  for (let j = -4; j <= 4; j++) {
    const [x, z] = [i * 0.2, j * 0.2];
    const d = Math.hypot(x, z);
    if (d > 0.86 || d < 0.15 || hasard() < 0.22) continue;
    tours.push({ x, z, l: 0.035 + hasard() * 0.035, h: 0.12 + (1 - d) * 0.55 * (0.4 + hasard() * 0.9), debut: 0 });
  }
tours
  .sort((a, b) => Math.hypot(a.x, a.z) + hasard() * 0.25 - (Math.hypot(b.x, b.z) + hasard() * 0.25))
  .forEach((t, i, arr) => (t.debut = 0.14 + (i / arr.length) * 0.62));

const DUREE_TOUR = 0.07;
const facile = (x: number) => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3);

function tourner([x, y, z]: V3, ax: number, ay: number): V3 {
  const [x1, z1] = [x * Math.cos(ay) + z * Math.sin(ay), -x * Math.sin(ay) + z * Math.cos(ay)];
  return [x1, y * Math.cos(ax) - z1 * Math.sin(ax), y * Math.sin(ax) + z1 * Math.cos(ax)];
}

/**
 * Cité de données filaire qui se construit au fil du démarrage.
 * `progression` (0 → 1) suit l'avancement du terminal.
 */
export default function Construction({
  progression,
  className = "",
}: {
  progression: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cible = useRef(progression);
  cible.current = progression;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const statique = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let largeur = 0;
    let hauteur = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const redim = () => {
      const r = canvas.getBoundingClientRect();
      largeur = r.width;
      hauteur = r.height;
      canvas.width = largeur * dpr;
      canvas.height = hauteur * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    redim();
    const ro = new ResizeObserver(redim);
    ro.observe(canvas);

    let raf = 0;
    let affiche = statique ? 1 : 0;
    const t0 = performance.now();

    const dessiner = (maintenant: number) => {
      const t = (maintenant - t0) / 1000;
      // La construction rattrape doucement l'avancement réel, sans jamais s'arrêter net.
      affiche += (Math.max(cible.current, Math.min(affiche + 0.0006, 0.97)) - affiche) * 0.05;
      if (statique) affiche = 1;
      const p = affiche;

      const R = Math.min(largeur, hauteur * 1.1) * 0.46;
      const cx = largeur / 2;
      const cy = hauteur * 0.66;
      const ax = 0.52;
      const ay = 0.6 + t * 0.12;
      const focale = 4;

      const proj = (v: V3): [number, number, number] => {
        const [x, y, z] = tourner(v, ax, ay);
        const s = focale / (focale + z);
        return [cx + x * R * s, cy - y * R * s, z];
      };
      const alpha = (z: number, base: number) => base * (0.25 + 0.75 * ((1.2 - z) / 2.4));
      const segment = (a: V3, b: V3, base: number, epaisseur = 1) => {
        const [x1, y1, z1] = proj(a);
        const [x2, y2, z2] = proj(b);
        ctx.strokeStyle = `rgba(${ROUGE}, ${Math.max(0, alpha((z1 + z2) / 2, base))})`;
        ctx.lineWidth = epaisseur;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      };
      const cercle = (r: number, y: number, fin: number, base: number, pas = 96, pointille = false) => {
        const n = Math.max(2, Math.floor(pas * fin));
        for (let i = 0; i < n; i += pointille ? 2 : 1) {
          const [a, b] = [(i / pas) * Math.PI * 2, ((i + 1) / pas) * Math.PI * 2];
          segment([Math.cos(a) * r, y, Math.sin(a) * r], [Math.cos(b) * r, y, Math.sin(b) * r], base);
        }
      };

      ctx.clearRect(0, 0, largeur, hauteur);
      ctx.globalCompositeOperation = "lighter";

      // 1. Plateforme : cercles qui se tracent, puis rayons.
      const pPlate = facile(p / 0.14);
      cercle(1, 0, pPlate, 0.9);
      cercle(0.97, 0, pPlate, 0.3);
      cercle(0.55, 0, facile((p - 0.05) / 0.1), 0.25, 64, true);
      const rayons = Math.floor(facile((p - 0.08) / 0.08) * 24);
      for (let i = 0; i < rayons; i++) {
        const a = (i / 24) * Math.PI * 2;
        segment([Math.cos(a) * 0.18, 0, Math.sin(a) * 0.18], [Math.cos(a) * 0.97, 0, Math.sin(a) * 0.97], 0.12);
      }

      // 2. Tours qui sortent du sol.
      const emetteur: V3 = [0, 1.55, 0];
      tours.forEach((tour, i) => {
        const local = (p - tour.debut) / DUREE_TOUR;
        if (local <= 0) return;
        const k = facile(local);
        const h = tour.h * k;
        const { x, z, l } = tour;
        const bas: V3[] = [[x - l, 0, z - l], [x + l, 0, z - l], [x + l, 0, z + l], [x - l, 0, z + l]];
        const haut = bas.map(([a, , c]) => [a, h, c] as V3);
        const enCours = local < 1;
        for (let c = 0; c < 4; c++) {
          segment(bas[c], bas[(c + 1) % 4], 0.35);
          segment(bas[c], haut[c], 0.5);
          segment(haut[c], haut[(c + 1) % 4], enCours ? 1 : 0.75, enCours ? 2 : 1);
        }
        // Étages.
        for (let e = 0.08; e < h - 0.02; e += 0.08) {
          segment([x - l, e, z + l], [x + l, e, z + l], 0.16);
          segment([x + l, e, z - l], [x + l, e, z + l], 0.16);
        }
        // Laser de construction.
        if (enCours) segment(emetteur, [x, h, z], 0.55);
      });

      // 3. Flèche centrale.
      const pFleche = facile((p - 0.78) / 0.14);
      if (pFleche > 0) {
        const hf = 1.25 * pFleche;
        const base: V3[] = [[-0.09, 0, -0.09], [0.09, 0, -0.09], [0.09, 0, 0.09], [-0.09, 0, 0.09]];
        const sommet: V3 = [0, hf, 0];
        base.forEach((b, c) => {
          segment(b, base[(c + 1) % 4], 0.6);
          segment(b, sommet, 0.95, 1.5);
        });
        for (let e = 0.12; e < hf; e += 0.12) {
          const r = 0.09 * (1 - e / 1.25);
          segment([-r, e, r], [r, e, r], 0.25);
          segment([r, e, -r], [r, e, r], 0.25);
        }
        if (pFleche > 0.98) {
          const [sx, sy] = proj([0, hf + 0.04, 0]);
          ctx.fillStyle = `rgba(${ROUGE}, ${0.5 + 0.5 * Math.abs(Math.sin(t * 4))})`;
          ctx.shadowColor = `rgb(${ROUGE})`;
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Émetteur du laser.
      if (p < 0.95) {
        const [ex, ey] = proj(emetteur);
        ctx.fillStyle = `rgba(${ROUGE}, 0.9)`;
        ctx.beginPath();
        ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
        ctx.fill();
        cercle(0.08, 1.55, 1, 0.6, 24);
      }

      // 4. Cité terminée : onde qui balaie la plateforme.
      if (p > 0.93) {
        const onde = (t * 0.6) % 1;
        cercle(0.2 + onde * 1.1, 0, 1, (1 - onde) * 0.9, 120);
      }

      ctx.globalCompositeOperation = "source-over";
      if (!statique) raf = requestAnimationFrame(dessiner);
    };

    raf = requestAnimationFrame(dessiner);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  // Le canvas remplit un conteneur positionné (un canvas seul ne s'étire pas avec top/bottom).
  return (
    <div className={className} aria-hidden>
      <canvas ref={canvasRef} className="size-full [filter:drop-shadow(0_0_6px_rgb(255_42_42/0.55))]" />
    </div>
  );
}
