import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Jeton GitHub manquant.",
        },
        { status: 500 },
      );
    }

    const client = new OpenAI({
      baseURL: "https://models.github.ai/inference",
      apiKey: token,
    });

    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: "Aucune image reçue" },
        { status: 400 },
      );
    }

    const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;

    const prompt = `
      Tu es un expert en cartes Pokémon. Analyse cette image.
      Si c'est une carte Pokémon, renvoie-moi UNIQUEMENT un objet JSON avec ces 3 propriétés exactes (sans aucun texte autour) :
      - "nom" : le nom du Pokémon, qui ce trouve en haut à gauche de la carte.
      - "extension" : le nom de l'extension de la carte (en bas à gauche de la carte ou en bas à droite de la carte, selon le type de carte).
      - "numero" : le numéro de la carte (ex: 045/165) (en bas à gauche de la carte ou en bas à droite de la carte, selon le type de carte).
      Si ce n'est pas une carte Pokémon, renvoie {"erreur": "Carte non reconnue ou invalide"}.
    `;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64Data}` },
            },
          ],
        },
      ],
    });

    console.log("Réponse GitHub:", JSON.stringify(response, null, 2));

    if (!response.choices || response.choices.length === 0) {
      console.error("Réponse API invalide:", response);
      return NextResponse.json(
        { success: false, error: "Le serveur IA n'a pas renvoyé de résultat." },
        { status: 500 },
      );
    }

    const test = response.choices[0]?.message?.content || "";
    return NextResponse.json({ success: true, data: test });
    
  } catch (error: any) {
    console.error("Erreur lors de l'analyse IA:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur" },
      { status: 500 },
    );
  }
}
