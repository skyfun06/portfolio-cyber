"use client";

import { motion, type MotionValue } from "framer-motion";
import { useEffect, useRef } from "react";

/** Phrases par défaut ; les anneaux les utilisent tour à tour. */
export const PHRASES_TUNNEL = ["BORREL — DÉVELOPPEUR — ANTIBES — "];

const ANNEAUX = { ordinateur: 15, telephone: 10 };
const TAILLE_LETTRE = { centre: 6, bord: 22 }; // px
const OPACITE = { centre: 0.25, bord: 0.9 };
const PART_CACHEE = 0.04;
const PART_ROUGE = 0.12; // lettres en couleur d'accent en permanence
const GRESILLEMENT_MS = 180;
const SOURIS_MAX = 20; // px : décalage du centre avec la souris
/** Lettres proches du curseur : repoussées et allumées. */
const AURA = { rayon: 130, poussee: 22 };
/** Particules aspirées vers le centre. */
const PARTICULES = { ordinateur: 150, telephone: 70 };
/** Entrée : on sort du fond du vortex en marche arrière (zoom fort + rotation folle qui se calment). */
const INTRO = { delai: 250, duree: 2400, zoom: 11, rotation: 30 };

type Anneau = {
  rayon: number;
  taille: number;
  opacite: number;
  vitesse: number; // rad/s, signée
  angle: number;
  lettres: string[];
  cachee: Uint8Array;
  rouge: Uint8Array; // lettre en couleur d'accent en permanence
  accent: Float64Array; // instant (ms) jusqu'auquel la lettre clignote en couleur d'accent
};

type Particule = { angle: number; rayon: number; vitesse: number; blanche: boolean };

const doux = (x: number) => x * x * (3 - 2 * x);
const borne = (x: number) => Math.min(1, Math.max(0, x));

const TAILLE_ATLAS = 64; // px : chaque lettre est pré-dessinée à cette taille, puis réduite

type Glyphe = { image: HTMLCanvasElement; l: number; h: number };

/** Pré-dessine chaque caractère une fois : recopier une image coûte bien moins cher que fillText. */
function creerAtlas(caracteres: string[], police: string, couleur: string) {
  const atlas = new Map<string, Glyphe>();
  const mesure = document.createElement("canvas").getContext("2d")!;
  mesure.font = `${TAILLE_ATLAS}px ${police}`;
  for (const c of caracteres) {
    const l = Math.ceil(mesure.measureText(c).width) + 4;
    const h = Math.ceil(TAILLE_ATLAS * 1.3);
    const image = document.createElement("canvas");
    image.width = l;
    image.height = h;
    const g = image.getContext("2d")!;
    g.font = `${TAILLE_ATLAS}px ${police}`;
    g.fillStyle = couleur;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(c, l / 2, h / 2);
    atlas.set(c, { image, l, h });
  }
  return atlas;
}

/** Position du centre du tunnel, en fraction de la zone : avant / après l'élargissement. */
export function centreTunnel(bureau: boolean, e: number): [number, number] {
  return bureau ? [0.79 + (0.5 - 0.79) * e, 0.6 + (0.55 - 0.6) * e] : [0.5, 0.86 + (0.55 - 0.86) * e];
}

/**
 * Tunnel de texte : anneaux concentriques de lettres qui tournent et grésillent, un cœur lumineux
 * et des particules aspirées vers le centre. Les lettres s'écartent et s'allument autour du curseur.
 * `elargir` (0 → 1) recentre le tunnel quand la zone droite prend tout l'écran ;
 * `plongee` (0 → 1) zoome à l'intérieur du vortex (plus on défile vite, plus il tourbillonne).
 */
export default function TextTunnel({
  actif = true,
  intro = false,
  phrases = PHRASES_TUNNEL,
  elargir,
  plongee,
  className = "",
  style,
}: {
  actif?: boolean;
  intro?: boolean;
  phrases?: string[];
  elargir?: MotionValue<number>;
  plongee?: MotionValue<number>;
  className?: string;
  style?: React.ComponentProps<typeof motion.div>["style"];
}) {
  const conteneurRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cle = phrases.join("|");

  useEffect(() => {
    if (!actif) return;
    const conteneur = conteneurRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!conteneur || !canvas || !ctx) return;
    const textes = cle.split("|");

    const statique = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const styles = getComputedStyle(document.documentElement);
    const police = styles.getPropertyValue("--font-mono").trim() || "monospace";
    const accent = styles.getPropertyValue("--color-neon").trim() || "#ff2a2a";
    const couleurTexte = getComputedStyle(conteneur).color;

    let largeur = 0;
    let hauteur = 0;
    let dpr = 1;
    let anneaux: Anneau[] = [];
    let particules: Particule[] = [];
    let rMin = 28;
    let rMax = 1000;
    let sourisActive = false;
    let bureau = true;
    const caracteres = [...new Set(textes.join(""))];
    let atlas = creerAtlas(caracteres, police, couleurTexte);
    let atlasAccent = creerAtlas(caracteres, police, accent);

    const nouvelleParticule = (loin: boolean): Particule => ({
      angle: Math.random() * Math.PI * 2,
      rayon: loin ? rMax * (0.7 + Math.random() * 0.4) : rMin + Math.random() * (rMax - rMin),
      vitesse: 0.25 + Math.random() * 0.45,
      blanche: Math.random() < 0.35,
    });

    // Construit les anneaux pour la taille actuelle.
    const construire = () => {
      const r = conteneur.getBoundingClientRect();
      largeur = r.width;
      hauteur = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(largeur * dpr);
      canvas.height = Math.round(hauteur * dpr);
      bureau = window.innerWidth >= 768;
      sourisActive = bureau && window.matchMedia("(pointer: fine)").matches;

      const n = bureau ? ANNEAUX.ordinateur : ANNEAUX.telephone;
      const [fx, fy] = centreTunnel(bureau, 0);
      const [cx, cy] = [largeur * fx, hauteur * fy];
      const coinLePlusLoin = Math.max(
        Math.hypot(cx, cy),
        Math.hypot(largeur - cx, cy),
        Math.hypot(cx, hauteur - cy),
        Math.hypot(largeur - cx, hauteur - cy),
      );
      rMin = Math.max(28, Math.min(largeur, hauteur) * 0.06);
      rMax = coinLePlusLoin * 1.05;
      const raison = Math.pow(rMax / rMin, 1 / (n - 1)); // espacement exponentiel

      anneaux = Array.from({ length: n }, (_, i) => {
        const t = i / (n - 1);
        const phrase = textes[i % textes.length];
        const rayon = rMin * Math.pow(raison, i);
        const taille = TAILLE_LETTRE.centre + (TAILLE_LETTRE.bord - TAILLE_LETTRE.centre) * t;
        const pas = taille * 1.15; // largeur d'une lettre mono + espacement généreux
        // Nombre entier de phrases par anneau : pas de mot coupé là où le cercle se referme.
        const brut = Math.max(8, Math.floor((2 * Math.PI * rayon) / pas));
        const nb = brut >= phrase.length ? Math.round(brut / phrase.length) * phrase.length : brut;
        const decalage = Math.floor(Math.random() * phrase.length);
        const lettres = Array.from({ length: nb }, (_, j) => phrase[(j + decalage) % phrase.length]);
        const cachee = new Uint8Array(nb);
        const rouge = new Uint8Array(nb);
        for (let j = 0; j < nb; j++) {
          cachee[j] = Math.random() < PART_CACHEE ? 1 : 0;
          rouge[j] = Math.random() < PART_ROUGE ? 1 : 0;
        }
        return {
          rayon,
          taille,
          opacite: OPACITE.centre + (OPACITE.bord - OPACITE.centre) * t,
          vitesse: ((2 * Math.PI) / (60 + Math.random() * 60)) * (i % 2 ? -1 : 1),
          angle: Math.random() * Math.PI * 2,
          lettres,
          cachee,
          rouge,
          accent: new Float64Array(nb),
        };
      });
      particules = Array.from({ length: bureau ? PARTICULES.ordinateur : PARTICULES.telephone }, () => nouvelleParticule(false));
    };

    // Souris : position dans la zone (pour l'aura) et décalage cible du centre, lissé à chaque image.
    const souris = { x: 0, y: 0, cx: 0, cy: 0, px: -9999, py: -9999, force: 0, dedans: false };
    const surSouris = (e: PointerEvent) => {
      if (!sourisActive) return;
      const r = conteneur.getBoundingClientRect();
      souris.px = e.clientX - r.left;
      souris.py = e.clientY - r.top;
      souris.dedans = souris.px >= 0 && souris.py >= 0 && souris.px <= r.width && souris.py <= r.height;
      souris.x = souris.dedans ? (souris.px / r.width - 0.5) * 2 * SOURIS_MAX : 0;
      souris.y = souris.dedans ? (souris.py / r.height - 0.5) * 2 * SOURIS_MAX : 0;
    };
    const quitterSouris = () => {
      souris.x = souris.y = 0;
      souris.dedans = false;
    };

    // Grésillement : quelques lettres apparaissent / disparaissent, rarement une lettre en accent.
    let dernierGresillement = 0;
    const gresiller = (maintenant: number) => {
      for (const a of anneaux) {
        if (Math.random() < 0.5) {
          // On échange une lettre visible et une cachée : la proportion reste stable.
          const j = Math.floor(Math.random() * a.lettres.length);
          const l = Math.floor(Math.random() * a.lettres.length);
          if (a.cachee[j] !== a.cachee[l]) [a.cachee[j], a.cachee[l]] = [a.cachee[l], a.cachee[j]];
        }
        if (Math.random() < 0.18) a.accent[Math.floor(Math.random() * a.lettres.length)] = maintenant + 150 + Math.random() * 200;
      }
    };

    const debutIntro = performance.now() + INTRO.delai;
    let precedent = 0;
    let plongeePrecedente = 0;
    let elan = 0; // vitesse de défilement lissée
    const dessiner = (maintenant: number) => {
      const dt = precedent ? Math.min(0.05, (maintenant - precedent) / 1000) : 0;
      precedent = maintenant;

      if (!statique && maintenant - dernierGresillement > GRESILLEMENT_MS) {
        gresiller(maintenant);
        dernierGresillement = maintenant;
      }

      souris.cx += (souris.x - souris.cx) * 0.06;
      souris.cy += (souris.y - souris.cy) * 0.06;
      souris.force += ((souris.dedans ? 1 : 0) - souris.force) * 0.1;

      // Plongée : zoom x1 → x8 dans le vortex, puis fondu pendant que la page suivante s'ouvre.
      const brut = statique ? 0 : borne(plongee?.get() ?? 0);
      if (dt > 0) {
        const vitesseScroll = Math.abs(brut - plongeePrecedente) / dt;
        elan += (Math.min(4, vitesseScroll * 6) - elan) * 0.08;
      }
      plongeePrecedente = brut;
      const p = doux(brut);
      const e = statique ? 0 : doux(borne(elargir?.get() ?? 0));
      const ti = intro && !statique ? borne((maintenant - debutIntro) / INTRO.duree) : 1;
      const reste = Math.pow(1 - ti, 4); // 1 → 0, rapide puis très doux
      const zoom = (1 + 7 * p) * (1 + INTRO.zoom * reste);
      const tourbillon = (1 + INTRO.rotation * reste * reste) * (1 + elan * 3);
      const fondu = (1 - 0.85 * doux(borne((p - 0.5) / 0.5))) * Math.min(1, ti * 4);
      const [fx, fy] = centreTunnel(bureau, e);

      const cx = largeur * fx + souris.cx;
      const cy = hauteur * fy + souris.cy;
      const diagonale = Math.hypot(largeur, hauteur);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Cœur : halo rouge qui respire au fond du trou.
      const pouls = 0.75 + 0.25 * Math.sin(maintenant / 650);
      const rCoeur = rMin * 3.2 * zoom;
      const halo = ctx.createRadialGradient(cx * dpr, cy * dpr, 0, cx * dpr, cy * dpr, rCoeur * dpr);
      halo.addColorStop(0, `rgba(255, 70, 70, ${0.32 * pouls * fondu})`);
      halo.addColorStop(0.25, `rgba(255, 42, 42, ${0.14 * pouls * fondu})`);
      halo.addColorStop(1, "rgba(255, 42, 42, 0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Particules aspirées : de petites traînées qui filent vers le centre.
      ctx.lineCap = "round";
      for (const pt of particules) {
        if (!statique) {
          pt.rayon *= Math.exp(-pt.vitesse * (1 + elan * 4 + reste * 6) * dt);
          if (pt.rayon < rMin * 0.6) Object.assign(pt, nouvelleParticule(true));
        }
        const rr = pt.rayon * zoom;
        if (rr > diagonale) continue;
        const cos = Math.cos(pt.angle);
        const sin = Math.sin(pt.angle);
        const trainee = rr * (0.04 + 0.05 * elan);
        const proximite = 1 - borne((pt.rayon - rMin) / (rMax - rMin)); // plus brillante en approchant du centre
        ctx.strokeStyle = pt.blanche ? `rgba(255,255,255,${(0.15 + 0.45 * proximite) * fondu})` : `rgba(255,42,42,${(0.25 + 0.6 * proximite) * fondu})`;
        ctx.lineWidth = (0.6 + 1.4 * (1 - proximite)) * dpr;
        ctx.beginPath();
        ctx.moveTo((cx + cos * rr) * dpr, (cy + sin * rr) * dpr);
        ctx.lineTo((cx + cos * (rr + trainee)) * dpr, (cy + sin * (rr + trainee)) * dpr);
        ctx.stroke();
      }

      const aura = AURA.rayon * souris.force;
      const aura2 = aura * aura;

      for (const a of anneaux) {
        if (!statique) a.angle += a.vitesse * dt * tourbillon;
        const rayon = a.rayon * zoom;
        const taille = a.taille * zoom;
        // Anneau entièrement hors de la zone : inutile de le dessiner.
        if (rayon - taille > diagonale) continue;

        const k = (taille * dpr) / TAILLE_ATLAS;
        const alpha = a.opacite * fondu;
        const nb = a.lettres.length;
        const pasAngle = (Math.PI * 2) / nb;

        for (let j = 0; j < nb; j++) {
          if (a.cachee[j]) continue;
          const theta = a.angle + j * pasAngle;
          let x = cx + Math.cos(theta) * rayon;
          let y = cy + Math.sin(theta) * rayon;
          if (x < -taille || x > largeur + taille || y < -taille || y > hauteur + taille) continue;

          // Aura du curseur : la lettre s'écarte et s'allume.
          let proche = 0;
          if (aura > 1) {
            const dx = x - souris.px;
            const dy = y - souris.py;
            const d2 = dx * dx + dy * dy;
            if (d2 < aura2) {
              const d = Math.sqrt(d2) || 1;
              proche = 1 - d / aura;
              const pousse = AURA.poussee * proche * proche;
              x += (dx / d) * pousse;
              y += (dy / d) * pousse;
            }
          }

          const flash = a.accent[j] > maintenant;
          const enAccent = flash || a.rouge[j] === 1 || proche > 0.3;
          const g = (enAccent ? atlasAccent : atlas).get(a.lettres[j]);
          if (!g) continue;
          ctx.globalAlpha = flash ? fondu : Math.min(1, alpha + proche * 0.9 * fondu);
          const echelle = k * (1 + proche * 0.5);
          // Lettre posée sur le cercle, tournée pour suivre la courbe.
          const c = -Math.sin(theta) * echelle; // cos(θ + π/2)
          const s = Math.cos(theta) * echelle; // sin(θ + π/2)
          ctx.setTransform(c, s, -s, c, x * dpr, y * dpr);
          ctx.drawImage(g.image, -g.l / 2, -g.h / 2);
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      ctx.globalAlpha = 1;
    };

    // Boucle unique, en pause hors écran ou onglet caché.
    let raf = 0;
    let visible = true;
    const boucle = (t: number) => {
      dessiner(t);
      raf = requestAnimationFrame(boucle);
    };
    const relancer = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      precedent = 0;
      if (statique) {
        requestAnimationFrame(dessiner);
        return;
      }
      if (visible && !document.hidden) raf = requestAnimationFrame(boucle);
    };

    construire();
    const ro = new ResizeObserver(() => {
      construire();
      relancer();
    });
    ro.observe(conteneur);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      relancer();
    });
    io.observe(conteneur);
    const surVisibilite = () => relancer();
    document.addEventListener("visibilitychange", surVisibilite);
    // Écoute sur la fenêtre : le texte posé par-dessus le tunnel ne bloque pas l'aura.
    window.addEventListener("pointermove", surSouris, { passive: true });
    document.documentElement.addEventListener("pointerleave", quitterSouris);
    // Les polices peuvent arriver après le premier dessin.
    document.fonts?.ready.then(() => {
      atlas = creerAtlas(caracteres, police, couleurTexte);
      atlasAccent = creerAtlas(caracteres, police, accent);
      relancer();
    });
    relancer();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", surVisibilite);
      window.removeEventListener("pointermove", surSouris);
      document.documentElement.removeEventListener("pointerleave", quitterSouris);
    };
  }, [actif, intro, cle, elargir, plongee]);

  return (
    <motion.div ref={conteneurRef} className={`overflow-hidden ${className}`} style={style}>
      <canvas ref={canvasRef} className="absolute inset-0 size-full" aria-hidden />
    </motion.div>
  );
}
