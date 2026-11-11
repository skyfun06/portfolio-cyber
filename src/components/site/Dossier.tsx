"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight, Code2, Compass, PenTool, Rocket, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { projets, type Projet } from "@/data/projects";
import AsciiImage from "../AsciiImage";
import FondTexte from "../FondTexte";
import { FOND_SPREAD } from "../TextSpread";
import { useBrouillage } from "./outils";

const EASE = [0.22, 1, 0.36, 1] as const;
const pad = (n: number) => String(n).padStart(3, "0");
const hote = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

/** Ce que je fais sur chaque produit, seul, de bout en bout. */
const ETAPES = [
  { icone: Compass, titre: "Conception", texte: "Cadrer le besoin, définir les fonctionnalités qui comptent vraiment." },
  { icone: PenTool, titre: "Design", texte: "Maquetter une interface claire, pensée pour l'utilisateur final." },
  { icone: Code2, titre: "Développement", texte: "Coder le produit complet : interface, base de données, comptes utilisateurs." },
  { icone: Rocket, titre: "Mise en ligne", texte: "Déployer, surveiller et faire évoluer le produit après le lancement." },
];

// Apparition en cascade du contenu.
const bloc = (delai: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { delay: delai, duration: 0.6, ease: EASE } },
});

function Titre({ texte }: { texte: string }) {
  const affiche = useBrouillage(texte, true, 650);
  return <>{affiche}</>;
}

/** Capture du produit dans un cadre de navigateur, balayée par un scan à l'ouverture. */
function Apercu({ projet }: { projet: Projet }) {
  const reduire = useReducedMotion();
  return (
    <div className="relative">
      {/* Coins du viseur, hors du cadre */}
      {["-top-3 -left-3 border-t-2 border-l-2", "-top-3 -right-3 border-t-2 border-r-2", "-bottom-3 -left-3 border-b-2 border-l-2", "-right-3 -bottom-3 border-r-2 border-b-2"].map((c) => (
        <span key={c} className={`pointer-events-none absolute size-5 border-neon/70 ${c}`} />
      ))}
      <div className="overflow-hidden border border-white/15 bg-black shadow-[0_30px_80px_rgb(0_0_0/0.6),0_0_60px_rgb(255_42_42/0.08)]">
        {/* Barre du navigateur */}
        <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.04] px-3 py-2">
          <span className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-neon/80" />
            <span className="size-2.5 rounded-full bg-white/20" />
            <span className="size-2.5 rounded-full bg-white/20" />
          </span>
          <span className="mx-auto flex max-w-xs min-w-0 flex-1 items-center justify-center gap-2 truncate rounded bg-black/50 px-3 py-1 font-mono text-[10px] tracking-wider text-white/50">
            <span className="size-1.5 shrink-0 rounded-full bg-neon/70" />
            {projet.lienSite ? hote(projet.lienSite) : `${projet.nom.toLowerCase()} · aperçu`}
          </span>
          <span className="w-12" />
        </div>
        <div className="relative">
          {projet.image ? (
            <Image
              src={projet.image}
              alt={`Capture de ${projet.nom}`}
              width={1600}
              height={900}
              priority
              quality={90}
              sizes="(max-width: 768px) 100vw, 1100px"
              className="h-auto w-full"
            />
          ) : (
            <AsciiImage nom={projet.nom} alt={projet.nom} sizes="1100px" className="aspect-[16/9]" />
          )}
          {!reduire && (
            <motion.div
              className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-[linear-gradient(to_bottom,transparent,rgb(255_42_42/0.18)_90%,rgb(255_140_140/0.9)_99%,transparent)]"
              initial={{ y: "-100%" }}
              animate={{ y: "320%" }}
              transition={{ delay: 0.35, duration: 1.1, ease: [0.5, 0, 0.5, 1] }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Dossier plein écran d'un projet : étude de cas complète, navigation entre projets (← →),
 * appel à l'action et dossier suivant. Le premier dossier ouvert s'anime depuis l'image cliquée (layoutId).
 */
export default function Dossier({
  projet,
  onClose,
  onChange,
}: {
  projet: Projet | null;
  onClose: () => void;
  onChange: (p: Projet) => void;
}) {
  const [monte, setMonte] = useState(false);
  const [origine, setOrigine] = useState<string | null>(null);
  const defilement = useRef<HTMLDivElement>(null);
  useEffect(() => setMonte(true), []);

  // Seul le dossier ouvert depuis la liste part de l'image cliquée ; ensuite on navigue en fondu.
  useEffect(() => {
    if (!projet) setOrigine(null);
    else setOrigine((o) => o ?? projet.id);
  }, [projet]);

  const index = projet ? projets.findIndex((p) => p.id === projet.id) : -1;
  const precedent = index >= 0 ? projets[(index - 1 + projets.length) % projets.length] : null;
  const suivant = index >= 0 ? projets[(index + 1) % projets.length] : null;

  useEffect(() => {
    if (!projet) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && suivant) onChange(suivant);
      if (e.key === "ArrowLeft" && precedent) onChange(precedent);
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [projet, onClose, onChange, suivant, precedent]);

  // Nouveau dossier : retour en haut.
  useEffect(() => {
    defilement.current?.scrollTo({ top: 0 });
  }, [projet?.id]);

  if (!monte) return null;

  const allerAuContact = () => {
    onClose();
    setTimeout(() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }), 60);
  };

  return createPortal(
    <AnimatePresence>
      {projet && (
        <motion.div
          ref={defilement}
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain"
          style={{ background: FOND_SPREAD }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          role="dialog"
          aria-modal="true"
          aria-label={projet.nom}
        >
          <div className="pointer-events-none fixed inset-0">
            <FondTexte />
          </div>

          {/* Barre de commande */}
          <motion.header
            className="sticky top-0 z-10 border-b border-white/10 bg-black/70 backdrop-blur-md"
            initial={{ y: -60 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.15, duration: 0.45, ease: EASE }}
          >
            <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 font-mono text-[10px] tracking-[0.25em] uppercase md:px-10 md:text-xs">
              <span className="flex items-center gap-2 text-neon">
                <span className="size-1.5 animate-pulse bg-neon shadow-[0_0_6px_#ff2a2a]" />
                Dossier {pad(index + 1)}
                <span className="text-white/35">/ {pad(projets.length)}</span>
              </span>
              {/* Pastilles : un trait par projet, cliquables */}
              <span className="hidden flex-1 items-center gap-1.5 md:flex">
                {projets.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onChange(p)}
                    data-info-titre={`${p.numero} · ${p.nom}`}
                    data-info="Ouvrir ce dossier"
                    className="group flex h-6 flex-1 items-center"
                    aria-label={`Ouvrir ${p.nom}`}
                  >
                    <span className={`h-0.5 w-full transition-colors ${p.id === projet.id ? "bg-neon shadow-[0_0_8px_#ff2a2a]" : "bg-white/15 group-hover:bg-white/40"}`} />
                  </button>
                ))}
              </span>
              <span className="ml-auto flex items-center gap-2 md:ml-0">
                {[
                  { p: precedent, icone: ArrowLeft, touche: "←", label: "Dossier précédent" },
                  { p: suivant, icone: ArrowRight, touche: "→", label: "Dossier suivant" },
                ].map(({ p, icone: Icone, touche, label }) =>
                  p ? (
                    <button
                      key={label}
                      onClick={() => onChange(p)}
                      data-info-titre={label}
                      data-info={p.nom}
                      data-info-touche={touche}
                      className="flex size-9 items-center justify-center border border-white/15 text-white/60 transition-colors hover:border-neon hover:text-neon"
                      aria-label={label}
                    >
                      <Icone className="size-4" />
                    </button>
                  ) : null,
                )}
                <button
                  data-info-titre="Fermer"
                  data-info="Revenir à la liste des projets"
                  data-info-touche="Échap"
                  onClick={onClose}
                  className="ml-2 flex size-9 items-center justify-center border border-white/15 text-white/70 transition-colors hover:border-neon hover:bg-neon/10 hover:text-neon"
                  aria-label="Fermer"
                >
                  <X className="size-4" />
                </button>
              </span>
            </div>
          </motion.header>

          <AnimatePresence mode="wait" initial={false}>
            <motion.article
              key={projet.id}
              className="relative mx-auto w-full max-w-6xl px-4 pt-10 pb-20 md:px-10 md:pt-14"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } }}
              exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
            >
              {/* En-tête */}
              <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
                <div>
                  <motion.p {...bloc(0.1)} className="font-mono text-xs tracking-[0.25em] text-neon uppercase">
                    Dossier {projet.numero} <span className="text-neon/40">//</span> {projet.categorie}
                  </motion.p>
                  <h2 className="mt-3 font-display text-5xl leading-[0.9] font-bold tracking-tight text-white uppercase md:text-8xl">
                    <Titre texte={projet.nom} />
                  </h2>
                  <motion.p {...bloc(0.2)} className="mt-5 max-w-2xl text-lg text-white/80 md:text-2xl">
                    {projet.description}
                  </motion.p>
                </div>
                <motion.div {...bloc(0.3)} className="flex flex-wrap gap-3">
                  {projet.lienSite && (
                    <a
                      href={projet.lienSite}
                      data-info-titre="Voir le site"
                      data-info={`Ouvre ${hote(projet.lienSite)} dans un nouvel onglet`}
                      target="_blank"
                      rel="noreferrer"
                      className="coupe flex items-center gap-2 bg-neon px-6 py-3 font-mono text-xs font-semibold tracking-[0.2em] text-black uppercase transition-shadow hover:shadow-[0_0_24px_#ff2a2a]"
                    >
                      Voir le site <ArrowUpRight className="size-4" />
                    </a>
                  )}
                  {projet.lienCode && (
                    <a
                      href={projet.lienCode}
                      data-info-titre="Code source"
                      data-info="Voir le code du projet sur GitHub"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 border border-neon/40 px-6 py-3 font-mono text-xs font-semibold tracking-[0.2em] text-neon uppercase transition-colors hover:bg-neon/10"
                    >
                      <Code2 className="size-4" /> Code
                    </a>
                  )}
                </motion.div>
              </div>

              {/* Capture */}
              <motion.div
                layoutId={origine === projet.id ? `projet-${projet.id}` : undefined}
                transition={{ duration: 0.55, ease: EASE }}
                className="mt-10 md:mt-14"
              >
                <Apercu projet={projet} />
              </motion.div>

              {/* Corps */}
              <div className="mt-14 grid gap-12 md:mt-20 md:grid-cols-[1.7fr_1fr] md:gap-16">
                <div className="flex flex-col gap-14">
                  <motion.section {...bloc(0.35)}>
                    <h3 className="font-mono text-xs tracking-[0.25em] text-white/45 uppercase">
                      <span className="text-neon">01</span> // Le projet
                    </h3>
                    <p className="mt-4 text-lg leading-relaxed text-white/70 md:text-xl">{projet.descriptionLongue}</p>
                  </motion.section>

                  <motion.section {...bloc(0.45)}>
                    <h3 className="font-mono text-xs tracking-[0.25em] text-white/45 uppercase">
                      <span className="text-neon">02</span> // Ce que j&apos;ai fait, seul, de A à Z
                    </h3>
                    <ol className="mt-5 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
                      {ETAPES.map(({ icone: Icone, titre, texte }, i) => (
                        <motion.li
                          key={titre}
                          className="group relative flex flex-col gap-3 bg-[#0f0f0f] p-5 transition-colors hover:bg-[#160808]"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1, transition: { delay: 0.55 + i * 0.08 } }}
                        >
                          <span className="flex items-center justify-between">
                            <Icone className="size-5 text-neon" />
                            <span className="font-mono text-[10px] tracking-[0.2em] text-white/30">0{i + 1}</span>
                          </span>
                          <span className="font-display text-xl font-semibold tracking-wide text-white uppercase">{titre}</span>
                          <span className="text-sm leading-relaxed text-white/55">{texte}</span>
                          <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-neon transition-transform duration-300 group-hover:scale-x-100" />
                        </motion.li>
                      ))}
                    </ol>
                  </motion.section>
                </div>

                {/* Fiche technique */}
                <motion.aside {...bloc(0.5)} className="flex flex-col gap-8 md:sticky md:top-24 md:self-start">
                  <div className="relative border border-white/15 bg-black/60 backdrop-blur-sm">
                    <p className="flex items-center justify-between border-b border-white/10 px-4 py-3 font-mono text-[10px] tracking-[0.25em] text-neon uppercase">
                      Fiche technique <span className="text-white/30">#{projet.id}</span>
                    </p>
                    <dl className="font-mono text-xs tracking-[0.12em] uppercase">
                      {[
                        { label: "Catégorie", valeur: projet.categorie },
                        { label: "Rôle", valeur: "Solo · de A à Z" },
                        { label: "Année", valeur: projet.annee },
                        { label: "Statut", valeur: projet.statut ?? (projet.lienSite ? "En ligne" : undefined) },
                        { label: "Adresse", valeur: projet.lienSite ? hote(projet.lienSite) : undefined },
                      ]
                        .filter((l) => l.valeur)
                        .map(({ label, valeur }) => (
                          <div key={label} className="flex justify-between gap-4 border-b border-dashed border-white/10 px-4 py-3 last:border-0">
                            <dt className="text-white/40">{label}</dt>
                            <dd className="text-right text-white">
                              {label === "Statut" && <span className="mr-2 inline-block size-1.5 translate-y-[-1px] rounded-full bg-neon shadow-[0_0_6px_#ff2a2a]" />}
                              {valeur}
                            </dd>
                          </div>
                        ))}
                    </dl>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] tracking-[0.25em] text-white/40 uppercase">Stack · {projet.stack.length} outils</p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {projet.stack.map((s) => (
                        <li key={s} className="border border-neon/30 bg-neon/[0.06] px-3 py-1.5 font-mono text-xs text-neon">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.aside>
              </div>

              {/* Appel à l'action */}
              <motion.div
                {...bloc(0.6)}
                className="relative mt-20 overflow-hidden border border-neon/40 bg-[linear-gradient(120deg,rgb(255_42_42/0.16),rgb(255_42_42/0.03)_60%)] p-6 md:mt-28 md:flex md:items-center md:justify-between md:gap-10 md:p-10"
              >
                <div>
                  <p className="font-mono text-xs tracking-[0.25em] text-neon uppercase">&gt; Prochaine mission</p>
                  <p className="mt-3 font-display text-3xl leading-tight font-bold text-white uppercase md:text-5xl">
                    Un projet comme {projet.nom}&nbsp;?
                  </p>
                  <p className="mt-3 max-w-lg text-white/60">Racontez-moi votre idée : je vous réponds avec un plan clair et un délai réaliste.</p>
                </div>
                <button
                  onClick={allerAuContact}
                  data-info-titre="Lancer mon projet"
                  data-info="Fermer le dossier et aller au formulaire de contact"
                  className="coupe group mt-6 flex shrink-0 items-center gap-2 bg-neon px-7 py-4 font-mono text-xs font-semibold tracking-[0.2em] text-black uppercase transition-shadow hover:shadow-[0_0_30px_#ff2a2a] md:mt-0"
                >
                  Lancer mon projet
                  <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </motion.div>

              {/* Dossier suivant */}
              {suivant && suivant.id !== projet.id && (
                <motion.button
                  {...bloc(0.7)}
                  onClick={() => onChange(suivant)}
                  data-info-titre="Dossier suivant"
                  data-info={suivant.description}
                  data-info-touche="→"
                  className="group mt-6 flex w-full items-center gap-5 border border-white/10 bg-black/50 p-4 text-left transition-colors hover:border-neon/50 md:gap-8 md:p-5"
                >
                  {suivant.image && (
                    <span className="relative hidden aspect-[16/10] w-40 shrink-0 overflow-hidden border border-white/10 sm:block">
                      <Image
                        src={suivant.image}
                        alt=""
                        fill
                        sizes="160px"
                        className="object-cover object-top grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
                      />
                    </span>
                  )}
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="font-mono text-[10px] tracking-[0.25em] text-white/40 uppercase">
                      Dossier suivant · {suivant.numero}
                    </span>
                    <span className="truncate font-display text-2xl font-bold text-white uppercase transition-colors group-hover:text-neon md:text-4xl">
                      {suivant.nom}
                    </span>
                  </span>
                  <ArrowRight className="ml-auto size-6 shrink-0 text-white/40 transition-all group-hover:translate-x-1 group-hover:text-neon" />
                </motion.button>
              )}
            </motion.article>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
