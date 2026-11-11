"use client";

import { motion } from "framer-motion";
import { filtres, type Filtre } from "@/lib/ui";

export default function FiltrePills({
  actif,
  onChange,
  layoutId,
}: {
  actif: Filtre | null;
  onChange: (f: Filtre) => void;
  layoutId: string;
}) {
  return (
    <div className="glass inline-flex max-w-full gap-1 overflow-x-auto rounded-full p-1">
      {filtres.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`relative shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors ${
            actif === f ? "text-white" : "text-white/60 hover:text-white"
          }`}
        >
          {actif === f && (
            <motion.span
              layoutId={layoutId}
              className="absolute inset-0 rounded-full bg-white/20"
              transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
            />
          )}
          <span className="relative">{f}</span>
        </button>
      ))}
    </div>
  );
}
