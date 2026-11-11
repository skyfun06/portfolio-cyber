"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import * as sons from "../demarrage/sons";

/** Instant (s) de l'explosion, après la courte aspiration du point lumineux. Les animations du site s'y calent. */
export const CHOC = 0.25;
const OUVERTURE = 1.2; // s : le trou s'ouvre sur tout l'écran
const RAYON_FINAL = 95; // vmax

const ondes = [
  { delai: 0, duree: 1.1, epaisseur: 3, opacite: 1 },
  { delai: 0.07, duree: 1.4, epaisseur: 1.5, opacite: 0.7 },
  { delai: 0.16, duree: 1.7, epaisseur: 1, opacite: 0.45 },
];

/**
 * Entrée sur le site, à la suite de l'extinction du terminal (qui se termine sur un point rouge au centre) :
 * le point aspire la lumière, explose, une onde de choc perce l'écran noir en cercle et dévoile le site,
 * avec flash, traînée horizontale, bandes de glitch, viseur qui s'ouvre et balayage.
 */
export default function Entree({ onFini }: { onFini: () => void }) {
  const rayon = useMotionValue(0);
  const masque = useTransform(rayon, (r) => `radial-gradient(circle at 50% 50%, transparent ${r}vmax, #000 ${r + 0.4}vmax)`);
  const bord = useTransform(rayon, (r) => `${r * 2}vmax`);
  const bordOpacite = useTransform(rayon, (r) => (r === 0 ? 0 : 1 - r / RAYON_FINAL));

  // Bandes de glitch tirées au hasard (le composant n'existe que côté client, après le démarrage).
  const [bandes] = useState(() =>
    Array.from({ length: 9 }, () => ({
      top: Math.random() * 100,
      hauteur: 0.4 + Math.random() * 5,
      decalage: (Math.random() - 0.5) * 120,
      rouge: Math.random() < 0.6,
      delai: CHOC + 0.05 + Math.random() * 0.3,
    })),
  );

  useEffect(() => {
    sons.deflagration(CHOC);
    const ouverture = animate(rayon, RAYON_FINAL, { delay: CHOC, duration: OUVERTURE, ease: [0.12, 0.9, 0.2, 1] });
    const fin = setTimeout(onFini, (CHOC + 1.9) * 1000);
    return () => {
      ouverture.stop();
      clearTimeout(fin);
    };
  }, [rayon, onFini]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden" aria-hidden>
      {/* Rideau noir percé d'un trou qui s'agrandit. */}
      <motion.div className="absolute inset-0 bg-black" style={{ maskImage: masque, WebkitMaskImage: masque }} />

      {/* Lèvre incandescente du trou. */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/90 shadow-[0_0_30px_6px_#ff2a2a,inset_0_0_30px_6px_#ff2a2a]"
        style={{ width: bord, height: bord, opacity: bordOpacite }}
      />

      {/* Ondes de choc. */}
      {ondes.map((o, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 100 100"
          className="absolute top-1/2 left-1/2 -mt-[100vmax] -ml-[100vmax] size-[200vmax] overflow-visible"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.05], opacity: [o.opacite, 0] }}
          transition={{ delay: CHOC + o.delai, duration: o.duree, ease: [0.1, 0.8, 0.25, 1] }}
        >
          <circle cx="50" cy="50" r="49" fill="none" stroke="#ff2a2a" strokeWidth={o.epaisseur} vectorEffect="non-scaling-stroke" />
          <circle cx="50" cy="50" r="49" fill="none" stroke="#ff2a2a" strokeWidth={o.epaisseur * 8} strokeOpacity={0.15} vectorEffect="non-scaling-stroke" />
        </motion.svg>
      ))}

      {/* Point lumineux : il se contracte en aspirant la lumière, puis explose. */}
      <motion.div
        className="absolute top-1/2 left-1/2 -mt-2 -ml-2 size-4 rounded-full bg-white shadow-[0_0_20px_6px_#ff2a2a,0_0_60px_20px_rgb(255_42_42/0.6)]"
        initial={{ scale: 0.4, opacity: 1 }}
        animate={{ scale: [0.4, 1.6, 0.5, 10], opacity: [1, 1, 1, 0] }}
        transition={{ duration: CHOC + 0.2, times: [0, 0.3, CHOC / (CHOC + 0.2), 1], ease: ["easeOut", "easeIn", "easeOut"] }}
      />

      {/* Traînée horizontale façon objectif anamorphique, et sa petite sœur verticale. */}
      <motion.div
        className="absolute top-1/2 left-1/2 -mt-px -ml-[100vw] h-[3px] w-[200vw] bg-[linear-gradient(90deg,transparent,#ff2a2a_30%,#fff_50%,#ff2a2a_70%,transparent)] shadow-[0_0_24px_4px_rgb(255_42_42/0.8)]"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: [0, 1], scaleY: [1, 2, 0.3], opacity: [1, 0.9, 0] }}
        transition={{ delay: CHOC, duration: 0.6, ease: [0.1, 0.8, 0.3, 1] }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -mt-[30vh] -ml-px h-[60vh] w-[2px] bg-[linear-gradient(180deg,transparent,#fff_50%,transparent)]"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: [0, 1], opacity: [0.9, 0] }}
        transition={{ delay: CHOC, duration: 0.5, ease: "easeOut" }}
      />

      {/* Flash blanc puis rouge. */}
      <motion.div
        className="absolute inset-0 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.85, 0] }}
        transition={{ delay: CHOC, duration: 0.22, times: [0, 0.15, 1], ease: "easeOut" }}
      />
      <motion.div
        className="absolute inset-0 bg-neon mix-blend-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ delay: CHOC + 0.04, duration: 0.45, times: [0, 0.15, 1], ease: "easeOut" }}
      />

      {/* Bandes de glitch. */}
      {bandes.map((b, i) => (
        <motion.div
          key={i}
          className={`absolute inset-x-0 mix-blend-screen ${b.rouge ? "bg-neon" : "bg-white"}`}
          style={{ top: `${b.top}%`, height: `${b.hauteur}vh` }}
          initial={{ opacity: 0, x: 0 }}
          animate={{ opacity: [0, 0.55, 0, 0.4, 0], x: [0, b.decalage, -b.decalage / 2, b.decalage / 3, 0] }}
          transition={{ delay: b.delai, duration: 0.35, ease: "linear" }}
        />
      ))}

      {/* Viseur : quatre coins qui jaillissent du centre vers les bords, avec un statut qui clignote. */}
      <motion.div
        className="absolute inset-5 md:inset-8"
        initial={{ scale: 0.04, opacity: 0 }}
        animate={{ scale: [0.04, 1.03, 1], opacity: [0, 1, 1, 0.3, 1, 0] }}
        transition={{
          scale: { delay: CHOC + 0.05, duration: 0.6, ease: [0.2, 0.9, 0.2, 1] },
          opacity: { delay: CHOC + 0.05, duration: 1.5, times: [0, 0.05, 0.55, 0.6, 0.65, 1] },
        }}
      >
        {["top-0 left-0 border-t-2 border-l-2", "top-0 right-0 border-t-2 border-r-2", "bottom-0 left-0 border-b-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"].map(
          (c) => (
            <span key={c} className={`absolute size-10 border-neon shadow-[0_0_12px_rgb(255_42_42/0.7)] md:size-16 ${c}`} />
          ),
        )}
        <span className="absolute top-3 left-14 font-mono text-[10px] tracking-[0.3em] text-neon uppercase md:left-20 md:text-xs">
          Signal acquis
        </span>
        <span className="absolute right-14 bottom-3 font-mono text-[10px] tracking-[0.3em] text-neon/70 uppercase md:right-20 md:text-xs">
          Borrel//sim · en ligne
        </span>
      </motion.div>

      {/* Balayage vertical qui « imprime » l'écran une fois ouvert. */}
      <motion.div
        className="absolute inset-x-0 top-0 h-[35vh] bg-[linear-gradient(to_bottom,transparent,rgb(255_42_42/0.12)_85%,rgb(255_120_120/0.9)_99%,transparent)]"
        initial={{ y: "-40vh" }}
        animate={{ y: "110vh" }}
        transition={{ delay: CHOC + 0.55, duration: 1.1, ease: [0.5, 0, 0.5, 1] }}
      />
    </div>
  );
}
