"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { projets, type Projet } from "@/data/projects";
import AsciiImage from "../AsciiImage";
import * as sons from "../demarrage/sons";
import FondTexte from "../FondTexte";
import { FOND_SPREAD } from "../TextSpread";
import Dossier from "./Dossier";
import { TitreSection } from "./outils";

/** Ligne de la fiche : étiquette à gauche, valeur à droite (qui défile si elle est trop longue). */
function LigneFiche({ label, valeur }: { label: string; valeur: string }) {
  const boite = useRef<HTMLSpanElement>(null);
  const texte = useRef<HTMLSpanElement>(null);
  const [deborde, setDeborde] = useState(false);
  useEffect(() => {
    if (boite.current && texte.current) setDeborde(texte.current.scrollWidth > boite.current.clientWidth + 1);
  }, [valeur]);
  return (
    <div className="flex gap-4">
      <span className="shrink-0 text-white/45">{label}</span>
      <span ref={boite} className="ml-auto max-w-[11rem] min-w-0 overflow-hidden text-right">
        <span ref={texte} className={`inline-block whitespace-nowrap ${deborde ? "defile" : ""}`}>
          {valeur}
          {deborde && <span className="pl-6">{valeur}</span>}
        </span>
      </span>
    </div>
  );
}

function Fiche({ projet }: { projet: Projet }) {
  const lignes = [
    { label: "Année", valeur: projet.annee },
    { label: "Stack", valeur: projet.stack.length ? projet.stack.join(" / ") : undefined },
    { label: "Statut", valeur: projet.statut },
  ].filter((l): l is { label: string; valeur: string } => !!l.valeur);
  if (!lignes.length) return null;
  return (
    <div className="flex w-60 max-w-full flex-col gap-1 border border-dashed border-white/25 bg-black/85 px-3 py-2 font-mono text-[10px] tracking-[0.15em] text-white uppercase">
      {lignes.map((l) => (
        <LigneFiche key={l.label} {...l} />
      ))}
    </div>
  );
}

const ancre = (p: Projet) => `#projet-${p.id}`;

export default function Projets() {
  const sectionRef = useRef<HTMLElement>(null);
  const [ouvert, setOuvert] = useState<Projet | null>(null);

  const ouvrir = useCallback((p: Projet) => {
    sons.ok();
    setOuvert(p);
    history.pushState(null, "", ancre(p));
  }, []);
  const changer = useCallback((p: Projet) => {
    sons.ok();
    setOuvert(p);
    history.replaceState(null, "", ancre(p));
  }, []);
  const fermer = useCallback(() => {
    setOuvert(null);
    if (location.hash.startsWith("#projet-")) history.replaceState(null, "", location.pathname + location.search);
  }, []);

  // Lien partagé (#projet-scanavis) et bouton « précédent » du navigateur.
  useEffect(() => {
    const synchro = () => setOuvert(projets.find((p) => ancre(p) === location.hash) ?? null);
    synchro();
    window.addEventListener("popstate", synchro);
    return () => window.removeEventListener("popstate", synchro);
  }, []);

  return (
    // md:-ml-24 md:pl-24 : le fond passe sous le rail pour couvrir toute la largeur.
    <section id="projets" ref={sectionRef} className="relative md:-ml-24 md:pl-24" style={{ background: FOND_SPREAD }}>
      <FondTexte section={sectionRef} />

      <div className="relative px-4 py-28 md:px-[6vw] md:py-40">
        <TitreSection numero="02" etiquette="Projets" titre="Ce que j'ai lancé" />

        <ul className="grid gap-y-12 md:grid-cols-2 md:gap-x-[1.5vw] md:gap-y-16">
          {projets.map((projet) => (
            <li key={projet.id}>
              <button onClick={() => ouvrir(projet)} className="group block w-full cursor-pointer text-left"
                data-curseur="Voir"
                data-info-titre={`${projet.numero} · ${projet.nom}`}
                data-info={`${projet.description} Cliquer pour ouvrir le dossier.`}
                data-info-touche={projet.categorie} aria-label={`Ouvrir le projet ${projet.nom}`}>
                <motion.div layoutId={`projet-${projet.id}`} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
                  <AsciiImage
                    src={projet.image}
                    nom={projet.nom}
                    alt={`Capture de ${projet.nom}`}
                    sizes="(max-width: 768px) 100vw, 45vw"
                    className="aspect-[4/3] md:aspect-[16/10]"
                    fiche={<Fiche projet={projet} />}
                  />
                </motion.div>
                <h3 className="mt-3 font-mono text-lg tracking-[0.15em] text-white uppercase transition-colors group-hover:text-neon md:text-xl">
                  {projet.nom}
                </h3>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Dossier projet={ouvert} onClose={fermer} onChange={changer} />
    </section>
  );
}
