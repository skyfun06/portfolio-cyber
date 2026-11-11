"use client";

import { MotionConfig, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import FondTexte from "../FondTexte";
import Accueil from "./Accueil";
import Contact from "./Contact";
import Entree, { CHOC } from "./Entree";
import Profil from "./Profil";
import Projets from "./Projets";
import Rail from "./Rail";
import TextSpread, { FOND_SUITE } from "../TextSpread";

function PiedDePage() {
  return (
    <footer className="border-t border-neon/15">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-10 font-mono text-[11px] tracking-[0.2em] text-white/40 uppercase md:flex-row md:items-center md:justify-between md:px-10">
        <span>
          <span className="text-neon">■</span> Fin de transmission · © {new Date().getFullYear()} Borrel · Antibes
        </span>
        <button
          onClick={() => window.location.reload()}
          data-info-titre="Relancer la simulation"
          data-info="Recharger le site et rejouer la séquence de démarrage" className="self-start text-neon/70 transition-colors hover:text-neon md:self-auto">
          [ Relancer la simulation ]
        </button>
      </div>
    </footer>
  );
}

/** Fond fixe de tout le site : la photo si elle existe, sinon des halos rouges. Il s'assombrit au scroll. */
function Fond({ image }: { image?: string }) {
  const { scrollY } = useScroll();
  const voile = useTransform(scrollY, [0, 700], [image ? 0.35 : 0, image ? 0.82 : 0.4]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 bg-black" aria-hidden>
      {image ? (
        <Image src={image} alt="" fill priority quality={100} sizes="100vw" className="object-cover" />
      ) : (
        <>
          <div className="absolute -top-[20%] left-[10%] size-[60vw] rounded-full bg-neon/[0.07] blur-[120px]" />
          <div className="absolute right-[-10%] bottom-[-20%] size-[50vw] rounded-full bg-neon/[0.05] blur-[140px]" />
        </>
      )}
      {/* Assombrissement : plus fort à gauche (texte) et en bas. */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black to-transparent" />
      <motion.div className="absolute inset-0 bg-black" style={{ opacity: voile }} />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgb(255_42_42/0.025)_0_1px,transparent_1px_3px)]" />
    </div>
  );
}

/** Le site, révélé par l'explosion d'entrée à la sortie de la séquence de démarrage. */
export default function Site({ demarre, fond, portrait }: { demarre: boolean; fond?: string; portrait?: string }) {
  const suiteRef = useRef<HTMLDivElement>(null);
  const reduire = useReducedMotion();
  const [entreeFinie, setEntreeFinie] = useState(false);
  const finirEntree = useCallback(() => setEntreeFinie(true), []);

  return (
    <MotionConfig reducedMotion="user">
      <Fond image={fond} />
      <div className={demarre ? undefined : "opacity-0"}>
        <Rail demarre={demarre} />
        {/* Décalage pour laisser la place au rail replié ; ouvert, il passe par-dessus. */}
        <div className="md:pl-24">
          {/* Secousse au moment de l'explosion, puis plus aucune transformation (le sticky reste intact). */}
          <motion.main
            initial={false}
            animate={demarre && !reduire ? { x: [0, -18, 14, -9, 6, -3, 0], y: [0, 10, -12, 7, -4, 2, 0] } : undefined}
            transition={{ delay: CHOC, duration: 0.55, ease: "easeOut" }}
          >
            <Accueil demarre={demarre} />
            <Projets />
            <TextSpread />
            {/* Même fond que la fin de la transition (rouge + lignes de texte) : raccord invisible. */}
            <div ref={suiteRef} className="relative md:-ml-24 md:pl-24" style={{ background: FOND_SUITE }}>
              <FondTexte section={suiteRef} variante="rouge" />
              <div className="relative">
                <Profil portrait={portrait} />
                <Contact />
                <PiedDePage />
              </div>
            </div>
          </motion.main>
        </div>
      </div>
      {demarre && !reduire && !entreeFinie && <Entree onFini={finirEntree} />}
    </MotionConfig>
  );
}
