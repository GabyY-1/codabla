# Codabla

Codabla est un assistant IA spécialisé dans le développement, conçu comme une vraie interface de chat pour créer, corriger, expliquer et améliorer du code.

## Fonctionnalités

- réponses en streaming ;
- historique local des discussions ;
- recherche dans les conversations ;
- modes Chat, Créer, Debug, Expliquer et Améliorer ;
- import de fichiers de code texte ;
- Markdown et blocs de code avec copie ;
- copie et régénération des réponses ;
- export d'une discussion en Markdown ;
- arrêt d'une génération en cours ;
- interface responsive ordinateur et mobile ;
- backend sécurisé : la clé OpenRouter n'est jamais envoyée au navigateur.

## Modèle

Par défaut :

```text
nvidia/nemotron-3-ultra-550b-a55b:free
```

Le modèle peut être remplacé avec la variable `OPENROUTER_MODEL`.

## Installation

```bash
npm install
npm run dev
```

Le projet est ensuite disponible sur `http://localhost:3000`.

## Variables d'environnement

Crée un fichier `.env.local` :

```env
OPENROUTER_API_KEY=ta_cle_openrouter
OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Sur Vercel :

```env
OPENROUTER_API_KEY=ta_cle_openrouter
OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
NEXT_PUBLIC_SITE_URL=https://codabla.horibli.com
```

Ne mets jamais `OPENROUTER_API_KEY` dans un fichier envoyé sur GitHub.

## Domaine

Production : `https://codabla.horibli.com`
