import type { Variants } from "framer-motion";
import { easeDoux } from "@/lib/ui";

const cache = { opacity: 0, filter: "blur(8px)", y: 10 };

/** Transition de section : fondu + flou. Le filtre est retiré à la fin pour ne pas casser le backdrop-filter. */
export const transitionSection: Variants = {
  initial: cache,
  animate: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: { duration: 0.4, ease: easeDoux },
    transitionEnd: { filter: "none", transform: "none" },
  },
  exit: { ...cache, transition: { duration: 0.3, ease: easeDoux } },
};

export const conteneurDecale: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

export const elementDecale: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeDoux } },
};
