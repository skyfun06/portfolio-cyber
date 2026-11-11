"use client";

import { motion } from "framer-motion";
import { attributs, equipement, identite, parcours } from "@/data/profil";
import LogoTournant from "../demarrage/LogoTournant";
import { Apparition, Cadre, TitreSection } from "./outils";

function Etiquette({ children }: { children: React.ReactNode }) {
  return <p className="mb-5 font-mono text-[10px] tracking-[0.25em] text-neon uppercase">{children}</p>;
}

/** Jauge segmentée sur 10. */
function Jauge({ niveau }: { niveau: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 10 }, (_, i) => (
        <motion.span
          key={i}
          className={`h-2.5 flex-1 ${i < niveau ? "bg-neon shadow-[0_0_6px_rgb(255_42_42/0.7)]" : "bg-white/10"}`}
          initial={{ opacity: 0, scaleY: 0.2 }}
          whileInView={{ opacity: 1, scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 + i * 0.04, duration: 0.25 }}
        />
      ))}
    </div>
  );
}

export default function Profil() {
  return (
    <section id="profil" className="mx-auto max-w-7xl px-5 py-28 md:px-10 md:py-40">
      <TitreSection numero="03" etiquette="Profil" titre="Fiche personnage" />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Identité */}
        <Apparition>
          <Cadre className="h-full p-6 md:p-8">
            <Etiquette>Identité</Etiquette>
            <div className="relative mb-8 size-24">
              <LogoTournant className="absolute inset-0" />
            </div>
            <dl className="flex flex-col">
              {identite.map(({ label, valeur }) => (
                <div key={label} className="flex justify-between gap-4 border-b border-white/10 py-3 last:border-0">
                  <dt className="font-mono text-xs tracking-[0.15em] text-white/40 uppercase">{label}</dt>
                  <dd className="text-right text-white">{valeur}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 inline-flex items-center gap-2 border border-neon/40 px-3 py-1.5 font-mono text-xs tracking-[0.15em] text-neon uppercase">
              <span className="size-1.5 animate-pulse rounded-full bg-neon" /> Disponible pour des projets
            </p>
          </Cadre>
        </Apparition>

        {/* Attributs */}
        <Apparition delai={0.1}>
          <Cadre className="h-full p-6 md:p-8">
            <Etiquette>Attributs</Etiquette>
            <ul className="flex flex-col gap-6">
              {attributs.map(({ nom, niveau }) => (
                <li key={nom}>
                  <div className="mb-2 flex justify-between font-mono text-xs tracking-[0.1em] uppercase">
                    <span className="text-white/75">{nom}</span>
                    <span className="text-neon">{String(niveau).padStart(2, "0")}/10</span>
                  </div>
                  <Jauge niveau={niveau} />
                </li>
              ))}
            </ul>
          </Cadre>
        </Apparition>

        {/* Équipement */}
        <Apparition delai={0.2}>
          <Cadre className="h-full p-6 md:p-8">
            <Etiquette>Équipement</Etiquette>
            <ul className="grid grid-cols-2 gap-2">
              {equipement.map(({ nom, type }, i) => (
                <li key={nom} className="group border border-white/10 p-3 transition-colors hover:border-neon/60 hover:bg-neon/5">
                  <span className="font-mono text-[10px] text-neon/60">{String(i + 1).padStart(2, "0")}</span>
                  <p className="mt-1 font-display text-lg font-semibold text-white">{nom}</p>
                  <p className="font-mono text-[10px] tracking-[0.15em] text-white/40 uppercase">{type}</p>
                </li>
              ))}
            </ul>
          </Cadre>
        </Apparition>

        {/* Journal de parcours */}
        <Apparition delai={0.1} className="lg:col-span-3">
          <Cadre className="p-6 md:p-8">
            <Etiquette>Journal</Etiquette>
            <ol className="grid gap-8 md:grid-cols-4 md:gap-6">
              {parcours.map((e, i) => (
                <li key={e.titre} className="relative border-t border-white/15 pt-5">
                  <span
                    className={`absolute -top-[5px] left-0 size-2.5 rotate-45 ${
                      i === parcours.length - 1 ? "bg-neon shadow-[0_0_10px_#ff2a2a]" : "border border-neon/60 bg-black"
                    }`}
                  />
                  <p className="font-mono text-[10px] tracking-[0.2em] text-neon/70 uppercase">{e.date}</p>
                  <h3 className="mt-1 font-display text-xl font-semibold text-white">{e.titre}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{e.texte}</p>
                </li>
              ))}
            </ol>
          </Cadre>
        </Apparition>
      </div>
    </section>
  );
}
