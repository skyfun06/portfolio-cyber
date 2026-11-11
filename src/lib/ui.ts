import { Briefcase, House, Mail, User, type LucideIcon } from "lucide-react";
import type { Couleur } from "@/data/projects";

export type SectionId = "accueil" | "projets" | "a-propos" | "contact";

export const sections: { id: SectionId; label: string; icone: LucideIcon }[] = [
  { id: "accueil", label: "Accueil", icone: House },
  { id: "projets", label: "Projets", icone: Briefcase },
  { id: "a-propos", label: "À propos", icone: User },
  { id: "contact", label: "Contact", icone: Mail },
];

export const filtres = ["Tout", "SaaS", "Sites", "Jeux"] as const;
export type Filtre = (typeof filtres)[number];

/** Teintes de verre désaturées et translucides. */
export const teintes: Record<Couleur, { fond: string; trait: string }> = {
  bleu: { fond: "rgba(110, 150, 210, 0.22)", trait: "#8fb3e8" },
  ambre: { fond: "rgba(215, 165, 90, 0.22)", trait: "#e8c08a" },
  violet: { fond: "rgba(155, 125, 205, 0.22)", trait: "#b9a2e3" },
  vert: { fond: "rgba(115, 175, 135, 0.22)", trait: "#9dd1ad" },
  rouge: { fond: "rgba(205, 110, 110, 0.22)", trait: "#e59a9a" },
};

export const easeDoux = [0.22, 1, 0.36, 1] as const;
