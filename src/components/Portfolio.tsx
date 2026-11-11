"use client";

import {
  AnimatePresence,
  MotionConfig,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { sections, type Filtre, type SectionId } from "@/lib/ui";
import Fond from "./Fond";
import Hero from "./Hero";
import { transitionSection } from "./motion";
import { BarreMobile, Dock, TopBar } from "./Navigation";
import Accueil from "./sections/Accueil";
import APropos from "./sections/APropos";
import Contact from "./sections/Contact";
import Projets from "./sections/Projets";

function sectionDepuisHash(): SectionId | null {
  const hash = window.location.hash.slice(1);
  return sections.some((s) => s.id === hash) ? (hash as SectionId) : null;
}

export default function Portfolio() {
  // null tant que le hash n'est pas lu : la bonne section s'affiche directement au chargement.
  const [section, setSection] = useState<SectionId | null>(null);
  const [filtre, setFiltre] = useState<Filtre>("Tout");
  const [navVisible, setNavVisible] = useState(false);
  const reduire = useReducedMotion();

  const pisteRef = useRef<HTMLDivElement>(null);
  const contenuRef = useRef<HTMLDivElement>(null);

  // Intro : 0 en haut de page, 1 quand la piste de l'intro est entièrement passée.
  const { scrollYProgress: progression } = useScroll({ target: pisteRef, offset: ["start start", "end start"] });
  // Contenu : se redresse en 3D pendant qu'il remonte dans l'écran.
  const { scrollYProgress: entree } = useScroll({ target: contenuRef, offset: ["start end", "start 0.15"] });
  const rotateX = useTransform(entree, [0, 1], [26, 0]);
  const y = useTransform(entree, [0, 1], [140, 0]);
  const scale = useTransform(entree, [0, 1], [0.86, 1]);

  useMotionValueEvent(progression, "change", (v) => setNavVisible(v > 0.5));

  const allerAuContenu = useCallback((behavior: ScrollBehavior) => {
    const el = contenuRef.current;
    if (el) window.scrollTo({ top: el.offsetTop, behavior });
  }, []);

  useEffect(() => {
    const sync = () => setSection(sectionDepuisHash() ?? "accueil");
    sync();
    setNavVisible(progression.get() > 0.5);
    // Lien direct vers une section (#projets…) : on saute l'intro.
    if (sectionDepuisHash()) requestAnimationFrame(() => allerAuContenu("instant"));
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, [allerAuContenu, progression]);

  const naviguer = useCallback(
    (id: SectionId) => {
      setSection(id);
      if (window.location.hash !== `#${id}`) history.pushState(null, "", `#${id}`);
      allerAuContenu("smooth");
    },
    [allerAuContenu],
  );

  const filtrerProjets = useCallback(
    (f: Filtre) => {
      setFiltre(f);
      naviguer("projets");
    },
    [naviguer],
  );

  const actif = section ?? "accueil";

  return (
    <MotionConfig reducedMotion="user">
      <Fond progression={progression} />
      <TopBar actif={actif} onNavigate={naviguer} visible={navVisible} />
      <Dock actif={actif} onNavigate={naviguer} visible={navVisible} />
      <BarreMobile actif={actif} onNavigate={naviguer} visible={navVisible} />

      {/* Piste de l'intro : le héros reste collé pendant que les lettres s'envolent. */}
      <div ref={pisteRef} className="relative h-[150svh]">
        <Hero progression={progression} />
      </div>

      <div ref={contenuRef} className="min-h-svh overflow-x-clip [perspective:1400px]">
        <motion.main
          className="mx-auto w-full max-w-6xl origin-[50%_40vh] px-4 pt-24 pb-32 md:pr-10 md:pl-28 md:pt-28 md:pb-16 xl:px-28"
          style={reduire ? undefined : { rotateX, y, scale }}
        >
          <AnimatePresence mode="wait">
            {section && (
              <motion.div key={section} variants={transitionSection} initial="initial" animate="animate" exit="exit">
                {section === "accueil" && <Accueil onFiltre={filtrerProjets} onContact={() => naviguer("contact")} />}
                {section === "projets" && <Projets filtre={filtre} onFiltre={setFiltre} />}
                {section === "a-propos" && <APropos />}
                {section === "contact" && <Contact />}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.main>
      </div>
    </MotionConfig>
  );
}
