"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import Construction from "./Construction";
import { Bandeau, Compteur, EcranCRT, FluxHex, Horloge, Oscillo, Panneau, Telemetrie, pulser } from "./Hud";
import LogoTournant from "./LogoTournant";
import { script, type Ligne } from "./script";
import * as sons from "./sons";

type Statut = "attente" | "alerte" | "ok";
type Phase = "attente" | "boot" | "sortie" | "fini";
type Effet = "glitch" | "secousse" | null;

const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));
const hasard = (min: number, max: number) => min + Math.random() * (max - min);
const SESSION = "4F2A-9C1E";

const BANNIERE = [
  "██████╗  ██████╗ ██████╗ ██████╗ ███████╗██╗     ",
  "██╔══██╗██╔═══██╗██╔══██╗██╔══██╗██╔════╝██║     ",
  "██████╔╝██║   ██║██████╔╝██████╔╝█████╗  ██║     ",
  "██╔══██╗██║   ██║██╔══██╗██╔══██╗██╔══╝  ██║     ",
  "██████╔╝╚██████╔╝██║  ██║██║  ██║███████╗███████╗",
  "╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝",
];

/** Bannière ASCII en tête du terminal, dévoilée ligne par ligne par un balayage. */
function Banniere() {
  return (
    <div className="mb-auto shrink-0 pb-4">
      <pre className="font-mono text-[6px] leading-[1.1] text-neon [text-shadow:0_0_8px_rgb(255_42_42/0.7)] sm:text-[8px] xl:text-[9px]">
        {BANNIERE.map((l, i) => (
          <motion.span
            key={i}
            className="block"
            initial={{ clipPath: "inset(0 100% 0 0)", opacity: 0.4 }}
            animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
            transition={{ delay: 0.75 + i * 0.06, duration: 0.35, ease: [0.7, 0, 0.2, 1] }}
          >
            {l}
          </motion.span>
        ))}
      </pre>
      <motion.p
        className="mt-3 flex items-center gap-3 font-mono text-[9px] tracking-[0.25em] text-neon/45 uppercase md:text-[10px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.3 }}
      >
        <span className="h-px w-6 bg-neon/50" />
        Système de simulation personnelle · Antibes
      </motion.p>
    </div>
  );
}

function BadgeStatut({ statut }: { statut?: Statut }) {
  if (!statut) return null;
  const styles: Record<Statut, string> = {
    attente: "text-neon/40",
    alerte: "bg-neon px-0.5 text-black animate-pulse",
    ok: "text-neon [text-shadow:0_0_10px_rgb(255_42_42/0.9)]",
  };
  const textes: Record<Statut, string> = { attente: "[ .. ]", alerte: "[ !! ]", ok: "[ OK ]" };
  return <span className={`shrink-0 ${styles[statut]}`}>{textes[statut]}</span>;
}

function Barre({ pourcent }: { pourcent: number }) {
  return (
    <span className="flex shrink-0 items-center gap-2 text-neon">
      <span className="relative h-2.5 w-20 overflow-hidden border border-neon/50 sm:w-36">
        <span
          className="absolute inset-y-0 left-0 bg-[repeating-linear-gradient(90deg,#ff2a2a_0_6px,transparent_6px_8px)] shadow-[0_0_10px_rgb(255_42_42/0.8)]"
          style={{ width: `${pourcent}%` }}
        />
      </span>
      <span className="w-9 text-right tabular-nums">{pourcent}%</span>
    </span>
  );
}

function LigneTerminal({
  ligne,
  texte,
  statut,
  pourcent,
  curseur,
  ts,
}: {
  ligne: Ligne;
  texte: string;
  statut?: Statut;
  pourcent: number;
  curseur: boolean;
  ts?: number;
}) {
  if (ligne.type === "vide") return <div className="h-[1.2em]" />;
  if (ligne.type === "pret") return null;

  const caret = curseur && (
    <span className="cyber-curseur ml-0.5 inline-block h-[1.1em] w-[0.6em] translate-y-[0.15em] bg-neon shadow-[0_0_8px_#ff2a2a]" />
  );
  // Horodatage façon journal noyau.
  const horo = <span className="hidden shrink-0 text-neon/25 tabular-nums sm:inline">[{(ts ?? 0).toFixed(4).padStart(9, " ")}]</span>;

  switch (ligne.type) {
    case "titre":
      return (
        <div className="flex gap-3">
          {horo}
          <span className="text-white [text-shadow:0_0_12px_rgb(255_42_42/0.9)]">
            {texte}
            {caret}
          </span>
        </div>
      );
    case "info":
      return (
        <div className="flex gap-3">
          {horo}
          <span className="pl-5 text-neon/55">
            <span className="text-neon/35">↳ </span>
            {texte}
            {caret}
          </span>
        </div>
      );
    default:
      return (
        <div className={`flex items-baseline gap-3 ${statut === "alerte" ? "bg-neon/15" : ""}`}>
          {horo}
          <span className="text-neon/50">&gt;</span>
          <span className="min-w-0 text-neon/85">
            {texte}
            {caret}
          </span>
          {(statut || ligne.type === "progression") && (
            <>
              <span className="min-w-4 flex-1 translate-y-[-0.25em] border-b border-dotted border-neon/20" />
              {ligne.type === "progression" ? <Barre pourcent={pourcent} /> : <BadgeStatut statut={statut} />}
            </>
          )}
        </div>
      );
  }
}

function nomPhase(avancement: number, pret: boolean) {
  if (pret) return "05 · Prêt";
  if (avancement < 0.35) return "01 · Initialisation";
  if (avancement < 0.5) return "02 · Chargement";
  if (avancement < 0.78) return "03 · Identification";
  return "04 · Synchronisation";
}

/** Écran d'accueil : il faut un geste du visiteur pour que le navigateur autorise le son. */
function EcranAttente() {
  return (
    <motion.div
      key="attente"
      className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
      exit={{ opacity: 0, scale: 1.15, filter: "blur(12px) brightness(2)", transition: { duration: 0.3 } }}
    >
      {/* Radar autour du logo */}
      <div className="relative mb-10 flex size-56 items-center justify-center md:size-64">
        <svg viewBox="0 0 100 100" className="cyber-rotation absolute inset-0 size-full" fill="none" stroke="#ff2a2a" aria-hidden>
          <circle cx="50" cy="50" r="49" strokeWidth="0.3" opacity="0.5" />
          <circle cx="50" cy="50" r="41" strokeWidth="0.25" strokeDasharray="1 2" opacity="0.6" />
          <circle cx="50" cy="50" r="30" strokeWidth="0.2" opacity="0.3" />
          {Array.from({ length: 36 }, (_, i) => (
            <line key={i} x1="50" y1="1" x2="50" y2={i % 3 ? 3 : 5} strokeWidth="0.4" opacity="0.7" transform={`rotate(${i * 10} 50 50)`} />
          ))}
        </svg>
        <div
          className="cyber-rotation absolute inset-[4%] rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_300deg,rgb(255_42_42/0.35)_359deg,transparent_360deg)]"
          style={{ animationDuration: "2.6s" }}
        />
        <LogoTournant className="relative size-24 md:size-28" />
      </div>

      <p className="cyber-glitch font-display text-5xl font-bold tracking-[0.06em] text-neon md:text-7xl" data-text="BORREL//SIM">
        BORREL//SIM
      </p>
      <p className="mt-3 font-mono text-[10px] tracking-[0.4em] text-neon/45 uppercase md:text-xs">Simulation · accès restreint · v2.6</p>

      <div className="mt-14 flex items-center gap-4">
        <span className="h-px w-8 bg-gradient-to-r from-transparent to-neon md:w-20" />
        <p className="animate-pulse font-mono text-xs tracking-[0.35em] text-neon uppercase [text-shadow:0_0_12px_rgb(255_42_42/0.8)] md:text-base">
          <span className="hidden md:inline">[ Appuyez sur une touche ]</span>
          <span className="md:hidden">[ Touchez l&apos;écran ]</span>
        </p>
        <span className="h-px w-8 bg-gradient-to-l from-transparent to-neon md:w-20" />
      </div>
      <p className="mt-4 font-mono text-[10px] tracking-[0.25em] text-neon/35 uppercase md:text-xs">pour initialiser · son recommandé</p>

      {/* Cadre */}
      <div className="pointer-events-none absolute inset-4 md:inset-8" aria-hidden>
        {["top-0 left-0 border-t-2 border-l-2", "top-0 right-0 border-t-2 border-r-2", "bottom-0 left-0 border-b-2 border-l-2", "right-0 bottom-0 border-r-2 border-b-2"].map((c) => (
          <span key={c} className={`absolute size-6 border-neon/60 ${c}`} />
        ))}
        <div className="absolute top-3 right-5 left-5 flex justify-between font-mono text-[10px] tracking-[0.2em] text-neon/50 uppercase md:top-4 md:right-8 md:left-8 md:text-xs">
          <span>Session {SESSION}</span>
          <Horloge />
        </div>
        <p className="cyber-curseur absolute right-0 bottom-4 left-0 font-mono text-[10px] tracking-[0.3em] text-neon/40 uppercase md:bottom-5">
          ■ En attente d&apos;opérateur
        </p>
      </div>
    </motion.div>
  );
}

/** Séquence de démarrage plein écran, jouée à chaque lancement. */
export default function Demarrage({ onFini }: { onFini?: () => void }) {
  const reduire = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("attente");
  const [ligneCourante, setLigneCourante] = useState(0);
  const [car, setCar] = useState(0);
  const [statuts, setStatuts] = useState<Record<number, Statut>>({});
  const [horodatages, setHorodatages] = useState<Record<number, number>>({});
  const [pourcent, setPourcent] = useState(0);
  const [pret, setPret] = useState(false);
  const [muet, setMuet] = useState(false);
  const [effet, setEffet] = useState<Effet>(null);
  const annule = useRef(false);

  useEffect(() => setMuet(sons.estMuet()), []);

  const declencher = useCallback(
    (e: Exclude<Effet, null>, ms: number) => {
      if (reduire) return;
      setEffet(e);
      setTimeout(() => setEffet(null), ms);
    },
    [reduire],
  );

  // Premier geste du visiteur : le son peut s'activer, la séquence démarre.
  const demarrer = useCallback(() => {
    sons.activer();
    sons.allumage();
    sons.demarrerAmbiance();
    setPhase((p) => (p === "attente" ? "boot" : p));
  }, []);

  const sortir = useCallback(() => {
    annule.current = true;
    setPhase((p) => (p === "boot" ? "sortie" : p));
  }, []);

  useEffect(() => {
    if (phase === "sortie") sons.extinction();
  }, [phase]);

  // Déroulé du script.
  useEffect(() => {
    if (phase !== "boot") return;
    annule.current = false;
    const debut = performance.now();
    const statut = (i: number, s: Statut) => setStatuts((prev) => ({ ...prev, [i]: s }));

    (async () => {
      // Le temps que l'écran s'allume et que l'interface s'assemble.
      await attendre(reduire ? 0 : 950);
      for (let i = 0; i < script.length; i++) {
        if (annule.current) return;
        const ligne = script[i];
        setLigneCourante(i);
        setHorodatages((h) => ({ ...h, [i]: (performance.now() - debut) / 1000 }));
        setCar(0);

        if (ligne.type === "pret") {
          setPret(true);
          sons.impact();
          pulser(3);
          declencher("secousse", 450);
          await attendre(reduire ? 900 : 1700);
          break;
        }

        // Frappe caractère par caractère, avec un clic de clavier par caractère.
        if (!reduire) {
          const vitesse = ligne.type === "titre" ? 18 : 0;
          for (let c = 1; c <= ligne.texte.length; c++) {
            if (annule.current) return;
            setCar(c);
            if (ligne.texte[c - 1] !== " ") {
              sons.touche();
              pulser(0.12);
            }
            await attendre(vitesse || hasard(5, 12));
          }
        }
        setCar(ligne.texte.length);

        if (ligne.type === "tache" || ligne.type === "alerte") {
          statut(i, "attente");
          await attendre(reduire ? 0 : hasard(110, 280));
          if (ligne.type === "alerte") {
            statut(i, "alerte");
            sons.alerte();
            pulser(3);
            declencher("glitch", 700);
            await attendre(reduire ? 0 : 1000);
          }
          statut(i, "ok");
          sons.ok();
          pulser(0.6);
        }
        if (ligne.type === "progression") {
          for (let p = 0; p <= 100; p += 4) {
            if (annule.current) return;
            setPourcent(p);
            pulser(0.25);
            await attendre(reduire ? 0 : hasard(20, 50));
          }
          setPourcent(100);
        }
        await attendre(reduire ? 0 : ligne.type === "vide" ? 40 : 60);
      }
      if (!annule.current) sortir();
    })();

    return () => {
      annule.current = true;
    };
  }, [phase, reduire, sortir, declencher]);

  // Clavier : n'importe quelle touche pour démarrer, Échap / Entrée pour passer. Pas de scroll pendant ce temps.
  useEffect(() => {
    if (phase === "fini") return;
    const onKey = (e: KeyboardEvent) => {
      if (phase === "attente") demarrer();
      else if (["Escape", "Enter"].includes(e.key)) sortir();
    };
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [phase, demarrer, sortir]);

  if (phase === "fini") return null;

  const sortie = phase === "sortie";
  const lignesVisibles = script.slice(0, ligneCourante + 1);
  const avancement = pret
    ? 1
    : (ligneCourante + car / Math.max(1, script[ligneCourante].texte.length)) / (script.length - 1);
  const enAlerte = Object.values(statuts).includes("alerte");

  const terminal = (
    <div className="flex h-full flex-col justify-end overflow-hidden p-4 pt-7 font-mono text-[11px] leading-[1.75] sm:text-xs md:p-5 md:pt-8">
      {!reduire && <Banniere />}
      {lignesVisibles.map((ligne, i) => {
        const enCours = i === ligneCourante && !pret;
        return (
          <LigneTerminal
            key={i}
            ligne={ligne}
            texte={enCours ? ligne.texte.slice(0, car) : ligne.texte}
            statut={statuts[i]}
            pourcent={pourcent}
            curseur={enCours && !statuts[i]}
            ts={horodatages[i]}
          />
        );
      })}
    </div>
  );

  return (
    <motion.div
      className="fixed inset-0 z-[100] origin-center overflow-hidden bg-black"
      initial="boot"
      animate={sortie ? "sortie" : "boot"}
      variants={{
        boot: { scaleX: 1, scaleY: 1, opacity: 1, backgroundColor: "#000000" },
        // Extinction façon vieil écran : écrasement en ligne rouge, puis en point.
        sortie: reduire
          ? { opacity: 0, transition: { duration: 0.4 } }
          : {
              scaleY: [1, 1, 0.004, 0.004],
              scaleX: [1, 1, 1, 0],
              backgroundColor: ["#000000", "#000000", "#ff2a2a", "#ff2a2a"],
              transition: { duration: 1, times: [0, 0.3, 0.65, 1], ease: ["linear", "easeIn", "easeOut"] },
            },
      }}
      onAnimationComplete={(definition) => {
        if (definition !== "sortie") return;
        setPhase("fini");
        onFini?.();
      }}
      onClick={phase === "attente" ? demarrer : sortir}
      role="status"
      aria-label="Démarrage du site"
    >
      <motion.div
        className="absolute inset-0"
        animate={
          sortie && !reduire
            ? {
                x: [0, -10, 8, -4, 0],
                opacity: [1, 1, 1, 0.6, 0],
                filter: ["none", "brightness(2.2)", "none", "brightness(1.6)", "none"],
              }
            : undefined
        }
        transition={{ duration: 0.55, times: [0, 0.2, 0.4, 0.6, 1] }}
      >
        <AnimatePresence mode="wait">
          {phase === "attente" ? (
            <EcranAttente />
          ) : (
            <motion.div key="boot" className={`absolute inset-0 ${effet === "glitch" ? "ecran-glitch" : effet === "secousse" ? "ecran-secousse" : ""}`}>
              {/* Allumage cathodique : une ligne blanche qui s'étire puis s'ouvre en plein écran. */}
              {!reduire && (
                <motion.div
                  className="pointer-events-none absolute inset-0 z-40 bg-white"
                  initial={{ scaleX: 0, scaleY: 0.003, opacity: 1 }}
                  animate={{ scaleX: [0, 1, 1], scaleY: [0.003, 0.003, 1], opacity: [1, 1, 0] }}
                  transition={{ duration: 0.65, times: [0, 0.4, 1], ease: ["easeOut", "easeIn"] }}
                />
              )}

              <div className="relative flex h-full flex-col gap-5 p-4 md:gap-6 md:p-8">
                {/* Barre du haut */}
                <motion.header
                  className="flex items-center gap-4 font-mono text-[10px] tracking-[0.2em] text-neon/60 uppercase md:gap-6 md:text-xs"
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <span className="relative size-7 shrink-0 md:size-8">
                    <LogoTournant className="absolute inset-0" />
                  </span>
                  <span className="text-neon">
                    Borrel//sim <span className="text-neon/40">· noyau 2.6.0</span>
                  </span>
                  <span className="hidden flex-1 items-center gap-3 md:flex">
                    <span className="h-px flex-1 bg-neon/15">
                      <span className="block h-full bg-neon shadow-[0_0_8px_#ff2a2a] transition-[width] duration-200" style={{ width: `${avancement * 100}%` }} />
                    </span>
                    <span className="text-white/80">Phase {nomPhase(avancement, pret)}</span>
                  </span>
                  <span className="ml-auto hidden lg:inline">Session {SESSION}</span>
                  <span className="ml-auto lg:ml-0">
                    <Horloge />
                  </span>
                </motion.header>

                {/* Grille de panneaux */}
                <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[1fr_auto] gap-5 md:gap-6 lg:grid-cols-12 lg:grid-rows-1">
                  <div className="hidden min-h-0 flex-col gap-6 xl:col-span-3 xl:flex">
                    <Panneau titre="Mémoire" info="0x7F3A00" delai={0.3} className="min-h-0 flex-1">
                      <FluxHex />
                    </Panneau>
                    <Panneau titre="Système" info="temps réel" delai={0.55} className="h-40 shrink-0">
                      <Telemetrie avancement={avancement} />
                    </Panneau>
                  </div>

                  <Panneau
                    titre="Terminal · tty0"
                    info={`${String(Math.min(ligneCourante + 1, script.length)).padStart(2, "0")}/${script.length}`}
                    delai={0.15}
                    className="min-h-0 lg:col-span-7 xl:col-span-5"
                  >
                    {terminal}
                  </Panneau>

                  <div className="flex min-h-0 flex-col gap-6 lg:col-span-5 xl:col-span-4">
                    <Panneau titre="Rendu · cité_01" info="43.58N 7.12E" delai={0.4} className="hidden min-h-0 flex-1 lg:block">
                      <Construction progression={avancement} className="absolute inset-0 pt-4" />
                    </Panneau>
                    <Panneau titre="Progression" delai={0.65} className="h-36 shrink-0 md:h-48">
                      <Compteur valeur={avancement * 100} />
                    </Panneau>
                  </div>
                </div>

                {/* Barre du bas */}
                <motion.footer
                  className="flex items-center gap-6 font-mono text-[10px] tracking-[0.2em] uppercase md:text-xs"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  <button
                    data-info-titre={muet ? "Son coupé" : "Son activé"}
                    data-info={muet ? "Réactiver le clavier et les bips de la séquence" : "Couper le son de la séquence"}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMuet(sons.basculerMuet());
                    }}
                    className="text-neon/45 transition-colors hover:text-neon"
                  >
                    Son : {muet ? "coupé" : "activé"}
                  </button>
                  <button
                    onClick={sortir}
                    data-info-titre="Passer"
                    data-info="Arrêter la séquence et entrer directement sur le site"
                    data-info-touche="Échap"
                    className="text-neon/45 transition-colors hover:text-neon"
                  >
                    Passer [Échap]
                  </button>
                  <Oscillo className="ml-auto hidden h-8 w-56 md:block lg:w-80" />
                  <span className="hidden text-neon/35 lg:inline">Signal · 60 Hz</span>
                </motion.footer>
              </div>

              {/* Alerte : voile rouge et bandeau de danger. */}
              <AnimatePresence>
                {enAlerte && !reduire && (
                  <motion.div
                    className="pointer-events-none absolute inset-0 z-20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                  >
                    <div className="absolute inset-0 animate-pulse bg-neon/10" />
                    <motion.div
                      className="absolute inset-x-[-10%] top-1/2 -translate-y-1/2 -rotate-3"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.25, ease: [0.7, 0, 0.2, 1] }}
                    >
                      <Bandeau texte="⚠ Anomalie détectée · recalibrage" className="h-12 md:h-14" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* SIMULATION PRÊTE : le titre s'écrase sur l'écran. */}
              <AnimatePresence>
                {pret && (
                  <motion.div
                    className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center overflow-hidden bg-black/85 px-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.12 }}
                  >
                    <motion.div
                      className="absolute inset-x-[-10%] top-[20%] -rotate-2"
                      initial={{ x: "-100%" }}
                      animate={{ x: "0%" }}
                      transition={{ duration: 0.35, ease: [0.7, 0, 0.2, 1] }}
                    >
                      <Bandeau texte="Accès autorisé" className="h-9 opacity-80" />
                    </motion.div>
                    <motion.div
                      className="absolute inset-x-[-10%] bottom-[20%] rotate-2"
                      initial={{ x: "100%" }}
                      animate={{ x: "0%" }}
                      transition={{ duration: 0.35, ease: [0.7, 0, 0.2, 1] }}
                    >
                      <Bandeau texte="Bienvenue opérateur" className="h-9 opacity-80" />
                    </motion.div>

                    <motion.p
                      className="cyber-glitch text-center font-display text-[clamp(2.6rem,10vw,9.5rem)] leading-[0.9] font-bold tracking-tight text-neon"
                      data-text="SIMULATION PRÊTE"
                      initial={{ scale: reduire ? 1 : 3.2, opacity: 0, filter: "blur(24px)" }}
                      animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                      transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}
                    >
                      SIMULATION PRÊTE
                    </motion.p>
                    <motion.p
                      className="mt-6 font-mono text-xs tracking-[0.3em] text-neon/70 uppercase md:text-sm"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                    >
                      &gt; entrée dans la simulation
                      <span className="cyber-curseur ml-1 inline-block h-[1.1em] w-[0.6em] translate-y-[0.15em] bg-neon" />
                    </motion.p>

                    {/* Flash d'impact */}
                    <motion.div
                      className="absolute inset-0 bg-white"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.7, 0] }}
                      transition={{ delay: 0.28, duration: 0.3, times: [0, 0.1, 1] }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <EcranCRT />
      </motion.div>
    </motion.div>
  );
}
