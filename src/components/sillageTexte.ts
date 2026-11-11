/**
 * Sillage dans les fonds de texte, comme un bâton qu'on fait glisser dans l'eau :
 * les lettres s'écartent autour du curseur et sur les côtés de sa trajectoire, puis le sillage se referme.
 * Utilisé par tous les canvas de fond (FondTexte, TextSpread).
 */
import { curseur, sillage, VIE_SILLAGE, vitesseActuelle } from "./positionSouris";

const POUSSEE = { rayon: 140, base: 3, max: 18 }; // px
const SILLAGE = { largeurDepart: 26, largeurFin: 110, amplitude: 14, traine: 0.35 }; // px ; traîne = entraînement vers l'avant

export type Interaction = {
  souris: { x: number; y: number; force: number; eclat: number } | null;
  // Points du sillage : position, direction du mouvement, largeur actuelle, force restante.
  vagues: { x: number; y: number; nx: number; ny: number; largeur: number; amplitude: number; vie: number }[];
};

/** Souris et sillage ramenés dans le repère d'un canvas ; null si rien ne le touche. */
export function lireSillage(rect: DOMRect, t: number, statique: boolean): Interaction | null {
  if (statique) return null;
  const [L, H] = [rect.width, rect.height];
  const [lx, ly] = [curseur.x - rect.left, curseur.y - rect.top];
  const R = POUSSEE.rayon;
  const v = vitesseActuelle(t);
  const souris =
    curseur.actif && lx > -R && ly > -R && lx < L + R && ly < H + R
      ? { x: lx, y: ly, force: POUSSEE.base + Math.min(POUSSEE.max, v / 90), eclat: 0.12 + Math.min(0.3, v / 4000) }
      : null;
  const vagues = sillage
    .map((w) => {
      const age = (t - w.t) / VIE_SILLAGE;
      const vie = 1 - age;
      return {
        x: w.x - rect.left,
        y: w.y - rect.top,
        nx: w.nx,
        ny: w.ny,
        // Le sillage s'élargit en vieillissant, et sa force retombe.
        largeur: SILLAGE.largeurDepart + (SILLAGE.largeurFin - SILLAGE.largeurDepart) * Math.sqrt(Math.max(0, age)),
        amplitude: vie ** 1.6 * SILLAGE.amplitude * (0.35 + 0.65 * w.force),
        vie,
      };
    })
    .filter((w) => w.vie > 0 && w.vie <= 1 && w.x > -w.largeur && w.y > -w.largeur && w.x < L + w.largeur && w.y < H + w.largeur);
  return souris || vagues.length ? { souris, vagues } : null;
}

/** Grille de lettres d'un fond : taille des cases (px CSS), décalage vertical et décalage horizontal par ligne. */
export type GrilleTexte = {
  lc: number;
  lh: number;
  /** Position verticale de la ligne 0 dans le canvas (px CSS). */
  o: number;
  dpr: number;
  L: number;
  H: number;
  /** Décalage horizontal de la ligne r (px CSS) : la case c commence à x = c·lc − decalage(r). */
  decalage?: (r: number) => number;
};

/** Lettre de la case (r, c) : son image, son image sur la crête du sillage, son opacité et la couleur pour l'effacer. */
export type LettreCase = { img?: HTMLCanvasElement; crete?: HTMLCanvasElement; alpha: number; fond: string | null } | null;

/** Redessine, décalées et plus lumineuses, les lettres touchées par la souris ou par son sillage. */
export function appliquerSillage(
  ctx: CanvasRenderingContext2D,
  { souris, vagues }: Interaction,
  g: GrilleTexte,
  lettre: (r: number, c: number, xc: number, yc: number) => LettreCase,
) {
  const { lc, lh, o, dpr, L, H } = g;
  // Zone à traiter : boîte englobant la souris et le sillage.
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  if (souris) {
    const R = POUSSEE.rayon;
    [x0, y0, x1, y1] = [souris.x - R, souris.y - R, souris.x + R, souris.y + R];
  }
  for (const v of vagues) {
    [x0, y0, x1, y1] = [Math.min(x0, v.x - v.largeur), Math.min(y0, v.y - v.largeur), Math.max(x1, v.x + v.largeur), Math.max(y1, v.y + v.largeur)];
  }
  if (x0 === Infinity) return;
  x0 = Math.max(0, x0);
  x1 = Math.min(L, x1);
  const r0 = Math.max(Math.floor(-o / lh), Math.floor((y0 - o) / lh));
  const r1 = Math.min(Math.ceil((H - o) / lh), Math.ceil((y1 - o) / lh));

  // Deux passes : on efface toutes les cases touchées, puis on dessine les lettres déplacées
  // (sinon l'effacement d'une case voisine rognerait une lettre déjà décalée).
  const aDessiner: { img: HTMLCanvasElement; x: number; y: number; a: number }[] = [];
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  for (let r = r0; r <= r1; r++) {
    const yCase = o + r * lh;
    const yc = yCase + lh / 2;
    const dec = g.decalage?.(r) ?? 0;
    for (let c = Math.floor((x0 + dec) / lc); c <= Math.ceil((x1 + dec) / lc); c++) {
      const xCase = c * lc - dec;
      const xc = xCase + lc / 2;
      let [dx, dy, eclat, crete] = [0, 0, 0, 0];
      if (souris) {
        const [ex, ey] = [xc - souris.x, yc - souris.y];
        const d = Math.hypot(ex, ey);
        if (d < POUSSEE.rayon && d > 0.01) {
          const k = (1 - d / POUSSEE.rayon) ** 2;
          dx += (ex / d) * souris.force * k;
          dy += (ey / d) * souris.force * k;
          eclat += souris.eclat * k;
        }
      }
      for (const v of vagues) {
        const [ex, ey] = [xc - v.x, yc - v.y];
        const d = Math.hypot(ex, ey);
        if (d > v.largeur) continue;
        // Écart perpendiculaire à la trajectoire : les lettres sont rejetées sur les côtés.
        const le = ex * v.nx + ey * v.ny;
        const [px, py] = [ex - le * v.nx, ey - le * v.ny];
        const cote = Math.hypot(px, py);
        const b = (1 - d / v.largeur) ** 2;
        const f = v.amplitude * b;
        if (cote > 0.01) {
          dx += (px / cote) * f;
          dy += (py / cote) * f;
        }
        // Et un peu entraînées dans le sens du mouvement, comme l'eau derrière le bâton.
        dx += v.nx * f * SILLAGE.traine;
        dy += v.ny * f * SILLAGE.traine;
        eclat += 0.3 * b * v.vie;
        crete = Math.max(crete, b * v.vie * (v.amplitude / SILLAGE.amplitude));
      }
      if (Math.abs(dx) + Math.abs(dy) < 0.4 && eclat < 0.01) continue;

      const l = lettre(r, c, xc, yc);
      if (!l) continue;
      const [px, py] = [xCase * dpr, yCase * dpr];
      if (l.fond) {
        ctx.fillStyle = l.fond;
        ctx.fillRect(px, py, Math.ceil(lc * dpr) + 1, Math.ceil(lh * dpr));
      } else ctx.clearRect(px, py, Math.ceil(lc * dpr) + 1, Math.ceil(lh * dpr));
      const img = crete > 0.55 && l.crete ? l.crete : l.img;
      if (img) aDessiner.push({ img, x: px + dx * dpr - dpr, y: py + dy * dpr, a: Math.min(0.85, l.alpha + eclat) });
    }
  }
  for (const { img, x, y, a } of aDessiner) {
    ctx.globalAlpha = a;
    ctx.drawImage(img, x, y);
  }
  ctx.globalAlpha = 1;
}

/** Pré-dessine chaque caractère d'un texte, à la taille d'une case. */
export function creerGlyphes(caracteres: Iterable<string>, police: string, taille: number, l: number, h: number, couleur: string) {
  const m = new Map<string, HTMLCanvasElement>();
  for (const ch of new Set(caracteres)) {
    const img = document.createElement("canvas");
    img.width = Math.ceil(l) + 2;
    img.height = Math.ceil(h);
    const g = img.getContext("2d")!;
    g.font = `${taille}px ${police}`;
    g.fillStyle = couleur;
    g.textBaseline = "middle";
    g.fillText(ch, 1, img.height / 2);
    m.set(ch, img);
  }
  return m;
}
