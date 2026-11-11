/** Fiche personnage (section Profil). Valeurs provisoires : modifie-les librement. */

export const identite = [
  { label: "Nom", valeur: "Borrel" },
  { label: "Classe", valeur: "Développeur indépendant" },
  { label: "Âge", valeur: "18 ans" },
  { label: "Origine", valeur: "Antibes, FR" },
];

/** Attributs sur 10. */
export const attributs = [
  { nom: "Front-end", niveau: 9 },
  { nom: "Back-end", niveau: 7 },
  { nom: "Design d'interface", niveau: 7 },
  { nom: "Produit", niveau: 8 },
  { nom: "Vitesse d'exécution", niveau: 9 },
];

export const parcours = [
  { date: "Lycée", titre: "Bac", texte: "Les premières lignes de code, en parallèle des cours." },
  { date: "Débuts", titre: "Premiers projets", texte: "Des sites pour des proches et des clubs, pour apprendre en livrant." },
  { date: "Produits", titre: "Lancement de mes produits", texte: "WhatItCost, ScanAvis, Gestion AVP : des idées devenues des produits en ligne." },
  { date: "Aujourd'hui", titre: "Auto-entreprise", texte: "Développeur indépendant à Antibes, ouvert aux nouveaux projets." },
];

/** Stack, présentée comme l'équipement du personnage. */
export const equipement = [
  { nom: "Next.js", type: "Framework" },
  { nom: "TypeScript", type: "Langage" },
  { nom: "Tailwind", type: "Style" },
  { nom: "Supabase", type: "Données" },
  { nom: "Vercel", type: "Déploiement" },
];
