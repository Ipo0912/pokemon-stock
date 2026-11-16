"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { supabase } from "../../lib/supabase";

const CarteInteractive = dynamic(
  () => import("../../components/CarteInteractive"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-400">
        Chargement de la carte...
      </div>
    ),
  },
);

export default function CartePage() {
  const [magasins, setMagasins] = useState<any[]>([]);
  const [pendingLocation, setPendingLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [nomMagasin, setNomMagasin] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [recherche, setRecherche] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [resultatsRecherche, setResultatsRecherche] = useState<any[]>([]); // Pour stocker les résultats trouvés

  const [centreCarte, setCentreCarte] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [positionUtilisateur, setPositionUtilisateur] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    chargerMagasins();
  }, []);

  const chargerMagasins = async () => {
    const { data, error } = await supabase.from("magasins").select("*");
    if (!error && data) setMagasins(data);
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setPendingLocation({ lat, lng });
    setResultatsRecherche([]); // On cache les résultats si on clique sur la carte manuellement
  };

  const sauvegarderMagasin = async (nom: string, lat: number, lng: number) => {
    if (!nom.trim()) return;
    setIsSaving(true);

    const { error } = await supabase
      .from("magasins")
      .insert([{ nom, lat, lng }]);

    if (!error) {
      setNomMagasin("");
      setPendingLocation(null);
      setResultatsRecherche([]); // On vide la recherche après l'ajout
      setRecherche("");
      chargerMagasins();
    } else {
      alert("Erreur lors de la sauvegarde.");
    }
    setIsSaving(false);
  };

  const lancerRecherche = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!recherche.trim()) return;

    setIsSearching(true);
    setPendingLocation(null);

    try {
      let requete = recherche;

      // Si l'utilisateur a cliqué sur "Moi" ou s'est déjà déplacé,
      // on peut ajouter subtilement le pays ou s'appuyer sur la vue de la carte sans bloquer.
      // Mais le plus simple et robuste avec Nominatim est d'utiliser la zone visible (viewbox) de la carte actuelle :
      const zoneDeRecherche = centreCarte || positionUtilisateur;

      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(requete)}&limit=10&addressdetails=1`;

      if (zoneDeRecherche) {
        const { lat, lng } = zoneDeRecherche;
        // Une zone large autour du centre actuel de votre carte (environ 50-60km)
        const viewbox = `${lng - 0.5},${lat + 0.5},${lng + 0.5},${lat - 0.5}`;
        url += `&viewbox=${viewbox}&bounded=0`;
      }

      const reponse = await fetch(url);
      const donnees = await reponse.json();

      setResultatsRecherche(donnees);

      if (donnees && donnees.length > 0) {
        setCentreCarte({
          lat: parseFloat(donnees[0].lat),
          lng: parseFloat(donnees[0].lon),
        });
      } else {
        alert("Aucun lieu trouvé dans cette zone.");
      }
    } catch (erreur) {
      console.error(erreur);
    } finally {
      setIsSearching(false);
    }
  };

  const geolocaliser = () => {
    if (!navigator.geolocation) {
      alert("Votre navigateur ne supporte pas la géolocalisation.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setPositionUtilisateur(coords);
        setCentreCarte(coords);
      },
      (erreur) => {
        alert("Impossible de récupérer votre position.");
      },
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white flex flex-col items-center">
      <div className="w-full max-w-6xl">
        <div className="mb-6 flex flex-wrap gap-4 justify-between items-center">
          <h1 className="text-3xl font-black text-blue-400">
            Poke<span className="text-white">Map</span>
          </h1>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={geolocaliser}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 font-bold rounded-lg transition-all"
              title="Me localiser"
            >
              📍 Moi
            </button>
            <form
              onSubmit={lancerRecherche}
              className="flex gap-2 flex-1 sm:flex-initial"
            >
              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Ex: Micromania Paris..."
                className="w-full sm:w-64 bg-slate-900 border border-slate-700 p-2 rounded-lg outline-none focus:border-blue-500 text-sm"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-lg transition-all text-sm"
              >
                {isSearching ? "..." : "Chercher"}
              </button>
            </form>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 h-[75vh]">
          {/* ZONE CARTE */}
          <div className="flex-1 bg-slate-900 rounded-xl border border-slate-700 shadow-xl overflow-hidden relative z-0">
            <CarteInteractive
              magasins={magasins}
              onLocationSelect={handleLocationSelect}
              pendingLocation={pendingLocation}
              centreCarte={centreCarte}
              positionUtilisateur={positionUtilisateur}
              resultatsRecherche={resultatsRecherche}
            />
          </div>

          {/* ZONE MENU DROITE */}
          <div className="w-full lg:w-80 bg-slate-900 p-6 rounded-xl border border-slate-700 flex flex-col">
            {/* AFFICHAGE DES RÉSULTATS DE RECHERCHE */}
            {resultatsRecherche.length > 0 ? (
              <div className="mb-6">
                <h2 className="text-lg font-bold text-blue-400 mb-4 flex justify-between items-center">
                  Résultats
                  <button
                    onClick={() => setResultatsRecherche([])}
                    className="text-xs text-slate-500 hover:text-white"
                  >
                    Fermer
                  </button>
                </h2>
                <div className="space-y-3 overflow-y-auto max-h-64 scrollbar-hide">
                  {resultatsRecherche.map((lieu, index) => {
                    // On essaie de récupérer le nom court, sinon on coupe l'adresse complète
                    const nomExtrait =
                      lieu.name || lieu.display_name.split(",")[0];
                    return (
                      <div
                        key={index}
                        className="bg-slate-950 p-3 rounded-lg border border-slate-700"
                      >
                        <p
                          className="font-bold text-sm text-slate-200 truncate"
                          title={nomExtrait}
                        >
                          {nomExtrait}
                        </p>
                        <p className="text-xs text-slate-500 truncate mb-3">
                          {lieu.display_name}
                        </p>
                        <button
                          onClick={() =>
                            sauvegarderMagasin(
                              nomExtrait,
                              parseFloat(lieu.lat),
                              parseFloat(lieu.lon),
                            )
                          }
                          disabled={isSaving}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded transition-all"
                        >
                          + Enregistrer ce lieu
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-slate-100 mb-6">
                  Ajout manuel
                </h2>
                {pendingLocation ? (
                  <div className="space-y-4 bg-slate-950 p-4 rounded-xl border border-blue-500/30 mb-6">
                    <p className="text-sm text-emerald-400 font-medium">
                      📍 Marqueur vert placé !
                    </p>
                    <div>
                      <input
                        type="text"
                        value={nomMagasin}
                        onChange={(e) => setNomMagasin(e.target.value)}
                        placeholder="Nom de la boutique"
                        className="w-full bg-slate-800 text-white p-2 rounded-lg outline-none border border-slate-700 focus:border-blue-500 transition-all font-medium text-sm"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          sauvegarderMagasin(
                            nomMagasin,
                            pendingLocation.lat,
                            pendingLocation.lng,
                          )
                        }
                        disabled={isSaving || !nomMagasin.trim()}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-lg transition-all text-sm"
                      >
                        Valider
                      </button>
                      <button
                        onClick={() => {
                          setPendingLocation(null);
                          setNomMagasin("");
                        }}
                        className="py-2 px-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all"
                      >
                        ✗
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs text-center flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-700 rounded-xl bg-slate-950/50 mb-6">
                    Cherchez un lieu en haut, <br />
                    ou cliquez sur la carte.
                  </div>
                )}
              </>
            )}

            {/* LISTE DES BOUTIQUES ENREGISTRÉES */}
            <div className="border-t border-slate-800 pt-6 flex-1 overflow-hidden flex flex-col">
              <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">
                Mes Boutiques ({magasins.length})
              </h3>
              <div className="space-y-2 overflow-y-auto scrollbar-hide pb-4">
                {magasins.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 bg-slate-800 rounded-lg text-sm text-slate-200 border border-slate-700 flex justify-between items-center hover:border-slate-500 transition-all cursor-pointer"
                    onClick={() => setCentreCarte({ lat: m.lat, lng: m.lng })}
                  >
                    <span className="font-medium truncate pr-2">{m.nom}</span>
                    <span className="text-xs text-blue-400">📍</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
