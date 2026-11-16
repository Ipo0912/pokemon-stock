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
      router.push("/galerie");
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
        "Compte créé. Vous pouvez vous connecter (vérifiez vos e-mails si la confirmation est activée).",
      );
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-fond text-encre px-4 pt-16">
      <div className="w-full max-w-sm mx-auto bg-white border border-bordure rounded-md overflow-hidden shadow-sm">
        <h1 className="bg-entete text-white text-sm font-medium px-4 py-2">
          Connexion
        </h1>
        <div className="p-5">
          {erreur && (
            <p className="border border-red-300 bg-red-50 text-red-800 text-sm p-3 rounded-md mb-4">
              {erreur}
            </p>
          )}
          {message && (
            <p className="border border-green-300 bg-green-50 text-green-800 text-sm p-3 rounded-md mb-4">
              {message}
            </p>
          )}

          <form className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-encre mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-bordure rounded-md px-3 py-2 text-sm bg-fond-doux focus:bg-white focus:outline-none focus:border-bleu focus:ring-2 focus:ring-bleu/20"
                placeholder="nom@exemple.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-encre mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-bordure rounded-md px-3 py-2 text-sm bg-fond-doux focus:bg-white focus:outline-none focus:border-bleu focus:ring-2 focus:ring-bleu/20"
                required
              />
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={gererConnexion}
                disabled={loading}
                className="w-full py-2 bg-accent text-white text-sm rounded-md hover:bg-accent-fonce disabled:opacity-40"
              >
                {loading ? "Chargement..." : "Se connecter"}
              </button>

              <button
                onClick={gererInscription}
                disabled={loading}
                className="w-full py-2 bg-white text-encre text-sm border border-bordure rounded-md hover:bg-fond disabled:opacity-40"
              >
                Créer un compte
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
