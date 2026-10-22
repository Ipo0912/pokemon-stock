import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const token = process.env.FREELLMAPI_KEY;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Clé API FreeLLMAPI manquante." },
        { status: 500 },
      );
    }

    // Connexion aux serveurs de FreeLLMAPI
    const client = new OpenAI({
      baseURL: "https://api.freellmapi.co/v1",
      apiKey: token,
    });

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

    const response = await client.chat.completions.create({
      model: "qwen/qwen3.8-omni-flash:free",
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

    const content = response.choices[0]?.message?.content ?? "";
    return NextResponse.json({ success: true, data: content });
  } catch (error: any) {
    console.error("Erreur IA :", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur" },
      { status: 500 },
    );
  }
}
