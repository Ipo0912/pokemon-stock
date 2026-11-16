"use client";

import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { supabase } from "../lib/supabase";

// Traducteur de langue pour eBay
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

const btnPrimaire =
  "py-2 px-4 bg-accent text-white text-sm rounded-md hover:bg-accent-fonce disabled:opacity-40";
const btnSecondaire =
  "py-2 px-4 bg-white text-encre text-sm border border-bordure rounded-md hover:bg-fond disabled:opacity-40";

export default function Camera() {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);

  // États pour les ajouts manuels
  const [prixManuel, setPrixManuel] = useState<string>("");
  const [categorieChoisie, setCategorieChoisie] = useState<string>("Autre");

  const [pokemonData, setPokemonData] = useState<{
    nom?: string;
    extension?: string;
    numero?: string;
    langue?: string;
    erreur?: string;
    prix_estime?: number;
  } | null>(null);

  const capture = useCallback(() => {
    const imageBase64 = webcamRef.current?.getScreenshot();
    if (imageBase64) {
      setImageSrc(imageBase64);
      analyserImage(imageBase64);
    }
  }, [webcamRef]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImageSrc(base64String);
        analyserImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyserImage = async (imageBase64: string) => {
    setIsScanning(true);
    setPokemonData(null);
    setSaveMessage(null);
    setPrixManuel("");
    setCategorieChoisie("Autre");

    try {
      const reponse = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      const resultat = await reponse.json();

      if (resultat.success) {
        setPokemonData(resultat.data);
        setPrixManuel(resultat.data.prix_estime?.toString() || "");
      } else {
        setPokemonData({
          erreur: resultat.error || "Erreur lors de l'analyse.",
        });
      }
    } catch (erreur) {
      console.error("Erreur de communication :", erreur);
      setPokemonData({ erreur: "Impossible de joindre le serveur d'analyse." });
    } finally {
      setIsScanning(false);
    }
  };

  const sauvegarderCarte = async () => {
    if (!pokemonData || pokemonData.erreur) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setSaveOk(false);
        setSaveMessage("Vous devez être connecté pour sauvegarder.");
        setIsSaving(false);
        return;
      }

      const userId = session.user.id;

      // Vérification des doublons
      const { data: cartesExistantes, error: erreurRecherche } = await supabase
        .from("cartes")
        .select("*")
        .eq("nom", pokemonData.nom)
        .eq("extension", pokemonData.extension)
        .eq("numero", pokemonData.numero)
        .eq("langue", pokemonData.langue)
        .eq("user_id", userId);

      if (erreurRecherche) throw erreurRecherche;

      if (cartesExistantes && cartesExistantes.length > 0) {
        setSaveOk(false);
        setSaveMessage("Cette carte est déjà dans votre collection.");
        setIsSaving(false);
        return;
      }

      const prixFinal = parseFloat(prixManuel.replace(",", ".")) || 0;

      // Sauvegarde finale avec le prix manuel et le dossier
      const { error } = await supabase.from("cartes").insert([
        {
          nom: pokemonData.nom,
          extension: pokemonData.extension,
          numero: pokemonData.numero,
          langue: pokemonData.langue,
          user_id: userId,
          prix_estime: prixFinal,
          categorie: categorieChoisie,
        },
      ]);

      if (error) throw error;

      setSaveOk(true);
      setSaveMessage("Carte ajoutée à votre collection.");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde :", error);
      setSaveOk(false);
      setSaveMessage("Erreur lors de la sauvegarde.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetCamera = () => {
    setImageSrc(null);
    setPokemonData(null);
    setSaveMessage(null);
    setPrixManuel("");
    setCategorieChoisie("Autre");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      <div className="w-full bg-bordure rounded-md overflow-hidden border border-bordure">
        {!imageSrc ? (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "environment" }}
            className="w-full h-auto object-cover aspect-[3/4]"
          />
        ) : (
          <img
            src={imageSrc}
            alt="Carte capturée"
            className="w-full h-auto object-cover aspect-[3/4]"
          />
        )}
      </div>

      <div className="mt-4 flex gap-2 w-full">
        {!imageSrc ? (
          <>
            <button onClick={capture} className={`flex-1 ${btnPrimaire}`}>
              Scanner
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 ${btnSecondaire}`}
            >
              Importer une image
            </button>
          </>
        ) : (
          <button
            onClick={resetCamera}
            disabled={isScanning || isSaving}
            className={`w-full ${btnSecondaire}`}
          >
            Reprendre une photo
          </button>
        )}
      </div>

      {isScanning && (
        <p className="mt-4 text-sm text-doux">Analyse de l'image en cours...</p>
      )}

      {pokemonData && !pokemonData.erreur && (
        <div className="mt-6 w-full border border-bordure rounded-md bg-white text-encre overflow-hidden shadow-sm">
          <h2 className="bg-entete text-white text-sm font-medium px-4 py-2">
            Carte identifiée
          </h2>
          <div className="p-4">
            <dl className="text-sm divide-y divide-bordure/60 mb-4">
              <div className="flex justify-between py-2">
                <dt className="text-doux">Pokémon</dt>
                <dd>{pokemonData.nom}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-doux">Extension</dt>
                <dd>{pokemonData.extension}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-doux">Numéro</dt>
                <dd>{pokemonData.numero}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-doux">Langue</dt>
                <dd className="uppercase">{pokemonData.langue}</dd>
              </div>
            </dl>

            <div className="flex gap-2 mb-4">
              <a
                href={`https://www.cardmarket.com/fr/Pokemon/Products/Search?searchString=${encodeURIComponent(`${pokemonData.nom || ""} ${pokemonData.numero ? pokemonData.numero.split("/")[0] : ""}`.trim())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-1.5 text-sm text-center border border-bordure rounded-md hover:bg-fond"
              >
                Voir sur Cardmarket
              </a>
              <a
                href={`https://www.ebay.fr/sch/i.html?_nkw=${encodeURIComponent(`${pokemonData.nom} ${pokemonData.numero} ${traduireLangue(pokemonData.langue)}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-1.5 text-sm text-center border border-bordure rounded-md hover:bg-fond"
              >
                Voir sur eBay
              </a>
            </div>

            <div className="mb-3">
              <label className="block text-sm text-encre mb-1">Dossier</label>
              <select
                value={categorieChoisie}
                onChange={(e) => setCategorieChoisie(e.target.value)}
                className="w-full border border-bordure rounded-md px-3 py-2 text-sm bg-fond-doux focus:bg-white focus:outline-none focus:border-bleu focus:ring-2 focus:ring-bleu/20"
              >
                <option value="Ultra rare">Ultra rare</option>
                <option value="Full art">Full art</option>
                <option value="Ar">Ar</option>
                <option value="Promo">Promo</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-encre mb-1">
                Valeur (€)
              </label>
              <input
                type="number"
                value={prixManuel}
                onChange={(e) => setPrixManuel(e.target.value)}
                placeholder="Ex : 15.50"
                className="w-full border border-bordure rounded-md px-3 py-2 text-sm bg-fond-doux focus:bg-white focus:outline-none focus:border-bleu focus:ring-2 focus:ring-bleu/20"
              />
            </div>

            {saveMessage ? (
              <p
                className={`p-3 text-sm rounded-md border ${saveOk ? "bg-green-50 text-green-800 border-green-300" : "bg-red-50 text-red-800 border-red-300"}`}
              >
                {saveMessage}
              </p>
            ) : (
              <button
                onClick={sauvegarderCarte}
                disabled={isSaving}
                className={`w-full ${btnPrimaire}`}
              >
                {isSaving ? "Ajout en cours..." : "Ajouter à ma collection"}
              </button>
            )}
          </div>
        </div>
      )}

      {pokemonData?.erreur && (
        <p className="mt-6 w-full p-3 text-sm border border-red-300 bg-red-50 text-red-800 rounded-md">
          {pokemonData.erreur}
        </p>
      )}
    </div>
  );
}
