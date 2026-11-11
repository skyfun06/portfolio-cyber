"use client";

import type { FormEvent } from "react";
import { site } from "@/data/site";
import * as sons from "../demarrage/sons";
import { Apparition, Cadre, TitreSection } from "./outils";

const champ =
  "w-full border-0 border-b border-white/15 bg-transparent py-3 text-white placeholder:text-white/25 outline-none transition-colors focus:border-neon";

function Champ({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[11px] tracking-[0.2em] text-neon uppercase">&gt; {label}</span>
      {children}
    </label>
  );
}

export default function Contact() {
  function transmettre(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    sons.ok();
    const data = new FormData(e.currentTarget);
    const nom = String(data.get("nom") ?? "");
    const email = String(data.get("email") ?? "");
    const message = String(data.get("message") ?? "");
    const sujet = encodeURIComponent(`Contact portfolio : ${nom}`);
    const corps = encodeURIComponent(`${message}\n\n${nom} (${email})`);
    window.location.href = `mailto:${site.email}?subject=${sujet}&body=${corps}`;
  }

  return (
    <section id="contact" className="mx-auto max-w-7xl px-5 py-28 md:px-10 md:py-40">
      <TitreSection numero="04" etiquette="Contact" titre="Ouvrir un canal" />

      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <Apparition>
          <p className="max-w-md text-lg leading-relaxed text-white/65">
            Un projet, une idée, une question ? Envoyez un message : je réponds vite.
          </p>
          <ul className="mt-10 flex flex-col gap-px bg-white/10">
            {[
              { label: "E-mail", valeur: site.email, href: `mailto:${site.email}` },
              { label: "GitHub", valeur: site.github.replace("https://", ""), href: site.github },
              { label: "Base", valeur: `${site.ville}, France` },
            ].map(({ label, valeur, href }) => (
              <li key={label} className="bg-black/55 px-4 py-4 backdrop-blur-sm">
                <p className="font-mono text-[10px] tracking-[0.25em] text-white/40 uppercase">{label}</p>
                {href ? (
                  <a
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    className="mt-1 inline-block font-display text-xl text-white transition-colors hover:text-neon"
                  >
                    {valeur} ↗
                  </a>
                ) : (
                  <p className="mt-1 font-display text-xl text-white">{valeur}</p>
                )}
              </li>
            ))}
          </ul>
        </Apparition>

        <Apparition delai={0.1}>
          <Cadre className="p-6 md:p-10">
            <form onSubmit={transmettre} className="flex flex-col gap-8">
              <div className="grid gap-8 sm:grid-cols-2">
                <Champ label="Nom">
                  <input name="nom" required autoComplete="name" placeholder="Votre nom" className={champ} />
                </Champ>
                <Champ label="E-mail">
                  <input name="email" type="email" required autoComplete="email" placeholder="vous@exemple.fr" className={champ} />
                </Champ>
              </div>
              <Champ label="Message">
                <textarea name="message" required rows={5} placeholder="Parlez-moi de votre projet…" className={`${champ} resize-none`} />
              </Champ>
              <button
                type="submit"
                data-info-titre="Transmettre"
                data-info="Ouvre ta messagerie avec le message déjà rempli"
                data-info-touche="Entrée"
                className="coupe self-start bg-neon px-8 py-4 font-mono text-xs font-semibold tracking-[0.25em] text-black uppercase transition-shadow hover:shadow-[0_0_30px_#ff2a2a]"
              >
                Transmettre →
              </button>
            </form>
          </Cadre>
        </Apparition>
      </div>
    </section>
  );
}
