"use client";

import { useEffect, useRef } from "react";

const N = 80; // résolution d'analyse (N × N)
const DUREE = 2600; // durée de la construction (ms)

type Analyse = { lum: Float32Array; contours: { x: number; y: number; v: number; t0: number }[] };

/** Silhouette de remplacement tant qu'aucune photo n'est fournie. */
function dessinerSilhouette(c: CanvasRenderingContext2D) {
  c.fillStyle = "#000";
  c.fillRect(0, 0, N, N);
  const g = c.createRadialGradient(N * 0.42, N * 0.32, 2, N * 0.5, N * 0.45, N * 0.5);
  g.addColorStop(0, "#fff");
  g.addColorStop(1, "#444");
  c.fillStyle = g;
  // Épaules
  c.beginPath();
  c.moveTo(N * 0.08, N);
  c.bezierCurveTo(N * 0.12, N * 0.76, N * 0.3, N * 0.7, N * 0.4, N * 0.68);
  c.lineTo(N * 0.6, N * 0.68);
  c.bezierCurveTo(N * 0.7, N * 0.7, N * 0.88, N * 0.76, N * 0.92, N);
  c.fill();
  // Cou
  c.fillRect(N * 0.42, N * 0.52, N * 0.16, N * 0.18);
  // Tête
  c.beginPath();
  c.ellipse(N * 0.5, N * 0.38, N * 0.165, N * 0.205, 0, 0, Math.PI * 2);
  c.fill();
  // Cheveux
  c.fillStyle = "#222";
  c.beginPath();
  c.ellipse(N * 0.5, N * 0.24, N * 0.18, N * 0.1, 0, Math.PI, Math.PI * 2);
  c.fill();
}

/** Recadre l'image en carré (légèrement vers le haut, là où se trouve le visage). */
function dessinerImage(c: CanvasRenderingContext2D, img: HTMLImageElement) {
  const cote = Math.min(img.width, img.height);
  const sx = (img.width - cote) / 2;
  const sy = Math.max(0, (img.height - cote) * 0.25);
  c.drawImage(img, sx, sy, cote, cote, 0, 0, N, N);
}

/** Luminance normalisée + contours (filtre de Sobel). */
function analyser(c: CanvasRenderingContext2D): Analyse {
  const d = c.getImageData(0, 0, N, N).data;
  const lum = new Float32Array(N * N);
  let min = 1;
  let max = 0;
  for (let i = 0; i < N * N; i++) {
    const v = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255;
    lum[i] = v;
    min = Math.min(min, v);
    max = Math.max(max, v);
  }
  for (let i = 0; i < N * N; i++) lum[i] = (lum[i] - min) / (max - min || 1);

  const contours: Analyse["contours"] = [];
  const L = (x: number, y: number) => lum[Math.min(N - 1, Math.max(0, y)) * N + Math.min(N - 1, Math.max(0, x))];
  for (let y = 1; y < N - 1; y++)
    for (let x = 1; x < N - 1; x++) {
      const gx = -L(x - 1, y - 1) - 2 * L(x - 1, y) - L(x - 1, y + 1) + L(x + 1, y - 1) + 2 * L(x + 1, y) + L(x + 1, y + 1);
      const gy = -L(x - 1, y - 1) - 2 * L(x, y - 1) - L(x + 1, y - 1) + L(x - 1, y + 1) + 2 * L(x, y + 1) + L(x + 1, y + 1);
      const v = Math.hypot(gx, gy);
      if (v > 0.55) {
        // Les contours s'allument du centre vers l'extérieur, avec un peu de hasard.
        const dist = Math.hypot(x - N / 2, y - N * 0.42) / (N * 0.7);
        contours.push({ x, y, v: Math.min(1, v / 2), t0: 0.04 + 0.42 * (dist * 0.7 + Math.random() * 0.3) });
      }
    }
  return { lum, contours };
}

/**
 * Portrait en néon rouge qui se construit : contours qui s'allument, scan qui remplit, clignotement d'allumage.
 * `src` : photo (facultative). `actif` : lance la construction.
 */
export default function PortraitNeon({ src, actif, className = "" }: { src?: string; actif: boolean; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!actif) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const statique = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const hors = document.createElement("canvas");
    hors.width = hors.height = N;
    const hctx = hors.getContext("2d", { willReadFrequently: true })!;

    let analyse: Analyse | null = null;
    let raf = 0;
    let annule = false;
    let debut = 0;
    let taille = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const redim = () => {
      taille = canvas.getBoundingClientRect().width;
      canvas.width = canvas.height = Math.max(1, Math.round(taille * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const ro = new ResizeObserver(redim);
    ro.observe(canvas);
    redim();

    const dessiner = (maintenant: number) => {
      if (!analyse || annule) return;
      if (!debut) debut = maintenant;
      const p = statique ? 1 : Math.min(1, (maintenant - debut) / DUREE);
      const t = (maintenant - debut) / 1000;
      const cel = taille / N;
      ctx.clearRect(0, 0, taille, taille);

      // Allumage final : quelques clignotements, puis un léger frémissement permanent.
      let intensite = 1;
      if (p > 0.86 && p < 1) intensite = [1, 0.25, 1, 0.5, 1][Math.floor(((p - 0.86) / 0.14) * 5)] ?? 1;
      if (p >= 1) intensite = 0.92 + Math.sin(t * 13) * 0.03 + (Math.random() < 0.01 ? -0.3 : 0);

      // 1. Remplissage en lignes de balayage, révélé par le scan.
      const scan = Math.min(1, Math.max(0, (p - 0.3) / 0.55));
      const lignes = Math.floor(scan * N);
      for (let y = 0; y < lignes; y++) {
        for (let x = 0; x < N; x++) {
          const v = Math.pow(analyse.lum[y * N + x], 1.6);
          if (v < 0.06) continue;
          ctx.fillStyle = `rgba(255, 42, 42, ${v * 0.6 * intensite})`;
          ctx.fillRect(x * cel, y * cel, cel + 0.2, cel * 0.5);
        }
      }

      // 2. Contours néon.
      for (const c of analyse.contours) {
        const k = Math.min(1, (p - c.t0) / 0.08);
        if (k <= 0) continue;
        ctx.fillStyle = `rgba(255, ${90 + c.v * 80}, ${90 + c.v * 80}, ${k * (0.5 + c.v * 0.5) * intensite})`;
        ctx.fillRect(c.x * cel, c.y * cel, cel * 0.9, cel * 0.9);
      }

      // 3. Tête du scan pendant la construction, puis un balayage de temps en temps.
      const tete = p < 0.86 ? scan : ((t % 4.5) / 4.5) * 1.6;
      if (tete > 0 && tete < 1) {
        ctx.fillStyle = `rgba(255, 140, 140, ${p < 0.86 ? 0.9 : 0.35})`;
        ctx.fillRect(0, tete * taille, taille, Math.max(1, cel * 0.6));
      }

      if (!statique) raf = requestAnimationFrame(dessiner);
    };

    const lancer = () => {
      analyse = analyser(hctx);
      raf = requestAnimationFrame(dessiner);
    };

    if (src) {
      const img = new Image();
      img.onload = () => {
        if (annule) return;
        dessinerImage(hctx, img);
        lancer();
      };
      img.onerror = () => {
        if (annule) return;
        dessinerSilhouette(hctx);
        lancer();
      };
      img.src = src;
    } else {
      dessinerSilhouette(hctx);
      lancer();
    }

    return () => {
      annule = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [src, actif]);

  return (
    <canvas
      ref={canvasRef}
      className={`aspect-square [filter:drop-shadow(0_0_4px_rgb(255_42_42/0.9))_drop-shadow(0_0_14px_rgb(255_42_42/0.4))] ${className}`}
      aria-hidden
    />
  );
}
