"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { abonner } from "./boucle";

/** Du plus clair au plus dense. */
const RAMPE = " .:-=+*#%@";
/** Traits de contour, choisis selon la direction du bord. */
const TRAITS = "-/|\\";
/** Tous les caractères d'une grille : la rampe, puis les traits. */
const CARACTERES = RAMPE + TRAITS;
const CELLULE = { ordinateur: [6, 10], telephone: [5, 9] } as const; // largeur × hauteur (px)
const OPACITE = 0.55;
const DUREE = { entree: 400, sortie: 300, remplissage: 600 };
const GRESILLEMENT_MS = 150;
const ALEATOIRES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%@*+=-:";

type Grille = { cols: number; rows: number; idx: Uint8Array };

/** Grilles déjà calculées, par source et par taille. */
const cache = new Map<string, Grille>();
const images = new Map<string, Promise<HTMLImageElement>>();

function chargerImage(src: string) {
  let p = images.get(src);
  if (!p) {
    p = new Promise((ok, ko) => {
      const img = new window.Image();
      img.onload = () => ok(img);
      img.onerror = ko;
      img.src = src;
    });
    images.set(src, p);
  }
  return p;
}

/** Remplacement : le nom en très grosses lettres blanches sur noir, converti ensuite comme une photo. */
function imageDuNom(nom: string, ratio: number) {
  const c = document.createElement("canvas");
  c.width = 1200;
  c.height = Math.round(1200 / ratio);
  const g = c.getContext("2d")!;
  g.fillStyle = "#000";
  g.fillRect(0, 0, c.width, c.height);
  const police = getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim() || "sans-serif";
  const mots = nom.toUpperCase().split(" ");
  const lignes = mots.length > 1 && nom.length > 12 ? [mots.slice(0, Math.ceil(mots.length / 2)).join(" "), mots.slice(Math.ceil(mots.length / 2)).join(" ")] : [nom.toUpperCase()];
  g.font = `700 100px ${police}`;
  const large = Math.max(...lignes.map((l) => g.measureText(l).width));
  const taille = Math.min((c.width * 0.86 * 100) / large, (c.height * 0.7) / lignes.length);
  g.font = `700 ${taille}px ${police}`;
  g.fillStyle = "#fff";
  g.textAlign = "center";
  g.textBaseline = "middle";
  lignes.forEach((l, i) => g.fillText(l, c.width / 2, c.height / 2 + (i - (lignes.length - 1) / 2) * taille * 1.05));
  return c;
}

/** Réduit la source (recadrée comme object-cover) à une case par caractère et convertit la luminosité. */
function calculerGrille(source: HTMLImageElement | HTMLCanvasElement, cols: number, rows: number, ratio: number): Grille {
  const c = document.createElement("canvas");
  c.width = cols;
  c.height = rows;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  const [w, h] = [source.width, source.height];
  let [sw, sh] = [w, h];
  if (w / h > ratio) sw = h * ratio;
  else sh = w / ratio;
  g.drawImage(source, (w - sw) / 2, (h - sh) / 2, sw, sh, 0, 0, cols, rows);
  const d = g.getImageData(0, 0, cols, rows).data;
  const n = cols * rows;
  const lum = new Float32Array(n);
  let moyenne = 0;
  for (let i = 0; i < n; i++) {
    lum[i] = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255;
    moyenne += lum[i] / n;
  }
  // Image surtout claire (fond blanc d'interface) : on l'inverse, le fond devient du vide.
  if (moyenne > 0.5) for (let i = 0; i < n; i++) lum[i] = 1 - lum[i];

  // Contraste étiré entre les percentiles 2 et 98 : toute la gamme de caractères est utilisée.
  const tri = Float32Array.from(lum).sort();
  const [bas, haut] = [tri[Math.floor(n * 0.02)], tri[Math.floor(n * 0.98)]];
  const ecart = Math.max(0.05, haut - bas);
  for (let i = 0; i < n; i++) lum[i] = Math.pow(Math.min(1, Math.max(0, (lum[i] - bas) / ecart)), 0.8);

  // Contours (Sobel) : les formes restent lisibles même dans les zones uniformes.
  const L = (x: number, y: number) => lum[Math.min(rows - 1, Math.max(0, y)) * cols + Math.min(cols - 1, Math.max(0, x))];
  const idx = new Uint8Array(n);
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const gx = L(x + 1, y - 1) + 2 * L(x + 1, y) + L(x + 1, y + 1) - L(x - 1, y - 1) - 2 * L(x - 1, y) - L(x - 1, y + 1);
      const gy = L(x - 1, y + 1) + 2 * L(x, y + 1) + L(x + 1, y + 1) - L(x - 1, y - 1) - 2 * L(x, y - 1) - L(x + 1, y - 1);
      const contour = Math.min(1, Math.hypot(gx, gy) * 0.6);
      const l = lum[y * cols + x] * 0.8;
      // Bord net et plus marqué que la luminosité : un trait qui suit sa direction.
      if (contour > 0.45 && contour > l + 0.15) {
        const angle = (Math.atan2(gy, gx) + Math.PI / 2 + Math.PI) % Math.PI; // direction du bord, 0 → π
        idx[y * cols + x] = RAMPE.length + (Math.round(angle / (Math.PI / 4)) % 4);
        continue;
      }
      let v = Math.max(l, contour * 0.95);
      if (v < 0.07) v = 0; // fond calme : vide, on voit le texte derrière
      idx[y * cols + x] = Math.min(RAMPE.length - 1, Math.floor(v * RAMPE.length));
    }
  return { cols, rows, idx };
}

function creerAtlas(police: string, l: number, h: number, couleur: string) {
  const atlas = new Map<string, HTMLCanvasElement>();
  for (const ch of new Set([...CARACTERES, ...ALEATOIRES])) {
    const img = document.createElement("canvas");
    img.width = l;
    img.height = h;
    const g = img.getContext("2d")!;
    g.font = `${h * 0.82}px ${police}`;
    g.fillStyle = couleur;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(ch, l / 2, h / 2);
    atlas.set(ch, img);
  }
  return atlas;
}

const doux = (x: number) => 1 - Math.pow(1 - x, 3);

/**
 * Image dessinée en caractères, posée sans cadre sur le fond (bords fondus).
 * La vraie photo se révèle au survol (ou au milieu de l'écran sur téléphone) par un balayage circulaire.
 * Sans image (ou si elle ne charge pas), le nom du projet est dessiné en grosses lettres de caractères.
 */
export default function AsciiImage({
  src,
  nom,
  alt,
  sizes,
  className = "",
  fiche,
}: {
  src?: string;
  nom: string;
  alt: string;
  sizes: string;
  /** Doit fixer le format, ex. « aspect-[16/10] ». */
  className?: string;
  fiche?: ReactNode;
}) {
  const cadreRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const [erreur, setErreur] = useState(false);
  const [revele, setRevele] = useState(false);
  const [reduire, setReduire] = useState(false);
  const photo = !!src && !erreur;

  useEffect(() => {
    const cadre = cadreRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!cadre || !canvas || !ctx) return;

    const statique = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduire(statique);
    const tactile = window.matchMedia("(hover: none)").matches;
    const police = getComputedStyle(document.documentElement).getPropertyValue("--font-mono").trim() || "monospace";
    const couleur = getComputedStyle(cadre).color;

    let source: HTMLImageElement | HTMLCanvasElement | null = null;
    let grille: Grille | null = null;
    let atlas = new Map<string, HTMLCanvasElement>();
    let [cw, ch, dpr] = [7, 12, 1];
    let annule = false;
    let visible = false;
    let sale = true;

    // Remplissage de haut en bas à la première apparition.
    let remplissage = statique ? 1 : 0;
    let debutRemplissage = 0;
    // Révélation : 0 = caractères, 1 = photo. Balayage circulaire depuis `origine` (en cases).
    let progres = 0;
    let anim: { de: number; vers: number; debut: number; duree: number } | null = null;
    let origine = { x: 0, y: 0 };
    let gresillement = new Set<number>();
    let dernierGresillement = 0;

    const preparer = () => {
      if (!source) return;
      const r = cadre.getBoundingClientRect();
      if (!r.width || !r.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      [cw, ch] = tactile ? CELLULE.telephone : CELLULE.ordinateur;
      const cols = Math.max(4, Math.floor(r.width / cw));
      const rows = Math.max(4, Math.floor(r.height / ch));
      cw = r.width / cols;
      ch = r.height / rows;
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      const cle = `${photo ? src : `nom:${nom}`}|${cols}x${rows}`;
      grille = cache.get(cle) ?? calculerGrille(source, cols, rows, r.width / r.height);
      cache.set(cle, grille);
      atlas = creerAtlas(police, Math.ceil(cw * dpr), Math.ceil(ch * dpr), couleur);
      sale = true;
      if (!visible) dessiner(); // premier dessin même hors écran (redimensionnement)
    };

    const rayonCases = () => {
      if (!grille) return 0;
      const { cols, rows } = grille;
      const loin = Math.max(
        Math.hypot(origine.x, origine.y),
        Math.hypot(cols - origine.x, origine.y),
        Math.hypot(origine.x, rows - origine.y),
        Math.hypot(cols - origine.x, rows - origine.y),
      );
      return doux(progres) * (loin + 2);
    };

    const dessiner = () => {
      if (!grille) return;
      const { cols, rows, idx } = grille;
      const [lp, hp] = [cw * dpr, ch * dpr];
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = OPACITE;

      const rayon = rayonCases();
      const bord = 1.6;
      const enBalayage = progres > 0 && progres < 1;
      const lignesVisibles = Math.ceil(doux(remplissage) * rows);

      for (let y = 0; y < lignesVisibles; y++) {
        for (let x = 0; x < cols; x++) {
          const d = progres > 0 ? Math.hypot(x + 0.5 - origine.x, y + 0.5 - origine.y) : Infinity;
          if (d < rayon - bord) continue; // case révélée
          const i = y * cols + x;
          let c = CARACTERES[idx[i]];
          // Bord du balayage, dernière ligne du remplissage, grésillement : caractères au hasard.
          if ((enBalayage && d < rayon) || gresillement.has(i) || (remplissage < 1 && y === lignesVisibles - 1)) {
            if (c === " " && !(enBalayage && d < rayon)) continue;
            c = ALEATOIRES[Math.floor(Math.random() * ALEATOIRES.length)];
          }
          if (c === " ") continue;
          const glyphe = atlas.get(c);
          if (glyphe) ctx.drawImage(glyphe, x * lp, y * hp);
        }
      }
      ctx.globalAlpha = 1;

      // La photo n'est visible que dans le cercle déjà balayé (bords nets).
      const ph = photoRef.current;
      if (ph && !statique) {
        const rpx = progres <= 0 ? 0 : progres >= 1 ? 99999 : rayon * Math.max(cw, ch);
        ph.style.clipPath = `circle(${rpx}px at ${origine.x * cw}px ${origine.y * ch}px)`;
      }
    };

    const tic = (t: number) => {
      if (!grille) return;
      if (remplissage < 1) {
        if (!debutRemplissage) debutRemplissage = t;
        remplissage = Math.min(1, (t - debutRemplissage) / DUREE.remplissage);
        sale = true;
      }
      if (anim) {
        const k = Math.min(1, (t - anim.debut) / anim.duree);
        progres = anim.de + (anim.vers - anim.de) * k;
        if (k >= 1) anim = null;
        sale = true;
      }
      if (!statique && progres === 0 && !anim && remplissage >= 1 && t - dernierGresillement > GRESILLEMENT_MS) {
        dernierGresillement = t;
        const n = Math.round(grille.idx.length * 0.02);
        gresillement = new Set(Array.from({ length: n }, () => Math.floor(Math.random() * grille!.idx.length)));
        sale = true;
      }
      if (sale) {
        dessiner();
        sale = false;
      }
    };

    const lancer = (cible: number, o: { x: number; y: number }) => {
      if (!grille || !photo) return;
      setRevele(cible === 1);
      if (statique) return; // simple fondu CSS
      origine = o;
      anim = {
        de: progres,
        vers: cible,
        debut: performance.now(),
        duree: (cible === 1 ? DUREE.entree : DUREE.sortie) * Math.max(0.2, Math.abs(cible - progres)),
      };
      gresillement = new Set();
    };

    const caseSouris = (e: PointerEvent) => {
      const r = cadre.getBoundingClientRect();
      return { x: (e.clientX - r.left) / cw, y: (e.clientY - r.top) / ch };
    };
    const centre = () => ({ x: (grille?.cols ?? 0) / 2, y: (grille?.rows ?? 0) / 2 });
    const entrer = (e: PointerEvent) => e.pointerType === "mouse" && lancer(1, caseSouris(e));
    const sortir = (e: PointerEvent) => e.pointerType === "mouse" && lancer(0, caseSouris(e));

    const r0 = cadre.getBoundingClientRect();
    const ratio = r0.width && r0.height ? r0.width / r0.height : 16 / 10;
    (photo ? chargerImage(src!) : Promise.resolve(imageDuNom(nom, ratio)))
      .then((s) => {
        if (annule) return;
        source = s;
        preparer();
      })
      .catch(() => !annule && setErreur(true)); // échec : version « nom en grosses lettres »

    const ro = new ResizeObserver(() => preparer());
    ro.observe(cadre);

    let desabonner: (() => void) | null = null;
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        desabonner?.();
        desabonner = visible ? abonner(tic) : null;
        if (tactile) lancer(e.intersectionRatio >= 0.6 ? 1 : 0, centre());
      },
      { threshold: [0, 0.6] },
    );
    io.observe(cadre);
    if (!tactile) {
      cadre.addEventListener("pointerenter", entrer);
      cadre.addEventListener("pointerleave", sortir);
    }

    return () => {
      annule = true;
      desabonner?.();
      ro.disconnect();
      io.disconnect();
      cadre.removeEventListener("pointerenter", entrer);
      cadre.removeEventListener("pointerleave", sortir);
    };
  }, [src, nom, photo]);

  return (
    <div ref={cadreRef} className={`relative text-white ${className}`}>
      {photo && (
        // Photo bien visible sous les caractères, couleurs adoucies ; nette au survol.
        <div className="fondu-bords absolute inset-0 overflow-hidden opacity-60 saturate-[0.6]" aria-hidden>
          <Image src={src!} alt="" fill sizes={sizes} quality={60} className="object-cover" />
        </div>
      )}
      {photo && (
        <div
          ref={photoRef}
          className={`absolute inset-0 overflow-hidden ${reduire ? `transition-opacity duration-300 ${revele ? "opacity-100" : "opacity-0"}` : ""}`}
          style={reduire ? undefined : { clipPath: "circle(0px at 0 0)" }}
        >
          <Image
            src={src!}
            alt={alt}
            fill
            sizes={sizes}
            quality={90}
            onError={() => setErreur(true)}
            className={`object-cover transition-transform duration-500 ease-out ${revele ? "scale-[1.02]" : ""}`}
          />
        </div>
      )}
      <canvas
        ref={canvasRef}
        aria-hidden
        className={`fondu-bords absolute inset-0 size-full ${reduire ? `transition-opacity duration-300 ${revele ? "opacity-0" : "opacity-100"}` : ""}`}
      />
      {fiche && photo && (
        <div
          className={`pointer-events-none absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] transition-all duration-300 [@media(hover:none)]:hidden ${
            revele ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          }`}
        >
          {fiche}
        </div>
      )}
    </div>
  );
}
