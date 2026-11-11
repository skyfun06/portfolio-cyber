"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

const GLYPHES = "!<>-_\\/[]{}=+*^?#01ABCDEFX";

/** Texte qui se « décode » : des caractères aléatoires se figent un à un sur le vrai texte. */
export function useBrouillage(texte: string, actif: boolean, duree = 900) {
  const reduire = useReducedMotion();
  const [affiche, setAffiche] = useState(texte);

  useEffect(() => {
    if (!actif || reduire) {
      setAffiche(texte);
      return;
    }
    const debut = performance.now();
    let raf = 0;
    const etape = () => {
      const p = Math.min(1, (performance.now() - debut) / duree);
      const fixes = Math.floor(p * texte.length);
      setAffiche(
        texte
          .split("")
          .map((c, i) => (c === " " || i < fixes ? c : GLYPHES[Math.floor(Math.random() * GLYPHES.length)]))
          .join(""),
      );
      if (p < 1) raf = requestAnimationFrame(etape);
    };
    raf = requestAnimationFrame(etape);
    return () => cancelAnimationFrame(raf);
  }, [texte, actif, duree, reduire]);

  return affiche;
}

/** Titre de section : numéro en mono + grand titre qui se décode quand il entre à l'écran. */
export function TitreSection({ numero, etiquette, titre }: { numero: string; etiquette: string; titre: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, margin: "-15% 0px" });
  const texte = useBrouillage(titre, visible, 700);

  return (
    <div ref={ref} className="mb-12 md:mb-16">
      <p className="font-mono text-xs tracking-[0.25em] text-neon uppercase">
        {numero} <span className="text-neon/40">//</span> {etiquette}
      </p>
      <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white uppercase md:text-6xl">
        {texte}
      </h2>
      <motion.div
        className="mt-6 h-px origin-left bg-gradient-to-r from-neon via-neon/30 to-transparent"
        initial={{ scaleX: 0 }}
        animate={visible ? { scaleX: 1 } : undefined}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

/** Apparition au scroll : glissement + révélation de gauche à droite. */
export function Apparition({ children, delai = 0, className = "" }: { children: ReactNode; delai?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24, clipPath: "inset(0 100% 0 0)" }}
      whileInView={{ opacity: 1, y: 0, clipPath: "inset(-4px -4px -4px -4px)" }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.7, delay: delai, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Panneau à bordure fine avec coins accentués en rouge. */
export function Cadre({ children, className = "" }: { children: ReactNode; className?: string }) {
  const coin = "pointer-events-none absolute size-3 border-neon";
  return (
    <div className={`relative border border-white/10 bg-black/75 backdrop-blur-sm ${className}`}>
      <span className={`${coin} -top-px -left-px border-t-2 border-l-2`} />
      <span className={`${coin} -top-px -right-px border-t-2 border-r-2`} />
      <span className={`${coin} -bottom-px -left-px border-b-2 border-l-2`} />
      <span className={`${coin} -right-px -bottom-px border-r-2 border-b-2`} />
      {children}
    </div>
  );
}
