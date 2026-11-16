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
  prix_achat?: number;
  categorie: string;
  provenance?: string;
  created_at?: string;
};

const btnPrimaire =
  "px-3 py-1.5 bg-accent text-white text-sm rounded-md hover:bg-accent-fonce disabled:opacity-40";
const btnSecondaire =
  "px-3 py-1.5 bg-white text-encre text-sm border border-bordure rounded-md hover:bg-fond disabled:opacity-40";
const selectStyle =
  "border border-bordure rounded-md px-2 py-1.5 text-sm bg-fond-doux focus:bg-white text-encre focus:outline-none focus:border-bleu focus:ring-2 focus:ring-bleu/20 disabled:opacity-40";

function Stat({
  label,
  valeur,
  couleur = "text-encre",
}: {
  label: string;
  valeur: string;
  couleur?: string;
}) {
  return (
    <div className="bg-white border border-bordure rounded-md p-4 shadow-sm">
      <p className="text-sm text-doux">{label}</p>
      <p className={`text-xl font-semibold mt-1 ${couleur}`}>{valeur}</p>
    </div>
  );
}

export default function Portfolio() {
  const [cartes, setCartes] = useState<Carte[]>([]);
  const [chargement, setChargement] = useState(true);

  const [selection, setSelection] = useState<number[]>([]);
  const [isReevaluating, setIsReevaluating] = useState(false);

  const [carteEnEditionPrix, setCarteEnEditionPrix] = useState<number | null>(
    null,
  );
  const [nouveauPrixManuel, setNouveauPrixManuel] = useState<string>("");

  const [carteEnEditionAchat, setCarteEnEditionAchat] = useState<number | null>(
    null,
  );
  const [nouveauAchatManuel, setNouveauAchatManuel] = useState<string>("");

  const [dossierActif, setDossierActif] = useState<string>("Toutes");
  const [langueActive, setLangueActive] = useState<string>("Toutes");
  const [tri, setTri] = useState<string>("recent");

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

  // 1. Filtrage par dossier ET par langue
  const cartesFiltrees = cartes.filter((c) => {
    const matchDossier =
      dossierActif === "Toutes" ||
      c.categorie === dossierActif ||
      (!c.categorie && dossierActif === "Autre");

    const matchLangue =
      langueActive === "Toutes" ||
      (c.langue || "FR").toUpperCase() === langueActive.toUpperCase();

    return matchDossier && matchLangue;
  });

  // 2. Tri des cartes filtrées
  const cartesAffichees = [...cartesFiltrees].sort((a, b) => {
    const prixA = a.prix_estime || 0;
    const prixB = b.prix_estime || 0;

    if (tri === "prix-croissant") return prixA - prixB;
    if (tri === "prix-decroissant") return prixB - prixA;

    return (
      new Date(b.created_at || 0).getTime() -
      new Date(a.created_at || 0).getTime()
    );
  });

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

  const changerProvenance = async (id: number, nouvelleProvenance: string) => {
    const { error } = await supabase
      .from("cartes")
      .update({ provenance: nouvelleProvenance })
      .eq("id", id);

    if (!error) {
      setCartes(
        cartes.map((c) =>
          c.id === id ? { ...c, provenance: nouvelleProvenance } : c,
        ),
      );
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

  const sauvegarderPrixEstimatif = async (id: number) => {
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
      setCarteEnEditionPrix(null);
    }
  };

  const sauvegarderPrixAchat = async (id: number) => {
    const prixNum = parseFloat(nouveauAchatManuel.replace(",", "."));
    if (isNaN(prixNum)) return;
    const { error } = await supabase
      .from("cartes")
      .update({ prix_achat: prixNum })
      .eq("id", id);
    if (!error) {
      setCartes(
        cartes.map((c) => (c.id === id ? { ...c, prix_achat: prixNum } : c)),
      );
      setCarteEnEditionAchat(null);
    }
  };

  const valeurTotale = cartesAffichees.reduce(
    (total, carte) => total + (carte.prix_estime || 0),
    0,
  );

  const achatTotal = cartesAffichees.reduce(
    (total, carte) => total + (carte.prix_achat || 0),
    0,
  );

  const plusMoinsValue = valeurTotale - achatTotal;
  const prixMoyen =
    cartesAffichees.length > 0 ? valeurTotale / cartesAffichees.length : 0;

  // --- Statistiques ---
  const top3Cartes = [...cartes]
    .sort((a, b) => (b.prix_estime || 0) - (a.prix_estime || 0))
    .slice(0, 3);

  const statsLangues = cartes.reduce((acc: Record<string, number>, carte) => {
    const lang = (carte.langue || "FR").toUpperCase();
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {});

  const valeurGlobaleTotale = cartes.reduce(
    (sum, c) => sum + (c.prix_estime || 0),
    1,
  );
  const statsCategories = CATEGORIES.map((cat) => {
    const cartesCat = cartes.filter(
      (c) => c.categorie === cat || (!c.categorie && cat === "Autre"),
    );
    const valCat = cartesCat.reduce((sum, c) => sum + (c.prix_estime || 0), 0);
    const pourcentage = Math.round((valCat / valeurGlobaleTotale) * 100);
    return { cat, valCat, pourcentage, count: cartesCat.length };
  });

  // Langues présentes dans la collection
  const languesDisponibles = Array.from(
    new Set(cartes.map((c) => (c.langue || "FR").toUpperCase())),
  );

  const classeOnglet = (actif: boolean) =>
    `px-3 py-1.5 text-sm rounded-md border whitespace-nowrap ${
      actif
        ? "bg-bleu text-white border-bleu"
        : "bg-white text-encre border-bordure hover:bg-fond"
    }`;

  const classeFiltreLangue = (actif: boolean) =>
    `px-2.5 py-1 text-xs rounded-md border ${
      actif
        ? "bg-bleu text-white border-bleu"
        : "bg-white text-encre border-bordure hover:bg-fond"
    }`;

  return (
    <div className="min-h-screen bg-fond text-encre px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-xl font-semibold mb-4">Ma collection</h1>

        {/* Chiffres principaux */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Stat
            label="Valeur affichée"
            valeur={`${valeurTotale.toFixed(2)} €`}
          />
          <Stat
            label="Plus-value affichée"
            valeur={`${plusMoinsValue >= 0 ? "+" : ""}${plusMoinsValue.toFixed(2)} €`}
            couleur={
              plusMoinsValue >= 0 ? "text-green-700" : "text-accent-fonce"
            }
          />
          <Stat
            label="Cartes affichées"
            valeur={`${cartesAffichees.length} / ${cartes.length}`}
          />
          <Stat label="Prix moyen" valeur={`${prixMoyen.toFixed(2)} €`} />
        </div>

        {/* Statistiques secondaires */}
        {cartes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-bordure rounded-md overflow-hidden shadow-sm">
              <h2 className="bg-entete text-white text-sm font-medium px-4 py-2">
                Les 3 cartes les plus chères
              </h2>
              <ol className="p-4 space-y-1 text-sm">
                {top3Cartes.map((c) => (
                  <li key={c.id} className="flex justify-between gap-2">
                    <span className="truncate">{c.nom}</span>
                    <span className="shrink-0 text-doux">
                      {c.prix_estime ? `${c.prix_estime.toFixed(2)} €` : "0 €"}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-white border border-bordure rounded-md overflow-hidden shadow-sm">
              <h2 className="bg-entete text-white text-sm font-medium px-4 py-2">
                Langues
              </h2>
              <ul className="p-4 space-y-1 text-sm">
                {Object.entries(statsLangues).map(([lang, count]) => {
                  const pourcentage = Math.round((count / cartes.length) * 100);
                  return (
                    <li key={lang} className="flex justify-between">
                      <span className="uppercase">{lang}</span>
                      <span className="text-doux">
                        {count} ({pourcentage}%)
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="bg-white border border-bordure rounded-md overflow-hidden shadow-sm">
              <h2 className="bg-entete text-white text-sm font-medium px-4 py-2">
                Valeur par dossier
              </h2>
              <div className="p-4 space-y-2">
                {statsCategories.map((item) => (
                  <div key={item.cat} className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span>
                        {item.cat} ({item.count})
                      </span>
                      <span className="text-doux">{item.pourcentage}%</span>
                    </div>
                    <div className="w-full bg-bordure h-1">
                      <div
                        className="bg-bleu h-full"
                        style={{ width: `${item.pourcentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Dossiers */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
          <button
            onClick={() => setDossierActif("Toutes")}
            className={classeOnglet(dossierActif === "Toutes")}
          >
            Toutes ({cartes.length})
          </button>
          {CATEGORIES.map((cat) => {
            const countCat = cartes.filter(
              (c) => c.categorie === cat || (!c.categorie && cat === "Autre"),
            ).length;
            return (
              <button
                key={cat}
                onClick={() => setDossierActif(cat)}
                className={classeOnglet(dossierActif === cat)}
              >
                {cat} ({countCat})
              </button>
            );
          })}
        </div>

        {/* Filtre de langue et tri */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm text-doux">Langue</span>
          <button
            onClick={() => setLangueActive("Toutes")}
            className={classeFiltreLangue(langueActive === "Toutes")}
          >
            Toutes
          </button>
          {languesDisponibles.map((lang) => (
            <button
              key={lang}
              onClick={() => setLangueActive(lang)}
              className={`uppercase ${classeFiltreLangue(langueActive === lang)}`}
            >
              {lang}
            </button>
          ))}

          <select
            value={tri}
            onChange={(e) => setTri(e.target.value)}
            className={`ml-auto ${selectStyle}`}
            aria-label="Trier les cartes"
          >
            <option value="recent">Plus récentes</option>
            <option value="prix-decroissant">Prix décroissant</option>
            <option value="prix-croissant">Prix croissant</option>
          </select>
        </div>

        {/* Barre d'actions sur la sélection */}
        <div className="mb-6 flex flex-wrap items-center gap-2 border border-bordure bg-white rounded-md p-3 shadow-sm">
          <button onClick={toutSelectionner} className={btnSecondaire}>
            {selection.length > 0 ? "Tout désélectionner" : "Sélection rapide"}
          </button>
          <span className="text-sm text-doux mr-2">
            {selection.length} sélectionnée(s)
          </span>

          <button
            onClick={() => rechercherSurMarche("cardmarket")}
            disabled={selection.length === 0}
            className={btnSecondaire}
          >
            Cardmarket
          </button>
          <button
            onClick={() => rechercherSurMarche("ebay")}
            disabled={selection.length === 0}
            className={btnSecondaire}
          >
            eBay
          </button>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <select
              onChange={(e) => {
                if (e.target.value) deplacerSelection(e.target.value);
                e.target.value = "";
              }}
              disabled={selection.length === 0 || isReevaluating}
              className={selectStyle}
              aria-label="Déplacer la sélection dans un dossier"
            >
              <option value="">Déplacer vers...</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <button
              onClick={lancerReevaluation}
              disabled={selection.length === 0 || isReevaluating}
              className={btnPrimaire}
            >
              {isReevaluating ? "Traitement..." : "Réévaluer les prix"}
            </button>
          </div>
        </div>

        {chargement ? (
          <p className="py-16 text-center text-sm text-doux">
            Chargement de la collection...
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cartesAffichees.map((carte) => (
              <div
                key={carte.id}
                className={`bg-white border rounded-md overflow-hidden shadow-sm flex flex-col justify-between ${selection.includes(carte.id) ? "border-bleu" : "border-bordure"}`}
              >
                <div className="p-4 bg-fond-doux">
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div className="flex gap-3 items-start">
                      <input
                        type="checkbox"
                        checked={selection.includes(carte.id)}
                        onChange={() => toggleSelection(carte.id)}
                        aria-label={`Sélectionner ${carte.nom}`}
                        className="mt-1 w-4 h-4 accent-bleu cursor-pointer"
                      />
                      <div>
                        <h3 className="font-medium">{carte.nom}</h3>
                        <p className="text-sm text-doux mt-0.5">
                          {carte.extension} · n° {carte.numero} ·{" "}
                          <span className="uppercase">{carte.langue}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => supprimerCarte(carte.id)}
                      className="text-xs text-doux hover:text-accent-fonce underline shrink-0"
                    >
                      Supprimer
                    </button>
                  </div>

                  <select
                    value={carte.provenance || "booster"}
                    onChange={(e) =>
                      changerProvenance(carte.id, e.target.value)
                    }
                    className={`${selectStyle} text-xs mb-3`}
                    aria-label="Provenance de la carte"
                  >
                    <option value="booster">Tirée d'un booster</option>
                    <option value="achat">Achat à l'unité</option>
                  </select>
                </div>

                {/* Prix d'achat et valeur estimée */}
                <div className="p-4 border-t border-bordure/60 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-doux">Prix d'achat</span>
                    {carteEnEditionAchat === carte.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={nouveauAchatManuel}
                          onChange={(e) =>
                            setNouveauAchatManuel(e.target.value)
                          }
                          className="w-20 border border-bordure rounded-md px-2 py-0.5 text-right text-sm focus:outline-none focus:border-bleu focus:ring-2 focus:ring-bleu/20"
                          autoFocus
                        />
                        <button
                          onClick={() => sauvegarderPrixAchat(carte.id)}
                          className="text-xs underline"
                        >
                          OK
                        </button>
                        <button
                          onClick={() => setCarteEnEditionAchat(null)}
                          className="text-xs text-doux underline"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>
                          {carte.prix_achat
                            ? `${carte.prix_achat.toFixed(2)} €`
                            : "0.00 €"}
                        </span>
                        <button
                          onClick={() => {
                            setCarteEnEditionAchat(carte.id);
                            setNouveauAchatManuel(
                              carte.prix_achat?.toString() || "0",
                            );
                          }}
                          className="text-xs text-doux hover:text-encre underline"
                        >
                          Modifier
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-doux">Valeur estimée</span>
                    {carteEnEditionPrix === carte.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={nouveauPrixManuel}
                          onChange={(e) => setNouveauPrixManuel(e.target.value)}
                          className="w-20 border border-bordure rounded-md px-2 py-0.5 text-right text-sm focus:outline-none focus:border-bleu focus:ring-2 focus:ring-bleu/20"
                          autoFocus
                        />
                        <button
                          onClick={() => sauvegarderPrixEstimatif(carte.id)}
                          className="text-xs underline"
                        >
                          OK
                        </button>
                        <button
                          onClick={() => setCarteEnEditionPrix(null)}
                          className="text-xs text-doux underline"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {carte.prix_estime
                            ? `${carte.prix_estime.toFixed(2)} €`
                            : "-- €"}
                        </span>
                        <button
                          onClick={() => {
                            setCarteEnEditionPrix(carte.id);
                            setNouveauPrixManuel(
                              carte.prix_estime?.toString() || "0",
                            );
                          }}
                          className="text-xs text-doux hover:text-encre underline"
                        >
                          Modifier
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {cartesAffichees.length === 0 && (
              <p className="col-span-full py-12 text-center text-sm text-doux">
                Aucune carte avec ces filtres.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
