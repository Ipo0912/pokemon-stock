"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  // Fonction pour se connecter
  const gererConnexion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErreur(null);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErreur(error.message);
    } else {
      router.push("/galerie"); // Redirection automatique vers la galerie
      router.refresh();
    }
    setLoading(false);
  };

  // Fonction pour créer un nouveau compte
  const gererInscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErreur(null);
    setMessage(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErreur(error.message);
    } else {
      setMessage(
        "Inscription réussie ! Vous pouvez maintenant vous connecter (ou vérifiez vos e-mails si la confirmation est activée sur Supabase).",
      );
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-8 uppercase tracking-widest">
          Poké-Stock
        </h1>

        {/* Affichage des messages d'erreur ou de succès */}
        {erreur && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg mb-4 text-sm">
            {erreur}
          </div>
        )}
        {message && (
          <div className="bg-emerald-900/50 border border-emerald-500 text-emerald-200 p-3 rounded-lg mb-4 text-sm">
            {message}
          </div>
        )}

        <form className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="dresseur@exemple.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <button
              onClick={gererConnexion}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Chargement..." : "Se connecter"}
            </button>

            <button
              onClick={gererInscription}
              disabled={loading}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 px-4 rounded-lg transition-colors border border-slate-700 disabled:opacity-50"
            >
              Créer un compte
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
