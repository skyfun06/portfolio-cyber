"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { site } from "@/data/site";
import { conteneurDecale, elementDecale } from "../motion";
import { Avatar, SectionTitre } from "../ui";

const parcours = [
  { date: "Lycée", titre: "Bac", texte: "Les premières lignes de code, en parallèle des cours." },
  { date: "Débuts", titre: "Premiers projets", texte: "Des sites pour des proches et des clubs, pour apprendre en livrant." },
  { date: "Produits", titre: "Lancement de mes produits", texte: "WhatItCost, ScanAvis, Gestion AVP : des idées devenues des produits en ligne." },
  { date: "Aujourd'hui", titre: "Auto-entreprise", texte: "Développeur indépendant à Antibes, ouvert aux nouveaux projets." },
];

const stack = ["Next.js", "TypeScript", "Tailwind", "Supabase", "Vercel"];

export default function APropos() {
  return (
    <div className="flex flex-col gap-8">
      <SectionTitre titre="À propos" sousTitre="18 ans, indépendant, et l'envie de construire des produits utiles." />

      <motion.div variants={conteneurDecale} initial="initial" animate="animate" className="grid gap-4 lg:grid-cols-[1fr_1.4fr_1fr]">
        <motion.section variants={elementDecale} className="glass flex flex-col items-center gap-4 rounded-3xl p-6 text-center">
          <Avatar size="lg" />
          <div>
            <h2 className="text-xl font-semibold">{site.nom}</h2>
            <p className="text-white/60">{site.role}</p>
          </div>
          <p className="flex items-center gap-1.5 text-sm text-white/60">
            <MapPin className="size-4" /> {site.ville}
          </p>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs">
            <span className="size-2 rounded-full bg-emerald-400" /> Disponible pour des projets
          </span>
        </motion.section>

        <motion.section variants={elementDecale} className="glass rounded-3xl p-6">
          <span className="font-mono text-xs text-white/60 uppercase">Parcours</span>
          <ol className="mt-5 flex flex-col">
            {parcours.map((e, i) => (
              <li key={e.titre} className="relative flex gap-4 pb-6 last:pb-0">
                {i < parcours.length - 1 && <span className="absolute top-4 left-[5px] h-full w-px bg-white/15" />}
                <span className={`relative mt-1.5 size-[11px] shrink-0 rounded-full border-2 ${i === parcours.length - 1 ? "border-accent bg-accent" : "border-white/40 bg-transparent"}`} />
                <div className="min-w-0">
                  <span className="font-mono text-[11px] text-white/50 uppercase">{e.date}</span>
                  <h3 className="font-medium">{e.titre}</h3>
                  <p className="mt-0.5 text-sm text-white/60">{e.texte}</p>
                </div>
              </li>
            ))}
          </ol>
        </motion.section>

        <motion.section variants={elementDecale} className="glass rounded-3xl p-6">
          <span className="font-mono text-xs text-white/60 uppercase">Stack</span>
          <ul className="mt-5 flex flex-wrap gap-2">
            {stack.map((s) => (
              <li key={s} className="glass rounded-full px-3.5 py-1.5 text-sm">
                {s}
              </li>
            ))}
          </ul>
        </motion.section>
      </motion.div>
    </div>
  );
}
