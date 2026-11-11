"use client";

import { AnimatePresence, motion, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowUpRight, Check, Lock, Trophy } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { attributs, equipement, identite, parcours, succes, type Rarete } from "@/data/profil";
import { projets } from "@/data/projects";
import { site } from "@/data/site";
import * as sons from "../demarrage/sons";
import { Apparition, Cadre, TitreSection } from "./outils";
import PortraitNeon from "./PortraitNeon";

const EASE = [0.22, 1, 0.36, 1] as const;
const pad = (n: number) => String(n).padStart(2, "0");
const NIVEAU = parseInt(identite.find((i) => i.label === "Âge")?.valeur ?? "18", 10);

function Entete({ numero, titre, info }: { numero: string; titre: string; info?: ReactNode }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4 font-mono text-[10px] tracking-[0.25em] uppercase">
      <span className="text-neon">
        <span className="text-neon/40">{numero} //</span> {titre}
      </span>
      {info && <span className="text-white/35">{info}</span>}
    </div>
  );
}

/* ---------- Carte du personnage ---------- */

/** Carte holographique qui s'incline vers la souris, avec le portrait néon qui se construit. */
function CartePerso({ portrait }: { portrait?: string }) {
  const reduire = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, margin: "-15% 0px" });
  const rx = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });
  const xp = Math.round((projets.length / (projets.length + 1)) * 100);

  const bouger = (e: PointerEvent<HTMLDivElement>) => {
    if (reduire || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const u = (e.clientX - r.left) / r.width;
    const v = (e.clientY - r.top) / r.height;
    ry.set((u - 0.5) * 10);
    rx.set((0.5 - v) * 8);
    e.currentTarget.style.setProperty("--gx", `${u * 100}%`);
    e.currentTarget.style.setProperty("--gy", `${v * 100}%`);
  };
  const quitter = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className="group/carte relative h-full [perspective:1200px]"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <motion.div
        onPointerMove={bouger}
        onPointerLeave={quitter}
        style={{ rotateX: rx, rotateY: ry }}
        className="relative flex h-full flex-col overflow-hidden border border-neon/40 bg-[linear-gradient(170deg,rgb(255_42_42/0.14),rgb(0_0_0/0.85)_45%)] shadow-[0_0_60px_rgb(255_42_42/0.12)] backdrop-blur-sm [transform-style:preserve-3d]"
      >
        {/* Reflet qui suit la souris */}
        <span
          className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover/carte:opacity-100"
          style={{ background: "radial-gradient(380px circle at var(--gx, 50%) var(--gy, 0%), rgb(255 255 255 / 0.09), transparent 60%)" }}
        />
        {["-top-px -left-px border-t-2 border-l-2", "-top-px -right-px border-t-2 border-r-2", "-bottom-px -left-px border-b-2 border-l-2", "-right-px -bottom-px border-r-2 border-b-2"].map((c) => (
          <span key={c} className={`pointer-events-none absolute size-4 border-neon ${c}`} />
        ))}

        <div className="flex items-center justify-between border-b border-neon/20 px-5 py-3 font-mono text-[10px] tracking-[0.25em] text-neon uppercase">
          <span>Joueur 01</span>
          <span className="flex items-center gap-2 text-white/50">
            <span className="size-1.5 animate-pulse rounded-full bg-neon" /> En ligne
          </span>
        </div>

        {/* Portrait holographique */}
        <div className="relative mx-5 mt-5 overflow-hidden border border-white/10 bg-black/60">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgb(255_42_42/0.18),transparent_65%)]" />
          <PortraitNeon src={portrait} actif={visible} className="relative mx-auto w-[82%]" />
          <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgb(0_0_0/0.35)_0_1px,transparent_1px_3px)]" />
          <svg viewBox="0 0 100 100" className="cyber-rotation pointer-events-none absolute inset-[6%] opacity-50" style={{ animationDuration: "30s" }} fill="none" stroke="#ff2a2a">
            <circle cx="50" cy="50" r="49" strokeWidth="0.3" strokeDasharray="1 3" />
          </svg>
          <span className="absolute top-2 left-3 font-mono text-[9px] tracking-[0.25em] text-neon/70 uppercase">Scan · 43.58N</span>
          <span className="absolute right-3 bottom-2 font-mono text-[9px] tracking-[0.25em] text-white/40 uppercase">
            {portrait ? "Photo" : "Silhouette"} · v2.6
          </span>
        </div>

        <div className="flex flex-1 flex-col px-5 pt-5 pb-6">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="font-display text-4xl leading-none font-bold tracking-tight text-white uppercase md:text-5xl">{site.nom}</p>
              <p className="mt-2 font-mono text-[11px] tracking-[0.2em] text-white/55 uppercase">{site.role}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-mono text-[10px] tracking-[0.25em] text-neon/70 uppercase">Niv.</p>
              <p className="font-display text-5xl leading-none font-bold text-neon [text-shadow:0_0_24px_rgb(255_42_42/0.6)]">{NIVEAU}</p>
            </div>
          </div>

          {/* Barre d'expérience */}
          <div className="mt-5">
            <div className="mb-2 flex justify-between font-mono text-[10px] tracking-[0.2em] uppercase">
              <span className="text-white/50">XP · {projets.length} produits lancés</span>
              <span className="text-neon">{xp}%</span>
            </div>
            <div className="relative h-2 overflow-hidden bg-white/10">
              <motion.span
                className="absolute inset-y-0 left-0 bg-[repeating-linear-gradient(90deg,#ff2a2a_0_8px,rgb(255_42_42/0.6)_8px_10px)] shadow-[0_0_12px_#ff2a2a]"
                initial={{ width: "0%" }}
                animate={visible ? { width: `${xp}%` } : undefined}
                transition={{ delay: 0.6, duration: 1.4, ease: EASE }}
              />
            </div>
            <a
              href="#contact"
              data-info-titre="Prochain niveau"
              data-info="Votre projet : c'est lui qui fera passer le niveau suivant"
              className="group/xp mt-2 flex items-center justify-between font-mono text-[10px] tracking-[0.2em] text-white/40 uppercase transition-colors hover:text-neon"
            >
              <span>Niveau suivant : votre projet</span>
              <ArrowUpRight className="size-3.5 transition-transform group-hover/xp:translate-x-0.5 group-hover/xp:-translate-y-0.5" />
            </a>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-px border border-white/10 bg-white/10 font-mono text-[10px] tracking-[0.15em] uppercase">
            {identite
              .filter((i) => i.label !== "Nom" && i.label !== "Classe")
              .concat({ label: "Mode", valeur: "Solo" })
              .concat({ label: "Statut", valeur: "Disponible" })
              .map(({ label, valeur }) => (
                <div key={label} className="bg-black/70 px-3 py-2.5">
                  <dt className="text-white/35">{label}</dt>
                  <dd className={`mt-0.5 text-xs ${label === "Statut" ? "text-neon" : "text-white"}`}>{valeur}</dd>
                </div>
              ))}
          </dl>

          {/* Capacité spéciale */}
          <div className="mt-6 border-l-2 border-neon bg-neon/[0.06] px-4 py-3 lg:mb-6">
            <p className="font-mono text-[10px] tracking-[0.25em] text-neon uppercase">Capacité spéciale</p>
            <p className="mt-1 font-display text-lg font-semibold text-white uppercase">Livraison de bout en bout</p>
            <p className="mt-1 text-sm leading-relaxed text-white/55">
              De l&apos;idée au produit en ligne, sans intermédiaire : une seule personne conçoit, code et maintient.
            </p>
          </div>

          <a
            href="#contact"
            data-info-titre="Recruter ce joueur"
            data-info="Aller au formulaire de contact"
            className="coupe group/recruter mt-6 flex items-center justify-between bg-neon px-5 py-4 font-mono text-xs font-semibold tracking-[0.25em] text-black uppercase transition-shadow hover:shadow-[0_0_30px_#ff2a2a] lg:mt-auto"
          >
            Recruter ce joueur
            <ArrowUpRight className="size-4 transition-transform group-hover/recruter:translate-x-0.5 group-hover/recruter:-translate-y-0.5" />
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ---------- Attributs en radar ---------- */

const R = 104;
const point = (i: number, v: number) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / attributs.length;
  return [Math.cos(a) * R * v, Math.sin(a) * R * v] as const;
};

function Radar() {
  const ref = useRef<SVGSVGElement>(null);
  const visible = useInView(ref, { once: true, margin: "-15% 0px" });
  const [actif, setActif] = useState<number | null>(null);
  const forme = attributs.map((a, i) => point(i, a.niveau / 10).join(",")).join(" ");
  const total = attributs.reduce((s, a) => s + a.niveau, 0);
  const choisi = actif ?? attributs.reduce((m, a, i) => (a.niveau > attributs[m].niveau ? i : m), 0);

  return (
    <div>
      <svg ref={ref} viewBox="-160 -138 320 286" className="mx-auto w-full max-w-[340px] overflow-visible">
        {/* Grille */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((k) => (
          <polygon
            key={k}
            points={attributs.map((_, i) => point(i, k).join(",")).join(" ")}
            fill="none"
            stroke="rgb(255 255 255 / 0.1)"
            strokeDasharray={k === 1 ? undefined : "2 3"}
          />
        ))}
        {attributs.map((_, i) => {
          const [x, y] = point(i, 1);
          return <line key={i} x1={0} y1={0} x2={x} y2={y} stroke={actif === i ? "rgb(255 42 42 / 0.6)" : "rgb(255 255 255 / 0.08)"} />;
        })}

        {/* Forme des attributs : elle grandit depuis le centre */}
        <motion.g initial={{ scale: 0, opacity: 0 }} animate={visible ? { scale: 1, opacity: 1 } : undefined} transition={{ delay: 0.3, duration: 1, ease: EASE }}>
          <circle r={R} fill="transparent" />
          <polygon points={forme} fill="rgb(255 42 42 / 0.22)" stroke="#ff2a2a" strokeWidth={2} style={{ filter: "drop-shadow(0 0 8px rgb(255 42 42 / 0.8))" }} />
          {attributs.map((a, i) => {
            const [x, y] = point(i, a.niveau / 10);
            return <circle key={a.nom} cx={x} cy={y} r={actif === i ? 5 : 3.5} fill={actif === i ? "#fff" : "#ff2a2a"} />;
          })}
        </motion.g>

        {/* Étiquettes, survolables */}
        {attributs.map((a, i) => {
          const [x, y] = point(i, 1.24);
          const ancre = Math.abs(x) < 10 ? "middle" : x > 0 ? "start" : "end";
          return (
            <g
              key={a.nom}
              onPointerEnter={() => setActif(i)}
              onPointerLeave={() => setActif(null)}
              className="cursor-default"
              data-info-titre={a.nom}
              data-info={`${pad(a.niveau)}/10`}
            >
              <text x={x} y={y - 4} textAnchor={ancre} className={`font-mono text-[10px] tracking-[0.15em] ${actif === i ? "fill-neon" : "fill-white/55"}`}>
                {a.court}
              </text>
              <text x={x} y={y + 10} textAnchor={ancre} className="fill-white font-display text-[13px] font-bold">
                {pad(a.niveau)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-4 flex items-end justify-between border-t border-white/10 pt-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-white/40 uppercase">{actif === null ? "Point fort" : "Attribut"}</p>
          <p className="mt-1 font-display text-xl font-semibold text-white uppercase">{attributs[choisi].nom}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] tracking-[0.2em] text-white/40 uppercase">Puissance</p>
          <p className="mt-1 font-display text-xl font-bold text-neon">
            {total}
            <span className="text-white/30">/{attributs.length * 10}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Inventaire ---------- */

const RARETES: Record<Rarete, { nom: string; bord: string; texte: string }> = {
  legendaire: { nom: "Légendaire", bord: "border-neon shadow-[0_0_18px_rgb(255_42_42/0.45),inset_0_0_18px_rgb(255_42_42/0.25)]", texte: "text-neon" },
  epique: { nom: "Épique", bord: "border-white/60 shadow-[inset_0_0_14px_rgb(255_255_255/0.12)]", texte: "text-white" },
  rare: { nom: "Rare", bord: "border-white/30", texte: "text-white/70" },
};

function Inventaire() {
  const [choix, setChoix] = useState(0);
  const objet = equipement[choix];
  const vides = Math.max(0, 9 - equipement.length);
  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {equipement.map((e, i) => (
          <button
            key={e.nom}
            onPointerEnter={() => setChoix(i)}
            onFocus={() => setChoix(i)}
            onClick={() => setChoix(i)}
            data-info-titre={e.nom}
            data-info={`${RARETES[e.rarete].nom} · ${e.type}`}
            className={`group relative flex aspect-square flex-col items-center justify-center overflow-hidden border bg-black/60 transition-all ${RARETES[e.rarete].bord} ${
              choix === i ? "scale-[1.04] bg-neon/10" : "opacity-80 hover:opacity-100"
            }`}
          >
            {e.rarete === "legendaire" && <span className="inventaire-reflet pointer-events-none absolute inset-0" />}
            <span className={`font-display text-3xl font-bold ${RARETES[e.rarete].texte}`}>{e.sigle}</span>
            <span className="mt-1 font-mono text-[9px] tracking-[0.15em] text-white/50 uppercase">{e.nom}</span>
            <span className="absolute top-1 left-1.5 font-mono text-[8px] text-white/30">{pad(i + 1)}</span>
          </button>
        ))}
        {Array.from({ length: vides }, (_, i) => (
          <div
            key={i}
            data-info-titre="Emplacement libre"
            data-info="La prochaine compétence se débloque en livrant"
            className="flex aspect-square items-center justify-center border border-dashed border-white/10 text-white/15"
          >
            <Lock className="size-4" />
          </div>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={objet.nom}
          className="mt-4 border-t border-white/10 pt-4"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-display text-xl font-semibold text-white uppercase">{objet.nom}</p>
            <p className={`font-mono text-[10px] tracking-[0.2em] uppercase ${RARETES[objet.rarete].texte}`}>
              {RARETES[objet.rarete].nom} · {objet.type}
            </p>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-white/55">{objet.effet}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ---------- Journal de quêtes ---------- */

function Quetes() {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.6"] });
  // Fonction (et non tableau) : évite la ScrollTimeline native, qui calcule mal la progression sur ce site.
  const remplissage = useTransform(scrollYProgress, (v) => Math.min(1, Math.max(0, v)));
  return (
    <ol ref={ref} className="relative flex flex-col gap-6 pl-8">
      <span className="absolute top-2 bottom-2 left-[7px] w-px bg-white/10">
        <motion.span className="absolute inset-0 origin-top bg-neon shadow-[0_0_8px_#ff2a2a]" style={{ scaleY: remplissage }} />
      </span>
      {parcours.map((q, i) => {
        const enCours = q.etat === "en-cours";
        return (
          <motion.li
            key={q.titre}
            className="relative"
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ delay: i * 0.08, duration: 0.5, ease: EASE }}
          >
            <span
              className={`absolute top-0.5 -left-8 flex size-4 items-center justify-center border ${
                enCours ? "border-neon bg-neon/20" : "border-neon bg-neon text-black"
              }`}
            >
              {enCours ? <span className="size-1.5 animate-ping bg-neon" /> : <Check className="size-3" strokeWidth={3} />}
            </span>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] tracking-[0.2em] uppercase">
              <span className="text-white/40">
                Quête {pad(i + 1)} · {q.date}
              </span>
              <span className={enCours ? "bg-neon px-1.5 text-black" : "text-neon/70"}>{enCours ? "En cours" : "Terminée"}</span>
            </div>
            <h3 className="mt-1 font-display text-xl font-semibold text-white uppercase">{q.titre}</h3>
            <p className="mt-1 text-sm leading-relaxed text-white/55">{q.texte}</p>
          </motion.li>
        );
      })}
      <li className="relative">
        <span className="absolute top-0.5 -left-8 size-4 border border-dashed border-white/30" />
        <a
          href="#contact"
          data-info-titre="Quête suivante"
          data-info="Me parler de votre projet"
          className="group flex items-center justify-between gap-3 border border-dashed border-white/20 px-4 py-3 transition-colors hover:border-neon hover:bg-neon/5"
        >
          <span>
            <span className="block font-mono text-[10px] tracking-[0.2em] text-white/40 uppercase">Quête {pad(parcours.length + 1)} · Disponible</span>
            <span className="mt-1 block font-display text-lg font-semibold text-white uppercase transition-colors group-hover:text-neon">Votre projet</span>
          </span>
          <ArrowUpRight className="size-5 text-white/40 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-neon" />
        </a>
      </li>
    </ol>
  );
}

/* ---------- Succès ---------- */

/** Les succès se débloquent un par un quand le panneau arrive à l'écran, avec une notification. */
function Succes({ onDebloque }: { onDebloque: (titre: string) => void }) {
  const reduire = useReducedMotion();
  const ref = useRef<HTMLUListElement>(null);
  const visible = useInView(ref, { once: true, margin: "-20% 0px" });
  const [debloques, setDebloques] = useState(0);

  useEffect(() => {
    if (!visible) return;
    if (reduire) return setDebloques(succes.length);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDebloques(i);
      sons.ok();
      onDebloque(succes[i - 1].titre);
      if (i >= succes.length) clearInterval(id);
    }, 420);
    return () => clearInterval(id);
  }, [visible, reduire, onDebloque]);

  return (
    <div>
    <ul ref={ref} className="grid grid-cols-2 gap-2">
      {succes.map((s, i) => {
        const ok = i < debloques;
        return (
          <li
            key={s.titre}
            className={`relative overflow-hidden border p-3 transition-colors duration-500 ${ok ? "border-neon/50 bg-neon/[0.07]" : "border-white/10 bg-black/40"}`}
          >
            {ok && !reduire && (
              <motion.span className="pointer-events-none absolute inset-0 bg-neon" initial={{ opacity: 0.7 }} animate={{ opacity: 0 }} transition={{ duration: 0.6 }} />
            )}
            <span className="flex items-center gap-2">
              <span className={`flex size-7 shrink-0 items-center justify-center border ${ok ? "border-neon text-neon shadow-[0_0_10px_rgb(255_42_42/0.5)]" : "border-white/15 text-white/25"}`}>
                {ok ? <Trophy className="size-3.5" /> : <Lock className="size-3.5" />}
              </span>
              <span className={`font-display text-sm leading-tight font-semibold uppercase ${ok ? "text-white" : "text-white/30"}`}>
                {ok ? s.titre : "???"}
              </span>
            </span>
            <p className={`mt-2 text-xs leading-snug ${ok ? "text-white/55" : "text-white/20"}`}>{ok ? s.texte : "Succès verrouillé."}</p>
          </li>
        );
      })}
    </ul>
      <div className="mt-5">
        <div className="mb-2 flex justify-between font-mono text-[10px] tracking-[0.2em] uppercase">
          <span className="text-white/40">Progression</span>
          <span className="text-neon tabular-nums">{Math.round((debloques / succes.length) * 100)}%</span>
        </div>
        <div className="h-1 bg-white/10">
          <div className="h-full bg-neon shadow-[0_0_8px_#ff2a2a] transition-[width] duration-300" style={{ width: `${(debloques / succes.length) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

/** Notification « Succès débloqué » en bas de l'écran. */
function Notification({ titre }: { titre: string | null }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4" aria-live="polite">
      <AnimatePresence mode="wait">
        {titre && (
          <motion.div
            key={titre}
            className="flex items-center gap-3 border border-neon/60 bg-black/90 py-2.5 pr-5 pl-3 shadow-[0_0_30px_rgb(255_42_42/0.35)] backdrop-blur-md"
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95, transition: { duration: 0.12 } }}
            transition={{ duration: 0.22, ease: EASE }}
          >
            <span className="flex size-8 items-center justify-center bg-neon text-black">
              <Trophy className="size-4" />
            </span>
            <span>
              <span className="block font-mono text-[9px] tracking-[0.3em] text-neon uppercase">Succès débloqué</span>
              <span className="block font-display text-sm font-semibold text-white uppercase">{titre}</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Profil({ portrait }: { portrait?: string }) {
  const [notif, setNotif] = useState<string | null>(null);
  const minuteur = useRef<ReturnType<typeof setTimeout>>(undefined);
  const debloque = useRef((titre: string) => {
    setNotif(titre);
    clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => setNotif(null), 1600);
  }).current;
  useEffect(() => () => clearTimeout(minuteur.current), []);

  return (
    <section id="profil" className="mx-auto max-w-7xl px-5 py-28 md:px-10 md:py-40">
      <TitreSection numero="03" etiquette="Profil" titre="Fiche personnage" />

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-4 lg:row-span-2">
          <CartePerso portrait={portrait} />
        </div>

        <Apparition delai={0.1} className="lg:col-span-4">
          <Cadre className="h-full p-6">
            <Entete numero="01" titre="Attributs" info={<><span className="hidden md:inline">Survolez</span><span className="md:hidden">Touchez</span></>} />
            <Radar />
          </Cadre>
        </Apparition>

        <Apparition delai={0.2} className="lg:col-span-4">
          <Cadre className="h-full p-6">
            <Entete numero="02" titre="Inventaire" info={`${equipement.length}/9`} />
            <Inventaire />
          </Cadre>
        </Apparition>

        <Apparition delai={0.1} className="lg:col-span-4">
          <Cadre className="h-full p-6">
            <Entete numero="03" titre="Journal de quêtes" info={`${parcours.filter((q) => q.etat === "terminee").length}/${parcours.length + 1}`} />
            <Quetes />
          </Cadre>
        </Apparition>

        <Apparition delai={0.2} className="lg:col-span-4">
          <Cadre className="h-full p-6">
            <Entete numero="04" titre="Succès" info={`${succes.length} trophées`} />
            <Succes onDebloque={debloque} />
          </Cadre>
        </Apparition>
      </div>

      <Notification titre={notif} />
    </section>
  );
}
