This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.





Projet BTS SIO: POKESTOCK

Application sauvegarde/gestion de carte pokemon, avec visualisation du prix du marché.



Stack technique:

Framework: Next.js
Style: Tailwind
photo: react-webcam
IA: SDK Google Gemini modele 1.5 Flash
BDD: Supabase
Lien externe: api.poketrace.com/v1



Logique:

L'utilisateur prend une photo via l'interface /scanner. L'image est convertie en Base64 et envoyée à la route.

Analyse avec IA (OCR + Traduction), Le serveur transmet l'image à Gemini. L'IA renvoie un json contenant :
	-Le nom du Pokémon
	-Le numéro de série de la carte.
	-La langue détectée.

Interroge l'API poketrace, récupère l'image, les données de la carte et le prix estimé via cardmarket, avec un lien de redirection

Sauvegarde : Une fois le résultat affiché à l'écran, l'utilisateur peut valider l'ajout. Une seconde route API insère ces données dans la table Supabase de l'utilisateur.

Restitution : La page /collection interroge Supabase côté serveur pour générer le classeur visuel de l'utilisateur (protectiond'authentification).



Arborescence:

poke-stock/
├── public/  'image, logo...
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── scan/
│   │   │   │   └── route.ts  'reçoit l'image, appelle Gemini, puis l'API
│   │   │   └── cartes/
│   │   │       └── route.ts  'sauvegarder les cartes sur Supabase
│   │   ├── collection/
│   │   │   └── page.tsx      'bibliothéque l'utilisateur
│   │   ├── scanner/
│   │   │   └── page.tsx      'page pour prendre la photo
│   │   ├── login/
│   │   │   └── page.tsx      'page d'authentification
│   │   ├── error.tsx         'si probléme, personnalisé
│   │   ├── loading.tsx       'chargement personnalisé
│   │   ├── not-found.tsx     'page 404 personnalisé
│   │   ├── layout.tsx        'racine
│   │   └── page.tsx          'pas d'accueil
│   │
│   ├── components/
│   │   ├── Camera.tsx        'composant cam
│   │   ├── CardList.tsx      'grille pour afficher les cartes
│   │   └── Navbar.tsx
│   │
│   ├── lib/
│   │   ├── gemini.ts        'fonction reçoit la photo, config la requete (prompt pour voir le nom et le numero de la carte) et envoie au serveur
│   │   └── poketrace.ts   'fonction qui complete celle de gemini, elle recupere les données et interroge poketrace│   │
│   └── utils/
│       └── supabase/
│           ├── client.ts    'depuis le navigateur image, photo etc..
│           └── server.ts    'depuis le serveur routes API, composants etc...
│
├── middleware.ts            'bloque l'accès à collection si non connecté, redirige vers login si déconnecté etc..
├── .env.local               'clés d'API (Supabase, Gemini, poketrace)
├── next.config.mjs
├── package.json
├── tailwind.config.ts
└── tsconfig.json



Etapes:

1 : Initialisation et Infrastructure (avec GitHub)

	Versionnement : Création d'un dépôt GitHub vide pour sécuriser le code et préparer le déploiement.

	Initialisation du projet : Création de l'application Next.js (App Router) et liaison avec le dépôt GitHub.

	Dépendances : Installation des outils react-webcam, @supabase/ssr, @google/generative-ai).
	
	Installation Vercel pour avoir le site en public

	Variables d'environnement : Configuration sécurisée du fichier .env.local avec vos clés API.

	Base de données : Mise en place des clients Supabase (utils/supabase/) et création de la table cards pour stocker les cartes.

2 : Interface et Capture Visuelle
	Développement du layout.tsx, de la navigation, et des fichiers error.tsx, loading.tsx, not-found.tsx.

	Module Scanner : Codage du composant Camera.tsx (optimisé pour la caméra arrière des téléphones et la capture en base64).

	Feedback Visuel : Intégration d'animations ou de messages de chargement pour faire patienter l'utilisateur pendant le traitement de l'image.

3 : Intelligence Artificielle et Logique
	Configuration Gemini : Rédaction du prompt multilingue dans lib/gemini.ts pour extraire le nom, le numéro de série et le code langue.

	Route API Globale : Développement de api/scan/route.ts qui analyse l'image.

	Interrogation de poketrace pour obtenir l'image, l'estimation de prix, et le lien de redirection Cardmarket.

4 : Collection et Déploiement
	Sauvegarde : Création de la route API api/cards/route.ts pour enregistrer la carte analysée dans le compte Supabase de l'utilisateur.

	Classeur Virtuel : Développement de la page /collection qui récupère et affiche la base de données de l'utilisateur.

Futur:

pour la v2, meme chose avec les items pokemon.