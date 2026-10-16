import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Clé API Gemini non configurée sur le serveur.",
        },
        { status: 500 },
      );
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: "Aucune image reçue" },
        { status: 400 },
      );
    }

    const modelName = "gemini-2.5-pro";

    const prompt = `
      Tu es un expert en cartes Pokémon. Analyse cette image.
      Si c'est une carte Pokémon, renvoie-moi UNIQUEMENT un objet JSON avec ces 3 propriétés exactes (sans aucun texte autour) :
      - "nom" : le nom du Pokémon, qui ce trouve en haut à gauche de la carte.
      - "extension" : le nom de l'extension de la carte (en bas à gauche de la carte ou en bas à droite de la carte, selon le type de carte).
      - "numero" : le numéro de la carte (ex: 045/165) (en bas à gauche de la carte ou en bas à droite de la carte, selon le type de carte).
      Si ce n'est pas une carte Pokémon, renvoie {"erreur": "Carte non reconnue ou invalide"}.
    `;

    const base64Data = imageBase64.includes(",")
      ? imageBase64.split(",")[1]
      : imageBase64;

    const response = await ai.models.generateContent ({
      model: modelName,
      contents: [
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg",
          }
        }
      ]
    }
    );


    return NextResponse.json({ success: true, data: response.text });
  } catch (error: any) {
    console.error("Erreur lors de l'analyse IA:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur" },
      { status: 500 },
    );
  }
}
