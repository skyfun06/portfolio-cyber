"use client";

import { motion, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { site } from "@/data/site";
import { easeDoux } from "@/lib/ui";

/** Une lettre du nom : elle s'envole, tourne et se floute à son propre rythme pendant le scroll. */
function Lettre({ lettre, index, progression }: { lettre: string; index: number; progression: MotionValue<number> }) {
  const debut = 0.04 + index * 0.06;
  const fin = debut + 0.34;
  const sens = index % 2 === 0 ? -1 : 1;
  const y = useTransform(progression, [debut, fin], ["0%", "-70%"]);
  const rotate = useTransform(progression, [debut, fin], [0, 14 * sens]);
  const opacity = useTransform(progression, [debut, fin], [1, 0]);
  const filter = useTransform(progression, [debut, fin], ["blur(0px)", "blur(14px)"]);

  return (
    <motion.span className="inline-block origin-bottom" style={{ y, rotate, opacity, filter }}>
      {lettre}
    </motion.span>
  );
}

export default function Hero({ progression }: { progression: MotionValue<number> }) {
  const reduire = useReducedMotion();
  const infosOpacity = useTransform(progression, [0, 0.22], [1, 0]);
  const infosY = useTransform(progression, [0, 0.22], [0, -30]);
  const indiceOpacity = useTransform(progression, [0, 0.08], [1, 0]);

  return (
    <section className="sticky top-0 flex h-svh flex-col justify-between overflow-hidden px-5 pt-6 pb-16 md:px-12 md:pt-8 md:pb-12">
      <motion.div
        className="flex items-center justify-between font-mono text-[11px] tracking-wider text-white/70 uppercase md:text-xs"
        style={reduire ? undefined : { opacity: infosOpacity }}
      >
        <span>Portfolio — 2026</span>
        <span>43.58° N · 7.12° E</span>
      </motion.div>

      <div className="flex items-end justify-between gap-6">
        <div className="min-w-0">
          <motion.p
            className="mb-3 font-mono text-xs tracking-wider text-accent uppercase md:mb-4 md:text-sm"
            style={reduire ? undefined : { opacity: infosOpacity, y: infosY }}
          >
            {site.role} · {site.ville}
          </motion.p>
          <motion.h1
            className="text-[26vw] leading-[0.82] font-semibold tracking-[-0.05em] md:text-[17vw]"
            initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 1.1, ease: easeDoux } }}
            aria-label={site.nom}
          >
            {site.nom.split("").map((l, i) =>
              reduire ? (
                <span key={i}>{l}</span>
              ) : (
                <Lettre key={i} lettre={l} index={i} progression={progression} />
              ),
            )}
          </motion.h1>
        </div>

        <motion.div
          className="hidden shrink-0 flex-col items-center gap-3 pb-4 md:flex"
          style={reduire ? undefined : { opacity: indiceOpacity }}
        >
          <span className="font-mono text-[11px] tracking-[0.2em] text-white/70 uppercase [writing-mode:vertical-rl]">
            Défiler
          </span>
          <span className="relative h-16 w-px overflow-hidden bg-white/20">
            <motion.span
              className="absolute inset-x-0 top-0 h-6 bg-white"
              animate={reduire ? undefined : { y: [-24, 64] }}
              transition={{ duration: 1.8, ease: easeDoux, repeat: Infinity, repeatDelay: 0.3 }}
            />
          </span>
        </motion.div>
      </div>

      {/* Indice mobile */}
      <motion.span
        className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.2em] text-white/60 uppercase md:hidden"
        style={reduire ? undefined : { opacity: indiceOpacity }}
      >
        Défiler ↓
      </motion.span>
    </section>
  );
}
