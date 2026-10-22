import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Jeton GITHUB_TOKEN manquant." },
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

    const prompt = `
      Tu es un expert en cartes Pokémon. Analyse cette image.
      Si c'est une carte Pokémon, renvoie UNIQUEMENT un objet JSON avec ces 3 propriétés exactes (sans markdown, sans backticks) :
      {"nom": "NomDuPokemon", "extension": "NomDeLextension", "numero": "XXX/YYY"}
      Si ce n'est pas une carte Pokémon, renvoie {"erreur": "Carte non reconnue"}.
    `;

    // Appel direct avec gestion du format texte brut
    const res = await fetch(
      "https://models.inference.ai.azure.com/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
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
        }),
      },
    );

    const rawText = await res.text();
    console.log(`Statut HTTP: ${res.status}`);
    console.log("Corps de la réponse :", rawText);

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Erreur ${res.status} : ${rawText}` },
        { status: 500 },
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { success: false, error: `Réponse non-JSON reçue : ${rawText}` },
        { status: 500 },
      );
    }

    const content = parsed.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ success: true, data: content });
  } catch (error: any) {
    console.error("Erreur serveur :", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur" },
      { status: 500 },
    );
  }
}
