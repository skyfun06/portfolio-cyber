"use client";

import { useEffect, useRef, useState } from "react";
import { abonner } from "./boucle";
import { curseur } from "./positionSouris";

const CLIQUABLE = "a, button, [role=button], [data-curseur], input, textarea, label";

type Info = { titre: string; texte: string; touche?: string };

/** Nom lisible d'une section à partir de son ancre. */
const SECTIONS: Record<string, string> = { accueil: "Accueil", projets: "Projets", profil: "Profil", contact: "Contact" };

/**
 * Infos affichées au survol d'un élément. Priorité aux attributs posés dans le code :
 * `data-info-titre`, `data-info` (texte) et `data-info-touche` (raccourci). Sinon, déduites du lien.
 */
function lireInfo(el: HTMLElement): Info | null {
  const d = el.dataset;
  if (d.info || d.infoTitre) return { titre: d.infoTitre ?? d.curseur ?? "Action", texte: d.info ?? "", touche: d.infoTouche };

  const libelle = (el.getAttribute("aria-label") ?? el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 40);
  if (el instanceof HTMLAnchorElement) {
    const href = el.getAttribute("href") ?? "";
    if (href.startsWith("mailto:")) return { titre: "E-mail", texte: `Ouvre ta messagerie vers ${href.slice(7).split("?")[0]}` };
    if (href.startsWith("#")) {
      const s = SECTIONS[href.slice(1)];
      return { titre: libelle || "Lien", texte: s ? `Aller à la section ${s}` : "Aller plus bas dans la page" };
    }
    try {
      const url = new URL(href, location.href);
      if (url.origin !== location.origin) return { titre: libelle || url.hostname, texte: `Ouvre ${url.hostname.replace(/^www\./, "")} dans un nouvel onglet` };
    } catch {}
    return { titre: libelle || "Lien", texte: "Ouvrir" };
  }
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el.tagName === "LABEL") {
    const champ = el.tagName === "LABEL" ? el.querySelector("input, textarea") : el;
    const nom = (champ as HTMLInputElement | null)?.name;
    return nom ? { titre: "Champ", texte: `Saisis ton ${nom === "email" ? "e-mail" : nom}` } : null;
  }
  return libelle ? { titre: libelle, texte: "Cliquer pour activer" } : null;
}

/**
 * Curseur de visée : point qui suit la souris, anneau avec repères qui le rattrape,
 * étiquette courte dans l'anneau et fiche d'infos à côté au survol des éléments interactifs.
 * Seulement avec une souris, et désactivé si l'utilisateur réduit les animations.
 */
export default function Curseur() {
  const [actif, setActif] = useState(false);
  const pointRef = useRef<HTMLDivElement>(null);
  const anneauRef = useRef<HTMLDivElement>(null);
  const etiquetteRef = useRef<HTMLSpanElement>(null);
  const ficheRef = useRef<HTMLDivElement>(null);
  const titreRef = useRef<HTMLSpanElement>(null);
  const toucheRef = useRef<HTMLSpanElement>(null);
  const texteRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ok = window.matchMedia("(hover: hover) and (pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setActif(ok);
  }, []);

  useEffect(() => {
    if (!actif) return;
    const point = pointRef.current!;
    const anneau = anneauRef.current!;
    const etiquette = etiquetteRef.current!;
    const fiche = ficheRef.current!;
    document.documentElement.classList.add("curseur-perso");

    // État : survol d'un élément interactif, clic enfoncé, fiche d'infos.
    let survol = false;
    let enfonce = false;
    let info = false;
    let depuis = 0;
    const surSurvol = (e: PointerEvent) => {
      const cible = (e.target as HTMLElement).closest<HTMLElement>(CLIQUABLE);
      const champ = !!cible && (cible.matches("input, textarea, label") || !!cible.closest("label"));
      survol = !!cible && !champ;
      etiquette.textContent = survol && cible ? (cible.dataset.curseur ?? (cible.tagName === "A" ? "Ouvrir" : "")) : "";
      const i = cible ? lireInfo(cible) : null;
      if (i) {
        titreRef.current!.textContent = i.titre;
        texteRef.current!.textContent = i.texte;
        toucheRef.current!.textContent = i.touche ?? "";
        toucheRef.current!.style.display = i.touche ? "" : "none";
        if (!info) depuis = performance.now();
      }
      info = !!i;
    };
    const bas = () => (enfonce = true);
    const haut = () => (enfonce = false);
    window.addEventListener("pointerover", surSurvol);
    window.addEventListener("pointerdown", bas);
    window.addEventListener("pointerup", haut);

    const anneauPos = { x: curseur.x, y: curseur.y };
    const fichePos = { x: curseur.x, y: curseur.y };
    let taille = 34;

    const tic = (t: number) => {
      const visible = curseur.actif;
      point.style.opacity = anneau.style.opacity = visible ? "1" : "0";

      // Point : exactement sur la souris. Anneau : le rattrape en douceur.
      point.style.transform = `translate3d(${curseur.x}px, ${curseur.y}px, 0) translate(-50%, -50%) scale(${enfonce ? 0.5 : survol ? 0 : 1})`;
      anneauPos.x += (curseur.x - anneauPos.x) * 0.2;
      anneauPos.y += (curseur.y - anneauPos.y) * 0.2;
      taille += ((survol ? 68 : 34) * (enfonce ? 0.8 : 1) - taille) * 0.2;
      const vitesse = Math.hypot(curseur.x - anneauPos.x, curseur.y - anneauPos.y);
      anneau.style.width = anneau.style.height = `${taille}px`;
      anneau.style.transform = `translate3d(${anneauPos.x}px, ${anneauPos.y}px, 0) translate(-50%, -50%) rotate(${(t / 40 + vitesse * 2) % 360}deg)`;
      anneau.dataset.survol = survol ? "1" : "0";
      etiquette.style.transform = `translate3d(${anneauPos.x}px, ${anneauPos.y}px, 0) translate(-50%, -50%)`;
      etiquette.style.opacity = survol && etiquette.textContent ? "1" : "0";

      // Fiche d'infos : à droite et en dessous du curseur, retournée près des bords de l'écran.
      const [fl, fh] = [fiche.offsetWidth, fiche.offsetHeight];
      const ecart = taille / 2 + 14;
      const cx = curseur.x + ecart + fl > innerWidth - 12 ? curseur.x - ecart - fl : curseur.x + ecart;
      const cy = curseur.y + ecart + fh > innerHeight - 12 ? curseur.y - ecart - fh : curseur.y + ecart * 0.4;
      fichePos.x += (cx - fichePos.x) * 0.25;
      fichePos.y += (cy - fichePos.y) * 0.25;
      const montre = visible && info && t - depuis > 120; // petit délai : pas de clignotement en traversant la page
      fiche.style.transform = `translate3d(${fichePos.x}px, ${fichePos.y}px, 0) translateY(${montre ? 0 : 6}px)`;
      fiche.style.opacity = montre ? "1" : "0";
    };

    const desabonner = abonner(tic);
    return () => {
      desabonner();
      document.documentElement.classList.remove("curseur-perso");
      window.removeEventListener("pointerover", surSurvol);
      window.removeEventListener("pointerdown", bas);
      window.removeEventListener("pointerup", haut);
    };
  }, [actif]);

  if (!actif) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[300]" aria-hidden>
      {/* Anneau de visée : cercle + 4 repères */}
      <div
        ref={anneauRef}
        className="group/curseur absolute top-0 left-0 rounded-full border border-neon/80 opacity-0 transition-[background-color,border-color] duration-200 data-[survol=1]:border-neon data-[survol=1]:bg-neon/10"
        style={{ width: 34, height: 34 }}
      >
        <span className="absolute top-[-5px] left-1/2 h-2 w-px -translate-x-1/2 bg-neon" />
        <span className="absolute bottom-[-5px] left-1/2 h-2 w-px -translate-x-1/2 bg-neon" />
        <span className="absolute top-1/2 left-[-5px] h-px w-2 -translate-y-1/2 bg-neon" />
        <span className="absolute top-1/2 right-[-5px] h-px w-2 -translate-y-1/2 bg-neon" />
      </div>
      <span
        ref={etiquetteRef}
        className="absolute top-0 left-0 font-mono text-[9px] font-semibold tracking-[0.2em] text-white uppercase opacity-0 transition-opacity duration-150"
      />
      {/* Fiche d'infos */}
      <div
        ref={ficheRef}
        className="absolute top-0 left-0 flex max-w-64 flex-col gap-1 border border-dashed border-neon/40 bg-black/90 px-3 py-2 font-mono text-[10px] tracking-[0.12em] uppercase opacity-0 shadow-[0_8px_30px_rgb(0_0_0/0.6)] backdrop-blur-md transition-opacity duration-150"
      >
        <span className="flex items-center gap-3">
          <span className="size-1.5 shrink-0 bg-neon shadow-[0_0_6px_#ff2a2a]" />
          <span ref={titreRef} className="truncate font-semibold text-white" />
          <span ref={toucheRef} className="ml-auto shrink-0 border border-white/25 px-1 text-white/60" />
        </span>
        <span ref={texteRef} className="pl-[18px] leading-relaxed tracking-[0.08em] text-white/55 normal-case" />
      </div>
      <div ref={pointRef} className="absolute top-0 left-0 size-1.5 rounded-full bg-neon opacity-0 shadow-[0_0_10px_#ff2a2a]" />
    </div>
  );
}
