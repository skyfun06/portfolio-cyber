"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";
import { projets, type Projet } from "@/data/projects";
import { easeDoux, type Filtre } from "@/lib/ui";
import FiltrePills from "../FiltrePills";
import ProjetPanneau from "../ProjetPanneau";
import ProjetVisuel from "../ProjetVisuel";
import { SectionTitre } from "../ui";

export default function Projets({ filtre, onFiltre }: { filtre: Filtre; onFiltre: (f: Filtre) => void }) {
  const [ouvert, setOuvert] = useState<Projet | null>(null);
  const fermer = useCallback(() => setOuvert(null), []);
  const liste = filtre === "Tout" ? projets : projets.filter((p) => p.categorie === filtre);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionTitre titre="Projets" sousTitre="Ce que j'ai conçu, lancé et que je fais vivre." />
        <FiltrePills actif={filtre} onChange={onFiltre} layoutId="filtre-projets" />
      </div>

      <motion.ul layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {liste.map((projet, i) => (
            <motion.li
              key={projet.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.1 + i * 0.05, duration: 0.4, ease: easeDoux } }}
              exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.2 } }}
            >
              <motion.button
                layoutId={`projet-${projet.id}`}
                onClick={() => setOuvert(projet)}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3, ease: easeDoux }}
                className="glass flex w-full flex-col gap-4 rounded-2xl p-3 text-left transition-colors hover:bg-white/[0.13]"
              >
                <ProjetVisuel
                  projet={projet}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                  className="aspect-[16/10] w-full rounded-xl"
                />
                <div className="px-1 pb-1">
                  <span className="font-mono text-xs text-accent">{projet.numero}</span>
                  <h2 className="mt-0.5 font-semibold">{projet.nom}</h2>
                  <p className="mt-1 text-sm text-white/60">{projet.description}</p>
                </div>
              </motion.button>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      <ProjetPanneau projet={ouvert} onClose={fermer} />
    </div>
  );
}
