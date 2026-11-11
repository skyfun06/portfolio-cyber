"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Code, ExternalLink, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Projet } from "@/data/projects";
import { easeDoux } from "@/lib/ui";
import ProjetVisuel from "./ProjetVisuel";

export default function ProjetPanneau({ projet, onClose }: { projet: Projet | null; onClose: () => void }) {
  const [monte, setMonte] = useState(false);
  useEffect(() => setMonte(true), []);

  useEffect(() => {
    if (!projet) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [projet, onClose]);

  if (!monte) return null;

  return createPortal(
    <AnimatePresence>
      {projet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:p-8">
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.article
            layoutId={`projet-${projet.id}`}
            transition={{ duration: 0.45, ease: easeDoux }}
            className="glass relative flex h-full w-full flex-col overflow-y-auto bg-neutral-900/30 md:h-auto md:max-h-[85vh] md:max-w-3xl md:rounded-3xl"
            role="dialog"
            aria-modal="true"
            aria-label={projet.nom}
          >
            <ProjetVisuel
              projet={projet}
              sizes="(max-width: 768px) 100vw, 768px"
              className="aspect-[16/9] w-full shrink-0 border-0"
              grand
            />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-md transition-colors hover:bg-black/50"
              aria-label="Fermer"
            >
              <X className="size-4" />
            </button>

            <motion.div
              className="flex flex-col gap-6 p-6 md:p-8"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.35, ease: easeDoux } }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
            >
              <div>
                <span className="font-mono text-xs text-accent">{projet.numero}</span>
                <h2 className="mt-1 text-2xl font-semibold">{projet.nom}</h2>
                <p className="mt-3 leading-relaxed text-white/60">{projet.descriptionLongue}</p>
              </div>

              <ul className="flex flex-wrap gap-2">
                {projet.stack.map((s) => (
                  <li key={s} className="glass rounded-full px-3 py-1 text-xs text-white/80">
                    {s}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                <LienBouton href={projet.lienSite} principal>
                  <ExternalLink className="size-4" /> Voir le site
                </LienBouton>
                <LienBouton href={projet.lienCode}>
                  <Code className="size-4" /> Code
                </LienBouton>
              </div>
            </motion.div>
          </motion.article>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function LienBouton({
  href,
  principal = false,
  children,
}: {
  href?: string;
  principal?: boolean;
  children: React.ReactNode;
}) {
  const style = principal
    ? "bg-accent text-white hover:bg-orange-400"
    : "glass text-white/85 hover:bg-white/15";
  const base = "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors";

  if (!href) {
    return (
      <span className={`${base} ${style} cursor-not-allowed opacity-40`} title="Bientôt disponible">
        {children}
      </span>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" className={`${base} ${style}`}>
      {children}
    </a>
  );
}
