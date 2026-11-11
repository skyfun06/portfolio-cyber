"use client";

import { animate, motion } from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";
import { useState, type FormEvent } from "react";
import { site } from "@/data/site";
import * as sons from "../demarrage/sons";
import { Apparition, Cadre, TitreSection } from "./outils";

const champ =
  "w-full border-0 border-b border-white/15 bg-transparent py-3 text-white placeholder:text-white/25 outline-none transition-colors focus:border-neon";

const TYPES = ["Site vitrine", "Application web", "Outil métier", "Autre"];
const DELAIS = ["Dès que possible", "1 à 3 mois", "Pas pressé"];

/** Comment se passe une collaboration, en quatre étapes. */
const ETAPES = [
  { titre: "Vous m'écrivez", texte: "Quelques lignes sur votre idée suffisent." },
  { titre: "On en parle", texte: "Un échange pour cerner le besoin et les priorités." },
  { titre: "Devis clair", texte: "Ce qui sera livré, quand, et à quel prix." },
  { titre: "Je construis", texte: "Points réguliers, puis mise en ligne." },
];

function Champ({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[11px] tracking-[0.2em] text-neon uppercase">&gt; {label}</span>
      {children}
    </label>
  );
}

/** Choix unique sous forme de pastilles. */
function Pastilles({ label, options, valeur, onChange }: { label: string; options: string[]; valeur: string; onChange: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-3 font-mono text-[11px] tracking-[0.2em] text-neon uppercase">&gt; {label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const actif = o === valeur;
          return (
            <button
              key={o}
              type="button"
              onClick={() => {
                sons.touche();
                onChange(actif ? "" : o);
              }}
              aria-pressed={actif}
              className={`border px-3.5 py-2 font-mono text-[11px] tracking-[0.12em] uppercase transition-all ${
                actif ? "border-neon bg-neon text-black shadow-[0_0_16px_rgb(255_42_42/0.5)]" : "border-white/15 text-white/60 hover:border-neon/60 hover:text-white"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

type Etat = "pret" | "envoi" | "envoye";

export default function Contact() {
  const [type, setType] = useState("");
  const [delai, setDelai] = useState("");
  const [message, setMessage] = useState("");
  const [etat, setEtat] = useState<Etat>("pret");
  const [progression, setProgression] = useState(0);

  function transmettre(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (etat === "envoi") return;
    const data = new FormData(e.currentTarget);
    const nom = String(data.get("nom") ?? "");
    const email = String(data.get("email") ?? "");
    const details = [type && `Type de projet : ${type}`, delai && `Délai : ${delai}`].filter(Boolean).join("\n");
    const sujet = encodeURIComponent(`Projet${type ? ` · ${type}` : ""} : ${nom}`);
    const corps = encodeURIComponent(`${message}\n\n${details ? `${details}\n\n` : ""}${nom} (${email})`);

    // Petite séquence de transmission, puis ouverture de la messagerie avec le message prêt.
    setEtat("envoi");
    sons.ok();
    animate(0, 100, {
      duration: 1.1,
      ease: [0.4, 0, 0.2, 1],
      onUpdate: (v) => setProgression(Math.round(v)),
      onComplete: () => {
        setEtat("envoye");
        sons.impact();
        window.location.href = `mailto:${site.email}?subject=${sujet}&body=${corps}`;
      },
    });
  }

  return (
    <section id="contact" className="mx-auto max-w-7xl px-5 py-28 md:px-10 md:py-40">
      <TitreSection numero="04" etiquette="Contact" titre="Parlons de votre projet" />

      <div className="grid gap-12 lg:grid-cols-[1fr_1.35fr] lg:gap-16">
        <Apparition>
          <p className="max-w-md text-lg leading-relaxed text-white/70">
            Décrivez votre idée en quelques lignes. Je vous réponds personnellement, avec un premier avis et les prochaines étapes.
          </p>

          {/* Déroulé d'une collaboration */}
          <ol className="mt-10 flex flex-col">
            {ETAPES.map((e, i) => (
              <motion.li
                key={e.titre}
                className="group relative flex gap-5 pb-6 last:pb-0"
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ delay: 0.15 + i * 0.1, duration: 0.5 }}
              >
                {i < ETAPES.length - 1 && <span className="absolute top-9 bottom-0 left-[17px] w-px bg-gradient-to-b from-neon/50 to-white/10" />}
                <span className="flex size-9 shrink-0 items-center justify-center border border-neon/50 font-mono text-xs text-neon transition-colors group-hover:bg-neon group-hover:text-black">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="pt-1">
                  <span className="block font-display text-lg font-semibold text-white uppercase">{e.titre}</span>
                  <span className="mt-0.5 block text-sm text-white/50">{e.texte}</span>
                </span>
              </motion.li>
            ))}
          </ol>

          <ul className="mt-10 grid gap-px bg-white/10 sm:grid-cols-2">
            {[
              { label: "E-mail", valeur: site.email, href: `mailto:${site.email}` },
              { label: "GitHub", valeur: site.github.replace("https://github.com/", "@"), href: site.github },
              { label: "Base", valeur: `${site.ville}, France` },
              { label: "Zone", valeur: "France · à distance" },
            ].map(({ label, valeur, href }) => (
              <li key={label} className="bg-black/60 px-4 py-4 backdrop-blur-sm">
                <p className="font-mono text-[10px] tracking-[0.25em] text-white/40 uppercase">{label}</p>
                {href ? (
                  <a
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    className="group mt-1 inline-flex max-w-full items-center gap-1.5 font-display text-lg break-all text-white transition-colors hover:text-neon"
                  >
                    {valeur}
                    <ArrowUpRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                ) : (
                  <p className="mt-1 font-display text-lg text-white">{valeur}</p>
                )}
              </li>
            ))}
          </ul>
        </Apparition>

        <Apparition delai={0.1}>
          <Cadre className="overflow-hidden">
            {/* En-tête du formulaire, façon fenêtre de transmission */}
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-6 py-3 font-mono text-[10px] tracking-[0.25em] uppercase md:px-10">
              <span className="flex items-center gap-2 text-neon">
                <span className="size-1.5 animate-pulse rounded-full bg-neon" /> Nouvelle transmission
              </span>
              <span className="text-white/35">Canal 04 · {site.ville}</span>
            </div>

            <form onSubmit={transmettre} className="flex flex-col gap-8 p-6 md:p-10">
              <Pastilles label="Type de projet" options={TYPES} valeur={type} onChange={setType} />
              <Pastilles label="Délai" options={DELAIS} valeur={delai} onChange={setDelai} />
              <div className="grid gap-8 sm:grid-cols-2">
                <Champ label="Nom">
                  <input name="nom" required autoComplete="name" placeholder="Votre nom" className={champ} />
                </Champ>
                <Champ label="E-mail">
                  <input name="email" type="email" required autoComplete="email" placeholder="vous@exemple.fr" className={champ} />
                </Champ>
              </div>
              <Champ label="Message">
                <textarea
                  name="message"
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Votre idée, votre activité, ce que vous attendez du site ou de l'outil…"
                  className={`${champ} resize-none`}
                />
                <span className="mt-1 self-end font-mono text-[10px] tracking-[0.15em] text-white/30 tabular-nums">{message.length} car.</span>
              </Champ>

              <div className="flex flex-wrap items-center gap-5">
                <button
                  type="submit"
                  disabled={etat === "envoi"}
                  data-info-titre="Transmettre"
                  data-info="Ouvre votre messagerie avec le message déjà rempli"
                  data-info-touche="Entrée"
                  className="coupe relative min-w-56 overflow-hidden bg-neon px-8 py-4 font-mono text-xs font-semibold tracking-[0.25em] text-black uppercase transition-shadow hover:shadow-[0_0_30px_#ff2a2a] disabled:cursor-wait"
                >
                  {etat === "envoi" && (
                    <span className="absolute inset-y-0 left-0 bg-white/40" style={{ width: `${progression}%` }} aria-hidden />
                  )}
                  <span className="relative flex items-center justify-center gap-2">
                    {etat === "pret" && <>Transmettre →</>}
                    {etat === "envoi" && <>Transmission · {progression}%</>}
                    {etat === "envoye" && (
                      <>
                        <Check className="size-4" strokeWidth={3} /> Messagerie ouverte
                      </>
                    )}
                  </span>
                </button>
                <p className="font-mono text-[10px] tracking-[0.15em] text-white/35 uppercase">
                  {etat === "envoye" ? "Rien ne s'est ouvert ? Écrivez à " + site.email : "Votre message s'ouvre dans votre messagerie"}
                </p>
              </div>
            </form>
          </Cadre>
        </Apparition>
      </div>
    </section>
  );
}
