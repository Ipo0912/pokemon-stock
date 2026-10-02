import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Aucune image reçue" },
        { status: 400 },
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Tu es un expert en cartes Pokémon. Analyse cette image.
      Si c'est une carte Pokémon, renvoie-moi UNIQUEMENT un objet JSON avec ces 3 propriétés exactes (sans aucun texte autour) :
      - "nom" : le nom du Pokémon, qui ce trouve en haut à gauche de la carte.
      - "extension" : le nom de l'extension de la carte (en bas à gauche de la carte ou en bas à droite de la carte, selon le type de carte).
      - "numero" : le numéro de la carte (ex: 045/165) (en bas à gauche de la carte ou en bas à droite de la carte, selon le type de carte).
      Si ce n'est pas une carte Pokémon, renvoie {"erreur": "Carte non reconnue ou invalide"}.
    `;

    const base64Data = imageBase64.split(",")[1];
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg",
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ success: true, data: text });
  } catch (error) {
    console.error("Erreur lors de l'analyse IA:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 },
    );
  }
}
