"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const CATEGORIES = ["Ultra rare", "Full art", "Ar", "Promo", "Autre"];

const traduireLangue = (code?: string) => {
  if (!code) return "";
  const langues: Record<string, string> = {
    FR: "français",
    EN: "anglais",
    JP: "japonais",
    IT: "italien",
    DE: "allemand",
    ES: "espagnol",
  };
  return langues[code.toUpperCase()] || code;
};

type Carte = {
  id: number;
  nom: string;
  extension: string;
  numero: string;
  langue: string;
  prix_estime?: number;
  categorie: string;
};

export default function Portfolio() {
  const [cartes, setCartes] = useState<Carte[]>([]);
  const [chargement, setChargement] = useState(true);

  const [selection, setSelection] = useState<number[]>([]);
  const [isReevaluating, setIsReevaluating] = useState(false);
  const [carteEnEdition, setCarteEnEdition] = useState<number | null>(null);
  const [nouveauPrixManuel, setNouveauPrixManuel] = useState<string>("");

  // Nouvel état pour le dossier actuellement ouvert
  const [dossierActif, setDossierActif] = useState<string>("Toutes");

  useEffect(() => {
    chargerPortfolio();
  }, []);

  const chargerPortfolio = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("cartes")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (!error) setCartes(data || []);
    setChargement(false);
  };

  const MAX_SELECTION = 10;

  const toggleSelection = (id: number) => {
    setSelection((prev) => {
      if (prev.includes(id)) return prev.filter((cardId) => cardId !== id);
      if (prev.length >= MAX_SELECTION) {
        alert(`Limite de ${MAX_SELECTION} cartes simultanées.`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const toutSelectionner = () => {
    if (selection.length > 0) setSelection([]);
    else setSelection(cartesAffichees.slice(0, MAX_SELECTION).map((c) => c.id));
  };

  // --- LOGIQUE DES DOSSIERS ---
  const cartesAffichees =
    dossierActif === "Toutes"
      ? cartes
      : cartes.filter(
          (c) =>
            c.categorie === dossierActif ||
            (!c.categorie && dossierActif === "Autre"),
        );

  const deplacerSelection = async (nouvelleCategorie: string) => {
    if (selection.length === 0) return;
    setIsReevaluating(true);
    try {
      for (const id of selection) {
        await supabase
          .from("cartes")
          .update({ categorie: nouvelleCategorie })
          .eq("id", id);
      }
      await chargerPortfolio();
      setSelection([]);
    } catch (err) {
      console.error(err);
      alert("Erreur lors du déplacement.");
    } finally {
      setIsReevaluating(false);
    }
  };

  const supprimerCarte = async (id: number) => {
    if (
      !window.confirm(
        "Voulez-vous vraiment retirer cette carte de votre portfolio ?",
      )
    )
      return;
    const { error } = await supabase.from("cartes").delete().eq("id", id);
    if (!error) {
      setCartes(cartes.filter((c) => c.id !== id));
      setSelection((prev) => prev.filter((selectedId) => selectedId !== id));
    }
  };

  const lancerReevaluation = async () => {
    if (selection.length === 0) return;
    setIsReevaluating(true);
    const cartesAChercher = cartes.filter((c) => selection.includes(c.id));
    try {
      const rep = await fetch("/api/reevaluer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartes: cartesAChercher }),
      });
      const data = await rep.json();
      if (data.success) {
        for (const res of data.resultats) {
          await supabase
            .from("cartes")
            .update({ prix_estime: res.nouveau_prix })
            .eq("id", res.id);
        }
        await chargerPortfolio();
        setSelection([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsReevaluating(false);
    }
  };

  const rechercherSurMarche = (plateforme: "cardmarket" | "ebay") => {
    const cartesCibles = cartes.filter((c) => selection.includes(c.id));
    if (cartesCibles.length > 3) {
      if (
        !window.confirm(`Ouvrir ${cartesCibles.length} onglets simultanément ?`)
      )
        return;
    }
    cartesCibles.forEach((carte) => {
      let url = "";
      if (plateforme === "cardmarket") {
        const numShort = carte.numero ? carte.numero.split("/")[0] : "";
        url = `https://www.cardmarket.com/fr/Pokemon/Products/Search?searchString=${encodeURIComponent(`${carte.nom} ${numShort}`.trim())}`;
      } else {
        const lang = traduireLangue(carte.langue);
        url = `https://www.ebay.fr/sch/i.html?_nkw=${encodeURIComponent(`${carte.nom} ${carte.numero} ${lang}`.trim())}`;
      }
      window.open(url, "_blank");
    });
  };

  const activerEdition = (carte: Carte) => {
    setCarteEnEdition(carte.id);
    setNouveauPrixManuel(carte.prix_estime?.toString() || "0");
  };

  const sauvegarderPrixManuel = async (id: number) => {
    const prixNum = parseFloat(nouveauPrixManuel.replace(",", "."));
    if (isNaN(prixNum)) return;
    const { error } = await supabase
      .from("cartes")
      .update({ prix_estime: prixNum })
      .eq("id", id);
    if (!error) {
      setCartes(
        cartes.map((c) => (c.id === id ? { ...c, prix_estime: prixNum } : c)),
      );
      setCarteEnEdition(null);
    }
  };

  const valeurTotale = cartesAffichees.reduce(
    (total, carte) => total + (carte.prix_estime || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="max-w-5xl mx-auto">
        <div className="bg-slate-900 rounded-3xl p-8 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl text-slate-400 mb-2">
              Valeur{" "}
              {dossierActif === "Toutes"
                ? "du Portefeuille"
                : `du dossier ${dossierActif}`}
            </h1>
            <p className="text-5xl font-black text-emerald-400">
              {valeurTotale.toFixed(2)} €
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-400">
              {cartesAffichees.length}
            </p>
            <p className="text-sm text-slate-500 uppercase mt-1">Cartes</p>
          </div>
        </div>

        {/* ONGLETS DE DOSSIERS */}
        <div className="flex gap-2 overflow-x-auto mb-6 pb-2 scrollbar-hide">
          <button
            onClick={() => setDossierActif("Toutes")}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${dossierActif === "Toutes" ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50" : "bg-slate-900 text-slate-400 hover:bg-slate-800"}`}
          >
            Toutes les cartes
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setDossierActif(cat)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${dossierActif === cat ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50" : "bg-slate-900 text-slate-400 hover:bg-slate-800"}`}
            >
              📁 {cat}
            </button>
          ))}
        </div>

        {/* Barre d'outils de sélection */}
        <div className="mb-6 flex gap-4 items-center bg-slate-900 p-4 rounded-xl border border-slate-800 flex-wrap">
          <button
            onClick={toutSelectionner}
            className="text-sm px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg"
          >
            {selection.length > 0 ? "Tout désélectionner" : `Sélection rapide`}
          </button>
          <span className="text-slate-400 text-sm">
            {selection.length} sélectionnée(s)
          </span>

          <div className="flex gap-2 ml-2 sm:ml-4 border-l border-slate-700 pl-2 sm:pl-4">
            <button
              onClick={() => rechercherSurMarche("cardmarket")}
              disabled={selection.length === 0}
              className="px-3 py-2 bg-[#1785e0] hover:bg-blue-500 disabled:opacity-50 disabled:grayscale text-white text-xs font-bold rounded-lg transition-all"
            >
              🔍 Cardmarket
            </button>
            <button
              onClick={() => rechercherSurMarche("ebay")}
              disabled={selection.length === 0}
              className="px-3 py-2 bg-slate-200 text-[#e53238] hover:bg-white disabled:opacity-50 disabled:grayscale border border-slate-300 text-xs font-bold rounded-lg transition-all"
            >
              🔍 eBay
            </button>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-3">
            {/* BOUTON DÉROULANT POUR RANGER DANS UN DOSSIER */}
            <select
              onChange={(e) => {
                if (e.target.value) deplacerSelection(e.target.value);
                e.target.value = "";
              }}
              disabled={selection.length === 0 || isReevaluating}
              className="px-3 py-2 bg-slate-800 border border-slate-600 text-sm font-bold text-white rounded-lg outline-none cursor-pointer disabled:opacity-50 hover:bg-slate-700"
            >
              <option value="">📁 Ranger dans...</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <button
              onClick={lancerReevaluation}
              disabled={selection.length === 0 || isReevaluating}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-lg transition-all flex items-center gap-2"
            >
              {isReevaluating ? "Traitement..." : "✨ Réévaluer"}
            </button>
          </div>
        </div>

        {chargement ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-12 w-12 border-b-2 border-emerald-500 rounded-full"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cartesAffichees.map((carte) => (
              <div
                key={carte.id}
                className={`bg-slate-900 border rounded-xl p-5 transition-all ${selection.includes(carte.id) ? "border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]" : "border-slate-800"}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3 items-start">
                    <input
                      type="checkbox"
                      checked={selection.includes(carte.id)}
                      onChange={() => toggleSelection(carte.id)}
                      className="mt-1 w-4 h-4 accent-purple-500 cursor-pointer"
                    />
                    <div>
                      <h3 className="font-bold text-slate-100">{carte.nom}</h3>
                      <p className="text-sm text-slate-400">
                        {carte.extension} • N° {carte.numero}{" "}
                        <span className="text-slate-500 font-medium ml-1 px-1.5 py-0.5 bg-slate-800 rounded uppercase text-xs">
                          {carte.langue}
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => supprimerCarte(carte.id)}
                    className="text-slate-600 hover:text-red-500 transition-colors text-lg"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
                <div className="pt-4 border-t border-slate-800 flex justify-between items-center mt-auto">
                  <span className="text-sm text-slate-500 font-medium">
                    Valeur estimée
                  </span>
                  {carteEnEdition === carte.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={nouveauPrixManuel}
                        onChange={(e) => setNouveauPrixManuel(e.target.value)}
                        className="w-20 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-emerald-400 font-bold text-right"
                        autoFocus
                      />
                      <button
                        onClick={() => sauvegarderPrixManuel(carte.id)}
                        className="text-green-500"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setCarteEnEdition(null)}
                        className="text-red-500"
                      >
                        ✗
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <button
                        onClick={() => activerEdition(carte)}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-blue-400 transition-all text-xs"
                      >
                        ✏️ Éditer
                      </button>
                      <span className="text-lg font-bold text-emerald-400">
                        {carte.prix_estime
                          ? `${carte.prix_estime.toFixed(2)} €`
                          : "-- €"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {cartesAffichees.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500">
                Aucune carte dans le dossier {dossierActif}.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
