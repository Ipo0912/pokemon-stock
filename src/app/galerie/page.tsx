"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Carte = {
  id: number;
  nom: string;
  extension: string;
  numero: string;
  langue: string;
  created_at: string;
};

export default function Galerie() {
  const [cartes, setCartes] = useState<Carte[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    chargerCartes();
  }, []);

  const chargerCartes = async () => {
    try {
      const { data, error } = await supabase
        .from("cartes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCartes(data || []);
    } catch (err: any) {
      console.error("Erreur lors du chargement :", err);
      setErreur("Impossible de charger votre collection.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="max-w-4xl mx-auto">
        {}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 uppercase tracking-widest">
            Ma Collection ({cartes.length})
          </h1>
          <Link
            href="/"
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full font-medium transition-all"
          >
            ← Retour au scanner
          </Link>
        </div>

        {}
        {chargement && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {erreur && (
          <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-400 text-center font-medium">
            {erreur}
          </div>
        )}

        {}
        {!chargement && !erreur && cartes.length === 0 && (
          <div className="text-center py-20 text-slate-500 text-lg">
            Votre collection est vide. Allez scanner quelques cartes !
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {cartes.map((carte) => (
            <div
              key={carte.id}
              className="bg-slate-900 border border-slate-700/50 rounded-xl p-5 shadow-lg hover:border-blue-500/50 transition-colors group"
            >
              <h2 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                {carte.nom}
              </h2>
              <div className="space-y-2 mt-4 text-sm">
                <p className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Extension</span>
                  {carte.extension}
                </p>
                <p className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Numéro</span>
                  <span className="text-emerald-400 font-medium">
                    {carte.numero}
                  </span>
                </p>
                <p className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Langue</span>
                  <span className="uppercase">{carte.langue}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
