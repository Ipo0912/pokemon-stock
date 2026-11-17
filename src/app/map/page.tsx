"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { supabase } from "../../lib/supabase";

const CarteInteractive = dynamic(
  () => import("../../components/CarteInteractive"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-fond text-sm text-doux">
        Chargement de la carte...
      </div>
    ),
  },
);

const btnPrimaire =
  "px-3 py-2 bg-accent text-white text-sm rounded-md hover:bg-accent-fonce disabled:opacity-40";
const btnSecondaire =
  "px-3 py-2 bg-white text-encre text-sm border border-bordure rounded-md hover:bg-fond disabled:opacity-40";
const champ =
  "w-full border border-bordure rounded-md px-3 py-2 text-sm bg-fond-doux focus:bg-white text-encre focus:outline-none focus:border-bleu focus:ring-2 focus:ring-bleu/20";

export default function CartePage() {
  const [magasins, setMagasins] = useState<any[]>([]);
  const [pendingLocation, setPendingLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [nomMagasin, setNomMagasin] = useState("");
  const [adresseMagasin, setAdresseMagasin] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [recherche, setRecherche] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [resultatsRecherche, setResultatsRecherche] = useState<any[]>([]);

  const [centreCarte, setCentreCarte] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [positionUtilisateur, setPositionUtilisateur] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Résultat sélectionné dans la liste
  const [selectedResultIndex, setSelectedResultIndex] = useState<number | null>(
    null,
  );

  useEffect(() => {
    chargerMagasins();
  }, []);

  // Fait défiler la liste jusqu'à l'élément sélectionné
  useEffect(() => {
    if (selectedResultIndex !== null) {
      const element = document.getElementById(
        `resultat-${selectedResultIndex}`,
      );
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [selectedResultIndex]);

  const chargerMagasins = async () => {
    const { data, error } = await supabase.from("magasins").select("*");
    if (!error && data) setMagasins(data);
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setPendingLocation({ lat, lng });
    setResultatsRecherche([]);
    setSelectedResultIndex(null);
  };

  const sauvegarderMagasin = async (
    nom: string,
    adresse: string,
    lat: number,
    lng: number,
  ) => {
    if (!nom.trim()) return;
    setIsSaving(true);

    const { error } = await supabase
      .from("magasins")
      .insert([{ nom, adresse, lat, lng }]);

    if (!error) {
      setNomMagasin("");
      setAdresseMagasin("");
      setPendingLocation(null);
      setResultatsRecherche([]);
      setSelectedResultIndex(null);
      setRecherche("");
      chargerMagasins();
    } else {
      alert("Erreur lors de la sauvegarde.");
    }
    setIsSaving(false);
  };

  const supprimerMagasin = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!window.confirm("Voulez-vous vraiment supprimer cette boutique ?"))
      return;

    const { error } = await supabase.from("magasins").delete().eq("id", id);

    if (!error) {
      chargerMagasins();
    } else {
      alert("Erreur lors de la suppression.");
    }
  };

  const lancerRecherche = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!recherche.trim()) return;

    setIsSearching(true);
    setPendingLocation(null);
    setSelectedResultIndex(null);

    try {
      const zoneDeRecherche = centreCarte || positionUtilisateur;
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        recherche,
      )}&countrycodes=fr&limit=10&addressdetails=1`;

      if (zoneDeRecherche) {
        const { lat, lng } = zoneDeRecherche;
        const viewbox = `${lng - 0.8},${lat + 0.8},${lng + 0.8},${lat - 0.8}`;
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
        alert(
          "Aucun magasin trouvé à proximité. Essayez d'élargir le nom (ex: 'Smyths' au lieu de 'Smyth Toy').",
        );
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
      () => {
        alert("Impossible de récupérer votre position.");
      },
    );
  };

  return (
    <div className="min-h-screen bg-fond text-encre px-4 py-8">
      <div className="w-full max-w-6xl mx-auto">
        <div className="mb-4 flex flex-wrap gap-3 justify-between items-center">
          <h1 className="text-xl font-semibold">Boutiques</h1>

          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={geolocaliser} className={btnSecondaire}>
              Me localiser
            </button>
            <form
              onSubmit={lancerRecherche}
              className="flex gap-2 flex-1 sm:flex-initial"
            >
              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Ex : Micromania Paris"
                className={`sm:w-64 ${champ}`}
              />
              <button
                type="submit"
                disabled={isSearching}
                className={btnPrimaire}
              >
                {isSearching ? "..." : "Chercher"}
              </button>
            </form>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:h-[75vh]">
          <div className="h-80 lg:h-auto lg:flex-1 bg-white border border-bordure rounded-md overflow-hidden shadow-sm relative z-0">
            <CarteInteractive
              magasins={magasins}
              onLocationSelect={handleLocationSelect}
              pendingLocation={pendingLocation}
              centreCarte={centreCarte}
              positionUtilisateur={positionUtilisateur}
              resultatsRecherche={resultatsRecherche}
              onSearchResultClick={(index: number) =>
                setSelectedResultIndex(index)
              }
            />
          </div>

          <div className="w-full lg:w-80 bg-white border border-bordure rounded-md p-4 shadow-sm flex flex-col lg:overflow-hidden">
            {resultatsRecherche.length > 0 ? (
              <div className="mb-4 flex-1 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-3 shrink-0">
                  <h2 className="font-semibold">Résultats</h2>
                  <button
                    onClick={() => {
                      setResultatsRecherche([]);
                      setSelectedResultIndex(null);
                    }}
                    className="text-sm text-doux hover:text-encre underline"
                  >
                    Fermer
                  </button>
                </div>
                <div className="space-y-2 overflow-y-auto flex-1 max-h-72 lg:max-h-none pb-2">
                  {resultatsRecherche.map((lieu, index) => {
                    const nomDeBase =
                      lieu.name || lieu.display_name.split(",")[0];

                    const ville =
                      lieu.address?.city ||
                      lieu.address?.town ||
                      lieu.address?.village ||
                      lieu.address?.municipality ||
                      "";

                    const nomExtrait = ville
                      ? `${nomDeBase} - ${ville}`
                      : nomDeBase;

                    const isSelected = selectedResultIndex === index;

                    return (
                      <div
                        key={index}
                        id={`resultat-${index}`}
                        className={`p-3 rounded-md border ${
                          isSelected
                            ? "border-bleu bg-bleu/10"
                            : "border-bordure bg-fond-doux"
                        }`}
                      >
                        <p
                          className="font-medium text-sm truncate"
                          title={nomExtrait}
                        >
                          {nomExtrait}
                        </p>
                        <p className="text-xs text-doux truncate mb-2">
                          {lieu.display_name}
                        </p>
                        <button
                          onClick={() =>
                            sauvegarderMagasin(
                              nomExtrait,
                              lieu.display_name,
                              parseFloat(lieu.lat),
                              parseFloat(lieu.lon),
                            )
                          }
                          disabled={isSaving}
                          className="w-full py-1.5 border border-bordure rounded-md text-xs hover:bg-fond disabled:opacity-40"
                        >
                          Enregistrer ce lieu
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                <h2 className="font-semibold mb-3 shrink-0">Ajout manuel</h2>
                {pendingLocation ? (
                  <div className="space-y-2 mb-4 shrink-0">
                    <p className="text-sm text-doux">
                      Emplacement choisi (marqueur vert). Donnez-lui un nom.
                    </p>
                    <input
                      type="text"
                      value={nomMagasin}
                      onChange={(e) => setNomMagasin(e.target.value)}
                      placeholder="Nom de la boutique"
                      className={champ}
                      autoFocus
                    />
                    <input
                      type="text"
                      value={adresseMagasin}
                      onChange={(e) => setAdresseMagasin(e.target.value)}
                      placeholder="Adresse ou ville (facultatif)"
                      className={champ}
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          sauvegarderMagasin(
                            nomMagasin,
                            adresseMagasin,
                            pendingLocation.lat,
                            pendingLocation.lng,
                          )
                        }
                        disabled={isSaving || !nomMagasin.trim()}
                        className={`flex-1 ${btnPrimaire}`}
                      >
                        Enregistrer
                      </button>
                      <button
                        onClick={() => {
                          setPendingLocation(null);
                          setNomMagasin("");
                          setAdresseMagasin("");
                        }}
                        className={btnSecondaire}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-doux mb-4 shrink-0">
                    Cherchez un lieu avec la barre de recherche, ou cliquez sur
                    la carte pour placer un marqueur.
                  </p>
                )}
              </>
            )}

            {/* Boutiques enregistrées */}
            <div className="border-t border-bordure pt-4 flex-1 overflow-hidden flex flex-col">
              <h3 className="font-semibold mb-3 shrink-0">
                Mes boutiques ({magasins.length})
              </h3>
              {magasins.length === 0 && (
                <p className="text-sm text-doux">
                  Aucune boutique enregistrée.
                </p>
              )}
              <div className="space-y-2 overflow-y-auto max-h-72 lg:max-h-none pb-2">
                {magasins.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 border border-bordure rounded-md bg-fond-doux hover:bg-white cursor-pointer"
                    onClick={() => setCentreCarte({ lat: m.lat, lng: m.lng })}
                    title="Centrer la carte"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-medium text-sm">{m.nom}</span>
                      <button
                        onClick={(e) => supprimerMagasin(m.id, e)}
                        className="text-xs text-doux hover:text-accent-fonce underline shrink-0"
                      >
                        Supprimer
                      </button>
                    </div>
                    {m.adresse && (
                      <span className="text-xs text-doux line-clamp-2 mt-1 block">
                        {m.adresse}
                      </span>
                    )}
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
