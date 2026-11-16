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

    // Écoute les changements (connexion / déconnexion)
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

  const lien = (href: string) =>
    `text-sm text-white underline-offset-4 ${
      pathname === href ? "font-semibold underline" : "hover:underline"
    }`;

  return (
    <nav className="bg-accent border-b border-accent-fonce sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-3">
        <Link href="/" className="font-bold text-lg text-white">
          Poké-Stock
        </Link>

        <div className="flex items-center gap-5">
          <Link href="/" className={lien("/")}>
            Scanner
          </Link>
          <Link href="/galerie" className={lien("/galerie")}>
            Collection
          </Link>
          <Link href="/map" className={lien("/map")}>
            Boutiques
          </Link>

          {session ? (
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm text-white border border-white/70 rounded-md hover:bg-accent-fonce"
            >
              Déconnexion
            </button>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 text-sm font-medium bg-white text-accent rounded-md hover:bg-fond-doux"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
