import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";

export const metadata: Metadata = {
  title: "Poké-Stock - Scanner et collection",
  description: "Scannez et gérez votre collection de cartes Pokémon",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="bg-fond text-encre">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
