# Codabla

Codabla est un espace de développement web inspiré des IDE cloud modernes, avec un assistant IA intégré au projet.

## Fonctionnalités actuelles

- onboarding avec trois modes : manuel, copilote et génération par IA
- explorateur de fichiers
- éditeur Monaco
- onglets de fichiers
- aperçu HTML/CSS/JS intégré
- terminal navigateur léger
- assistant Codabla AI avec contexte du projet
- modifications multi-fichiers par IA
- sauvegarde locale automatique
- interface sombre type IDE

## Lancer en local

```bash
npm install
npm run dev
```

## IA avec OpenRouter

Ajoute ces variables sur Vercel :

```
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
APP_URL=https://codabla.horibli.com
```

La clé OpenRouter reste côté serveur dans `api/chat.js`.

## Build

```bash
npm run build
```
