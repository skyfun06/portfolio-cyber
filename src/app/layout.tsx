import type { Metadata, Viewport } from "next";
import { Chakra_Petch, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
});

// Police d'affichage pour les grands titres de l'univers « simulation ».
const chakra = Chakra_Petch({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-chakra",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Borrel · Développeur web indépendant à Antibes",
  description:
    "Développeur web indépendant à Antibes, 18 ans, 5 produits déjà en ligne. Site, application ou outil métier : je conçois, je code et je mets en ligne votre projet.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${poppins.variable} ${chakra.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
