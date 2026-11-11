"use client";

import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { ChevronsRight } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { site } from "@/data/site";
import LogoTournant from "../demarrage/LogoTournant";
import * as sons from "../demarrage/sons";
import { CHOC } from "./Entree";

const liens = [
  { id: "accueil", numero: "01", label: "Accueil" },
  { id: "projets", numero: "02", label: "Projets" },
  { id: "profil", numero: "03", label: "Profil" },
  { id: "contact", numero: "04", label: "Contact" },
];

const ressort = { type: "spring", stiffness: 420, damping: 34 } as const;

/** Verre teinté : flou du fond, bordure fine, reflet en haut. */
const verre =
  "border border-white/10 bg-[linear-gradient(160deg,rgb(255_255_255/0.07),rgb(10_10_10/0.72)_35%,rgb(10_10_10/0.8))] shadow-[inset_0_1px_0_rgb(255_255_255/0.1),0_24px_70px_rgb(0_0_0/0.6)] backdrop-blur-2xl backdrop-saturate-150";

const LARGEUR = { ferme: 76, ouvert: 248 };

/** Contenu visible seulement rail ouvert, avec une petite apparition. */
function Revele({ ouvert, delai = 0, children, className = "" }: { ouvert: boolean; delai?: number; children: ReactNode; className?: string }) {
  return (
    <motion.span
      className={`whitespace-nowrap ${className}`}
      initial={false}
      animate={ouvert ? { opacity: 1, x: 0, filter: "blur(0px)" } : { opacity: 0, x: -8, filter: "blur(4px)" }}
      transition={{ duration: 0.22, delay: ouvert ? delai : 0 }}
    >
      {children}
    </motion.span>
  );
}

/** Section à l'écran + avancement (0 → 1) dans cette section. */
function useSectionActive() {
  const [etat, setEtat] = useState({ id: "accueil", avance: 0 });
  useEffect(() => {
    let raf = 0;
    const maj = () => {
      raf = 0;
      const milieu = window.innerHeight * 0.45;
      for (const { id } of liens) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= milieu && r.bottom > milieu) {
          const avance = Math.min(1, Math.max(0, (milieu - r.top) / r.height));
          setEtat((e) => (e.id === id && Math.abs(e.avance - avance) < 0.01 ? e : { id, avance }));
          return;
        }
      }
    };
    const surScroll = () => {
      if (!raf) raf = requestAnimationFrame(maj);
    };
    maj();
    window.addEventListener("scroll", surScroll, { passive: true });
    window.addEventListener("resize", surScroll);
    return () => {
      window.removeEventListener("scroll", surScroll);
      window.removeEventListener("resize", surScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return etat;
}

/** Touches 1 à 4 : aller directement à une section (sauf pendant la saisie). */
function useRaccourcis() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement;
      if (cible.closest("input, textarea, [contenteditable]") || e.metaKey || e.ctrlKey || e.altKey) return;
      const lien = liens[Number(e.key) - 1];
      if (lien) document.getElementById(lien.id)?.scrollIntoView({ behavior: "smooth" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

function Horloge() {
  const [t, setT] = useState("--:--");
  useEffect(() => {
    const maj = () =>
      setT(new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(new Date()));
    maj();
    const i = setInterval(maj, 20_000);
    return () => clearInterval(i);
  }, []);
  return <>{t}</>;
}

function BoutonSon({ ouvert }: { ouvert: boolean }) {
  const [muet, setMuet] = useState(false);
  useEffect(() => setMuet(sons.estMuet()), []);
  return (
    <button
      data-info-titre={muet ? "Son coupé" : "Son activé"}
      data-info={muet ? "Réactiver les sons de l'interface (clavier, bips)" : "Couper tous les sons de l'interface"}
      onClick={(e) => {
        e.stopPropagation();
        setMuet(sons.basculerMuet());
      }}
      className="flex h-10 w-full items-center gap-3 rounded-xl px-[17px] font-mono text-[10px] tracking-[0.2em] text-white/50 uppercase transition-colors hover:bg-white/5 hover:text-neon"
      aria-label={muet ? "Activer le son" : "Couper le son"}
    >
      <span className="flex h-3.5 w-5 shrink-0 items-end justify-center gap-[2px]">
        {[0.5, 1, 0.35, 0.8].map((h, i) => (
          <motion.span
            key={i}
            className="w-[2px] bg-current"
            animate={muet ? { height: "18%" } : { height: [`${h * 100}%`, `${(1 - h) * 80 + 20}%`, `${h * 100}%`] }}
            transition={muet ? { duration: 0.2 } : { duration: 0.9 + i * 0.15, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </span>
      <Revele ouvert={ouvert}>Son {muet ? "coupé" : "activé"}</Revele>
    </button>
  );
}

/** Navigation : rail en verre tout à gauche, replié par défaut, ouvert au clic. Sur mobile, bouton + menu plein écran. */
export default function Rail({ demarre = true }: { demarre?: boolean }) {
  const { id: active, avance } = useSectionActive();
  useRaccourcis();
  const [ouvert, setOuvert] = useState(false);
  const [menu, setMenu] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Fermeture : Échap ou clic en dehors du rail.
  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOuvert(false);
    const onClic = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOuvert(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onClic);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onClic);
    };
  }, [ouvert]);
  const { scrollYProgress } = useScroll();
  const progression = useSpring(scrollYProgress, { stiffness: 140, damping: 30 });

  // Halo qui suit la souris dans le verre.
  const suivre = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  useEffect(() => {
    if (!menu) return;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [menu]);

  return (
    <>
      {/* ---------- Ordinateur : replié par défaut, il se déplie au clic ---------- */}
      <motion.nav
        ref={navRef}
        className={`group/rail fixed top-4 bottom-4 left-4 z-40 hidden cursor-pointer flex-col overflow-hidden rounded-[26px] p-3 md:flex ${verre}`}
        // Il glisse depuis le bord gauche juste après l'explosion d'entrée.
        initial={{ width: LARGEUR.ferme, x: -140, opacity: 0 }}
        animate={{ width: ouvert ? LARGEUR.ouvert : LARGEUR.ferme, x: demarre ? 0 : -140, opacity: demarre ? 1 : 0 }}
        transition={{
          default: ressort,
          x: { type: "spring", stiffness: 170, damping: 19, delay: CHOC + 0.75 },
          opacity: { duration: 0.25, delay: CHOC + 0.75 },
        }}
        onMouseMove={suivre}
        onClick={() => setOuvert((o) => !o)}
        aria-label="Navigation principale"
      >
        {/* Halo de souris */}
        <span
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/rail:opacity-100"
          style={{ background: "radial-gradient(220px circle at var(--mx) var(--my), rgb(255 42 42 / 0.14), transparent 70%)" }}
        />
        {/* Liseré néon sur le bord droit */}
        <span className="pointer-events-none absolute inset-y-8 right-0 w-px bg-gradient-to-b from-transparent via-neon/50 to-transparent" />

        {/* Logo + identité */}
        <div className="relative flex items-center gap-3 px-1">
          <span className="relative size-11 shrink-0">
            <LogoTournant className="absolute inset-0" />
          </span>
          <span className="flex flex-col">
            <Revele ouvert={ouvert} delai={0.05} className="font-display text-xl leading-none font-semibold tracking-wide text-white uppercase">
              {site.nom}
            </Revele>
            <Revele ouvert={ouvert} delai={0.1} className="mt-1 font-mono text-[9px] tracking-[0.18em] text-neon/80 uppercase">
              {site.role}
            </Revele>
          </span>
        </div>

        {/* Bouton plier / déplier */}
        <button
          data-info-titre={ouvert ? "Replier" : "Déplier"}
          data-info={ouvert ? "Réduire le menu à une fine colonne" : "Afficher le nom des sections et les raccourcis"}
          data-info-touche={ouvert ? "Échap" : undefined}
          onClick={(e) => {
            e.stopPropagation();
            setOuvert((o) => !o);
          }}
          className="relative mt-4 flex h-9 items-center gap-3 rounded-xl px-[15px] font-mono text-[10px] tracking-[0.2em] text-white/45 uppercase transition-colors hover:bg-white/5 hover:text-neon"
          aria-expanded={ouvert}
          aria-label={ouvert ? "Replier le menu" : "Déplier le menu"}
        >
          <motion.span animate={{ rotate: ouvert ? 180 : 0 }} transition={ressort} className="flex shrink-0">
            <ChevronsRight className="size-4" />
          </motion.span>
          <Revele ouvert={ouvert}>Replier</Revele>
        </button>

        {/* Navigation */}
        <ul className="relative my-auto flex flex-col gap-1.5">
          {/* Jauge de progression dans toute la page */}
          <span className="absolute top-2 bottom-2 left-0 w-px bg-white/10">
            <motion.span className="absolute inset-x-0 top-0 h-full origin-top bg-neon/70" style={{ scaleY: progression }} />
          </span>

          {liens.map(({ id, numero, label }, i) => {
            const estActif = active === id;
            return (
              <li key={id}>
                <motion.a
                  href={`#${id}`}
                  data-info-titre={`${numero} · ${label}`}
                  data-info={estActif ? "Section affichée en ce moment" : `Aller à la section ${label}`}
                  data-info-touche={String(i + 1)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOuvert(false);
                  }}
                  whileTap={{ scale: 0.96 }}
                  className={`group relative flex h-12 items-center gap-4 overflow-hidden rounded-xl pr-3 pl-[17px] transition-colors ${
                    estActif ? "text-white" : "text-white/45 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  {estActif && (
                    <motion.span
                      layoutId="rail-actif"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-neon/20 via-neon/[0.06] to-transparent"
                      transition={ressort}
                    >
                      <span className="absolute top-2 bottom-2 left-0 w-[3px] rounded-full bg-neon shadow-[0_0_12px_#ff2a2a]" />
                    </motion.span>
                  )}
                  <span
                    className={`relative w-6 shrink-0 font-mono text-xs transition-colors duration-200 group-hover:text-neon ${
                      estActif ? "text-neon [text-shadow:0_0_10px_#ff2a2a]" : ""
                    }`}
                  >
                    {numero}
                  </span>
                  <span className="relative flex min-w-0 flex-1 flex-col">
                    <Revele
                      ouvert={ouvert}
                      delai={0.04 + i * 0.03}
                      className="font-display text-lg leading-tight font-semibold tracking-wide uppercase"
                    >
                      {label}
                    </Revele>
                    {/* Avancement dans la section active */}
                    {estActif && ouvert && (
                      <span className="mt-1 h-px w-full bg-white/10">
                        <span className="block h-full bg-neon transition-[width] duration-150" style={{ width: `${avance * 100}%` }} />
                      </span>
                    )}
                  </span>
                  <Revele ouvert={ouvert} delai={0.08 + i * 0.03} className="relative rounded border border-white/15 px-1.5 font-mono text-[10px] text-white/40">
                    {i + 1}
                  </Revele>
                </motion.a>
              </li>
            );
          })}
        </ul>

        {/* Bas : son + statut */}
        <div className="flex flex-col gap-1 border-t border-white/10 pt-3">
          <BoutonSon ouvert={ouvert} />
          <div className="flex h-10 items-center gap-3 px-[21px] font-mono text-[10px] tracking-[0.2em] text-white/50 uppercase">
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inset-0 animate-ping rounded-full bg-neon/60" />
              <span className="relative size-2 rounded-full bg-neon shadow-[0_0_8px_#ff2a2a]" />
            </span>
            <Revele ouvert={ouvert}>
              En ligne · <Horloge />
            </Revele>
          </div>
        </div>
      </motion.nav>

      {/* ---------- Mobile ---------- */}
      <button
        onClick={() => setMenu(true)}
        className={`fixed top-4 left-4 z-40 flex items-center gap-2 rounded-2xl py-2 pr-4 pl-2 md:hidden ${verre}`}
        aria-expanded={menu}
      >
        <span className="relative size-8">
          <LogoTournant className="absolute inset-0" />
        </span>
        <span className="font-mono text-[11px] tracking-[0.2em] text-neon uppercase">Menu</span>
      </button>

      <AnimatePresence>
        {menu && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-black/80 px-6 pt-6 pb-10 backdrop-blur-2xl md:hidden"
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            animate={{ clipPath: "inset(0 0% 0 0)" }}
            exit={{ clipPath: "inset(0 100% 0 0)" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs tracking-[0.25em] text-neon">BORREL//SIM</span>
              <button onClick={() => setMenu(false)} className="font-mono text-xs tracking-[0.2em] text-neon uppercase">
                [ Fermer ]
              </button>
            </div>
            <nav className="mt-auto flex flex-col gap-2">
              {liens.map(({ id, numero, label }, i) => (
                <motion.a
                  key={id}
                  href={`#${id}`}
                  onClick={() => setMenu(false)}
                  className="flex items-baseline gap-4 border-b border-white/10 py-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: 0.15 + i * 0.06 } }}
                >
                  <span className={`font-mono text-sm ${active === id ? "text-neon" : "text-white/40"}`}>{numero}</span>
                  <span className="font-display text-4xl font-semibold text-white uppercase">{label}</span>
                </motion.a>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
