"use client";

import { motion } from "framer-motion";
import { Mail, Send } from "lucide-react";
import type { FormEvent } from "react";
import { site } from "@/data/site";
import { elementDecale } from "../motion";
import { GithubIcon, SectionTitre, boutonRond } from "../ui";

const champ =
  "w-full rounded-2xl border border-white/14 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition-colors focus:border-white/35 focus:bg-white/10";

export default function Contact() {
  function envoyer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const nom = String(data.get("nom") ?? "");
    const email = String(data.get("email") ?? "");
    const message = String(data.get("message") ?? "");
    const sujet = encodeURIComponent(`Contact portfolio : ${nom}`);
    const corps = encodeURIComponent(`${message}\n\n${nom} (${email})`);
    window.location.href = `mailto:${site.email}?subject=${sujet}&body=${corps}`;
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="w-full max-w-xl">
        <SectionTitre titre="Contact" sousTitre="Un projet, une question ? Écrivez-moi, je réponds vite." />
      </div>

      <motion.section variants={elementDecale} initial="initial" animate="animate" className="glass w-full max-w-xl rounded-3xl p-5 md:p-8">
        <form onSubmit={envoyer} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] text-white/60 uppercase">Nom</span>
              <input name="nom" required autoComplete="name" placeholder="Votre nom" className={champ} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] text-white/60 uppercase">E-mail</span>
              <input name="email" type="email" required autoComplete="email" placeholder="vous@exemple.fr" className={champ} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] text-white/60 uppercase">Message</span>
            <textarea name="message" required rows={5} placeholder="Parlez-moi de votre projet…" className={`${champ} resize-none`} />
          </label>

          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="flex gap-2">
              <a href={site.github} target="_blank" rel="noreferrer" className={boutonRond} aria-label="GitHub">
                <GithubIcon className="size-4" />
              </a>
              <a href={`mailto:${site.email}`} className={boutonRond} aria-label="E-mail">
                <Mail className="size-4" />
              </a>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-medium transition-colors hover:bg-orange-400"
            >
              <Send className="size-4" /> Envoyer
            </button>
          </div>
        </form>
      </motion.section>
    </div>
  );
}
