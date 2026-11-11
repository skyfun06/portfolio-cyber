/** Une seule boucle requestAnimationFrame partagée, en pause quand plus rien n'y est abonné ou que l'onglet est caché. */

type Tache = (t: number) => void;

const taches = new Set<Tache>();
let raf = 0;

function tour(t: number) {
  raf = 0;
  for (const f of [...taches]) f(t);
  demarrer();
}

function demarrer() {
  if (!raf && taches.size && typeof document !== "undefined" && !document.hidden) raf = requestAnimationFrame(tour);
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else demarrer();
  });
}

/** Ajoute une tâche à la boucle ; renvoie la fonction de désabonnement. */
export function abonner(f: Tache) {
  taches.add(f);
  demarrer();
  return () => {
    taches.delete(f);
  };
}
