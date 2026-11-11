/** Monogramme « B » anguleux dans un hexagone, qui tourne comme une pièce puis marque une pause. */
export default function LogoTournant({ className = "" }: { className?: string }) {
  return (
    <div className={`[perspective:600px] ${className}`} aria-hidden>
      <div className="logo-pivot relative size-full">
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 size-full overflow-visible [filter:drop-shadow(0_0_6px_rgb(255_42_42/0.8))]"
          fill="none"
          stroke="#ff2a2a"
          strokeLinejoin="miter"
        >
          {/* Hexagone extérieur + coins accentués */}
          <path d="M50 4 L90 27 V73 L50 96 L10 73 V27 Z" strokeWidth="2.5" />
          <path d="M50 12 L83 31 V69 L50 88 L17 69 V31 Z" strokeWidth="1" opacity="0.45" />
          {/* B anguleux */}
          <path d="M35 26 H59 L67 34 V44 L61 50 L69 56 V66 L61 74 H35 Z" strokeWidth="4" />
          <path d="M35 50 H59" strokeWidth="4" />
          <path d="M43 26 V74" strokeWidth="2" opacity="0.6" />
        </svg>
      </div>
      {/* Anneau pointillé qui tourne en sens inverse */}
      <svg viewBox="0 0 100 100" className="logo-anneau absolute -inset-[18%] size-[136%]" fill="none" stroke="#ff2a2a">
        <circle cx="50" cy="50" r="48" strokeWidth="1" strokeDasharray="3 5" opacity="0.6" />
        <path d="M50 0 v6 M50 94 v6 M0 50 h6 M94 50 h6" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
