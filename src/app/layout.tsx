import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Poké-Stock - Scanner & Collection",
  description: "Gérez votre collection de cartes Pokémon avec l'IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.className} bg-slate-950 text-white`}>
        {}
        <Navbar />
        {children}
      </body>
    </html>
  );
}
