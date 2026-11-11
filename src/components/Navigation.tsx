"use client";

import { motion } from "framer-motion";
import { MapPin, Mail, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { site } from "@/data/site";
import { sections, type SectionId } from "@/lib/ui";
import { Avatar, GithubIcon, boutonRond } from "./ui";

type NavProps = { actif: SectionId; onNavigate: (id: SectionId) => void; visible: boolean };

/** Apparition de la navigation une fois l'intro passée. */
const apparition = "transition-[opacity,translate] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]";
const cache = "pointer-events-none opacity-0";

const ressort = { type: "spring", bounce: 0.15, duration: 0.5 } as const;

export function useHeureAntibes() {
  const [heure, setHeure] = useState<{ texte: string; h: number } | null>(null);
  useEffect(() => {
    const maj = () => {
      const texte = new Intl.DateTimeFormat("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Paris",
      }).format(new Date());
      setHeure({ texte, h: Number(texte.slice(0, 2)) });
    };
    maj();
    const t = setInterval(maj, 30_000);
    return () => clearInterval(t);
  }, []);
  return heure;
}

export function TopBar({ actif, onNavigate, visible }: NavProps) {
  const heure = useHeureAntibes();
  const jour = heure ? heure.h >= 7 && heure.h < 20 : true;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 flex items-center justify-between px-4 py-4 md:px-6 md:py-5 ${apparition} ${
        visible ? "" : `${cache} -translate-y-4`
      }`}
    >
      {/* Gauche */}
      <div className="hidden items-center gap-2 md:flex">
        <span className={boutonRond} title={heure ? `${heure.texte} à Antibes` : site.ville}>
          {jour ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </span>
        <span className={boutonRond} title={site.ville}>
          <MapPin className="size-4" />
        </span>
        {heure && (
          <span className="ml-1 hidden font-mono text-xs text-white/60 xl:inline">{heure.texte} · Antibes</span>
        )}
      </div>
      <span className="text-lg font-semibold md:hidden">{site.nom}</span>

      {/* Centre */}
      <nav className="absolute left-1/2 hidden -translate-x-1/2 gap-2 md:flex" aria-label="Navigation principale">
        {sections.map(({ id, label, icone: Icone }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`glass relative flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
              actif === id ? "text-white" : "text-white/70 hover:text-white"
            }`}
            aria-current={actif === id ? "page" : undefined}
          >
            {actif === id && (
              <motion.span layoutId="pilule-top" className="absolute inset-0 rounded-full bg-white/20" transition={ressort} />
            )}
            <Icone className="relative size-4" />
            <span className="relative">{label}</span>
          </button>
        ))}
      </nav>

      {/* Droite */}
      <div className="flex items-center gap-2">
        <a
          href={site.github}
          target="_blank"
          rel="noreferrer"
          className={`${boutonRond} max-md:hidden`}
          aria-label="GitHub"
        >
          <GithubIcon className="size-4" />
        </a>
        <a href={`mailto:${site.email}`} className={`${boutonRond} max-md:hidden`} aria-label="E-mail">
          <Mail className="size-4" />
        </a>
        <Avatar />
      </div>
    </header>
  );
}

export function Dock({ actif, onNavigate, visible }: NavProps) {
  return (
    <nav
      className={`glass fixed top-1/2 left-5 z-40 hidden -translate-y-1/2 flex-col gap-2 rounded-full p-2 md:flex ${apparition} ${
        visible ? "" : `${cache} -translate-x-6`
      }`}
      aria-label="Dock"
    >
      {sections.map(({ id, label, icone: Icone }) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          className="group relative flex size-11 items-center justify-center rounded-full"
          aria-label={label}
        >
          {actif === id && (
            <motion.span layoutId="dock-actif" className="absolute inset-0 rounded-full bg-white" transition={ressort} />
          )}
          <Icone
            className={`relative size-[18px] transition-colors ${
              actif === id ? "text-neutral-900" : "text-white/75 group-hover:text-white"
            }`}
          />
          <span className="glass pointer-events-none absolute left-full ml-3 -translate-x-1 rounded-full px-3 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
            {label}
          </span>
        </button>
      ))}
    </nav>
  );
}

export function BarreMobile({ actif, onNavigate, visible }: NavProps) {
  return (
    <nav
      className={`glass fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 gap-1 rounded-full p-1.5 md:hidden ${apparition} ${
        visible ? "" : `${cache} translate-y-6`
      }`}
      aria-label="Navigation"
    >
      {sections.map(({ id, label, icone: Icone }) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          className="relative flex size-12 items-center justify-center rounded-full"
          aria-label={label}
        >
          {actif === id && (
            <motion.span layoutId="mobile-actif" className="absolute inset-0 rounded-full bg-white" transition={ressort} />
          )}
          <Icone className={`relative size-5 ${actif === id ? "text-neutral-900" : "text-white/75"}`} />
        </button>
      ))}
    </nav>
  );
}
