"use client";

import { motion, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import Image from "next/image";

/** Photo plein écran fixe. Au scroll de l'intro, la caméra plonge vers le bureau et la scène s'assombrit. */
export default function Fond({ progression }: { progression: MotionValue<number> }) {
  const reduire = useReducedMotion();
  const scale = useTransform(progression, [0, 1], [1.2, 1.38]);
  const voile = useTransform(progression, [0, 1], [0.15, 0.5]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <motion.div
        className="absolute inset-0 origin-[50%_85%]"
        style={reduire ? { scale: 1.2 } : { scale }}
      >
        <Image
          src="/background.jpg"
          alt=""
          fill
          priority
          quality={100}
          // Servie telle quelle (4608 px, JPEG 100) : pas de recompression par Next.
          unoptimized
          sizes="100vw"
          className="object-cover object-[50%_100%]"
        />
      </motion.div>
      <motion.div className="absolute inset-0 bg-black" style={{ opacity: reduire ? 0.3 : voile }} />
    </div>
  );
}
