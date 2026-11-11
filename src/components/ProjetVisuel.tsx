import Image from "next/image";
import type { Projet } from "@/data/projects";
import { teintes } from "@/lib/ui";

/** Zone en verre teinté : capture si elle existe, sinon l'icône du projet. */
export default function ProjetVisuel({
  projet,
  sizes,
  className = "",
  grand = false,
}: {
  projet: Projet;
  sizes: string;
  className?: string;
  grand?: boolean;
}) {
  const { icone: Icone } = projet;
  const teinte = teintes[projet.couleur];

  return (
    <div
      className={`relative overflow-hidden border border-white/10 ${className}`}
      style={{ background: `linear-gradient(135deg, ${teinte.fond}, rgba(255,255,255,0.03))` }}
    >
      {projet.image ? (
        <Image src={projet.image} alt={`Capture de ${projet.nom}`} fill sizes={sizes} className="object-cover" />
      ) : (
        <Icone
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-25 ${grand ? "size-24" : "size-16"}`}
          style={{ color: teinte.trait }}
          strokeWidth={1.25}
        />
      )}
      <span className="absolute top-3 left-3 flex size-9 items-center justify-center rounded-xl bg-black/20 backdrop-blur-md">
        <Icone className="size-4" style={{ color: teinte.trait }} />
      </span>
      <span className="absolute right-3 bottom-3 rounded-full bg-black/25 px-2.5 py-1 font-mono text-[11px] tracking-wide text-white/80 uppercase backdrop-blur-md">
        {projet.categorie}
      </span>
    </div>
  );
}
