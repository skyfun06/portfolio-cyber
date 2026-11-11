"use client";

import { useEffect, useRef, type RefObject } from "react";
import { abonner } from "./boucle";
import { appliquerSillage, creerGlyphes, lireSillage } from "./sillageTexte";
import { PHRASES_SPREAD } from "./TextSpread";

/** Mêmes phrases que la transition de texte. */
export const PHRASES_FOND = PHRASES_SPREAD;

/**
 * Variantes du fond :
 * - gris : petites lignes blanches très discrètes (Accueil, Projets) ;
 * - rouge : lignes rouges plus grandes, identiques au fond qui monte dans la transition (Profil, Contact).
 */
const VARIANTES = {
  gris: { taille: [13, 11], hauteur: [16, 14], largeur: null, couleur: "texte", opacite: 0.07 },
  rouge: { taille: [17.8, 14.6], hauteur: [21, 18], largeur: [11, 9], couleur: "accent", opacite: 0.16 },
} as const;
export type VarianteFond = keyof typeof VARIANTES;

const PART_GRESILLEMENT = 0.01;
const GRESILLEMENT_MS = 200;
const ALEATOIRES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·:-";

/**
 * Lignes de texte mono très discrètes, dessinées dans un seul canvas, qui réagissent à la souris (sillage).
 * Avec `section`, le canvas reste collé à l'écran et les lignes défilent avec la section (canvas léger
 * même pour une section très haute) ; sans, elles remplissent simplement le conteneur.
 */
export default function FondTexte({ section, variante = "gris" }: { section?: RefObject<HTMLElement | null>; variante?: VarianteFond }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const v = VARIANTES[variante];
    const statique = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const racine = getComputedStyle(document.documentElement);
    const police = racine.getPropertyValue("--font-mono").trim() || "monospace";
    const blanc = getComputedStyle(canvas).color;
    const rouge = racine.getPropertyValue("--color-neon").trim() || "#ff2a2a";
    const [couleur, couleurCrete] = v.couleur === "accent" ? [rouge, blanc] : [blanc, rouge];
    const lettres = [...PHRASES_FOND];

    let [L, H, dpr, taille, lc, lh] = [0, 0, 1, 13, 8, 16];
    let bandeau: HTMLCanvasElement | null = null;
    const decalages: number[] = [];
    let gresille: { r: number; c: number; car: string }[] = [];
    let dernierGresillement = 0;
    let derniereOrigine = NaN;
    let sale = true;
    let interactionAvant = false;
    let glyphes = new Map<string, HTMLCanvasElement>();
    let glyphesCrete = new Map<string, HTMLCanvasElement>();

    const decalage = (r: number) => {
      while (decalages.length <= r) decalages.push(Math.floor(Math.random() * lettres.length));
      return decalages[Math.max(0, r)];
    };

    const construire = () => {
      const rect = canvas.getBoundingClientRect();
      [L, H] = [rect.width, rect.height];
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(L * dpr);
      canvas.height = Math.round(H * dpr);
      const i = window.innerWidth >= 768 ? 0 : 1;
      taille = v.taille[i];
      lh = v.hauteur[i];
      ctx.font = `${taille * dpr}px ${police}`;
      lc = v.largeur ? v.largeur[i] : ctx.measureText("M").width / dpr;

      // Une phrase complète, caractère par caractère sur une grille fixe.
      bandeau = document.createElement("canvas");
      bandeau.width = Math.ceil(lettres.length * lc * dpr);
      bandeau.height = Math.ceil(lh * dpr);
      const g = bandeau.getContext("2d")!;
      g.font = `${taille * dpr}px ${police}`;
      g.fillStyle = couleur;
      g.textBaseline = "middle";
      lettres.forEach((ch, k) => g.fillText(ch, k * lc * dpr, (lh * dpr) / 2));

      glyphes = creerGlyphes(lettres, police, taille * dpr, lc * dpr, lh * dpr, couleur);
      glyphesCrete = creerGlyphes(lettres, police, taille * dpr, lc * dpr, lh * dpr, couleurCrete);
      sale = true;
    };

    // Position (en px) du haut de la section par rapport au haut du canvas.
    const origine = () => {
      if (!section?.current) return 0;
      return section.current.getBoundingClientRect().top - canvas.getBoundingClientRect().top;
    };

    const dessiner = (o: number, t: number) => {
      if (!bandeau) return false;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = v.opacite;
      const periode = bandeau.width;
      const premiere = Math.max(0, Math.floor(-o / lh));
      const derniere = Math.ceil((H - o) / lh);
      for (let r = premiere; r <= derniere; r++) {
        const y = (o + r * lh) * dpr;
        let x = -decalage(r) * lc * dpr;
        for (; x < canvas.width; x += periode) ctx.drawImage(bandeau, x, y);
      }
      // Quelques lettres remplacées au hasard.
      ctx.font = `${taille * dpr}px ${police}`;
      ctx.textBaseline = "middle";
      for (const { r, c, car } of gresille) {
        const y = (o + r * lh) * dpr;
        if (y < -lh * dpr || y > canvas.height) continue;
        const x = c * lc * dpr;
        ctx.globalAlpha = 1;
        ctx.clearRect(x, y, Math.ceil(lc * dpr), lh * dpr);
        ctx.globalAlpha = v.opacite * 1.6;
        ctx.fillStyle = couleur;
        ctx.fillText(car, x, y + (lh * dpr) / 2);
      }
      ctx.globalAlpha = 1;

      // Sillage de la souris.
      const inter = lireSillage(canvas.getBoundingClientRect(), t, statique);
      if (inter) {
        appliquerSillage(ctx, inter, { lc, lh, o, dpr, L, H }, (r, c) => {
          if (c < 0 || r < 0) return null;
          const ch = lettres[(c + decalage(r)) % lettres.length];
          return { img: ch === " " ? undefined : glyphes.get(ch), crete: glyphesCrete.get(ch), alpha: v.opacite, fond: null };
        });
      }
      return !!inter;
    };

    const tic = (t: number) => {
      const o = origine();
      if (!statique && t - dernierGresillement > GRESILLEMENT_MS) {
        dernierGresillement = t;
        const premiere = Math.max(0, Math.floor(-o / lh));
        const lignes = Math.ceil(H / lh) + 1;
        const cols = Math.ceil(L / lc);
        gresille = Array.from({ length: Math.round(lignes * cols * PART_GRESILLEMENT) }, () => ({
          r: premiere + Math.floor(Math.random() * lignes),
          c: Math.floor(Math.random() * cols),
          car: ALEATOIRES[Math.floor(Math.random() * ALEATOIRES.length)],
        }));
        sale = true;
      }
      // Tant que le sillage touche ce fond (et une image de plus pour l'effacer), on redessine.
      if (sale || interactionAvant || o !== derniereOrigine || lireSillage(canvas.getBoundingClientRect(), t, statique)) {
        interactionAvant = dessiner(o, t);
        derniereOrigine = o;
        sale = false;
      }
    };

    construire();
    let desabonner: (() => void) | null = null;
    const ro = new ResizeObserver(construire);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      desabonner?.();
      desabonner = e.isIntersecting ? abonner(tic) : null;
    });
    io.observe(section?.current ?? canvas);
    document.fonts?.ready.then(construire);

    return () => {
      desabonner?.();
      ro.disconnect();
      io.disconnect();
    };
  }, [section, variante]);

  if (section) {
    return (
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="sticky top-0 h-[100svh] w-full">
          <canvas ref={canvasRef} className="size-full text-white" />
        </div>
      </div>
    );
  }
  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 size-full text-white" aria-hidden />;
}
