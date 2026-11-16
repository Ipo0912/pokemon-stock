"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Écoute les changements (si l'utilisateur se connecte ou se déconnecte)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-4xl mx-auto p-4 flex flex-wrap justify-between items-center gap-4">
        {/* Titre cliquable (retour à l'accueil) */}
        <Link
          href="/"
          className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 uppercase tracking-widest hover:opacity-80 transition-opacity"
        >
          Poké-Stock
        </Link>

        {/* Liens de navigation */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/"
            className={`font-medium transition-colors ${pathname === "/" ? "text-blue-400" : "text-slate-400 hover:text-white"}`}
          >
            Scanner
          </Link>
          <Link
            href="/galerie"
            className={`font-medium transition-colors ${pathname === "/galerie" ? "text-blue-400" : "text-slate-400 hover:text-white"}`}
          >
            Collection
          </Link>

          {/* NOUVEAU : LIEN VERS LA MAP */}
          <Link
            href="/map"
            className={`font-medium transition-colors ${pathname === "/map" ? "text-blue-400" : "text-slate-400 hover:text-white"}`}
          >
            Map
          </Link>

          {/* Bouton de connexion / déconnexion */}
          {session ? (
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-red-900/30 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-all text-sm font-bold"
            >
              Déconnexion
            </button>
          ) : (
            <Link
              href="/login"
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all text-sm font-bold"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
