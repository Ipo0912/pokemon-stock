import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { NextResponse } from "next/server";

export const maxDuration = 60;

const MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
];
const MAX_RETRIES = 1;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  try {
    const token = process.env.GEMINI_API_KEY;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Clé GEMINI_API_KEY manquante." },
        { status: 500 },
      );
    }

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

    const ai = new GoogleGenAI({ apiKey: token });

    const prompt = `Tu es un expert en cartes Pokémon. Analyse cette image.
Si c'est une carte Pokémon, renvoie un objet JSON avec :
{"nom": "...", "extension": "...", "numero": "XXX/YYY", "langue": "fr|en|ja|..."}
Sinon renvoie {"erreur": "Carte non reconnue"}.`;

    for (const model of MODELS) {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: [
              {
                role: "user",
                parts: [
                  { text: prompt },
                  { inlineData: { mimeType: "image/jpeg", data: base64Data } },
                ],
              },
            ],
            config: {
              responseMimeType: "application/json",
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            },
          });

          const data = JSON.parse(response.text ?? "{}");

          if (data.erreur) {
            return NextResponse.json(
              { success: false, error: data.erreur },
              { status: 422 },
            );
          }

          return NextResponse.json({ success: true, model, data });
        } catch (err: any) {
          console.error(
            `[${model}] essai ${attempt + 1} :`,
            err?.status,
            err?.message,
          );

          const temporaire = err?.status === 503 || err?.status === 429;
          if (!temporaire) break;

          if (attempt < MAX_RETRIES) await sleep(1000);
        }
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Le service d'analyse est surchargé, réessaie dans un instant.",
      },
      { status: 503 },
    );
  } catch (error: any) {
    console.error("Erreur route scan :", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur" },
      { status: 500 },
    );
  }
}
