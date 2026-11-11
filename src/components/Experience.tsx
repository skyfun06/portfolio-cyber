"use client";

import { useState } from "react";
import Curseur from "./Curseur";
import Demarrage from "./demarrage/Demarrage";
import Site from "./site/Site";

/** Enchaîne la séquence de démarrage puis le site. */
export default function Experience({ fond, portrait }: { fond?: string; portrait?: string }) {
  const [demarre, setDemarre] = useState(false);
  return (
    <>
      <Demarrage onFini={() => setDemarre(true)} />
      <Site demarre={demarre} fond={fond} portrait={portrait} />
      <Curseur />
    </>
  );
}
