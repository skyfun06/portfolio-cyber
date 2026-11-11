/**
 * Script de la séquence de démarrage. Modifie librement les textes ici.
 * - titre       : en-tête, tapé lentement
 * - tache       : tapée, puis « [ .. ] » → « [ OK ] »
 * - alerte      : comme une tâche, mais passe par « [ !! ] » avant de se valider
 * - info        : ligne de détail tapée (sans statut)
 * - progression : barre qui se remplit jusqu'à 100 %
 * - vide        : ligne vide
 * - pret        : message final en grand
 */
export type TypeLigne = "titre" | "tache" | "alerte" | "info" | "progression" | "vide" | "pret";
export type Ligne = { type: TypeLigne; texte: string };

export const script: Ligne[] = [
  { type: "titre", texte: "BORREL//SIM — noyau 2.6.0 · build 4f2a9c1" },
  { type: "vide", texte: "" },
  { type: "tache", texte: "initialisation du noyau" },
  { type: "tache", texte: "vérification mémoire · 16 384 Mo" },
  { type: "info", texte: "secteurs sains .... 100 %" },
  { type: "tache", texte: "montage du système de fichiers" },
  { type: "tache", texte: "liaison réseau · Antibes 43.58N 7.12E" },
  { type: "tache", texte: "chargement des modules · next / ts / tailwind" },
  { type: "alerte", texte: "signal visuel instable · recalibrage" },
  { type: "vide", texte: "" },
  { type: "tache", texte: "création du personnage" },
  { type: "info", texte: "nom ........ BORREL" },
  { type: "info", texte: "classe ..... développeur indépendant" },
  { type: "info", texte: "origine .... Antibes, FR" },
  { type: "info", texte: "statut ..... disponible" },
  { type: "vide", texte: "" },
  { type: "tache", texte: "compilation des projets · 5 trouvés" },
  { type: "progression", texte: "synchronisation" },
  { type: "vide", texte: "" },
  { type: "pret", texte: "SIMULATION PRÊTE" },
];
