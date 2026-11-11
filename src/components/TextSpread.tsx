"use client";

import { useScroll } from "framer-motion";
import { useEffect, useRef } from "react";
import { appliquerSillage, creerGlyphes, lireSillage } from "./sillageTexte";

/** Phrases répétées dans la zone sombre. */
export const PHRASES_SPREAD = "WHATITCOST · SCANAVIS · GESTION AVP · BAMBOORUSH · LOG POSE · NEXT.JS · SUPABASE · TYPESCRIPT · ";

/** Fond de départ : celui de la section Projets (anthracite + lignes de texte discrètes). */
export const FOND_SPREAD = "#0f0f0f";
/** Nouveau fond qui envahit l'écran (la section qui suit doit avoir le même). */
export const FOND_SUITE = "#150507";

/** Lignes du fond de départ : mêmes réglages que le fond de la section Projets. */
const LIGNES_HAUT = { ordinateur: 13, telephone: 11, opacite: 0.07 };

const CELLULE = { ordinateur: [11, 21], telephone: [9, 18] } as const; // largeur × hauteur (px)
const BANDE_HAUT = 5; // lignes de grésillement au-dessus du front
const BANDE_BAS = 1; // lignes de grésillement sous le front
const ISOLEES_LIGNES = 12; // lettres isolées jusqu'à N lignes au-dessus du front
const TIC_MS = 80;
const GLISSEMENT = 8; // px/s
const ALEATOIRES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·:-";

type Atlas = Map<string, HTMLCanvasElement>;

/** Chaque caractère pré-dessiné une fois, à la taille réelle d'une cellule. */
function creerAtlas(caracteres: Iterable<string>, police: string, taille: number, l: number, h: number, couleur: string): Atlas {
  const atlas: Atlas = new Map();
  for (const c of caracteres) {
    const img = document.createElement("canvas");
    img.width = l;
    img.height = h;
    const g = img.getContext("2d")!;
    g.font = `${taille}px ${police}`;
    g.fillStyle = couleur;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(c, l / 2, h / 2 + taille * 0.05);
    atlas.set(c, img);
  }
  return atlas;
}

/**
 * Transition au scroll : une zone sombre remplie de texte monte depuis le bas et envahit l'écran,
 * avec une bordure irrégulière qui grésille.
 */
export default function TextSpread() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Démarre pendant que la section arrive encore à l'écran.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start 0.7", "end end"] });

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!section || !canvas || !ctx) return;

    const statique = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const styles = getComputedStyle(document.documentElement);
    const police = styles.getPropertyValue("--font-mono").trim() || "monospace";
    const accent = styles.getPropertyValue("--color-neon").trim() || "#ff2a2a";
    const texte = getComputedStyle(section).color;
    const caracteres = new Set([...ALEATOIRES, ...PHRASES_SPREAD]);

    let L = 0, H = 0, dpr = 1, cw = 11, ch = 21, cols = 0, lignes = 0;
    let atlasTexte: Atlas = new Map(), atlasFond: Atlas = new Map(), atlasAccent: Atlas = new Map();
    let bandeau: HTMLCanvasElement | null = null; // une phrase complète en rouge (nouveau fond)
    let bandeauHaut: HTMLCanvasElement | null = null; // la même, à la taille du fond de Projets
    let lhHaut = 16;
    let decalagesHaut: number[] = [];
    let lcHautCss = 8;
    let glyphesHaut = new Map<string, HTMLCanvasElement>();
    let glyphesHautCrete = new Map<string, HTMLCanvasElement>();
    let decalages: number[] = [];
    let bruit = new Float32Array(0); // relief fixe du front, par colonne

    // État aléatoire de la bande, renouvelé tous les TIC_MS.
    const HB = BANDE_HAUT + BANDE_BAS;
    let carBande: string[] = [], visBande = new Uint8Array(0), invBande = new Uint8Array(0), accBande = new Uint8Array(0);
    let isolees: { c: number; o: number; car: string }[] = [];

    const construire = () => {
      const r = canvas.getBoundingClientRect();
      L = r.width || window.innerWidth;
      H = r.height || window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(L * dpr);
      canvas.height = Math.round(H * dpr);
      [cw, ch] = window.innerWidth >= 768 ? CELLULE.ordinateur : CELLULE.telephone;
      cols = Math.ceil(L / cw);
      lignes = Math.ceil(H / ch) + 1;

      const [lp, hp, taille] = [Math.round(cw * dpr), Math.round(ch * dpr), cw * 1.62 * dpr];
      atlasTexte = creerAtlas(caracteres, police, taille, lp, hp, texte);
      atlasFond = creerAtlas(caracteres, police, taille, lp, hp, FOND_SPREAD);
      atlasAccent = creerAtlas(caracteres, police, taille, lp, hp, accent);

      // Bandeau du nouveau fond : la phrase entière en rouge, cellule par cellule.
      bandeau = document.createElement("canvas");
      bandeau.width = PHRASES_SPREAD.length * lp;
      bandeau.height = hp;
      const g = bandeau.getContext("2d")!;
      [...PHRASES_SPREAD].forEach((c, i) => {
        const img = atlasAccent.get(c);
        if (img) g.drawImage(img, i * lp, 0);
      });
      decalages = Array.from({ length: lignes }, () => Math.random() * PHRASES_SPREAD.length * cw);

      // Bandeau du fond de départ, identique à celui de la section Projets.
      const tailleHaut = window.innerWidth >= 768 ? LIGNES_HAUT.ordinateur : LIGNES_HAUT.telephone;
      lhHaut = Math.round(tailleHaut * 1.25);
      const gh = document.createElement("canvas").getContext("2d")!;
      gh.font = `${tailleHaut * dpr}px ${police}`;
      const lcHaut = gh.measureText("M").width;
      bandeauHaut = document.createElement("canvas");
      bandeauHaut.width = Math.ceil(PHRASES_SPREAD.length * lcHaut);
      bandeauHaut.height = Math.ceil(lhHaut * dpr);
      const g2 = bandeauHaut.getContext("2d")!;
      g2.font = `${tailleHaut * dpr}px ${police}`;
      g2.fillStyle = texte;
      g2.textBaseline = "middle";
      [...PHRASES_SPREAD].forEach((c, i) => g2.fillText(c, i * lcHaut, (lhHaut * dpr) / 2));
      const lignesHaut = Math.ceil(H / lhHaut) + 1;
      decalagesHaut = Array.from({ length: lignesHaut }, () => Math.floor(Math.random() * PHRASES_SPREAD.length) * lcHaut);
      lcHautCss = lcHaut / dpr;
      glyphesHaut = creerGlyphes(PHRASES_SPREAD, police, tailleHaut * dpr, lcHaut, lhHaut * dpr, texte);
      glyphesHautCrete = creerGlyphes(PHRASES_SPREAD, police, tailleHaut * dpr, lcHaut, lhHaut * dpr, accent);

      bruit = new Float32Array(cols);
      const graine = Math.random() * 10;
      for (let c = 0; c < cols; c++) {
        const s = Math.sin(c * 0.06 + graine) + 0.55 * Math.sin(c * 0.17 + graine * 2) + 0.3 * Math.sin(c * 0.41 + graine * 3);
        bruit[c] = s / 1.85 + (Math.random() - 0.5) * 0.25;
      }

      const n = cols * HB;
      carBande = new Array(n);
      visBande = new Uint8Array(n);
      invBande = new Uint8Array(n);
      accBande = new Uint8Array(n);
      tic();
    };

    const hasardCar = () => ALEATOIRES[Math.floor(Math.random() * ALEATOIRES.length)];

    const tic = () => {
      for (let o = 0; o < HB; o++) {
        // o = 0 : ligne la plus haute de la bande ; densité croissante vers le front.
        const auDessus = BANDE_HAUT - o; // > 0 au-dessus du front
        const densite = auDessus > 0 ? 0.85 * (1 - (auDessus - 1) / BANDE_HAUT) : 0.9;
        let groupe = 0;
        for (let c = 0; c < cols; c++) {
          const i = o * cols + c;
          carBande[i] = hasardCar();
          visBande[i] = Math.random() < densite ? 1 : 0;
          // Blocs inversés, par petits groupes de 2 à 6 cellules.
          if (groupe === 0 && Math.random() < 0.25 / 4) groupe = 2 + Math.floor(Math.random() * 5);
          invBande[i] = groupe > 0 && visBande[i] ? 1 : 0;
          if (groupe > 0) groupe--;
          accBande[i] = Math.random() < 0.03 ? 1 : 0;
        }
      }
      const nb = Math.round(cols * ISOLEES_LIGNES * 0.01);
      isolees = Array.from({ length: nb }, () => ({
        c: Math.floor(Math.random() * cols),
        o: BANDE_HAUT + 1 + Math.floor(Math.random() * (ISOLEES_LIGNES - BANDE_HAUT)),
        car: hasardCar(),
      }));
    };

    let affiche = scrollYProgress.get();
    let dernierTic = 0;
    const t0 = performance.now();
    const fronts = new Int32Array(4096);

    const dessiner = (maintenant: number) => {
      affiche += (scrollYProgress.get() - affiche) * 0.1;
      const p = Math.min(1, Math.max(0, affiche));
      if (!statique && maintenant - dernierTic > TIC_MS) {
        tic();
        dernierTic = maintenant;
      }
      const t = statique ? 0 : (maintenant - t0) / 1000;

      // Front par colonne : du bas (p = 0) jusqu'au-dessus du haut (p = 1).
      const A = H * 0.16; // amplitude du relief
      const marge = A + (ISOLEES_LIGNES + 2) * ch;
      const base = H + A + BANDE_BAS * ch - p * (H + A + marge + BANDE_BAS * ch);
      for (let c = 0; c < cols; c++) {
        const ondule = statique ? 0 : Math.sin(t * 0.6 + c * 0.05) * 0.08;
        fronts[c] = Math.floor((base + (bruit[c] + ondule) * A) / ch);
      }

      const lp = cw * dpr, hp = ch * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // 0. Fond de départ (celui de Projets) sur tout l'écran.
      ctx.fillStyle = FOND_SPREAD;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (bandeauHaut) {
        ctx.globalAlpha = LIGNES_HAUT.opacite;
        const periode = bandeauHaut.width;
        decalagesHaut.forEach((d, r) => {
          for (let x = -d; x < canvas.width; x += periode) ctx.drawImage(bandeauHaut!, x, r * lhHaut * dpr);
        });
        ctx.globalAlpha = 1;
      }

      // 1. Nouveau fond sous le front + lignes de texte rouges qui glissent.
      ctx.save();
      ctx.beginPath();
      for (let c = 0; c < cols; c++) {
        const y = Math.max(0, fronts[c]) * hp;
        if (y < canvas.height) ctx.rect(c * lp, y, lp + 0.5, canvas.height - y);
      }
      ctx.fillStyle = FOND_SUITE;
      ctx.fill();
      ctx.clip();
      if (bandeau) {
        ctx.globalAlpha = 0.16;
        const periode = bandeau.width;
        let haut = lignes;
        for (let c = 0; c < cols; c++) haut = Math.min(haut, fronts[c]);
        haut = Math.max(0, haut);
        for (let r = haut; r < lignes; r++) {
          const sens = r % 2 ? -1 : 1;
          let x = -(((decalages[r] + sens * GLISSEMENT * t) * dpr) % periode);
          if (x > 0) x -= periode;
          for (; x < canvas.width; x += periode) ctx.drawImage(bandeau, x, r * hp);
        }
        ctx.globalAlpha = 1;
      }
      ctx.restore();

      // Sillage de la souris, sur les deux fonds (chaque case n'est traitée que dans sa zone).
      const inter = lireSillage(canvas.getBoundingClientRect(), maintenant, statique);
      if (inter) {
        const enBas = (xc: number, yc: number) => {
          const c = Math.min(cols - 1, Math.max(0, Math.floor(xc / cw)));
          return yc >= fronts[c] * ch;
        };
        // Fond de départ (gris).
        appliquerSillage(
          ctx,
          inter,
          { lc: lcHautCss, lh: lhHaut, o: 0, dpr, L, H, decalage: (r) => (decalagesHaut[r] ?? 0) / dpr },
          (r, c, xc, yc) => {
            if (r < 0 || r >= decalagesHaut.length || c < 0 || enBas(xc, yc)) return null;
            const car = PHRASES_SPREAD[c % PHRASES_SPREAD.length];
            return { img: car === " " ? undefined : glyphesHaut.get(car), crete: glyphesHautCrete.get(car), alpha: LIGNES_HAUT.opacite, fond: FOND_SPREAD };
          },
        );
        // Nouveau fond (rouge), avec ses lignes qui glissent.
        const P = PHRASES_SPREAD.length * cw;
        appliquerSillage(
          ctx,
          inter,
          {
            lc: cw,
            lh: ch,
            o: 0,
            dpr,
            L,
            H,
            decalage: (r) => {
              const sens = r % 2 ? -1 : 1;
              return ((((decalages[r] ?? 0) + sens * GLISSEMENT * t) % P) + P) % P;
            },
          },
          (r, c, xc, yc) => {
            if (r < 0 || r >= lignes || c < 0 || !enBas(xc, yc)) return null;
            const car = PHRASES_SPREAD[c % PHRASES_SPREAD.length];
            return { img: car === " " ? undefined : atlasAccent.get(car), crete: atlasTexte.get(car), alpha: 0.16, fond: FOND_SUITE };
          },
        );
      }

      // 2. Bande de grésillement autour du front.
      for (let c = 0; c < cols; c++) {
        for (let o = 0; o < HB; o++) {
          const r = fronts[c] - BANDE_HAUT + o;
          if (r < 0 || r >= lignes) continue;
          const i = o * cols + c;
          if (!visBande[i]) continue;
          const x = c * lp, y = r * hp;
          if (invBande[i]) {
            ctx.fillStyle = accBande[i] ? accent : texte;
            ctx.fillRect(x, y, lp, hp);
            const img = atlasFond.get(carBande[i]);
            if (img) ctx.drawImage(img, x, y);
          } else {
            const img = (accBande[i] ? atlasAccent : atlasTexte).get(carBande[i]);
            if (!img) continue;
            ctx.globalAlpha = r >= fronts[c] ? 0.9 : 0.75;
            ctx.drawImage(img, x, y);
            ctx.globalAlpha = 1;
          }
        }
      }

      // 3. Lettres isolées au-dessus du front.
      ctx.globalAlpha = 0.5;
      for (const { c, o, car } of isolees) {
        const r = fronts[c] - o;
        const img = atlasTexte.get(car);
        if (r >= 0 && r < lignes && img) ctx.drawImage(img, c * lp, r * hp);
      }
      ctx.globalAlpha = 1;
    };

    // Boucle unique, en pause hors écran ou onglet caché.
    let raf = 0;
    let visible = false;
    const boucle = (t: number) => {
      dessiner(t);
      raf = requestAnimationFrame(boucle);
    };
    const relancer = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (visible && !document.hidden) raf = requestAnimationFrame(boucle);
    };

    construire();
    const ro = new ResizeObserver(() => {
      construire();
      relancer();
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      relancer();
    });
    io.observe(section);
    document.addEventListener("visibilitychange", relancer);
    document.fonts?.ready.then(() => {
      construire();
      relancer();
    });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", relancer);
    };
  }, [scrollYProgress]);

  return (
    // md:-ml-24 : déborde sous le rail pour couvrir toute la largeur de l'écran.
    <section
      ref={sectionRef}
      className="relative h-[140vh] text-white md:-ml-24 md:h-[170vh]"
      style={{ background: FOND_SPREAD }}
      aria-hidden
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      </div>
    </section>
  );
}
