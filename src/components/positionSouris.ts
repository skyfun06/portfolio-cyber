/** Position de la souris, sa vitesse et le sillage laissé par ses mouvements (souris uniquement). */
export const curseur = { x: -9999, y: -9999, actif: false, vitesse: 0, dernierMouvement: 0 };

/** Points du trajet récent, en coordonnées d'écran, avec la direction du mouvement (vecteur unitaire). */
export const sillage: { x: number; y: number; nx: number; ny: number; force: number; t: number }[] = [];

/** Un point de sillage tous les PAS_SILLAGE px parcourus ; un point vit VIE_SILLAGE ms. */
const PAS_SILLAGE = 12;
export const VIE_SILLAGE = 900;
const MAX_POINTS = 48;

let dernierPoint = { x: 0, y: 0 };

if (typeof window !== "undefined") {
  window.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse") return;
      const t = performance.now();
      const d = curseur.actif ? Math.hypot(e.clientX - curseur.x, e.clientY - curseur.y) : 0;
      const dt = Math.max(1, t - curseur.dernierMouvement);
      // Vitesse lissée, en px/s.
      curseur.vitesse += (Math.min(4000, (d / dt) * 1000) - curseur.vitesse) * 0.3;
      if (!curseur.actif) dernierPoint = { x: e.clientX, y: e.clientY };
      curseur.x = e.clientX;
      curseur.y = e.clientY;
      curseur.actif = true;
      curseur.dernierMouvement = t;

      const [dx, dy] = [e.clientX - dernierPoint.x, e.clientY - dernierPoint.y];
      const l = Math.hypot(dx, dy);
      if (l >= PAS_SILLAGE) {
        sillage.push({ x: e.clientX, y: e.clientY, nx: dx / l, ny: dy / l, force: Math.min(1, curseur.vitesse / 1600), t });
        dernierPoint = { x: e.clientX, y: e.clientY };
        if (sillage.length > MAX_POINTS) sillage.shift();
      }
      while (sillage.length && t - sillage[0].t > VIE_SILLAGE) sillage.shift();
    },
    { passive: true },
  );
  document.addEventListener("pointerleave", () => {
    curseur.actif = false;
  });
}

/** Vitesse actuelle : retombe à zéro quand la souris s'arrête. */
export function vitesseActuelle(t: number) {
  return curseur.vitesse * Math.exp(-(t - curseur.dernierMouvement) / 180);
}
