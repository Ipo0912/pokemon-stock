import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const token = process.env.GEMINI_API_KEY;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Clé GEMINI_API_KEY manquante." },
        { status: 500 },
      );
    }

    const ai = new GoogleGenAI({ apiKey: token });
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: "Aucune image reçue." },
        { status: 400 },
      );
    }

    const base64Data = imageBase64.includes(",")
      ? imageBase64.split(",")[1]
      : imageBase64;

    const prompt = `
      Tu es un expert en cartes Pokémon. Analyse cette image.
      Si c'est une carte Pokémon, renvoie UNIQUEMENT un objet JSON avec ces 3 propriétés exactes (sans markdown, sans texte autour) :
      {"nom": "NomDuPokemon", "extension": "NomDeLextension", "numero": "XXX/YYY"}
      Si ce n'est pas une carte Pokémon, renvoie {"erreur": "Carte non reconnue"}.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: base64Data } },
          ],
        },
      ],
    });

    const content = response.text || "";
    return NextResponse.json({
      success: true,
      data: content.replace(/```json|```/g, "").trim(),
    });
  } catch (error: any) {
    console.error("Erreur Gemini :", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur" },
      { status: 500 },
    );
  }
}
