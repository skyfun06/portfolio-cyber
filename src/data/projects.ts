import { Clapperboard, Coins, Landmark, LayoutDashboard, QrCode, type LucideIcon } from "lucide-react";

export type Categorie = "SaaS" | "Sites" | "Jeux";
export type Couleur = "bleu" | "ambre" | "violet" | "vert" | "rouge";

export type Projet = {
  id: string;
  numero: string;
  nom: string;
  categorie: Categorie;
  couleur: Couleur;
  icone: LucideIcon;
  description: string;
  descriptionLongue: string;
  stack: string[];
  lienSite?: string;
  lienCode?: string;
  /** Chemin vers une capture dans /public/projets/… (optionnel) */
  image?: string;
  /** Fiche d'infos au survol de l'image (optionnels) */
  annee?: string;
  statut?: string;
};

export const projets: Projet[] = [
  {
    id: "whatitcost",
    numero: "001",
    nom: "WhatItCost",
    categorie: "Jeux",
    couleur: "ambre",
    icone: Clapperboard,
    description: "Le jeu en ligne où l'on devine le budget des films.",
    descriptionLongue:
      "WhatItCost propose une affiche de film et vous demande d'estimer son budget. Plus vous êtes proche, plus vous marquez de points. Parties rapides, classement et nouveaux films chaque jour.",
    stack: ["Next.js", "TypeScript", "Tailwind", "Supabase", "Vercel"],
    lienSite: "https://whatitcost.fr",
    image: "/projets/whatitcost.jpg",
  },
  {
    id: "scanavis",
    numero: "002",
    nom: "ScanAvis",
    categorie: "SaaS",
    couleur: "bleu",
    icone: QrCode,
    description: "Des QR codes qui envoient les avis clients au bon endroit.",
    descriptionLongue:
      "ScanAvis génère des QR codes pour les commerces : les clients satisfaits sont guidés vers les avis publics, les retours négatifs arrivent directement au gérant pour être traités.",
    stack: ["Next.js", "TypeScript", "Tailwind", "Supabase"],
    image: "/projets/scanavis.jpeg",
  },
  {
    id: "gestion-avp",
    numero: "003",
    nom: "Gestion AVP",
    categorie: "SaaS",
    couleur: "violet",
    icone: Landmark,
    description: "La gestion des autorisations, pensée pour les mairies.",
    descriptionLongue:
      "Gestion AVP centralise les demandes d'autorisation des mairies : dépôt, suivi, validation et archivage, dans une interface simple pour les agents.",
    stack: ["Next.js", "TypeScript", "Supabase"],
    image: "/projets/avp.jpeg",
  },
  {
    id: "bamboorush",
    numero: "004",
    nom: "BambooRush",
    categorie: "Sites",
    couleur: "vert",
    icone: Coins,
    description: "La plateforme qui récompense les utilisateurs pour leurs offres complétées.",
    descriptionLongue:
      "BambooRush permet de gagner des Bamboos en répondant à des sondages, en testant des applis ou en jouant, puis de les échanger contre de l'argent PayPal, des cryptomonnaies, des Robux ou des cartes cadeaux. Classement, parrainage et chat en direct intégrés.",
    stack: ["Next.js", "TypeScript", "Tailwind"],
    lienSite: "https://bamboorush.com",
    image: "/projets/bamboorush.jpg",
  },
  {
    id: "log-pose",
    numero: "005",
    nom: "Log Pose",
    categorie: "Sites",
    couleur: "vert",
    icone: LayoutDashboard,
    description: "Mon tableau de bord personnel : mails, TikTok et le reste.",
    descriptionLongue:
      "Log Pose rassemble au même endroit ce que je suis au quotidien : mes mails, les statistiques TikTok et mes notes. Un outil personnel, construit pour aller vite.",
    stack: ["Next.js", "TypeScript", "Tailwind"],
    image: "/projets/logpose.jpeg",
  },
];

export const projetALaUne = projets[0];
