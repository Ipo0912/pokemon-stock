"use client";

import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { supabase } from "../lib/supabase";

export default function Camera() {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [pokemonData, setPokemonData] = useState<{
    nom?: string;
    extension?: string;
    numero?: string;
    langue?: string;
    erreur?: string;
  } | null>(null);

  // 1. Fonction existante pour la webcam
  const capture = useCallback(() => {
    const imageBase64 = webcamRef.current?.getScreenshot();
    if (imageBase64) {
      setImageSrc(imageBase64);
      analyserImage(imageBase64);
    }
  }, [webcamRef]);

  // 2. NOUVELLE FONCTION : Gestion de l'upload de fichier
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

    try {
      const reponse = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      const resultat = await reponse.json();

      if (resultat.success) {
        setPokemonData(resultat.data);
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
      const { error } = await supabase.from("cartes").insert([
        {
          nom: pokemonData.nom,
          extension: pokemonData.extension,
          numero: pokemonData.numero,
          langue: pokemonData.langue,
        },
      ]);

      if (error) throw error;

      setSaveMessage("✅ Carte sauvegardée avec succès !");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde :", error);
      setSaveMessage("❌ Erreur lors de la sauvegarde.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetCamera = () => {
    setImageSrc(null);
    setPokemonData(null);
    setSaveMessage(null);
    // Réinitialise le champ file pour permettre de re-sélectionner la même image
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      <div className="w-full bg-black rounded-xl overflow-hidden border-2 border-slate-700 shadow-lg">
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

      <div className="mt-8 flex gap-3 flex-wrap justify-center w-full">
        {!imageSrc ? (
          <>
            <button
              onClick={capture}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-blue-500/30 shadow-lg"
            >
              Scanner
            </button>

            {/* Input fichier caché et son bouton déclencheur */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-purple-500/30 shadow-lg"
            >
              Importer
            </button>
          </>
        ) : (
          <button
            onClick={resetCamera}
            disabled={isScanning || isSaving}
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all disabled:opacity-50"
          >
            Reprendre une photo
          </button>
        )}
      </div>

      {isScanning && (
        <div className="mt-6 flex items-center gap-3 text-blue-400">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="font-medium animate-pulse">
            Analyse de l'image en cours...
          </span>
        </div>
      )}

      {pokemonData && !pokemonData.erreur && (
        <div className="mt-8 w-full p-6 bg-slate-800 rounded-xl text-white shadow-xl border border-blue-500/30">
          <h3 className="text-xl font-black text-blue-400 mb-4 uppercase tracking-wider text-center">
            Carte identifiée
          </h3>
          <div className="space-y-2 text-sm sm:text-base mb-6">
            <p className="flex justify-between border-b border-slate-700 pb-2">
              <span className="text-slate-400">Pokémon</span>
              <span className="font-bold">{pokemonData.nom}</span>
            </p>
            <p className="flex justify-between border-b border-slate-700 pb-2">
              <span className="text-slate-400">Extension</span>
              <span className="font-bold">{pokemonData.extension}</span>
            </p>
            <p className="flex justify-between border-b border-slate-700 pb-2">
              <span className="text-slate-400">Numéro</span>
              <span className="font-bold text-blue-300">
                {pokemonData.numero}
              </span>
            </p>
            <p className="flex justify-between pb-1">
              <span className="text-slate-400">Langue</span>
              <span className="font-bold uppercase">{pokemonData.langue}</span>
            </p>
          </div>

          {saveMessage ? (
            <div
              className={`p-3 text-center rounded-lg font-medium ${saveMessage.includes("✅") ? "bg-green-900/30 text-green-400 border border-green-500/30" : "bg-red-900/30 text-red-400 border border-red-500/30"}`}
            >
              {saveMessage}
            </div>
          ) : (
            <button
              onClick={sauvegarderCarte}
              disabled={isSaving}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? "Sauvegarde..." : "Ajouter à ma collection"}
            </button>
          )}
        </div>
      )}

      {pokemonData?.erreur && (
        <div className="mt-6 w-full p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-400 text-center font-medium">
          {pokemonData.erreur}
        </div>
      )}
    </div>
  );
}
