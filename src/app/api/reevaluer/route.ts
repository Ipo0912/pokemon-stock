import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { cartes } = await req.json();
    const token = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey: token });

    const listeTexte = cartes
      .map(
        (c: any) => `- ID ${c.id}: ${c.nom} (${c.extension}, N° ${c.numero})`,
      )
      .join("\n");

    const prompt = `
    Tu es un expert en cartes Pokémon. Voici une liste de cartes. 
    Donne le prix actuel estimé (en euros) pour chacune sur Cardmarket/Ebay.
    Renvoie UNIQUEMENT un tableau JSON strict au format : [{"id": 1, "nouveau_prix": 15.50}, ...].
    Cartes :
    ${listeTexte}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const resultats = JSON.parse(response.text ?? "[]");
    return NextResponse.json({ success: true, resultats });
  } catch (error) {
    console.error("Erreur de réévaluation :", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 },
    );
  }
}
