import { existsSync } from "node:fs";
import { join } from "node:path";
import Experience from "@/components/Experience";

/** Premier fichier `nom.jpg|png|webp` présent dans /public, s'il y en a un. */
function image(nom: string) {
  const f = ["jpg", "png", "webp"].map((ext) => `${nom}.${ext}`).find((f) => existsSync(join(process.cwd(), "public", f)));
  return f ? `/${f}` : undefined;
}

export default function Page() {
  // Fond du site : `public/fond.jpg` ; portrait du Profil : `public/portrait.jpg` (sinon une silhouette).
  return <Experience fond={image("fond")} portrait={image("portrait")} />;
}
