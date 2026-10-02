"use client";

import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";

export default function Camera() {
  const webcamRef = useRef<Webcam>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [pokemonData, setPokemonData] = useState<{
    nom?: string;
    extension?: string;
    numero?: string;
    erreur?: string;
  } | null>(null);

  const capture = useCallback(() => {
    const imageBase64 = webcamRef.current?.getScreenshot();
    if (imageBase64) {
      setImageSrc(imageBase64);
      analyserImage(imageBase64);
    }
  }, [webcamRef]);

  const analyserImage = async (imageBase64: string) => {
    setIsScanning(true);
    setPokemonData(null);

    try {
      const reponse = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      const resultat = await reponse.json();

      if (resultat.success) {
        const donneesPropres = JSON.parse(
          resultat.data.replace(/```json/g, "").replace(/```/g, ""),
        );
        setPokemonData(donneesPropres);
        console.log("Carte identifiée :", donneesPropres);
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

  const resetCamera = () => {
    setImageSrc(null);
    setPokemonData(null);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      {}
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

      {}
      <div className="mt-8 flex gap-4">
        {!imageSrc ? (
          <button
            onClick={capture}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full transition-all shadow-blue-500/30 shadow-lg"
          >
            Scanner la carte
          </button>
        ) : (
          <button
            onClick={resetCamera}
            disabled={isScanning}
            className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-full transition-all disabled:opacity-50"
          >
            Reprendre une photo
          </button>
        )}
      </div>

      {}
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

      {}
      {pokemonData && !pokemonData.erreur && (
        <div className="mt-8 w-full p-6 bg-slate-800 rounded-xl text-white shadow-xl border border-blue-500/30">
          <h3 className="text-xl font-black text-blue-400 mb-4 uppercase tracking-wider text-center">
            Carte identifiée
          </h3>
          <div className="space-y-2 text-sm sm:text-base">
            <p className="flex justify-between border-b border-slate-700 pb-2">
              <span className="text-slate-400">Pokémon</span>
              <span className="font-bold">{pokemonData.nom}</span>
            </p>
            <p className="flex justify-between border-b border-slate-700 pb-2">
              <span className="text-slate-400">Extension</span>
              <span className="font-bold">{pokemonData.extension}</span>
            </p>
            <p className="flex justify-between pb-1">
              <span className="text-slate-400">Numéro</span>
              <span className="font-bold text-blue-300">
                {pokemonData.numero}
              </span>
            </p>
          </div>
        </div>
      )}

      {}
      {pokemonData?.erreur && (
        <div className="mt-6 w-full p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-400 text-center font-medium">
          {pokemonData.erreur}
        </div>
      )}
    </div>
  );
}
