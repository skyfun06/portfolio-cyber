"use client";

import { animate, AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { projets } from "@/data/projects";
import { identite } from "@/data/profil";
import { site } from "@/data/site";
import FondTexte from "../FondTexte";
import TextTunnel from "../TextTunnel";
import { FOND_SPREAD } from "../TextSpread";
import { CHOC } from "./Entree";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Les anneaux du vortex alternent l'identité, les produits lancés et la stack. */
const PHRASES = [
  `${site.nom} — ${site.role} — ${site.ville} — `.toUpperCase(),
  `${projets.map((p) => p.nom).join(" — ")} — `.toUpperCase(),
  "NEXT.JS — TYPESCRIPT — SUPABASE — TAILWIND — VERCEL — ",
];

// Le contenu est rendu dès le serveur (référencement) mais n'apparaît qu'à la sortie de la simulation.
// Les délais partent de l'explosion d'entrée (voir Entree.tsx).
const entree = (delai: number, demarre: boolean) => ({
  initial: { opacity: 0, y: 24, filter: "blur(10px)" },
  animate: demarre ? { opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } } : undefined,
  transition: { duration: 0.9, delay: CHOC + delai, ease: EASE },
});

// Bouton qui se dévoile de gauche à droite.
const balayage = (delai: number, demarre: boolean) => ({
  initial: { clipPath: "inset(-50% 100% -50% -10%)" },
  animate: demarre ? { clipPath: "inset(-50% -10% -50% -10%)" } : undefined,
  transition: { duration: 0.7, delay: CHOC + delai, ease: [0.7, 0, 0.2, 1] as const },
});

const doux = (x: number) => x * x * (3 - 2 * x);
/** 0 → 1 entre a et b (borné). */
const entre = (v: number, a: number, b: number) => Math.min(1, Math.max(0, (v - a) / (b - a)));

const GLYPHES = "!<>-_\\/[]{}=+*^?#01ABCDEFX";
const brouiller = (texte: string) =>
  texte
    .split("")
    .map((c) => (c === " " ? " " : GLYPHES[Math.floor(Math.random() * GLYPHES.length)]))
    .join("");

/**
 * Texte qui se décode en vague : une tête de caractères aléatoires rouges avance et
 * les lettres se figent derrière elle. Le texte réel garde sa place dès le départ (pas de saut de mise en page).
 */
function Decode({
  texte,
  demarre,
  delai,
  duree = 700,
  tete = 6,
  accent,
}: {
  texte: string;
  demarre: boolean;
  delai: number;
  duree?: number;
  tete?: number;
  /** Index à partir duquel le texte figé passe en couleur d'accent. */
  accent?: number;
}) {
  const reduire = useReducedMotion();
  const total = texte.length + tete;
  const [n, setN] = useState(-1); // position de la tête ; -1 = pas commencé
  const [, setTic] = useState(0);

  useEffect(() => {
    if (!demarre) return;
    if (reduire) return setN(total);
    let raf = 0;
    const debut = performance.now() + (CHOC + delai) * 1000;
    const etape = (t: number) => {
      const p = (t - debut) / duree;
      if (p >= 0) {
        setN(Math.min(total, Math.floor(p * total)));
        setTic((x) => x + 1); // nouveaux caractères aléatoires à chaque image
      }
      if (p < 1) raf = requestAnimationFrame(etape);
    };
    raf = requestAnimationFrame(etape);
    return () => cancelAnimationFrame(raf);
  }, [demarre, reduire, total, delai, duree]);

  if (n < 0) return <span className="invisible">{texte}</span>;
  const fige = Math.max(0, n - tete);
  const coupe = Math.min(fige, accent ?? fige);
  return (
    <>
      {texte.slice(0, coupe)}
      {coupe < fige && <span className="text-neon [text-shadow:0_0_30px_rgb(255_42_42/0.55)]">{texte.slice(coupe, fige)}</span>}
      <span className="text-neon [text-shadow:0_0_14px_rgb(255_42_42/0.9)]">{brouiller(texte.slice(fige, n))}</span>
      <span className="invisible">{texte.slice(n)}</span>
    </>
  );
}

/** Titre de « Les archives » : il se décode au fil du défilement. */
function DecodeScroll({ texte, progression }: { texte: string; progression: MotionValue<number> }) {
  const [p, setP] = useState(0);
  useMotionValueEvent(progression, "change", setP);
  const n = Math.floor(p * texte.length);
  // Avant le décodage le titre est invisible : le vrai texte suffit (et le rendu serveur reste identique).
  if (p <= 0) return <>{texte}</>;
  return (
    <>
      {texte.slice(0, n)}
      <span className="text-neon">{brouiller(texte.slice(n))}</span>
    </>
  );
}

const AGE = parseInt(identite.find((i) => i.label === "Âge")?.valeur ?? "18", 10);

/** Chiffre clé qui défile de 0 à sa valeur à l'entrée. */
function Chiffre({ valeur, demarre, delai, chiffres = 2 }: { valeur: number; demarre: boolean; delai: number; chiffres?: number }) {
  const reduire = useReducedMotion();
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!demarre) return;
    if (reduire) return setV(valeur);
    const c = animate(0, valeur, { delay: CHOC + delai, duration: 1.1, ease: [0.16, 1, 0.3, 1], onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [demarre, reduire, valeur, delai]);
  return <>{String(v).padStart(chiffres, "0")}</>;
}

/** Aperçu des archives en bas à droite : les projets défilent un par un. */
function Apercu() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % projets.length), 2600);
    return () => clearInterval(id);
  }, []);
  const projet = projets[i];
  return (
    <a
      href="#projets"
      data-info-titre="Voir les réalisations"
      data-info="Sauter l'animation et aller directement aux projets"
      className="group relative flex w-72 flex-col gap-2 border border-white/15 bg-black/85 p-4 backdrop-blur-md transition-colors hover:border-neon/60"
    >
      <span className="flex items-center justify-between font-mono text-[10px] tracking-[0.25em] text-white/45 uppercase">
        <span className="flex items-center gap-2">
          <span className="size-1.5 animate-pulse bg-neon shadow-[0_0_6px_#ff2a2a]" />
          Réalisations
        </span>
        <span className="pr-6 tabular-nums">
          {String(i + 1).padStart(2, "0")}/{String(projets.length).padStart(2, "0")}
        </span>
      </span>
      <span className="relative h-7 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={projet.id}
            className="absolute inset-0 flex items-baseline gap-3"
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-110%", opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <span className="font-mono text-xs text-neon">{projet.numero}</span>
            <span className="font-display text-xl font-semibold tracking-wide text-white uppercase">{projet.nom}</span>
            <span className="ml-auto font-mono text-[10px] tracking-[0.2em] text-white/40 uppercase">{projet.categorie}</span>
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="flex gap-1">
        {projets.map((p, k) => (
          <span key={p.id} className={`h-0.5 flex-1 transition-colors duration-300 ${k === i ? "bg-neon" : "bg-white/15"}`} />
        ))}
      </span>
      <ArrowUpRight className="absolute top-3 right-3 size-4 text-white/30 transition-colors group-hover:text-neon" />
    </a>
  );
}

// Aberration chromatique sur le grand titre, qui se résorbe en quelques secousses.
const glitchTitre = (demarre: boolean) => ({
  initial: { textShadow: "0px 0px 0px rgb(255 42 42 / 0), 0px 0px 0px rgb(255 255 255 / 0)", skewX: 0 },
  animate: demarre
    ? {
        textShadow: [
          "-14px 0px 0px rgb(255 42 42 / 0.95), 14px 0px 0px rgb(255 255 255 / 0.55)",
          "6px 0px 0px rgb(255 42 42 / 0.95), -8px 0px 0px rgb(255 255 255 / 0.55)",
          "-10px 0px 0px rgb(255 42 42 / 0.9), 4px 0px 0px rgb(255 255 255 / 0.5)",
          "3px 0px 0px rgb(255 42 42 / 0.8), -2px 0px 0px rgb(255 255 255 / 0.4)",
          "0px 0px 0px rgb(255 42 42 / 0), 0px 0px 0px rgb(255 255 255 / 0)",
        ],
        skewX: [-8, 5, -3, 1, 0],
        transitionEnd: { textShadow: "none" },
      }
    : undefined,
  transition: { duration: 1.1, delay: CHOC + 0.35, times: [0, 0.2, 0.45, 0.7, 1], ease: "linear" as const },
});

/**
 * Accueil scénarisé au scroll : l'écran reste en place pendant que
 * 1. la zone droite s'élargit, 2. on plonge dans le vortex, 3. une nouvelle page s'ouvre en cercle.
 *
 * Les valeurs liées au scroll passent toutes par des fonctions : sous forme de tableau, framer-motion
 * les confie à une ScrollTimeline native qui calcule mal la progression ici (texte resté à moitié transparent).
 */
export default function Accueil({ demarre }: { demarre: boolean }) {
  const reduire = useReducedMotion();
  const pisteRef = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: pisteRef, offset: ["start start", "end end"] });

  // Étapes de la séquence.
  const elargir = useTransform(p, (v) => entre(v, 0, 0.22));
  const plongee = useTransform(p, (v) => entre(v, 0.12, 0.6));
  // La page suivante apparaît en fondu à la fin de la plongée ; le reste de la piste laisse le temps de lire.
  const ouverture = useTransform(p, (v) => entre(v, 0.42, 0.7));

  const texteOpacite = useTransform(p, (v) => 1 - entre(v, 0, 0.16));
  const texteX = useTransform(p, (v) => -80 * entre(v, 0, 0.2));
  // Bord fondu du tunnel qui glisse vers la gauche (ordinateur) / vers le haut (téléphone).
  const bordBureau = useTransform(elargir, (e) => `${50 - 70 * doux(e)}%`);
  const bordMobile = useTransform(elargir, (e) => `${66 - 86 * doux(e)}%`);
  // Page suivante : le fond arrive en fondu, le texte juste après.
  const fondOpacite = useTransform(ouverture, (v) => entre(v, 0, 0.6));

  // « Les archives » : invisible au départ, il émerge du fond du vortex pendant la plongée
  // (flou → net, lettres espacées → resserrées, décodage), en suivant le centre du tunnel.
  const [bureau, setBureau] = useState(true);
  useEffect(() => setBureau(window.innerWidth >= 768), []);
  const echelleTexte = useTransform(plongee, (v) => Math.min(bureau ? 1 : 0.8, 0.11 * (1 + 7 * doux(v))));
  const centreX = useTransform(elargir, (e) => `${bureau ? 79 + (50 - 79) * doux(e) : 50}%`);
  const centreY = useTransform(elargir, (e) => `${bureau ? 60 + (55 - 60) * doux(e) : 86 + (55 - 86) * doux(e)}%`);
  const archives = useTransform(plongee, (v) => doux(entre(v, 0.3, 0.75)));
  const archivesFlou = useTransform(archives, (a) => (a >= 1 ? "none" : `blur(${(1 - a) * 16}px)`));
  const archivesEspace = useTransform(archives, (a) => `${-0.025 + (1 - a) * 0.6}em`); // → tracking-tight
  const decodage = useTransform(plongee, (v) => entre(v, 0.4, 0.85));
  const accesOpacite = useTransform(p, (v) => entre(v, 0.36, 0.48));
  const viseurOpacite = useTransform(p, (v) => 1 - entre(v, 0.04, 0.14));
  const sousTitreOpacite = useTransform(p, (v) => entre(v, 0.5, 0.62));
  const sousTitreY = useTransform(sousTitreOpacite, (o) => (1 - o) * 20);

  return (
    <section id="accueil" ref={pisteRef} className={`relative md:-ml-24 ${reduire ? "h-[100svh]" : "h-[230svh]"}`}>
      <div className="sticky top-0 h-[100svh] overflow-hidden" style={{ background: FOND_SPREAD }}>
        {/* Fond de texte qui réagit à la souris, comme dans le reste du site. */}
        <FondTexte />
        {/* Tunnel : couvre toute la zone, son bord fondu glisse pour « élargir » la partie droite. */}
        <TextTunnel
          actif={demarre}
          phrases={PHRASES}
          intro={!reduire}
          elargir={reduire ? undefined : elargir}
          plongee={reduire ? undefined : plongee}
          className="absolute inset-0 text-white [mask-image:linear-gradient(to_bottom,transparent_calc(var(--bord-m)_-_12%),#000_var(--bord-m))] md:[mask-image:linear-gradient(to_right,transparent_calc(var(--bord)_-_15%),#000_var(--bord))]"
          style={{ "--bord": bordBureau, "--bord-m": bordMobile } as never}
        />

        <motion.div
          className="pointer-events-none absolute inset-y-0 left-0 hidden w-[62%] md:block"
          style={{ opacity: texteOpacite, background: `linear-gradient(to right, ${FOND_SPREAD} 35%, ${FOND_SPREAD}cc 60%, transparent)` }}
          aria-hidden
        />

        {/* Gauche : texte */}
        <motion.div
          className="relative z-10 flex h-full flex-col justify-start px-5 pt-24 md:ml-24 md:w-[calc(50%-3rem)] md:justify-center md:px-10 md:pt-0 lg:px-14"
          style={reduire ? undefined : { opacity: texteOpacite, x: texteX }}
        >
          {/* Statut : disponible pour une mission */}
          <motion.div {...entree(0.05, demarre)} className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] tracking-[0.25em] uppercase md:text-xs">
            <span className="flex items-center gap-2 border border-neon/40 bg-neon/10 px-2.5 py-1 text-neon">
              <span className="relative flex size-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-neon" />
                <span className="relative size-1.5 rounded-full bg-neon" />
              </span>
              Disponible
            </span>
            <span className="text-white/55">
              <Decode texte={`${site.role} · ${site.ville}`} demarre={demarre} delai={0.2} />
            </span>
          </motion.div>

          <motion.h1
            {...glitchTitre(demarre)}
            className="mt-6 font-display text-[2.6rem] leading-[0.92] font-bold tracking-tight text-white uppercase sm:text-6xl md:text-[min(calc(((100vw-6rem)/2-5rem)/8.6),6.5rem)]"
          >
            {/* Deux lignes courtes ; sur ordinateur la taille s'ajuste à la moitié gauche. */}
            <span className="block whitespace-nowrap">
              <Decode texte="Votre idée," demarre={demarre} delai={0.35} duree={600} />
            </span>
            <span className="block whitespace-nowrap">
              <Decode texte="en ligne. Vite." demarre={demarre} delai={0.6} duree={650} accent={10} />
            </span>
          </motion.h1>

          <motion.p {...entree(1.05, demarre)} className="mt-6 max-w-md text-base leading-relaxed text-white/65 md:text-lg">
            J&apos;ai {AGE} ans et j&apos;ai déjà lancé {projets.length} produits web, seul, de la première maquette à la mise en ligne.
            Site, application ou outil métier : <span className="text-white">vous parlez directement à celui qui code.</span>
          </motion.p>

          {/* Chiffres clés */}
          <motion.dl {...entree(1.15, demarre)} className="mt-7 hidden max-w-md grid-cols-3 border-y border-white/10 sm:grid md:mt-8">
            {[
              { valeur: <Chiffre valeur={AGE} demarre={demarre} delai={1.2} />, legende: "ans" },
              { valeur: <Chiffre valeur={projets.length} demarre={demarre} delai={1.3} />, legende: "produits en ligne" },
              { valeur: "01", legende: "seul interlocuteur" },
            ].map(({ valeur, legende }, k) => (
              <div key={legende} className={`flex flex-col gap-1 py-3 ${k ? "border-l border-white/10 pl-4" : ""}`}>
                <dt className="sr-only">{legende}</dt>
                <dd className="font-display text-2xl leading-none font-bold text-white tabular-nums md:text-3xl">{valeur}</dd>
                <dd className="font-mono text-[9px] tracking-[0.2em] text-white/45 uppercase md:text-[10px]">{legende}</dd>
              </div>
            ))}
          </motion.dl>

          <div className="mt-7 flex flex-wrap gap-3 md:mt-8 md:gap-4">
            <motion.span {...balayage(1.35, demarre)} className="flex">
              <a
                href="#contact"
                data-info-titre="Lancer mon projet"
                data-info="M'écrire pour parler de votre projet"
                data-info-touche="4"
                className="coupe group flex items-center gap-2 bg-neon px-6 py-3 font-mono text-xs font-semibold tracking-[0.2em] text-black uppercase transition-shadow hover:shadow-[0_0_30px_#ff2a2a] md:px-5 md:py-3.5 xl:px-7"
              >
                Lancer mon projet
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </motion.span>
            <motion.span {...balayage(1.5, demarre)} className="flex">
              <a
                href="#projets"
                data-info-titre="Voir mes réalisations"
                data-info={`Parcourir les ${projets.length} produits que j'ai lancés`}
                data-info-touche="2"
                className="border border-neon/50 bg-black/50 px-6 py-3 font-mono text-xs tracking-[0.2em] text-neon uppercase backdrop-blur-sm transition-colors hover:border-neon hover:bg-neon/10 md:px-5 md:py-3.5 xl:px-7"
              >
                Voir mes réalisations
              </a>
            </motion.span>
          </div>

          <motion.p
            {...entree(1.8, demarre)}
            className="mt-auto mb-8 flex items-center gap-3 font-mono text-[10px] tracking-[0.25em] text-white/50 uppercase md:mt-12 md:mb-0"
          >
            <span className="flex size-8 items-center justify-center rounded-full border border-white/20">
              <ArrowDown className="size-3.5 animate-bounce" />
            </span>
            Scroll pour plonger<span className="hidden md:inline"> dans les archives</span>
          </motion.p>
        </motion.div>

        <motion.div className="absolute right-5 bottom-5 z-10 hidden md:right-8 md:bottom-8 md:flex" style={reduire ? undefined : { opacity: texteOpacite }}>
          <motion.div {...balayage(1.7, demarre)}>
            <Apercu />
          </motion.div>
        </motion.div>

        {/* Viseur posé sur le cœur du vortex */}
        {!reduire && (
          <motion.div
            className="pointer-events-none absolute z-[5] hidden md:block"
            style={{ left: centreX, top: centreY, x: "-50%", y: "-50%", opacity: viseurOpacite }}
            aria-hidden
          >
            <motion.div
              initial={{ scale: 2.5, opacity: 0, rotate: -90 }}
              animate={demarre ? { scale: 1, opacity: 1, rotate: 0 } : undefined}
              transition={{ delay: CHOC + 1.4, duration: 0.9, ease: EASE }}
              className="relative size-40"
            >
              <svg viewBox="0 0 100 100" className="cyber-rotation absolute inset-0 size-full" style={{ animationDuration: "40s" }} fill="none" stroke="#ff2a2a">
                <circle cx="50" cy="50" r="48" strokeWidth="0.4" strokeDasharray="2 4" opacity="0.6" />
                <path d="M50 0 v8 M50 92 v8 M0 50 h8 M92 50 h8" strokeWidth="0.8" />
              </svg>
              <span className="absolute top-1/2 left-1/2 size-1 -translate-1/2 rounded-full bg-neon shadow-[0_0_10px_#ff2a2a]" />
              <span className="absolute top-[calc(100%+10px)] left-1/2 -translate-x-1/2 font-mono text-[9px] tracking-[0.3em] whitespace-nowrap text-neon/70 uppercase">
                Archives · {String(projets.length).padStart(2, "0")} entrées
              </span>
              <span className="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 font-mono text-[9px] tracking-[0.3em] whitespace-nowrap text-white/35 uppercase">
                43.58N · 7.12E
              </span>
            </motion.div>
          </motion.div>
        )}

        {!reduire && (
          <>
            {/* Fond de la page suivante, révélé en fondu à la fin de la plongée */}
            <motion.div className="pointer-events-none absolute inset-0 z-20" style={{ opacity: fondOpacite, background: FOND_SPREAD }}>
              <FondTexte />
            </motion.div>
            {/* Texte de la page suivante : il émerge du vortex pendant la plongée */}
            <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
              <motion.div
                className="absolute w-max text-center"
                style={{ left: centreX, top: centreY, x: "-50%", y: "-50%", scale: echelleTexte }}
              >
                <motion.p style={{ opacity: accesOpacite }} className="font-mono text-xs tracking-[0.3em] text-neon uppercase">
                  &gt; Accès autorisé
                </motion.p>
                <motion.p
                  style={{ opacity: archives, filter: archivesFlou, letterSpacing: archivesEspace }}
                  className="mt-5 font-display text-6xl font-bold tracking-tight text-white uppercase [text-shadow:0_0_30px_rgb(255_42_42/0.5)] md:text-8xl"
                >
                  <DecodeScroll texte="Les archives" progression={decodage} />
                </motion.p>
                <motion.div style={{ opacity: sousTitreOpacite, y: sousTitreY }}>
                  <p className="mt-5 font-mono text-xs tracking-[0.25em] text-white/50 uppercase">
                    {String(projets.length).padStart(2, "0")} produits conçus, codés et mis en ligne · continuez
                  </p>
                  <ArrowDown className="mx-auto mt-10 size-5 animate-bounce text-neon" />
                </motion.div>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
