"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Hammer, Layers, MapPin, Rocket, Send, type LucideIcon } from "lucide-react";
import { projetALaUne, type Couleur } from "@/data/projects";
import { site } from "@/data/site";
import { teintes, type Filtre } from "@/lib/ui";
import FiltrePills from "../FiltrePills";
import { conteneurDecale, elementDecale } from "../motion";
import { useHeureAntibes } from "../Navigation";
import ProjetVisuel from "../ProjetVisuel";
import { SectionTitre } from "../ui";

type Stat = {
  libelle: string;
  valeur: string;
  pastille: string;
  icone: LucideIcon;
  couleur: Couleur;
  courbe: number[];
};

const stats: Stat[] = [
  { libelle: "Projets lancés", valeur: "5", pastille: "En ligne", icone: Rocket, couleur: "ambre", courbe: [2, 3, 3, 5, 4, 6, 8] },
  { libelle: "En cours", valeur: "2", pastille: "Actif", icone: Hammer, couleur: "bleu", courbe: [3, 5, 4, 6, 5, 7, 6] },
  { libelle: "Stack", valeur: "Next.js", pastille: "Principal", icone: Layers, couleur: "violet", courbe: [4, 4, 5, 5, 6, 7, 7] },
  { libelle: "Basé à", valeur: "Antibes", pastille: "06", icone: MapPin, couleur: "vert", courbe: [5, 4, 6, 5, 7, 6, 8] },
];

const enCeMoment = [
  { titre: "WhatItCost", detail: "Nouveaux modes de jeu" },
  { titre: "ScanAvis", detail: "Tableau de suivi des avis" },
  { titre: "Gestion AVP", detail: "Retours des premières mairies" },
  { titre: "Portfolio", detail: "Cette V1, en direct" },
];

function Courbe({ points, couleur }: { points: number[]; couleur: string }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * 100;
      const y = 28 - ((p - min) / (max - min || 1)) * 24;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-8 w-full" aria-hidden>
      <path d={d} fill="none" stroke={couleur} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function Accueil({
  onFiltre,
  onContact,
}: {
  onFiltre: (f: Filtre) => void;
  onContact: () => void;
}) {
  const heure = useHeureAntibes();
  const salut = heure && (heure.h >= 18 || heure.h < 5) ? "Bonsoir" : "Bonjour";
  const une = projetALaUne;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionTitre
          titre={`${salut}, je suis ${site.nom}`}
          sousTitre="Développeur indépendant à Antibes. Je conçois et lance mes propres produits web."
        />
        <div className="flex flex-wrap items-center gap-3">
          <FiltrePills actif={null} onChange={onFiltre} layoutId="filtre-accueil" />
          <button
            onClick={onContact}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium transition-colors hover:bg-orange-400"
          >
            <Send className="size-4" /> Me contacter
          </button>
        </div>
      </div>

      <motion.ul variants={conteneurDecale} initial="initial" animate="animate" className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {stats.map(({ libelle, valeur, pastille, icone: Icone, couleur, courbe }) => (
          <motion.li key={libelle} variants={elementDecale} className="glass flex min-w-0 flex-col gap-4 rounded-2xl p-4 md:p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl" style={{ background: teintes[couleur].fond }}>
                <Icone className="size-4" style={{ color: teintes[couleur].trait }} />
              </span>
              <span className="truncate rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white/70 uppercase">
                {pastille}
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-white/60 md:text-sm">{libelle}</p>
              <p className="mt-1 truncate text-xl font-semibold md:text-2xl">{valeur}</p>
            </div>
            <Courbe points={courbe} couleur={teintes[couleur].trait} />
          </motion.li>
        ))}
      </motion.ul>

      <motion.div variants={conteneurDecale} initial="initial" animate="animate" className="grid gap-4 lg:grid-cols-3">
        <motion.section variants={elementDecale} className="glass flex flex-col gap-5 rounded-3xl p-5 md:p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-white/60 uppercase">Projet à la une</span>
            <span className="font-mono text-xs text-accent">{une.numero}</span>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 sm:items-center">
            <ProjetVisuel
              projet={projetALaUne}
              sizes="(max-width: 640px) 100vw, 400px"
              className="aspect-[4/3] w-full rounded-2xl"
              grand
            />
            <div className="flex flex-col items-start gap-4">
              <h2 className="text-xl font-semibold">{une.nom}</h2>
              <p className="leading-relaxed text-white/60">{une.description}</p>
              {une.lienSite && (
                <a
                  href={une.lienSite}
                  target="_blank"
                  rel="noreferrer"
                  className="glass inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors hover:bg-white/15"
                >
                  Voir le projet <ArrowUpRight className="size-4" />
                </a>
              )}
            </div>
          </div>
        </motion.section>

        <motion.section variants={elementDecale} className="glass flex flex-col gap-4 rounded-3xl p-5 md:p-6">
          <span className="font-mono text-xs text-white/60 uppercase">En ce moment</span>
          <ul className="flex flex-col">
            {enCeMoment.map((l, i) => (
              <li key={l.titre} className="flex items-start gap-3 border-b border-white/10 py-3 last:border-0">
                <span className="mt-0.5 font-mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{l.titre}</p>
                  <p className="text-sm text-white/60">{l.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </motion.section>
      </motion.div>
    </div>
  );
}
