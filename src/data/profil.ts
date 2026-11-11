/** Fiche personnage (section Profil). Modifie librement les valeurs ici. */

export const identite = [
  { label: "Nom", valeur: "Borrel" },
  { label: "Classe", valeur: "Développeur indépendant" },
  { label: "Âge", valeur: "18 ans" },
  { label: "Origine", valeur: "Antibes, FR" },
];

/** Attributs sur 10 (affichés en radar). */
export const attributs = [
  { nom: "Front-end", court: "FRONT", niveau: 9 },
  { nom: "Back-end", court: "BACK", niveau: 7 },
  { nom: "Design d'interface", court: "DESIGN", niveau: 7 },
  { nom: "Produit", court: "PRODUIT", niveau: 8 },
  { nom: "Vitesse d'exécution", court: "VITESSE", niveau: 9 },
];

export type EtatQuete = "terminee" | "en-cours";

/** Parcours, présenté comme un journal de quêtes. */
export const parcours: { date: string; titre: string; texte: string; etat: EtatQuete }[] = [
  { date: "Lycée", titre: "Bac", texte: "Les premières lignes de code, en parallèle des cours.", etat: "terminee" },
  { date: "Débuts", titre: "Premiers projets", texte: "Des sites pour des proches et des clubs, pour apprendre en livrant.", etat: "terminee" },
  { date: "Produits", titre: "Lancement de mes produits", texte: "WhatItCost, ScanAvis, Gestion AVP : des idées devenues des produits en ligne.", etat: "terminee" },
  { date: "Aujourd'hui", titre: "Auto-entreprise", texte: "Développeur indépendant à Antibes, ouvert aux nouveaux projets.", etat: "en-cours" },
];

export type Rarete = "legendaire" | "epique" | "rare";

/** Stack, présentée comme l'inventaire du personnage. */
export const equipement: { nom: string; sigle: string; type: string; rarete: Rarete; effet: string }[] = [
  { nom: "Next.js", sigle: "N", type: "Framework", rarete: "legendaire", effet: "Sites et applis rapides, bien référencés, prêts pour la production." },
  { nom: "TypeScript", sigle: "TS", type: "Langage", rarete: "legendaire", effet: "Un code typé : moins de bugs, des évolutions plus sereines." },
  { nom: "Supabase", sigle: "SB", type: "Données", rarete: "epique", effet: "Base de données, comptes utilisateurs et stockage, en quelques heures." },
  { nom: "Tailwind", sigle: "TW", type: "Style", rarete: "epique", effet: "Des interfaces sur mesure, cohérentes sur tous les écrans." },
  { nom: "Vercel", sigle: "▲", type: "Déploiement", rarete: "rare", effet: "Mise en ligne en un clic, rapide partout dans le monde." },
];

/** Succès débloqués : uniquement des faits vérifiables. */
export const succes = [
  { titre: "Premier client", texte: "Des sites livrés pour des proches et des clubs." },
  { titre: "En production", texte: "Un premier produit en ligne, ouvert au public." },
  { titre: "Série de 5", texte: "Cinq produits conçus et lancés." },
  { titre: "Service public", texte: "Un outil pensé pour les mairies." },
  { titre: "Full stack", texte: "Interface, données et mise en ligne maîtrisées." },
  { titre: "Solo de A à Z", texte: "Chaque produit mené seul, du croquis au lancement." },
];
